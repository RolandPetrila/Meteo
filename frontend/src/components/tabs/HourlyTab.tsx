"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
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

      {/* Grafic umiditate */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-dark-border">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Umiditate (%)
        </h3>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={hourly}>
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
              domain={[0, 100]}
            />
            <Line
              type="monotone"
              dataKey="humidity"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Lista orizontala cu ore */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {hourly.slice(0, 12).map((h) => (
          <div
            key={h.hour}
            className="flex-shrink-0 w-16 bg-white dark:bg-dark-card rounded-xl p-2.5
                       border border-gray-100 dark:border-dark-border text-center"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">{h.hour}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {Math.round(h.temperature)}°
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💧{h.humidity}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
