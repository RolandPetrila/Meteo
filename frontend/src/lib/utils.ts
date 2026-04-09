import { CONDITION_LABELS } from "./constants";

export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Bucharest",
    });
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("ro-RO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Bucharest",
    });
  } catch {
    return isoString;
  }
}

export function translateCondition(condition: string): string {
  return CONDITION_LABELS[condition] || condition.replace(/_/g, " ");
}

export function getAgreementColor(color: string): string {
  switch (color) {
    case "green":
      return "text-emerald-500";
    case "yellow":
      return "text-amber-500";
    case "red":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

export function getAgreementBg(color: string): string {
  switch (color) {
    case "green":
      return "bg-emerald-500/20";
    case "yellow":
      return "bg-amber-500/20";
    case "red":
      return "bg-red-500/20";
    default:
      return "bg-gray-500/20";
  }
}

export function getConfidenceColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export function getConfidenceTextColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

export function getWindDirection(degrees: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SV", "V", "NV"];
  const index = Math.round(degrees / 45) % 8;
  return dirs[index];
}

export function timeAgo(isoString: string): string {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "chiar acum";
  if (diffMin === 1) return "acum 1 minut";
  if (diffMin < 60) return `acum ${diffMin} minute`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH === 1) return "acum 1 oră";
  return `acum ${diffH} ore`;
}
