"use client";

import type { SourceData, AgreementInfo } from "@/lib/types";
import { SOURCE_NAMES, SOURCE_COLORS } from "@/lib/constants";
import {
  translateCondition,
  getAgreementColor,
  getAgreementBg,
} from "@/lib/utils";
import ConfidenceBadge from "../ConfidenceBadge";

interface ComparisonTabProps {
  comparison: SourceData[];
  agreement: AgreementInfo;
}

export default function ComparisonTab({
  comparison,
  agreement,
}: ComparisonTabProps) {
  return (
    <div className="space-y-3">
      {/* Indicator acord */}
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl ${getAgreementBg(agreement.color)}`}
      >
        <span
          className={`w-3 h-3 rounded-full ${
            agreement.color === "green"
              ? "bg-emerald-500"
              : agreement.color === "yellow"
                ? "bg-amber-500"
                : "bg-red-500"
          }`}
        />
        <span
          className={`text-sm font-medium ${getAgreementColor(agreement.color)}`}
        >
          {agreement.description}
        </span>
      </div>

      {/* Tabel surse */}
      {comparison.map((source) => (
        <div
          key={source.source}
          className={`bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border ${
            !source.available ? "opacity-50" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: SOURCE_COLORS[source.source] || "#6b7280",
                }}
              />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {SOURCE_NAMES[source.source] || source.source}
              </span>
            </div>
            {source.available ? (
              <ConfidenceBadge score={source.confidence} />
            ) : (
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-dark-surface px-2 py-1 rounded-lg">
                Indisponibil
              </span>
            )}
          </div>

          {source.available && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="text-xs text-gray-400">Temp</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {source.temperature !== null
                    ? `${source.temperature}°C`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Umiditate</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {source.humidity !== null ? `${source.humidity}%` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Vânt</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {source.wind_speed !== null
                    ? `${source.wind_speed} km/h`
                    : "—"}
                </p>
              </div>
            </div>
          )}

          {source.available && source.condition && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {translateCondition(source.condition)}
              {source.response_time_ms > 0 && (
                <span className="ml-2 text-gray-400">
                  ({source.response_time_ms}ms)
                </span>
              )}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
