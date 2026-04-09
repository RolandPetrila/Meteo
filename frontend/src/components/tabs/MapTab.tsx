"use client";

import dynamic from "next/dynamic";

const MapContent = dynamic(() => import("./MapContent"), {
  ssr: false,
  loading: () => (
    <div className="h-80 rounded-2xl bg-gray-100 dark:bg-dark-card flex items-center justify-center">
      <p className="text-gray-500 dark:text-gray-400">Se încarcă harta...</p>
    </div>
  ),
});

interface MapTabProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lon: number, name?: string) => void;
}

export default function MapTab({
  latitude,
  longitude,
  onLocationChange,
}: MapTabProps) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-dark-border">
      <MapContent
        latitude={latitude}
        longitude={longitude}
        onLocationChange={onLocationChange}
      />
    </div>
  );
}
