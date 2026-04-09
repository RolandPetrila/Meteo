from pydantic import BaseModel
from typing import Optional


class Location(BaseModel):
    name: str
    latitude: float
    longitude: float
    timezone: str = "Europe/Bucharest"


class CurrentWeather(BaseModel):
    temperature: float
    humidity: int
    wind_speed: float
    wind_direction: int
    precipitation: float = 0.0
    condition: str
    condition_icon: str = ""


class HourlyForecast(BaseModel):
    hour: str
    timestamp: str
    temperature: float
    humidity: int
    wind_speed: float
    precipitation: float = 0.0
    condition: str


class DailyForecast(BaseModel):
    date: str
    day_name: str
    temp_min: float
    temp_max: float
    humidity: int = 0
    precipitation: float = 0.0
    wind_speed: float = 0.0
    condition: str


class SourceData(BaseModel):
    source: str
    temperature: Optional[float] = None
    humidity: Optional[int] = None
    wind_speed: Optional[float] = None
    condition: Optional[str] = None
    available: bool = True
    confidence: float = 0.0
    response_time_ms: int = 0


class AgreementInfo(BaseModel):
    level: str  # "puternic", "moderat", "dezacord"
    color: str  # "green", "yellow", "red"
    max_deviation: float
    description: str


class AISummary(BaseModel):
    summary: str
    recommendation: str
    alert: Optional[str] = None


class WeatherResponse(BaseModel):
    location: Location
    timestamp: str
    current: CurrentWeather
    forecast_hourly: list[HourlyForecast]
    forecast_7days: list[DailyForecast]
    comparison: list[SourceData]
    agreement: AgreementInfo
    aggregated_confidence: float
    ai_summary: AISummary
    cache_hit: bool = False


class LocationCreate(BaseModel):
    name: str
    latitude: float
    longitude: float


class LocationResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    timezone: str
    created_at: str
