import {
  WeatherSource,
  CurrentData,
  HourlyData,
  DailyData,
  getConditionIcon,
  getDayNameRo,
} from "./base";

const BASE_URL = "https://api.weatherapi.com/v1";
const TIMEOUT = 15000;

const WAPI_MAP: Record<string, string> = {
  sunny: "senin",
  clear: "senin",
  "partly cloudy": "partial_noros",
  cloudy: "noros",
  overcast: "noros",
  mist: "ceata",
  fog: "ceata",
  "freezing fog": "ceata",
  "light rain": "ploaie_usoara",
  "moderate rain": "ploaie_moderata",
  "heavy rain": "ploaie_puternica",
  "light rain shower": "averse_usoare",
  "moderate or heavy rain shower": "averse_usoare",
  "torrential rain shower": "ploaie_puternica",
  "light drizzle": "burinta_usoara",
  "patchy light drizzle": "burinta_usoara",
  "freezing drizzle": "burinta_usoara",
  "heavy freezing drizzle": "ploaie_moderata",
  "patchy rain possible": "ploaie_usoara",
  "patchy rain nearby": "ploaie_usoara",
  "light freezing rain": "ploaie_usoara",
  "moderate or heavy freezing rain": "ploaie_moderata",
  "patchy light rain": "ploaie_usoara",
  "patchy light rain with thunder": "furtuna",
  "moderate or heavy rain with thunder": "furtuna",
  "light snow": "ninsoare_usoara",
  "moderate snow": "ninsoare_moderata",
  "heavy snow": "ninsoare_puternica",
  "patchy snow possible": "ninsoare_usoara",
  "patchy light snow": "ninsoare_usoara",
  "light snow showers": "ninsoare_usoara",
  "moderate or heavy snow showers": "ninsoare_moderata",
  "blowing snow": "ninsoare_moderata",
  blizzard: "ninsoare_puternica",
  "patchy light snow with thunder": "furtuna",
  "moderate or heavy snow with thunder": "furtuna",
  "ice pellets": "ninsoare_usoara",
  "light showers of ice pellets": "ninsoare_usoara",
  "moderate or heavy showers of ice pellets": "ninsoare_moderata",
  "light sleet": "ploaie_usoara",
  "moderate or heavy sleet": "ploaie_moderata",
  "light sleet showers": "ploaie_usoara",
  "moderate or heavy sleet showers": "ploaie_moderata",
  "patchy sleet possible": "ploaie_usoara",
  "patchy freezing drizzle possible": "burinta_usoara",
  "thundery outbreaks possible": "furtuna",
  "thundery outbreaks in nearby": "furtuna",
};

function mapCondition(text: string): string {
  return WAPI_MAP[text.toLowerCase().trim()] || "necunoscut";
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
