"use client";

import { translateCondition } from "@/lib/utils";
import type {
  CurrentWeather,
  AISummary,
  AgreementInfo,
  DailyForecast,
} from "@/lib/types";

interface WeatherCardProps {
  current: CurrentWeather;
  aiSummary: AISummary;
  agreement: AgreementInfo;
  todayForecast?: DailyForecast;
}

export default function WeatherCard({
  current,
  aiSummary,
  agreement,
  todayForecast,
}: WeatherCardProps) {
  const conditionText = translateCondition(current.condition);

  const dotColor =
    agreement.color === "green"
      ? "bg-emerald-400"
      : agreement.color === "yellow"
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <div className="mx-4 mt-4">
      <div
        className="relative overflow-hidden rounded-3xl p-8
                   bg-gradient-to-br from-primary-500 to-primary-700
                   dark:from-primary-600 dark:to-primary-900
                   text-white shadow-xl shadow-primary-500/20"
      >
        {/* Background decorativ subtil */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-10 -translate-x-10" />

        <div className="relative z-10">
          {/* Temperatura mare si aerisita */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-8xl font-extralight tracking-tighter leading-none">
                {Math.round(current.temperature)}°
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-2xl">{current.condition_icon}</span>
                <span className="text-base font-medium opacity-90">
                  {conditionText}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${dotColor}`}
                  title={agreement.description}
                />
              </div>
            </div>

            {/* Zi/Noapte in dreapta-sus, discret */}
            {todayForecast && (
              <div className="text-right space-y-1.5">
                <div className="text-sm opacity-80 flex items-center justify-end gap-1.5">
                  <span className="opacity-70">☀️</span>
                  <span className="font-semibold tabular-nums">
                    {Math.round(todayForecast.temp_max)}°
                  </span>
                </div>
                <div className="text-sm opacity-80 flex items-center justify-end gap-1.5">
                  <span className="opacity-70">🌙</span>
                  <span className="font-semibold tabular-nums">
                    {Math.round(todayForecast.temp_min)}°
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Detalii secundare: umiditate + vant + precipitatii — icoane discrete */}
          <div className="flex items-center gap-5 mt-6 text-sm opacity-80">
            <div className="flex items-center gap-1.5">
              <span>💧</span>
              <span className="tabular-nums">{current.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>💨</span>
              <span className="tabular-nums">{current.wind_speed} km/h</span>
            </div>
            {current.precipitation > 0 && (
              <div className="flex items-center gap-1.5">
                <span>🌧️</span>
                <span className="tabular-nums">{current.precipitation} mm</span>
              </div>
            )}
          </div>

          {/* AI Summary + Recommendation */}
          <div className="mt-6 pt-6 border-t border-white/15">
            <p className="text-sm leading-relaxed opacity-80">
              {aiSummary.summary}
            </p>
            <p className="text-sm font-semibold mt-2">
              {aiSummary.recommendation}
            </p>
          </div>

          {/* Alert critic */}
          {aiSummary.alert && (
            <div className="mt-4 px-4 py-2.5 rounded-xl bg-red-500/25 border border-red-400/40 text-sm font-medium">
              ⚠️ {aiSummary.alert}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
