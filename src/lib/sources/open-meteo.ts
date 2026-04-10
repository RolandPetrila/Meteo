import {
  WeatherSource,
  CurrentData,
  HourlyData,
  DailyData,
  wmoToCondition,
  getConditionIcon,
  getDayNameRo,
} from "./base";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";
const TIMEOUT = 15000;

export class OpenMeteoSource implements WeatherSource {
  name = "open_meteo";

  async fetchCurrent(lat: number, lon: number): Promise<CurrentData> {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current:
        "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code",
      timezone: "Europe/Bucharest",
    });

    const resp = await fetch(`${BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await resp.json();
    const current = data.current;
    const condition = wmoToCondition(current?.weather_code ?? 0);

    return {
      temperature: current?.temperature_2m ?? 0,
      humidity: Math.round(current?.relative_humidity_2m ?? 0),
      wind_speed: current?.wind_speed_10m ?? 0,
      wind_direction: Math.round(current?.wind_direction_10m ?? 0),
      precipitation: current?.precipitation ?? 0,
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

    return times.map((t, i) => {
      const condition = wmoToCondition(hourly.weather_code?.[i] ?? 0);
      return {
        hour: t.includes("T") ? t.split("T")[1].slice(0, 5) : t,
        timestamp: t,
        temperature: hourly.temperature_2m?.[i] ?? 0,
        humidity: Math.round(hourly.relative_humidity_2m?.[i] ?? 0),
        wind_speed: hourly.wind_speed_10m?.[i] ?? 0,
        precipitation: hourly.precipitation?.[i] ?? 0,
        condition,
      };
    });
  }

  async fetchDaily(lat: number, lon: number): Promise<DailyData[]> {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      daily:
        "temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max",
      hourly: "relative_humidity_2m",
      timezone: "Europe/Bucharest",
      forecast_days: "7",
    });

    const resp = await fetch(`${BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await resp.json();
    const daily = data.daily || {};
    const hourly = data.hourly || {};
    const dates: string[] = daily.time || [];

    // Calculeaza media humidity pe zi din date orare
    const hourlyTimes: string[] = hourly.time || [];
    const hourlyHumidity: number[] = hourly.relative_humidity_2m || [];
    const humidityByDay: Record<string, number[]> = {};
    for (let i = 0; i < hourlyTimes.length; i++) {
      const dateKey = hourlyTimes[i].split("T")[0];
      if (!humidityByDay[dateKey]) humidityByDay[dateKey] = [];
      if (typeof hourlyHumidity[i] === "number") {
        humidityByDay[dateKey].push(hourlyHumidity[i]);
      }
    }

    return dates.map((d, i) => {
      const dayHumidity = humidityByDay[d] || [];
      const avgHumidity =
        dayHumidity.length > 0
          ? Math.round(
              dayHumidity.reduce((a, b) => a + b, 0) / dayHumidity.length,
            )
          : undefined;

      return {
        date: d,
        day_name: getDayNameRo(d),
        temp_min: daily.temperature_2m_min?.[i] ?? 0,
        temp_max: daily.temperature_2m_max?.[i] ?? 0,
        humidity: avgHumidity,
        precipitation: daily.precipitation_sum?.[i] ?? 0,
        wind_speed: daily.wind_speed_10m_max?.[i] ?? 0,
        condition: wmoToCondition(daily.weather_code?.[i] ?? 0),
      };
    });
  }
}
