"use client";

import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  locationName: string;
  onGPSClick: () => void;
  gpsLoading: boolean;
  confidence: number;
  gpsError?: string | null;
}

export default function Header({
  locationName,
  onGPSClick,
  gpsLoading,
  confidence,
  gpsError,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-dark-bg/80 border-b border-gray-200/50 dark:border-dark-border/50 pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onGPSClick}
            onTouchEnd={(e) => {
              e.preventDefault();
              onGPSClick();
            }}
            disabled={gpsLoading}
            className="w-12 h-12 rounded-xl bg-primary-500/10 dark:bg-primary-500/20
                       flex items-center justify-center transition-colors duration-150 hover:bg-primary-500/20
                       active:bg-primary-500/30 disabled:opacity-50 touch-manipulation relative z-10
                       select-none cursor-pointer"
            aria-label="Localizare GPS"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <svg
              className={`w-6 h-6 text-primary-500 pointer-events-none ${gpsLoading ? "animate-pulse" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 100 12 6 6 0 000-12zm0 4a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {locationName}
            </h1>
            {confidence > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-16 rounded-full bg-gray-200 dark:bg-dark-surface overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      confidence >= 80
                        ? "bg-emerald-500"
                        : confidence >= 60
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {confidence}%
                </span>
              </div>
            )}
          </div>
        </div>
        <ThemeToggle />
      </div>
      {gpsError && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20">
          <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
            📍 {gpsError}
          </p>
        </div>
      )}
    </header>
  );
}
