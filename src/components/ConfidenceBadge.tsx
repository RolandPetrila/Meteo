"use client";

import { getConfidenceColor } from "@/lib/utils";

interface ConfidenceBadgeProps {
  score: number;
  size?: "sm" | "md";
}

export default function ConfidenceBadge({
  score,
  size = "sm",
}: ConfidenceBadgeProps) {
  const bgColor = getConfidenceColor(score);
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-1.5 rounded-full bg-gray-200 dark:bg-dark-surface overflow-hidden ${size === "sm" ? "w-12" : "w-16"}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${bgColor}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span
        className={`${textSize} font-medium tabular-nums ${
          score >= 80
            ? "text-emerald-600 dark:text-emerald-400"
            : score >= 60
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400"
        }`}
      >
        {Math.round(score)}%
      </span>
    </div>
  );
}
