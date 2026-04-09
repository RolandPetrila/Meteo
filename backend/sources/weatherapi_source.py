import httpx
from .base import WeatherSource, get_condition_icon
from config import SOURCE_TIMEOUT, WEATHERAPI_KEY

# Mapare conditii WeatherAPI -> conditii normalizate
WAPI_CONDITIONS = {
    "Sunny": "senin",
    "Clear": "senin",
    "Partly cloudy": "partial_noros",
    "Cloudy": "noros",
    "Overcast": "noros",
    "Mist": "ceata",
    "Fog": "ceata",
    "Freezing fog": "ceata_chiciura",
    "Patchy rain possible": "ploaie_usoara",
    "Patchy light drizzle": "burinta_usoara",
    "Light drizzle": "burinta_usoara",
    "Light rain": "ploaie_usoara",
    "Moderate rain": "ploaie_moderata",
    "Heavy rain": "ploaie_puternica",
    "Moderate rain at times": "ploaie_moderata",
    "Heavy rain at times": "ploaie_puternica",
    "Light rain shower": "averse_usoare",
    "Moderate or heavy rain shower": "averse_moderate",
    "Torrential rain shower": "averse_puternice",
    "Patchy snow possible": "ninsoare_usoara",
    "Light snow": "ninsoare_usoara",
    "Moderate snow": "ninsoare_moderata",
    "Heavy snow": "ninsoare_puternica",
    "Light snow showers": "averse_ninsoare_usoare",
    "Moderate or heavy snow showers": "averse_ninsoare_puternice",
    "Thundery outbreaks possible": "furtuna",
    "Patchy light rain with thunder": "furtuna",
    "Moderate or heavy rain with thunder": "furtuna_grindina",
}


def _map_condition(condition_text: str) -> str:
    return WAPI_CONDITIONS.get(condition_text, "necunoscut")


class WeatherAPISource(WeatherSource):
    name = "weatherapi"
    BASE_URL = "http://api.weatherapi.com/v1"

    async def fetch_current(self, lat: float, lon: float) -> dict:
        if not WEATHERAPI_KEY:
            raise ValueError("WeatherAPI key nu este configurat")

        params = {
            "key": WEATHERAPI_KEY,
            "q": f"{lat},{lon}",
            "aqi": "no",
        }
        async with httpx.AsyncClient(timeout=SOURCE_TIMEOUT) as client:
            resp = await client.get(f"{self.BASE_URL}/current.json", params=params)
            resp.raise_for_status()
            data = resp.json()

        current = data["current"]
        condition = _map_condition(current["condition"]["text"])
        return {
            "temperature": current["temp_c"],
            "humidity": current["humidity"],
            "wind_speed": current["wind_kph"],
            "wind_direction": current["wind_degree"],
            "precipitation": current["precip_mm"],
            "condition": condition,
            "condition_icon": get_condition_icon(condition),
        }

    async def fetch_hourly(self, lat: float, lon: float) -> list[dict]:
        if not WEATHERAPI_KEY:
            raise ValueError("WeatherAPI key nu este configurat")

        params = {
            "key": WEATHERAPI_KEY,
            "q": f"{lat},{lon}",
            "days": 1,
            "aqi": "no",
        }
        async with httpx.AsyncClient(timeout=SOURCE_TIMEOUT) as client:
            resp = await client.get(f"{self.BASE_URL}/forecast.json", params=params)
            resp.raise_for_status()
            data = resp.json()

        results = []
        for day in data.get("forecast", {}).get("forecastday", []):
            for hour_data in day.get("hour", []):
                condition = _map_condition(hour_data["condition"]["text"])
                time_str = hour_data["time"]
                hour_part = time_str.split(" ")[1][:5] if " " in time_str else time_str
                results.append({
                    "hour": hour_part,
                    "timestamp": time_str,
                    "temperature": hour_data["temp_c"],
                    "humidity": hour_data["humidity"],
                    "wind_speed": hour_data["wind_kph"],
                    "precipitation": hour_data["precip_mm"],
                    "condition": condition,
                })
        return results[:24]

    async def fetch_daily(self, lat: float, lon: float) -> list[dict]:
        if not WEATHERAPI_KEY:
            raise ValueError("WeatherAPI key nu este configurat")

        params = {
            "key": WEATHERAPI_KEY,
            "q": f"{lat},{lon}",
            "days": 3,
            "aqi": "no",
        }
        async with httpx.AsyncClient(timeout=SOURCE_TIMEOUT) as client:
            resp = await client.get(f"{self.BASE_URL}/forecast.json", params=params)
            resp.raise_for_status()
            data = resp.json()

        from datetime import datetime
        day_names_ro = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"]
        results = []
        for day in data.get("forecast", {}).get("forecastday", []):
            date_str = day["date"]
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            day_name = day_names_ro[dt.weekday()]
            condition = _map_condition(day["day"]["condition"]["text"])
            results.append({
                "date": date_str,
                "day_name": day_name,
                "temp_min": day["day"]["mintemp_c"],
                "temp_max": day["day"]["maxtemp_c"],
                "precipitation": day["day"]["totalprecip_mm"],
                "wind_speed": day["day"]["maxwind_kph"],
                "condition": condition,
            })
        return results
