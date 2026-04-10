"use client";

import dynamic from "next/dynamic";
import type { HourlyForecast } from "@/lib/types";

// Dynamic import Recharts pentru bundle mai mic
const TemperatureChart = dynamic(() => import("./TemperatureChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] rounded-2xl bg-gray-100 dark:bg-dark-card animate-pulse" />
  ),
});

interface HourlyTabProps {
  hourly: HourlyForecast[];
}

const CONDITION_ICONS: Record<string, string> = {
  senin: "☀️",
  predominant_senin: "🌤️",
  partial_noros: "⛅",
  noros: "☁️",
  ceata: "🌫️",
  ploaie_usoara: "🌦️",
  ploaie_moderata: "🌧️",
  ploaie_puternica: "🌧️",
  ninsoare_usoara: "🌨️",
  ninsoare_moderata: "❄️",
  ninsoare_puternica: "❄️",
  furtuna: "⛈️",
  averse_usoare: "🌦️",
  averse_moderate: "🌧️",
  averse_puternice: "⛈️",
};

function getIcon(condition: string): string {
  return CONDITION_ICONS[condition] || "🌡️";
}

const DAY_NAMES = [
  "Duminică",
  "Luni",
  "Marți",
  "Miercuri",
  "Joi",
  "Vineri",
  "Sâmbătă",
];

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return "Astăzi";
  if (target.getTime() === tomorrow.getTime()) return "Mâine";
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${date.toLocaleDateString("ro-RO", { month: "short" })}`;
}

function isNightHour(hourStr: string): boolean {
  const h = parseInt(hourStr.split(":")[0], 10);
  return h >= 21 || h < 7;
}

export default function HourlyTab({ hourly }: HourlyTabProps) {
  if (!hourly.length) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Nu sunt date orare disponibile
      </div>
    );
  }

  // Grupeaza orele per zi
  const grouped: Record<string, HourlyForecast[]> = {};
  for (const h of hourly) {
    const dateKey = h.timestamp.split("T")[0];
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(h);
  }
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      {/* Grafic temperatura — primele 24 de ore */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-dark-border">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
          Temperatură următoarele 24h
        </h3>
        <TemperatureChart data={hourly.slice(0, 24)} />
      </div>

      {/* Lista ore — grupate per zi cu sticky headers */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
        {sortedDates.map((dateKey) => {
          const hours = grouped[dateKey];
          return (
            <div key={dateKey}>
              {/* Sticky header pentru zi */}
              <div className="sticky top-0 z-10 px-4 py-2 bg-gray-50/95 dark:bg-dark-surface/95 backdrop-blur-sm border-b border-gray-200 dark:border-dark-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  {formatDayLabel(dateKey)}
                </p>
              </div>

              {/* Orele din ziua respectiva */}
              <div className="divide-y divide-gray-100 dark:divide-dark-border">
                {hours.map((h) => {
                  const night = isNightHour(h.hour);
                  const precipColor =
                    h.precipitation >= 5
                      ? "text-red-500"
                      : h.precipitation >= 1
                        ? "text-amber-500"
                        : h.precipitation > 0
                          ? "text-blue-500"
                          : "text-gray-300 dark:text-gray-600";

                  return (
                    <div
                      key={h.timestamp}
                      className={`flex items-center justify-between px-4 py-2.5 ${
                        night ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-medium w-12 tabular-nums ${
                            night
                              ? "text-indigo-600 dark:text-indigo-300"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {h.hour}
                        </span>
                        <span className="text-xl">{getIcon(h.condition)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-base font-semibold text-gray-900 dark:text-white w-12 text-right tabular-nums">
                          {Math.round(h.temperature)}°
                        </span>
                        <span
                          className={`text-sm w-16 text-right tabular-nums ${precipColor}`}
                        >
                          {h.precipitation > 0
                            ? `${h.precipitation.toFixed(1)} mm`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
