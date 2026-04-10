"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchWeather } from "@/lib/api";
import { REFRESH_INTERVAL } from "@/lib/constants";
import type { WeatherResponse } from "@/lib/types";

export function useWeather(lat: number, lon: number) {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(async () => {
    // Anuleaza fetch-ul anterior daca exista
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchWeather(lat, lon, controller.signal);
      if (controller.signal.aborted) return;
      setData(result);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(
        err instanceof Error
          ? err.message
          : "Eroare la încărcarea datelor meteo",
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    doFetch();
    const interval = setInterval(doFetch, REFRESH_INTERVAL);
    return () => {
      clearInterval(interval);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [doFetch]);

  return { data, loading, error, refresh: doFetch, lastUpdated };
}
