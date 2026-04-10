import type { WeatherResponse } from "./types";

// API-ul e pe acelasi domeniu (Next.js API routes) — fara URL extern
async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Eroare HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<WeatherResponse> {
  return fetchJSON<WeatherResponse>(`/api/weather/${lat}/${lon}`, signal);
}

export async function fetchHourly(
  lat: number,
  lon: number,
  signal?: AbortSignal,
) {
  return fetchJSON<{
    hourly: WeatherResponse["forecast_hourly"];
    cache_hit: boolean;
  }>(`/api/weather/${lat}/${lon}/hourly`, signal);
}

export async function fetchComparison(
  lat: number,
  lon: number,
  signal?: AbortSignal,
) {
  return fetchJSON<{
    comparison: WeatherResponse["comparison"];
    agreement: WeatherResponse["agreement"];
    aggregated_confidence: number;
  }>(`/api/weather/${lat}/${lon}/comparison`, signal);
}
