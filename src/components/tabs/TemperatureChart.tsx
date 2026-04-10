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

export default function TemperatureChart({ data }: { data: HourlyForecast[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
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
  );
}
