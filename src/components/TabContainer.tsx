"use client";

import { useState } from "react";
import type { WeatherResponse } from "@/lib/types";
import HourlyTab from "./tabs/HourlyTab";
import SevenDayTab from "./tabs/SevenDayTab";
import ComparisonTab from "./tabs/ComparisonTab";
import MapTab from "./tabs/MapTab";

const TABS = [
  { id: "hourly", label: "Orar", icon: "🕐" },
  { id: "daily", label: "Prognoză", icon: "📅" },
  { id: "compare", label: "Surse", icon: "📊" },
  { id: "map", label: "Hartă", icon: "🗺️" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface TabContainerProps {
  data: WeatherResponse;
  onLocationChange: (lat: number, lon: number, name?: string) => void;
}

export default function TabContainer({
  data,
  onLocationChange,
}: TabContainerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("hourly");

  return (
    <div className="mx-4 mt-4">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-2xl bg-gray-100 dark:bg-dark-card">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === "hourly" && <HourlyTab hourly={data.forecast_hourly} />}
        {activeTab === "daily" && <SevenDayTab daily={data.forecast_7days} />}
        {activeTab === "compare" && (
          <ComparisonTab
            comparison={data.comparison}
            agreement={data.agreement}
            todaySources={data.today_sources}
          />
        )}
        {activeTab === "map" && (
          <MapTab
            latitude={data.location.latitude}
            longitude={data.location.longitude}
            onLocationChange={onLocationChange}
          />
        )}
      </div>
    </div>
  );
}
