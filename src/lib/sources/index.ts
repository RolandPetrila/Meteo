import { WeatherSource } from "./base";
import { OpenMeteoSource } from "./open-meteo";
import { OpenWeatherSource } from "./openweather";
import { WeatherAPISource } from "./weatherapi";
import { ECMWFSource } from "./ecmwf";

export function getAllSources(): WeatherSource[] {
  const sources: WeatherSource[] = [new OpenMeteoSource(), new ECMWFSource()];

  // Adauga sursele cu API key doar daca key-ul exista
  if (process.env.OPENWEATHER_API_KEY) {
    sources.push(new OpenWeatherSource());
  }
  if (process.env.WEATHERAPI_KEY) {
    sources.push(new WeatherAPISource());
  }

  return sources;
}

export type { WeatherSource, CurrentData, HourlyData, DailyData } from "./base";
