"use client";

import { useState, useRef, useEffect } from "react";
import type { FavoriteLocation } from "@/lib/types";

interface FavoritesDropdownProps {
  current: { name: string; latitude: number; longitude: number };
  favorites: FavoriteLocation[];
  onSelect: (lat: number, lon: number, name: string) => void;
  onAdd: () => void;
  onRemove: (lat: number, lon: number) => void;
}

export default function FavoritesDropdown({
  current,
  favorites,
  onSelect,
  onAdd,
  onRemove,
}: FavoritesDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Inchide dropdown la click in afara
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const isCurrentInFavorites = favorites.some(
    (f) =>
      Math.abs(f.latitude - current.latitude) < 0.001 &&
      Math.abs(f.longitude - current.longitude) < 0.001,
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-left touch-manipulation"
        aria-label="Locații salvate"
        aria-expanded={open}
      >
        <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[180px]">
          {current.name}
        </h1>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-200 dark:border-dark-border z-[60] overflow-hidden">
          <div className="max-h-64 overflow-y-auto p-2">
            {favorites.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 p-3 text-center">
                Nicio locație salvată
              </p>
            ) : (
              favorites.map((f) => {
                const isActive =
                  Math.abs(f.latitude - current.latitude) < 0.001 &&
                  Math.abs(f.longitude - current.longitude) < 0.001;
                return (
                  <div
                    key={`${f.latitude},${f.longitude}`}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      isActive
                        ? "bg-primary-500/10"
                        : "hover:bg-gray-100 dark:hover:bg-dark-surface"
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelect(f.latitude, f.longitude, f.name);
                        setOpen(false);
                      }}
                      className="flex-1 flex items-center gap-2 text-left text-sm touch-manipulation"
                    >
                      <span
                        className={
                          isActive ? "text-primary-500" : "text-gray-400"
                        }
                      >
                        📍
                      </span>
                      <span
                        className={`truncate ${
                          isActive
                            ? "font-medium text-primary-600 dark:text-primary-400"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {f.name}
                      </span>
                    </button>
                    <button
                      onClick={() => onRemove(f.latitude, f.longitude)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 touch-manipulation"
                      aria-label={`Șterge ${f.name}`}
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
                );
              })
            )}
          </div>
          {!isCurrentInFavorites && (
            <button
              onClick={() => {
                onAdd();
                setOpen(false);
              }}
              className="w-full p-3 border-t border-gray-200 dark:border-dark-border text-sm font-medium text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 touch-manipulation flex items-center justify-center gap-1"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Salvează „{current.name}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
