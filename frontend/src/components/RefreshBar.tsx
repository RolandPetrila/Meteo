"use client";

import { useState, useEffect } from "react";
import { timeAgo } from "@/lib/utils";
import { REFRESH_INTERVAL } from "@/lib/constants";

interface RefreshBarProps {
  lastUpdated: string | null;
  onRefresh: () => void;
  loading: boolean;
}

export default function RefreshBar({
  lastUpdated,
  onRefresh,
  loading,
}: RefreshBarProps) {
  const [progress, setProgress] = useState(0);
  const [timeText, setTimeText] = useState("");

  useEffect(() => {
    if (!lastUpdated) return;

    const updateProgress = () => {
      const elapsed = Date.now() - new Date(lastUpdated).getTime();
      const pct = Math.min((elapsed / REFRESH_INTERVAL) * 100, 100);
      setProgress(pct);
      setTimeText(timeAgo(lastUpdated));
    };

    updateProgress();
    const interval = setInterval(updateProgress, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="mx-4 mt-4 mb-6">
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        <span>{lastUpdated ? timeText : "Se încarcă..."}</span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg
                     bg-gray-100 dark:bg-dark-surface
                     hover:bg-gray-200 dark:hover:bg-dark-border
                     transition-colors active:scale-95 disabled:opacity-50"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Actualizează
        </button>
      </div>
      {/* Bara de progres */}
      <div className="h-1 rounded-full bg-gray-200 dark:bg-dark-surface overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-500/50 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
