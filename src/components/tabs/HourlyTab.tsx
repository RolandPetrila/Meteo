"use client";

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import type { HourlyForecast } from "@/lib/types";
import { translateCondition } from "@/lib/utils";

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

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: HourlyForecast }>;
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl p-3 shadow-lg border border-gray-200 dark:border-dark-border text-sm">
      <p className="font-semibold text-gray-900 dark:text-white">{data.hour}</p>
      <p className="text-gray-600 dark:text-gray-300">
        🌡️ {data.temperature}°C
      </p>
      <p className="text-gray-600 dark:text-gray-300">💧 {data.humidity}%</p>
      <p className="text-gray-600 dark:text-gray-300">
        💨 {data.wind_speed} km/h
      </p>
      <p className="text-gray-600 dark:text-gray-300">
        {translateCondition(data.condition)}
      </p>
    </div>
  );
}

export default function HourlyTab({ hourly }: HourlyTabProps) {
  if (!hourly.length) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Nu sunt date orare disponibile
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grafic temperatura */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-dark-border">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Temperatură (°C)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={hourly}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              className="dark:opacity-20"
            />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              width={35}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#tempGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#3b82f6",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Lista ore - 24h complet */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-dark-border">
          {hourly.map((h) => {
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
                className="flex items-center justify-between px-4 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-12">
                    {h.hour}
                  </span>
                  <span className="text-xl">{getIcon(h.condition)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-base font-semibold text-gray-900 dark:text-white w-12 text-right">
                    {Math.round(h.temperature)}°
                  </span>
                  <span className={`text-sm w-16 text-right ${precipColor}`}>
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
    </div>
  );
}
