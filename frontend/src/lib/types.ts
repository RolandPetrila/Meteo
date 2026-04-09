export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  precipitation: number;
  condition: string;
  condition_icon: string;
}

export interface HourlyForecast {
  hour: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  precipitation: number;
  condition: string;
}

export interface DailyForecast {
  date: string;
  day_name: string;
  temp_min: number;
  temp_max: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  condition: string;
}

export interface SourceData {
  source: string;
  temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
  condition: string | null;
  available: boolean;
  confidence: number;
  response_time_ms: number;
}

export interface AgreementInfo {
  level: string;
  color: string;
  max_deviation: number;
  description: string;
}

export interface AISummary {
  summary: string;
  recommendation: string;
  alert: string | null;
}

export interface WeatherResponse {
  location: Location;
  timestamp: string;
  current: CurrentWeather;
  forecast_hourly: HourlyForecast[];
  forecast_7days: DailyForecast[];
  comparison: SourceData[];
  agreement: AgreementInfo;
  aggregated_confidence: number;
  ai_summary: AISummary;
  cache_hit: boolean;
}

export interface SavedLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  created_at: string;
}

export interface FavoriteLocation {
  name: string;
  latitude: number;
  longitude: number;
}
