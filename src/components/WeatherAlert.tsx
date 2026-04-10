"use client";

import type { HourlyForecast, CurrentWeather } from "@/lib/types";

interface Alert {
  level: "info" | "warning" | "danger";
  message: string;
  icon: string;
}

function detectAlerts(
  hourly: HourlyForecast[],
  current: CurrentWeather,
): Alert[] {
  const alerts: Alert[] = [];
  const next12h = hourly.slice(0, 12);
  const next6h = hourly.slice(0, 6);

  // Furtuna iminenta
  const stormHourIndex = next6h.findIndex(
    (h) => h.condition.includes("furtuna") || h.condition.includes("grindina"),
  );
  if (stormHourIndex !== -1) {
    alerts.push({
      level: "danger",
      message: `Furtună prognozată la ora ${next6h[stormHourIndex].hour}`,
      icon: "⛈️",
    });
  }

  // Ploaie semnificativa urmatoarele 12h
  const rainSum = next12h.reduce((s, h) => s + (h.precipitation || 0), 0);
  if (rainSum > 15) {
    alerts.push({
      level: "warning",
      message: `Ploaie abundentă: ${rainSum.toFixed(0)}mm în următoarele 12h`,
      icon: "🌧️",
    });
  } else if (rainSum > 5) {
    alerts.push({
      level: "info",
      message: `Ploaie ușoară: ${rainSum.toFixed(0)}mm în 12h. Ia umbrela.`,
      icon: "🌦️",
    });
  }

  // Ninsoare in urmatoarele 6h
  const snowHour = next6h.find((h) => h.condition.includes("ninsoare"));
  if (snowHour) {
    alerts.push({
      level: "warning",
      message: `Ninsoare la ora ${snowHour.hour} — atenție la drumuri`,
      icon: "❄️",
    });
  }

  // Temperaturi extreme (curent)
  if (current.temperature >= 35) {
    alerts.push({
      level: "danger",
      message: `Caniculă: ${current.temperature.toFixed(0)}°C. Hidratează-te!`,
      icon: "🥵",
    });
  } else if (current.temperature >= 30) {
    alerts.push({
      level: "warning",
      message: `Foarte cald: ${current.temperature.toFixed(0)}°C`,
      icon: "☀️",
    });
  } else if (current.temperature <= -10) {
    alerts.push({
      level: "danger",
      message: `Ger sever: ${current.temperature.toFixed(0)}°C. Îmbracă-te gros!`,
      icon: "🥶",
    });
  } else if (current.temperature <= -5) {
    alerts.push({
      level: "warning",
      message: `Frig: ${current.temperature.toFixed(0)}°C`,
      icon: "❄️",
    });
  }

  // Vant puternic
  if (current.wind_speed >= 60) {
    alerts.push({
      level: "danger",
      message: `Vânt puternic: ${current.wind_speed.toFixed(0)} km/h`,
      icon: "💨",
    });
  } else if (current.wind_speed >= 40) {
    alerts.push({
      level: "warning",
      message: `Vânt: ${current.wind_speed.toFixed(0)} km/h`,
      icon: "💨",
    });
  }

  // Schimbare brusca de temperatura in urmatoarele 6h
  if (next6h.length >= 6) {
    const tempDelta = next6h[5].temperature - current.temperature;
    if (Math.abs(tempDelta) >= 8) {
      alerts.push({
        level: "info",
        message: `Schimbare bruscă: ${tempDelta > 0 ? "+" : ""}${tempDelta.toFixed(0)}°C în 6h`,
        icon: tempDelta > 0 ? "📈" : "📉",
      });
    }
  }

  return alerts;
}

interface WeatherAlertProps {
  hourly: HourlyForecast[];
  current: CurrentWeather;
}

export default function WeatherAlert({ hourly, current }: WeatherAlertProps) {
  const alerts = detectAlerts(hourly, current);
  if (alerts.length === 0) return null;

  return (
    <div className="mx-4 mt-3 space-y-2">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`p-3 rounded-2xl flex items-center gap-3 text-sm font-medium border ${
            a.level === "danger"
              ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
              : a.level === "warning"
                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
          }`}
          role="alert"
        >
          <span className="text-2xl flex-shrink-0">{a.icon}</span>
          <span>{a.message}</span>
        </div>
      ))}
    </div>
  );
}
