"use client";

import { translateCondition } from "@/lib/utils";
import type {
  CurrentWeather,
  AISummary,
  AgreementInfo,
  DailyForecast,
  TodaySourceTemp,
} from "@/lib/types";
import { getAgreementBg } from "@/lib/utils";

interface WeatherCardProps {
  current: CurrentWeather;
  aiSummary: AISummary;
  agreement: AgreementInfo;
  todayForecast?: DailyForecast;
  todaySources?: TodaySourceTemp[];
}

export default function WeatherCard({
  current,
  aiSummary,
  agreement,
  todayForecast,
  todaySources,
}: WeatherCardProps) {
  const conditionText = translateCondition(current.condition);

  return (
    <div className="mx-4 mt-4">
      {/* Card principal */}
      <div
        className="relative overflow-hidden rounded-3xl p-6
                    bg-gradient-to-br from-primary-500 to-primary-700
                    dark:from-primary-600 dark:to-primary-900
                    text-white shadow-xl shadow-primary-500/25"
      >
        {/* Background decorativ */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

        <div className="relative z-10">
          {/* Temperatura + conditie */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-7xl font-extralight tracking-tighter">
                {Math.round(current.temperature)}°
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl">{current.condition_icon}</span>
                <span className="text-lg font-medium opacity-90">
                  {conditionText}
                </span>
              </div>
              {todayForecast && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15">
                    <span className="text-sm opacity-70">☀️</span>
                    <span className="text-sm font-semibold">
                      {Math.round(todayForecast.temp_max)}°
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/15">
                    <span className="text-sm opacity-70">🌙</span>
                    <span className="text-sm font-semibold">
                      {Math.round(todayForecast.temp_min)}°
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="text-right space-y-1 text-sm opacity-80">
              <div>💧 {current.humidity}%</div>
              <div>💨 {current.wind_speed} km/h</div>
              {current.precipitation > 0 && (
                <div>🌧️ {current.precipitation} mm</div>
              )}
            </div>
          </div>

          {/* Temperaturi zi/noapte per sursa */}
          {todaySources && todaySources.length > 0 && todayForecast && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs font-medium opacity-70 mb-2.5 uppercase tracking-wide">
                Temperaturi azi per sursă
              </p>
              <div className="space-y-1.5">
                {todaySources.map((src) => (
                  <div
                    key={src.source}
                    className="flex items-center justify-between text-sm px-2.5 py-1.5 rounded-lg bg-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{src.label}</span>
                      <span className="text-xs opacity-50">
                        {Math.round(src.confidence)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="opacity-80">
                        ☀️ {Math.round(src.temp_max)}°
                      </span>
                      <span className="opacity-60">
                        🌙 {Math.round(src.temp_min)}°
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Rezultat ponderat */}
              <div className="flex items-center justify-between text-sm mt-2 px-2.5 py-2 rounded-lg bg-white/20 font-semibold">
                <span>Rezultat ponderat</span>
                <div className="flex items-center gap-3">
                  <span>☀️ {Math.round(todayForecast.temp_max)}°</span>
                  <span>🌙 {Math.round(todayForecast.temp_min)}°</span>
                </div>
              </div>
            </div>
          )}

          {/* Indicator acord surse */}
          <div
            className={`mt-4 px-3 py-1.5 rounded-xl text-sm inline-flex items-center gap-2 ${getAgreementBg(agreement.color)}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                agreement.color === "green"
                  ? "bg-emerald-400"
                  : agreement.color === "yellow"
                    ? "bg-amber-400"
                    : "bg-red-400"
              }`}
            />
            {agreement.description}
          </div>

          {/* AI Summary */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm font-medium opacity-90">
              {aiSummary.summary}
            </p>
            <p className="text-sm mt-1 opacity-75">
              {aiSummary.recommendation}
            </p>
          </div>

          {/* Alert */}
          {aiSummary.alert && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-red-500/30 border border-red-400/30 text-sm">
              ⚠️ {aiSummary.alert}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
