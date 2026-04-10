"use client";

import { useWeather } from "@/hooks/useWeather";
import { useLocation } from "@/hooks/useLocation";
import Header from "@/components/Header";
import LocationSearch from "@/components/LocationSearch";
import WeatherAlert from "@/components/WeatherAlert";
import WeatherCard from "@/components/WeatherCard";
import TabContainer from "@/components/TabContainer";
import RefreshBar from "@/components/RefreshBar";
import InstallPrompt from "@/components/InstallPrompt";
import Skeleton from "@/components/Skeleton";

export default function Home() {
  const {
    currentLocation,
    setLocation,
    favorites,
    addFavorite,
    removeFavorite,
    requestGPS,
    gpsLoading,
    gpsError,
  } = useLocation();
  const { data, loading, error, refresh, lastUpdated } = useWeather(
    currentLocation.latitude,
    currentLocation.longitude,
  );

  const handleLocationChange = (lat: number, lon: number, name?: string) => {
    setLocation(lat, lon, name);
  };

  const handleAddCurrentToFavorites = () => {
    addFavorite(
      currentLocation.name,
      currentLocation.latitude,
      currentLocation.longitude,
    );
  };

  return (
    <>
      <Header
        currentLocation={currentLocation}
        favorites={favorites}
        onSelectFavorite={handleLocationChange}
        onAddFavorite={handleAddCurrentToFavorites}
        onRemoveFavorite={removeFavorite}
        onGPSClick={requestGPS}
        gpsLoading={gpsLoading}
        confidence={data?.aggregated_confidence || 0}
        gpsError={gpsError}
      />

      <div className="mx-4 mt-3">
        <LocationSearch onSelect={handleLocationChange} />
      </div>

      <InstallPrompt />

      {/* Loading state */}
      {loading && !data && <Skeleton />}

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
          <WeatherAlert hourly={data.forecast_hourly} current={data.current} />
          <WeatherCard
            current={data.current}
            aiSummary={data.ai_summary}
            agreement={data.agreement}
            todayForecast={data.forecast_7days?.[0]}
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
