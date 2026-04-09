import asyncio
import time
from statistics import median
from sources import OpenMeteoSource, OpenWeatherSource, WeatherAPISource, ECMWFSource
from models import (
    SourceData, AgreementInfo, CurrentWeather, HourlyForecast, DailyForecast,
)
from sources.base import get_condition_icon


ALL_SOURCES = [
    OpenMeteoSource(),
    OpenWeatherSource(),
    WeatherAPISource(),
    ECMWFSource(),
]


async def _fetch_with_timing(source, method: str, lat: float, lon: float) -> tuple[str, dict | list | None, int, bool]:
    """Fetch de la o sursa cu masurare timp si tratare erori."""
    start = time.monotonic()
    try:
        func = getattr(source, method)
        data = await func(lat, lon)
        elapsed = int((time.monotonic() - start) * 1000)
        return source.name, data, elapsed, True
    except Exception:
        elapsed = int((time.monotonic() - start) * 1000)
        return source.name, None, elapsed, False


def _calculate_confidence(source_temps: dict[str, float]) -> dict[str, float]:
    """Calculeaza scorul de incredere per sursa bazat pe deviatie fata de mediana."""
    if not source_temps:
        return {}

    values = list(source_temps.values())
    if len(values) < 2:
        return {name: 95.0 for name in source_temps}

    med = median(values)
    max_spread = max(values) - min(values) if len(values) > 1 else 0

    scores = {}
    for name, temp in source_temps.items():
        deviation = abs(temp - med)
        # Scor de baza 100, scade cu deviatie
        score = max(40.0, 100.0 - (deviation * 15.0))
        # Bonus daca spread-ul e mic (sursele sunt de acord)
        if max_spread < 2:
            score = min(100.0, score + 5.0)
        scores[name] = round(score, 1)

    return scores


def _calculate_agreement(source_temps: dict[str, float]) -> AgreementInfo:
    """Calculeaza nivelul de acord intre surse."""
    if len(source_temps) < 2:
        return AgreementInfo(
            level="necunoscut",
            color="gray",
            max_deviation=0,
            description="Insuficiente surse pentru comparație",
        )

    values = list(source_temps.values())
    max_dev = round(max(values) - min(values), 1)

    if max_dev < 2:
        return AgreementInfo(
            level="puternic",
            color="green",
            max_deviation=max_dev,
            description=f"Sursele sunt de acord (diferență: {max_dev}°C)",
        )
    elif max_dev < 5:
        return AgreementInfo(
            level="moderat",
            color="yellow",
            max_deviation=max_dev,
            description=f"Acord moderat între surse (diferență: {max_dev}°C)",
        )
    else:
        return AgreementInfo(
            level="dezacord",
            color="red",
            max_deviation=max_dev,
            description=f"Dezacord între surse (diferență: {max_dev}°C)",
        )


def _weighted_average(source_temps: dict[str, float], confidence: dict[str, float]) -> float:
    """Media ponderata cu scoruri de incredere."""
    total_weight = 0
    weighted_sum = 0
    for name, temp in source_temps.items():
        weight = confidence.get(name, 50.0)
        weighted_sum += temp * weight
        total_weight += weight
    if total_weight == 0:
        return 0
    return round(weighted_sum / total_weight, 1)


def _majority_condition(source_conditions: dict[str, str]) -> str:
    """Conditia meteo prin vot majoritar."""
    if not source_conditions:
        return "necunoscut"
    counts: dict[str, int] = {}
    for cond in source_conditions.values():
        counts[cond] = counts.get(cond, 0) + 1
    return max(counts, key=counts.get)


