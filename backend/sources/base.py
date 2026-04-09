from abc import ABC, abstractmethod


# Coduri WMO (World Meteorological Organization) -> conditii text
WMO_CONDITIONS = {
    0: "senin",
    1: "predominant_senin",
    2: "partial_noros",
    3: "noros",
    45: "ceata",
    48: "ceata_chiciura",
    51: "burinta_usoara",
    53: "burinta_moderata",
    55: "burinta_puternica",
    56: "burinta_inghet",
    57: "burinta_inghet_puternica",
    61: "ploaie_usoara",
    63: "ploaie_moderata",
    65: "ploaie_puternica",
    66: "ploaie_inghet",
    67: "ploaie_inghet_puternica",
    71: "ninsoare_usoara",
    73: "ninsoare_moderata",
    75: "ninsoare_puternica",
    77: "grindina",
    80: "averse_usoare",
    81: "averse_moderate",
    82: "averse_puternice",
    85: "averse_ninsoare_usoare",
    86: "averse_ninsoare_puternice",
    95: "furtuna",
    96: "furtuna_grindina",
    99: "furtuna_grindina_puternica",
}

# Mapare conditii la icoane emoji
CONDITION_ICONS = {
    "senin": "☀️",
    "predominant_senin": "🌤️",
    "partial_noros": "⛅",
    "noros": "☁️",
    "ceata": "🌫️",
    "ceata_chiciura": "🌫️",
    "burinta_usoara": "🌦️",
    "burinta_moderata": "🌦️",
    "burinta_puternica": "🌧️",
    "burinta_inghet": "🌧️",
    "burinta_inghet_puternica": "🌧️",
    "ploaie_usoara": "🌦️",
    "ploaie_moderata": "🌧️",
    "ploaie_puternica": "🌧️",
    "ploaie_inghet": "🌧️",
    "ploaie_inghet_puternica": "🌧️",
    "ninsoare_usoara": "🌨️",
    "ninsoare_moderata": "❄️",
    "ninsoare_puternica": "❄️",
    "grindina": "🌨️",
    "averse_usoare": "🌦️",
    "averse_moderate": "🌧️",
    "averse_puternice": "⛈️",
    "averse_ninsoare_usoare": "🌨️",
    "averse_ninsoare_puternice": "🌨️",
    "furtuna": "⛈️",
    "furtuna_grindina": "⛈️",
    "furtuna_grindina_puternica": "⛈️",
}


def get_condition_icon(condition: str) -> str:
    return CONDITION_ICONS.get(condition, "🌡️")


def wmo_to_condition(code: int) -> str:
    return WMO_CONDITIONS.get(code, "necunoscut")


class WeatherSource(ABC):
    name: str

    @abstractmethod
    async def fetch_current(self, lat: float, lon: float) -> dict:
        pass

    @abstractmethod
    async def fetch_hourly(self, lat: float, lon: float) -> list[dict]:
        pass

    @abstractmethod
    async def fetch_daily(self, lat: float, lon: float) -> list[dict]:
        pass
