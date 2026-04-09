import {
  WeatherSource,
  CurrentData,
  HourlyData,
  DailyData,
  getConditionIcon,
  getDayNameRo,
} from "./base";

const BASE_URL = "http://api.weatherapi.com/v1";
const TIMEOUT = 15000;

const WAPI_MAP: Record<string, string> = {
  Sunny: "senin",
  Clear: "senin",
  "Partly Cloudy": "partial_noros",
  "Partly cloudy": "partial_noros",
  Cloudy: "noros",
  Overcast: "noros",
  Mist: "ceata",
  Fog: "ceata",
  "Freezing fog": "ceata",
  "Light rain": "ploaie_usoara",
  "Moderate rain": "ploaie_moderata",
  "Heavy rain": "ploaie_puternica",
  "Light rain shower": "averse_usoare",
  "Moderate or heavy rain shower": "averse_usoare",
  "Torrential rain shower": "ploaie_puternica",
  "Light drizzle": "burinta_usoara",
  "Patchy light drizzle": "burinta_usoara",
  "Freezing drizzle": "burinta_usoara",
  "Heavy freezing drizzle": "ploaie_moderata",
  "Patchy rain possible": "ploaie_usoara",
  "Patchy rain nearby": "ploaie_usoara",
  "Light freezing rain": "ploaie_usoara",
  "Moderate or heavy freezing rain": "ploaie_moderata",
  "Patchy light rain": "ploaie_usoara",
  "Patchy light rain with thunder": "furtuna",
  "Moderate or heavy rain with thunder": "furtuna",
  "Light snow": "ninsoare_usoara",
  "Moderate snow": "ninsoare_moderata",
  "Heavy snow": "ninsoare_puternica",
  "Patchy snow possible": "ninsoare_usoara",
  "Patchy light snow": "ninsoare_usoara",
  "Light snow showers": "ninsoare_usoara",
  "Moderate or heavy snow showers": "ninsoare_moderata",
  "Blowing snow": "ninsoare_moderata",
  Blizzard: "ninsoare_puternica",
  "Patchy light snow with thunder": "furtuna",
  "Moderate or heavy snow with thunder": "furtuna",
  "Ice pellets": "ninsoare_usoara",
  "Light showers of ice pellets": "ninsoare_usoara",
  "Moderate or heavy showers of ice pellets": "ninsoare_moderata",
  "Light sleet": "ploaie_usoara",
  "Moderate or heavy sleet": "ploaie_moderata",
  "Light sleet showers": "ploaie_usoara",
  "Moderate or heavy sleet showers": "ploaie_moderata",
  "Patchy sleet possible": "ploaie_usoara",
  "Patchy freezing drizzle possible": "burinta_usoara",
  "Thundery outbreaks possible": "furtuna",
  "Thundery outbreaks in nearby": "furtuna",
};

function mapCondition(text: string): string {
  return WAPI_MAP[text] || "necunoscut";
}

export class WeatherAPISource implements WeatherSource {
  name = "weatherapi";

  private get apiKey(): string {
    return process.env.WEATHERAPI_KEY || "";
  }

  async fetchCurrent(lat: number, lon: number): Promise<CurrentData> {
    if (!this.apiKey) throw new Error("WeatherAPI key lipsă");

    const params = new URLSearchParams({
      key: this.apiKey,
      q: `${lat},${lon}`,
      aqi: "no",
    });

    const resp = await fetch(`${BASE_URL}/current.json?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);

    const current = data.current;
    const condition = mapCondition(current.condition.text);
    return {
      temperature: current.temp_c,
      humidity: current.humidity,
      wind_speed: current.wind_kph,
      wind_direction: current.wind_degree,
      precipitation: current.precip_mm,
      condition,
      condition_icon: getConditionIcon(condition),
    };
  }

  async fetchHourly(lat: number, lon: number): Promise<HourlyData[]> {
    if (!this.apiKey) throw new Error("WeatherAPI key lipsă");

    const params = new URLSearchParams({
      key: this.apiKey,
      q: `${lat},${lon}`,
      days: "1",
      aqi: "no",
    });

    const resp = await fetch(`${BASE_URL}/forecast.json?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await resp.json();

    const results: HourlyData[] = [];
    for (const day of data.forecast?.forecastday || []) {
      for (const h of day.hour || []) {
        const condition = mapCondition(h.condition.text);
        const timeStr: string = h.time;
        results.push({
          hour: timeStr.includes(" ")
            ? timeStr.split(" ")[1].slice(0, 5)
            : timeStr,
          timestamp: timeStr,
          temperature: h.temp_c,
          humidity: h.humidity,
          wind_speed: h.wind_kph,
          precipitation: h.precip_mm,
          condition,
        });
      }
    }
    return results.slice(0, 24);
  }

  async fetchDaily(lat: number, lon: number): Promise<DailyData[]> {
    if (!this.apiKey) throw new Error("WeatherAPI key lipsă");

    const params = new URLSearchParams({
      key: this.apiKey,
      q: `${lat},${lon}`,
      days: "3",
      aqi: "no",
    });

    const resp = await fetch(`${BASE_URL}/forecast.json?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await resp.json();

    return (data.forecast?.forecastday || []).map(
      (day: Record<string, unknown>) => {
        const d = day.day as Record<string, unknown>;
        const condition = mapCondition(
          ((d.condition as { text: string }) || { text: "" }).text,
        );
        return {
          date: day.date as string,
          day_name: getDayNameRo(day.date as string),
          temp_min: d.mintemp_c as number,
          temp_max: d.maxtemp_c as number,
          precipitation: d.totalprecip_mm as number,
          wind_speed: d.maxwind_kph as number,
          condition,
        };
      },
    );
  }
}
