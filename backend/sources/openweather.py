import httpx
from .base import WeatherSource, get_condition_icon
from config import SOURCE_TIMEOUT, OPENWEATHER_API_KEY

# Mapare conditii OpenWeatherMap -> conditii normalizate
OWM_CONDITIONS = {
    "Clear": "senin",
    "Clouds": "noros",
    "Few clouds": "partial_noros",
    "Scattered clouds": "partial_noros",
    "Broken clouds": "noros",
    "Overcast clouds": "noros",
    "Drizzle": "burinta_usoara",
    "Rain": "ploaie_moderata",
    "Light rain": "ploaie_usoara",
    "Moderate rain": "ploaie_moderata",
    "Heavy rain": "ploaie_puternica",
    "Thunderstorm": "furtuna",
    "Snow": "ninsoare_moderata",
    "Light snow": "ninsoare_usoara",
    "Heavy snow": "ninsoare_puternica",
    "Mist": "ceata",
    "Fog": "ceata",
    "Haze": "ceata",
}


def _map_condition(weather_data: dict) -> str:
    if not weather_data.get("weather"):
        return "necunoscut"
    main = weather_data["weather"][0].get("main", "")
    desc = weather_data["weather"][0].get("description", "")
    return OWM_CONDITIONS.get(desc.capitalize(), OWM_CONDITIONS.get(main, "necunoscut"))


class OpenWeatherSource(WeatherSource):
    name = "openweather"
    BASE_URL = "https://api.openweathermap.org/data/2.5"

    async def fetch_current(self, lat: float, lon: float) -> dict:
        if not OPENWEATHER_API_KEY:
            raise ValueError("OpenWeatherMap API key nu este configurat")

        params = {
            "lat": lat,
            "lon": lon,
            "units": "metric",
            "appid": OPENWEATHER_API_KEY,
        }
        async with httpx.AsyncClient(timeout=SOURCE_TIMEOUT) as client:
            resp = await client.get(f"{self.BASE_URL}/weather", params=params)
            resp.raise_for_status()
            data = resp.json()

        condition = _map_condition(data)
        return {
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "wind_speed": data["wind"]["speed"] * 3.6,  # m/s -> km/h
            "wind_direction": data["wind"].get("deg", 0),
            "precipitation": data.get("rain", {}).get("1h", 0),
            "condition": condition,
            "condition_icon": get_condition_icon(condition),
        }

    async def fetch_hourly(self, lat: float, lon: float) -> list[dict]:
        if not OPENWEATHER_API_KEY:
            raise ValueError("OpenWeatherMap API key nu este configurat")

        params = {
            "lat": lat,
            "lon": lon,
            "units": "metric",
            "appid": OPENWEATHER_API_KEY,
        }
        async with httpx.AsyncClient(timeout=SOURCE_TIMEOUT) as client:
            resp = await client.get(f"{self.BASE_URL}/forecast", params=params)
            resp.raise_for_status()
            data = resp.json()

        from datetime import datetime
        import pytz
        tz = pytz.timezone("Europe/Bucharest")
        results = []
        for item in data.get("list", [])[:8]:  # Primele 24h (8 x 3h)
            dt = datetime.fromtimestamp(item["dt"], tz=tz)
            condition = _map_condition(item)
            results.append({
                "hour": dt.strftime("%H:%M"),
                "timestamp": dt.isoformat(),
                "temperature": item["main"]["temp"],
                "humidity": item["main"]["humidity"],
                "wind_speed": item["wind"]["speed"] * 3.6,
                "precipitation": item.get("rain", {}).get("3h", 0),
                "condition": condition,
            })
        return results

    async def fetch_daily(self, lat: float, lon: float) -> list[dict]:
        if not OPENWEATHER_API_KEY:
            raise ValueError("OpenWeatherMap API key nu este configurat")

        params = {
            "lat": lat,
            "lon": lon,
            "units": "metric",
            "appid": OPENWEATHER_API_KEY,
        }
        async with httpx.AsyncClient(timeout=SOURCE_TIMEOUT) as client:
            resp = await client.get(f"{self.BASE_URL}/forecast", params=params)
            resp.raise_for_status()
            data = resp.json()

        from datetime import datetime
        import pytz
        tz = pytz.timezone("Europe/Bucharest")
        day_names_ro = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"]

        # Grupeaza pe zile
        days: dict[str, list] = {}
        for item in data.get("list", []):
            dt = datetime.fromtimestamp(item["dt"], tz=tz)
            date_key = dt.strftime("%Y-%m-%d")
            if date_key not in days:
                days[date_key] = []
            days[date_key].append(item)

        results = []
        for date_str, items in list(days.items())[:5]:
            temps = [it["main"]["temp"] for it in items]
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            day_name = day_names_ro[dt.weekday()]
            condition = _map_condition(items[len(items) // 2])
            results.append({
                "date": date_str,
                "day_name": day_name,
                "temp_min": round(min(temps), 1),
                "temp_max": round(max(temps), 1),
                "precipitation": sum(it.get("rain", {}).get("3h", 0) for it in items),
                "wind_speed": max(it["wind"]["speed"] * 3.6 for it in items),
                "condition": condition,
            })
        return results
