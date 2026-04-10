"use client";

import { useState, useEffect } from "react";

export default function PrivacyBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenBanner = localStorage.getItem("meteo_privacy_accepted");
    if (!hasSeenBanner) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border shadow-lg z-50">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center sm:text-left">
          Aplicația folosește locația doar local pentru a afișa prognoza corectă. Datele nu sunt stocate.
        </p>
        <button
          onClick={() => {
            localStorage.setItem("meteo_privacy_accepted", "true");
            setIsVisible(false);
          }}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md text-sm font-medium transition-colors whitespace-nowrap"
        >
          Am înțeles
        </button>
      </div>
    </div>
  );
}
