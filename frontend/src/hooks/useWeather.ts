"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWeather } from "@/lib/api";
import { REFRESH_INTERVAL } from "@/lib/constants";
import type { WeatherResponse } from "@/lib/types";

export function useWeather(lat: number, lon: number) {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWeather(lat, lon);
      setData(result);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Eroare la încărcarea datelor meteo",
      );
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, loading, error, refresh, lastUpdated };
}