async def aggregate_current(lat: float, lon: float) -> tuple[CurrentWeather, list[SourceData], AgreementInfo, float]:
    """Agregheaza datele curente din toate sursele."""
    tasks = [_fetch_with_timing(s, "fetch_current", lat, lon) for s in ALL_SOURCES]
    results = await asyncio.gather(*tasks)

    source_temps = {}
    source_conditions = {}
    source_humidity = {}
    source_wind = {}
    comparison = []

    for name, data, elapsed, ok in results:
        if ok and data:
            source_temps[name] = data["temperature"]
            source_conditions[name] = data["condition"]
            source_humidity[name] = data["humidity"]
            source_wind[name] = data["wind_speed"]

    confidence = _calculate_confidence(source_temps)
    agreement = _calculate_agreement(source_temps)

    for name, data, elapsed, ok in results:
        comparison.append(SourceData(
            source=name,
            temperature=data["temperature"] if ok and data else None,
            humidity=data["humidity"] if ok and data else None,
            wind_speed=data["wind_speed"] if ok and data else None,
            condition=data["condition"] if ok and data else None,
            available=ok and data is not None,
            confidence=confidence.get(name, 0),
            response_time_ms=elapsed,
        ))

    # Prognoza agregata ponderata
    avg_temp = _weighted_average(source_temps, confidence) if source_temps else 0
    avg_humidity = int(_weighted_average(
        {k: float(v) for k, v in source_humidity.items()}, confidence
    )) if source_humidity else 0
    avg_wind = round(_weighted_average(
        source_wind, confidence
    ), 1) if source_wind else 0
    condition = _majority_condition(source_conditions)

    # Wind direction din prima sursa disponibila
    wind_dir = 0
    precip = 0.0
    for _, data, _, ok in results:
        if ok and data:
            wind_dir = data.get("wind_direction", 0)
            precip = data.get("precipitation", 0)
            break

    current = CurrentWeather(
        temperature=avg_temp,
        humidity=avg_humidity,
        wind_speed=avg_wind,
        wind_direction=wind_dir,
        precipitation=precip,
        condition=condition,
        condition_icon=get_condition_icon(condition),
    )

    avg_confidence = round(sum(confidence.values()) / len(confidence), 1) if confidence else 0
    return current, comparison, agreement, avg_confidence


async def aggregate_hourly(lat: float, lon: float) -> list[HourlyForecast]:
    """Agregheaza prognoza orara (sursa principala: Open-Meteo)."""
    tasks = [_fetch_with_timing(s, "fetch_hourly", lat, lon) for s in ALL_SOURCES]
    results = await asyncio.gather(*tasks)

    # Folosim Open-Meteo ca baza (are cele mai multe ore)
    primary = None
    for name, data, _, ok in results:
        if name == "open_meteo" and ok and data:
            primary = data
            break

    if not primary:
        for _, data, _, ok in results:
            if ok and data:
                primary = data
                break

    if not primary:
        return []

    forecasts = []
    for item in primary:
        forecasts.append(HourlyForecast(
            hour=item["hour"],
            timestamp=item["timestamp"],
            temperature=item["temperature"],
            humidity=item["humidity"],
            wind_speed=item["wind_speed"],
            precipitation=item.get("precipitation", 0),
            condition=item["condition"],
        ))
    return forecasts


async def aggregate_daily(lat: float, lon: float) -> list[DailyForecast]:
    """Agregheaza prognoza zilnica din toate sursele."""
    tasks = [_fetch_with_timing(s, "fetch_daily", lat, lon) for s in ALL_SOURCES]
    results = await asyncio.gather(*tasks)

    # Combina zilele din toate sursele
    days_data: dict[str, list[dict]] = {}
    for name, data, _, ok in results:
        if ok and data:
            for day in data:
                date_key = day["date"]
                if date_key not in days_data:
                    days_data[date_key] = []
                days_data[date_key].append(day)

    forecasts = []
    for date_str in sorted(days_data.keys())[:7]:
        items = days_data[date_str]
        temp_mins = [d["temp_min"] for d in items if d.get("temp_min") is not None]
        temp_maxs = [d["temp_max"] for d in items if d.get("temp_max") is not None]
        conditions = [d["condition"] for d in items if d.get("condition")]

        condition_counts: dict[str, int] = {}
        for c in conditions:
            condition_counts[c] = condition_counts.get(c, 0) + 1
        best_condition = max(condition_counts, key=condition_counts.get) if condition_counts else "necunoscut"

        forecasts.append(DailyForecast(
            date=date_str,
            day_name=items[0].get("day_name", ""),
            temp_min=round(sum(temp_mins) / len(temp_mins), 1) if temp_mins else 0,
            temp_max=round(sum(temp_maxs) / len(temp_maxs), 1) if temp_maxs else 0,
            precipitation=round(max((d.get("precipitation", 0) for d in items), default=0), 1),
            wind_speed=round(max((d.get("wind_speed", 0) for d in items), default=0), 1),
            condition=best_condition,
        ))
    return forecasts
