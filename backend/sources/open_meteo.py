import httpx
from .base import WeatherSource, wmo_to_condition, get_condition_icon
from config import SOURCE_TIMEOUT, TIMEZONE


class OpenMeteoSource(WeatherSource):
    name = "open_meteo"
    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    async def fetch_current(self, lat: float, lon: float) -> dict:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code",
            "timezone": TIMEZONE,
        }
        async with httpx.AsyncClient(timeout=SOURCE_TIMEOUT) as client:
            resp = await client.get(self.BASE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        current = data["current"]
        condition = wmo_to_condition(current.get("weather_code", 0))
        return {
            "temperature": current.get("temperature_2m", 0),
            "humidity": int(current.get("relative_humidity_2m", 0)),
            "wind_speed": current.get("wind_speed_10m", 0),
            "wind_direction": int(current.get("wind_direction_10m", 0)),
            "precipitation": current.get("precipitation", 0),
            "condition": condition,
            "condition_icon": get_condition_icon(condition),
        }

    async def fetch_hourly(self, lat: float, lon: float) -> list[dict]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code",
            "timezone": TIMEZONE,
            "forecast_hours": 24,
        }
        async with httpx.AsyncClient(timeout=SOURCE_TIMEOUT) as client:
            resp = await client.get(self.BASE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        results = []
        for i, time_str in enumerate(times):
            condition = wmo_to_condition(hourly["weather_code"][i]) if hourly.get("weather_code") else "necunoscut"
            hour_part = time_str.split("T")[1][:5] if "T" in time_str else time_str
            results.append({
                "hour": hour_part,
                "timestamp": time_str,
                "temperature": hourly["temperature_2m"][i],
                "humidity": int(hourly["relative_humidity_2m"][i]),
                "wind_speed": hourly["wind_speed_10m"][i],
                "precipitation": hourly.get("precipitation", [0] * len(times))[i],
                "condition": condition,
            })
        return results

    async def fetch_daily(self, lat: float, lon: float) -> list[dict]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max",
            "timezone": TIMEZONE,
            "forecast_days": 7,
        }
        async with httpx.AsyncClient(timeout=SOURCE_TIMEOUT) as client:
            resp = await client.get(self.BASE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        daily = data.get("daily", {})
        dates = daily.get("time", [])
        day_names_ro = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"]
        results = []
        for i, date_str in enumerate(dates):
            from datetime import datetime
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            day_name = day_names_ro[dt.weekday()]
            condition = wmo_to_condition(daily["weather_code"][i]) if daily.get("weather_code") else "necunoscut"
            results.append({
                "date": date_str,
                "day_name": day_name,
                "temp_min": daily["temperature_2m_min"][i],
                "temp_max": daily["temperature_2m_max"][i],
                "precipitation": daily.get("precipitation_sum", [0] * len(dates))[i],
                "wind_speed": daily.get("wind_speed_10m_max", [0] * len(dates))[i],
                "condition": condition,
            })
        return results
