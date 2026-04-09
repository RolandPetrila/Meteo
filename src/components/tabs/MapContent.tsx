"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapContentProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lon: number, name?: string) => void;
}

export default function MapContent({
  latitude,
  longitude,
  onLocationChange,
}: MapContentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([latitude, longitude], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);

    const marker = L.marker([latitude, longitude], {
      icon: L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background: #3b82f6;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    }).addTo(map);

    markerRef.current = marker;
    mapInstanceRef.current = map;

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onLocationChange(parseFloat(lat.toFixed(3)), parseFloat(lng.toFixed(3)));
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], 10);
      markerRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude]);

  return (
    <div>
      <div ref={mapRef} className="h-80 w-full" />
      <div className="bg-white dark:bg-dark-card px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 text-center">
        Click pe hartă pentru a selecta o locație nouă
      </div>
    </div>
  );
}
