import { API_URL } from "./constants";
import type { WeatherResponse, SavedLocation } from "./types";

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Eroare HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchWeather(
  lat: number,
  lon: number,
): Promise<WeatherResponse> {
  return fetchJSON<WeatherResponse>(`${API_URL}/api/weather/${lat}/${lon}`);
}

export async function fetchHourly(lat: number, lon: number) {
  return fetchJSON<{
    hourly: WeatherResponse["forecast_hourly"];
    cache_hit: boolean;
  }>(`${API_URL}/api/weather/${lat}/${lon}/hourly`);
}

export async function fetchComparison(lat: number, lon: number) {
  return fetchJSON<{
    comparison: WeatherResponse["comparison"];
    agreement: WeatherResponse["agreement"];
    aggregated_confidence: number;
  }>(`${API_URL}/api/weather/${lat}/${lon}/comparison`);
}

export async function fetchLocations(): Promise<SavedLocation[]> {
  return fetchJSON<SavedLocation[]>(`${API_URL}/api/locations/`);
}

export async function saveLocation(
  name: string,
  latitude: number,
  longitude: number,
): Promise<SavedLocation> {
  const response = await fetch(`${API_URL}/api/locations/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, latitude, longitude }),
  });
  if (!response.ok) throw new Error("Eroare la salvarea locației");
  return response.json();
}

export async function deleteLocation(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/locations/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Eroare la ștergerea locației");
}
