"use client";

import type { DailyForecast } from "@/lib/types";
import { translateCondition } from "@/lib/utils";

interface SevenDayTabProps {
  daily: DailyForecast[];
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

export default function SevenDayTab({ daily }: SevenDayTabProps) {
  if (!daily.length) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Nu sunt date disponibile pentru 7 zile
      </div>
    );
  }

  const allTemps = daily.flatMap((d) => [d.temp_min, d.temp_max]);
  const globalMin = Math.min(...allTemps);
  const globalMax = Math.max(...allTemps);
  const range = globalMax - globalMin || 1;

  return (
    <div className="space-y-2">
      {daily.map((day) => {
        const leftPct = ((day.temp_min - globalMin) / range) * 100;
        const widthPct = ((day.temp_max - day.temp_min) / range) * 100;

        return (
          <div
            key={day.date}
            className="flex items-center gap-3 bg-white dark:bg-dark-card rounded-2xl p-3.5
                       border border-gray-100 dark:border-dark-border"
          >
            {/* Zi */}
            <div className="w-16 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {day.day_name.slice(0, 3)}
              </p>
              <p className="text-xs text-gray-400">{day.date.slice(5)}</p>
            </div>

            {/* Icona */}
            <div className="text-2xl w-8 text-center flex-shrink-0">
              {getIcon(day.condition)}
            </div>

            {/* Temp min */}
            <span className="text-sm text-gray-500 dark:text-gray-400 w-10 text-right flex-shrink-0">
              {Math.round(day.temp_min)}°
            </span>

            {/* Bara temperatura */}
            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-dark-surface relative">
              <div
                className="absolute h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                style={{
                  left: `${leftPct}%`,
                  width: `${Math.max(widthPct, 8)}%`,
                }}
              />
            </div>

            {/* Temp max */}
            <span className="text-sm font-semibold text-gray-900 dark:text-white w-10 flex-shrink-0">
              {Math.round(day.temp_max)}°
            </span>
          </div>
        );
      })}
    </div>
  );
}
