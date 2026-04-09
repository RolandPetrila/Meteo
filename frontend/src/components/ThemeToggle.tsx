"use client";

import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-12 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-sm
                 border border-white/20 dark:border-white/10
                 flex items-center justify-center transition-all duration-300
                 hover:bg-white/20 dark:hover:bg-white/10 active:scale-95"
      aria-label={isDark ? "Mod luminos" : "Mod întunecat"}
    >
      <span className="text-xl transition-transform duration-300">
        {isDark ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
