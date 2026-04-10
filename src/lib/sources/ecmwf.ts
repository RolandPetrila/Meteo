import {
  WeatherSource,
  CurrentData,
  HourlyData,
  DailyData,
  wmoToCondition,
  getConditionIcon,
  getDayNameRo,
} from "./base";

const BASE_URL = "https://api.open-meteo.com/v1/ecmwf";
const TIMEOUT = 15000;

export class ECMWFSource implements WeatherSource {
  name = "ecmwf";

  async fetchCurrent(lat: number, lon: number): Promise<CurrentData> {
    // ECMWF pe Open-Meteo nu suporta "current" — extragem din prima ora hourly
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      hourly:
        "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code",
      timezone: "Europe/Bucharest",
      forecast_hours: "3",
    });

    const resp = await fetch(`${BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await resp.json();
    const hourly = data.hourly || {};

    // Gasim ora cea mai apropiata de acum
    const now = Date.now();
    const times: string[] = hourly.time || [];
    let idx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
      const diff = Math.abs(new Date(times[i]).getTime() - now);
      if (diff < minDiff) {
        minDiff = diff;
        idx = i;
      }
    }

    const condition = wmoToCondition(hourly.weather_code?.[idx] ?? 0);

    return {
      temperature: hourly.temperature_2m?.[idx] ?? 0,
      humidity: Math.round(hourly.relative_humidity_2m?.[idx] ?? 0),
      wind_speed: hourly.wind_speed_10m?.[idx] ?? 0,
      wind_direction: Math.round(hourly.wind_direction_10m?.[idx] ?? 0),
      precipitation: hourly.precipitation?.[idx] ?? 0,
      condition,
      condition_icon: getConditionIcon(condition),
    };
  }

  async fetchHourly(lat: number, lon: number): Promise<HourlyData[]> {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      hourly:
        "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code",
      timezone: "Europe/Bucharest",
      forecast_hours: "24",
    });

    const resp = await fetch(`${BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await resp.json();
    const hourly = data.hourly || {};
    const times: string[] = hourly.time || [];

    return times.map((t, i) => ({
      hour: t.includes("T") ? t.split("T")[1].slice(0, 5) : t,
      timestamp: t,
      temperature: hourly.temperature_2m?.[i] ?? 0,
      humidity: Math.round(hourly.relative_humidity_2m?.[i] ?? 0),
      wind_speed: hourly.wind_speed_10m?.[i] ?? 0,
      precipitation: hourly.precipitation?.[i] ?? 0,
      condition: wmoToCondition(hourly.weather_code?.[i] ?? 0),
    }));
  }

  async fetchDaily(lat: number, lon: number): Promise<DailyData[]> {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      daily:
        "temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max",
      timezone: "Europe/Bucharest",
      forecast_days: "10",
    });

    const resp = await fetch(`${BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await resp.json();
    const daily = data.daily || {};
    const dates: string[] = daily.time || [];

    return dates.map((d, i) => ({
      date: d,
      day_name: getDayNameRo(d),
      temp_min: daily.temperature_2m_min?.[i] ?? 0,
      temp_max: daily.temperature_2m_max?.[i] ?? 0,
      precipitation: daily.precipitation_sum?.[i] ?? 0,
      wind_speed: daily.wind_speed_10m_max?.[i] ?? 0,
      condition: wmoToCondition(daily.weather_code?.[i] ?? 0),
    }));
  }
}
