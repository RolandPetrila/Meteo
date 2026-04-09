"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_LAT, DEFAULT_LON, DEFAULT_NAME } from "@/lib/constants";
import type { FavoriteLocation } from "@/lib/types";

const FAVORITES_KEY = "meteo_favorites";
const CURRENT_KEY = "meteo_current_location";

export function useLocation() {
  const [currentLocation, setCurrentLocation] = useState({
    name: DEFAULT_NAME,
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LON,
  });
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(CURRENT_KEY);
    if (saved) {
      try {
        setCurrentLocation(JSON.parse(saved));
      } catch {
        // ignora date invalide
      }
    }
    const savedFavs = localStorage.getItem(FAVORITES_KEY);
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch {
        // ignora
      }
    }
  }, []);

  const setLocation = useCallback((lat: number, lon: number, name?: string) => {
    const loc = {
      name: name || `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`,
      latitude: lat,
      longitude: lon,
    };
    setCurrentLocation(loc);
    localStorage.setItem(CURRENT_KEY, JSON.stringify(loc));
  }, []);

  const addFavorite = useCallback(
    (name: string, lat: number, lon: number) => {
      const newFav = { name, latitude: lat, longitude: lon };
      const updated = [
        ...favorites.filter(
          (f) =>
            !(
              Math.abs(f.latitude - lat) < 0.001 &&
              Math.abs(f.longitude - lon) < 0.001
            ),
        ),
        newFav,
      ];
      setFavorites(updated);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    },
    [favorites],
  );

  const removeFavorite = useCallback(
    (lat: number, lon: number) => {
      const updated = favorites.filter(
        (f) =>
          !(
            Math.abs(f.latitude - lat) < 0.001 &&
            Math.abs(f.longitude - lon) < 0.001
          ),
      );
      setFavorites(updated);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    },
    [favorites],
  );

  const requestGPS = useCallback(() => {
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("GPS-ul nu este disponibil pe acest dispozitiv");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude, "Locația mea");
        setGpsLoading(false);
        setGpsError(null);
      },
      (err) => {
        setGpsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError("Permite accesul la locație din setările browserului");
            break;
          case err.POSITION_UNAVAILABLE:
            setGpsError("Locația nu poate fi determinată. Verifică GPS-ul.");
            break;
          case err.TIMEOUT:
            setGpsError(
              "Timeout — încearcă din nou într-un loc cu semnal mai bun",
            );
            break;
          default:
            setGpsError("Eroare la detectarea locației");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [setLocation]);

  return {
    currentLocation,
    setLocation,
    favorites,
    addFavorite,
    removeFavorite,
    requestGPS,
    gpsLoading,
    gpsError,
  };
}
