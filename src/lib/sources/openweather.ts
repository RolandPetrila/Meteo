import {
  WeatherSource,
  CurrentData,
  HourlyData,
  DailyData,
  getConditionIcon,
  getDayNameRo,
} from "./base";

const BASE_URL = "https://api.openweathermap.org/data/2.5";
const TIMEOUT = 15000;

const OWM_MAP: Record<string, string> = {
  Clear: "senin",
  Clouds: "noros",
  Drizzle: "burinta_usoara",
  Rain: "ploaie_moderata",
  Thunderstorm: "furtuna",
  Snow: "ninsoare_moderata",
  Mist: "ceata",
  Fog: "ceata",
  Haze: "ceata",
};

function mapCondition(weather: Array<{ main: string }>): string {
  if (!weather?.[0]) return "necunoscut";
  return OWM_MAP[weather[0].main] || "necunoscut";
}

export class OpenWeatherSource implements WeatherSource {
  name = "openweather";

  private get apiKey(): string {
    return process.env.OPENWEATHER_API_KEY || "";
  }

  async fetchCurrent(lat: number, lon: number): Promise<CurrentData> {
    if (!this.apiKey) throw new Error("OpenWeather API key lipsă");

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      units: "metric",
      appid: this.apiKey,
    });

    const resp = await fetch(`${BASE_URL}/weather?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await resp.json();
    if (data.cod && data.cod !== 200) throw new Error(data.message);

    const condition = mapCondition(data.weather);
    return {
      temperature: data.main?.temp ?? 0,
      humidity: data.main?.humidity ?? 0,
      wind_speed: Math.round((data.wind?.speed ?? 0) * 3.6 * 10) / 10,
      wind_direction: data.wind?.deg ?? 0,
      precipitation: data.rain?.["1h"] ?? 0,
      condition,
      condition_icon: getConditionIcon(condition),
    };
  }

  async fetchHourly(lat: number, lon: number): Promise<HourlyData[]> {
    if (!this.apiKey) throw new Error("OpenWeather API key lipsă");

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      units: "metric",
      appid: this.apiKey,
    });

    const resp = await fetch(`${BASE_URL}/forecast?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await resp.json();

    return (data.list || [])
      .slice(0, 8)
      .map((item: Record<string, unknown>) => {
        const dt = new Date((item.dt as number) * 1000);
        const condition = mapCondition(
          (item as { weather: Array<{ main: string }> }).weather,
        );
        const main = item.main as { temp: number; humidity: number };
        const wind = item.wind as { speed: number };
        const rain = item.rain as Record<string, number> | undefined;
        return {
          hour: dt.toLocaleTimeString("ro-RO", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Bucharest",
          }),
          timestamp: dt.toISOString(),
          temperature: main?.temp ?? 0,
          humidity: main?.humidity ?? 0,
          wind_speed: Math.round((wind?.speed ?? 0) * 3.6 * 10) / 10,
          precipitation: rain?.["3h"] ?? 0,
          condition,
        };
      });
  }

  async fetchDaily(lat: number, lon: number): Promise<DailyData[]> {
    if (!this.apiKey) throw new Error("OpenWeather API key lipsă");

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      units: "metric",
      appid: this.apiKey,
    });

    const resp = await fetch(`${BASE_URL}/forecast?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await resp.json();

    const days: Record<string, Array<Record<string, unknown>>> = {};
    for (const item of data.list || []) {
      const dt = new Date((item.dt as number) * 1000);
      const key = dt.toISOString().split("T")[0];
      if (!days[key]) days[key] = [];
      days[key].push(item);
    }

    return Object.entries(days)
      .slice(0, 5)
      .map(([dateStr, items]) => {
        const temps = items.map((it) => (it.main as { temp: number }).temp);
        const midItem = items[Math.floor(items.length / 2)];
        const condition = mapCondition(
          (midItem as { weather: Array<{ main: string }> }).weather,
        );
        return {
          date: dateStr,
          day_name: getDayNameRo(dateStr),
          temp_min: Math.round(Math.min(...temps) * 10) / 10,
          temp_max: Math.round(Math.max(...temps) * 10) / 10,
          precipitation: items.reduce(
            (sum, it) =>
              sum +
              ((it.rain as Record<string, number> | undefined)?.["3h"] ?? 0),
            0,
          ),
          wind_speed:
            Math.round(
              Math.max(
                ...items.map(
                  (it) => ((it.wind as { speed: number })?.speed ?? 0) * 3.6,
                ),
              ) * 10,
            ) / 10,
          condition,
        };
      });
  }
}
