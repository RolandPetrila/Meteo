import type { AISummary } from "@/lib/types";

const CONDITION_DESC: Record<string, string> = {
  senin: "cer senin",
  predominant_senin: "predominant senin",
  partial_noros: "parțial noros",
  noros: "cer noros",
  ceata: "ceață",
  burinta_usoara: "burniță ușoară",
  ploaie_usoara: "ploaie ușoară",
  ploaie_moderata: "ploaie moderată",
  ploaie_puternica: "ploaie puternică",
  ninsoare_usoara: "ninsoare ușoară",
  ninsoare_moderata: "ninsoare moderată",
  ninsoare_puternica: "ninsoare puternică",
  averse_usoare: "averse ușoare",
  averse_moderate: "averse moderate",
  averse_puternice: "averse puternice",
  furtuna: "furtună",
  furtuna_grindina: "furtună cu grindină",
};

function describeCondition(condition: string): string {
  return CONDITION_DESC[condition] || condition.replace(/_/g, " ");
}

function generateRecommendation(
  temp: number,
  condition: string,
  wind: number,
): string {
  const parts: string[] = [];

  if (temp < -10) parts.push("Îmbracă-te foarte gros, temperaturi periculoase");
  else if (temp < 0) parts.push("Îmbracă-te gros, e sub zero grade");
  else if (temp < 10) parts.push("Ia o geacă, e răcoare");
  else if (temp < 20)
    parts.push("Temperatură plăcută, o jachetă ușoară e suficientă");
  else if (temp < 30)
    parts.push("Vreme caldă, ideală pentru activități în aer liber");
  else parts.push("Caniculă, stai la umbră și hidratează-te");

  if (
    condition.includes("ploaie") ||
    condition.includes("averse") ||
    condition.includes("burinta")
  )
    parts.push("Ia umbrela");
  if (condition.includes("ninsoare"))
    parts.push("Drumuri alunecoase, fii precaut");
  if (condition.includes("furtuna"))
    parts.push("Evită deplasările dacă nu e necesar");
  if (wind > 40) parts.push("Vânt puternic, atenție la obiecte nesecurizate");

  return parts.join(". ") + ".";
}

function checkAlerts(
  temp: number,
  wind: number,
  condition: string,
): string | null {
  const alerts: string[] = [];
  if (temp < -10) alerts.push(`Temperatură extrem de scăzută: ${temp}°C`);
  if (temp > 35) alerts.push(`Caniculă: ${temp}°C. Pericol de insolație`);
  if (wind > 60) alerts.push(`Vânt foarte puternic: ${wind} km/h`);
  if (condition.includes("furtuna")) alerts.push("Furtună în zonă");
  if (condition.includes("inghet")) alerts.push("Pericol de îngheț pe drumuri");
  return alerts.length ? alerts.join(". ") + "." : null;
}

export function generateSummary(current: {
  temperature: number;
  humidity: number;
  wind_speed: number;
  condition: string;
}): AISummary {
  const { temperature, humidity, wind_speed, condition } = current;
  const condText = describeCondition(condition);

  return {
    summary: `${condText.charAt(0).toUpperCase() + condText.slice(1)}, ${temperature}°C. Umiditate ${humidity}%, vânt ${wind_speed} km/h.`,
    recommendation: generateRecommendation(temperature, condition, wind_speed),
    alert: checkAlerts(temperature, wind_speed, condition),
  };
}
