"use client";

import { useWeather } from "@/hooks/useWeather";
import { useLocation } from "@/hooks/useLocation";
import Header from "@/components/Header";
import WeatherCard from "@/components/WeatherCard";
import TabContainer from "@/components/TabContainer";
import RefreshBar from "@/components/RefreshBar";
import InstallPrompt from "@/components/InstallPrompt";

export default function Home() {
  const { currentLocation, setLocation, requestGPS, gpsLoading } =
    useLocation();
  const { data, loading, error, refresh, lastUpdated } = useWeather(
    currentLocation.latitude,
    currentLocation.longitude,
  );

  const handleLocationChange = (lat: number, lon: number, name?: string) => {
    setLocation(lat, lon, name);
  };

  return (
    <>
      <Header
        locationName={currentLocation.name}
        onGPSClick={requestGPS}
        gpsLoading={gpsLoading}
        confidence={data?.aggregated_confidence || 0}
      />

      <InstallPrompt />

      {/* Loading state */}
      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Se încarcă datele meteo...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !data && (
        <div className="mx-4 mt-8 p-6 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium
                       hover:bg-red-600 transition-colors active:scale-95"
          >
            Încearcă din nou
          </button>
        </div>
      )}

      {/* Weather data */}
      {data && (
        <>
          <WeatherCard
            current={data.current}
            aiSummary={data.ai_summary}
            agreement={data.agreement}
          />
          <RefreshBar
            lastUpdated={lastUpdated}
            onRefresh={refresh}
            loading={loading}
          />
          <TabContainer data={data} onLocationChange={handleLocationChange} />
        </>
      )}
    </>
  );
}
