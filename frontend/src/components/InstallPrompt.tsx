"use client";

import { useState } from "react";
import { usePWA } from "@/hooks/usePWA";

export default function InstallPrompt() {
  const { canInstall, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div className="mx-4 mt-3 p-3 rounded-2xl bg-gradient-to-r from-primary-500/10 to-primary-600/10 dark:from-primary-500/20 dark:to-primary-600/20 border border-primary-500/20 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xl flex-shrink-0">📱</span>
        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
          Instalează aplicația pe telefon
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={promptInstall}
          className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium
                     hover:bg-primary-600 transition-colors active:scale-95"
        >
          Instalează
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Închide"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
