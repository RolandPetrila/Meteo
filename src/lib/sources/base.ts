// Coduri WMO -> conditii normalizate
export const WMO_CONDITIONS: Record<number, string> = {
  0: "senin",
  1: "predominant_senin",
  2: "partial_noros",
  3: "noros",
  45: "ceata",
  48: "ceata_chiciura",
  51: "burinta_usoara",
  53: "burinta_moderata",
  55: "burinta_puternica",
  56: "burinta_inghet",
  57: "burinta_inghet_puternica",
  61: "ploaie_usoara",
  63: "ploaie_moderata",
  65: "ploaie_puternica",
  66: "ploaie_inghet",
  67: "ploaie_inghet_puternica",
  71: "ninsoare_usoara",
  73: "ninsoare_moderata",
  75: "ninsoare_puternica",
  77: "grindina",
  80: "averse_usoare",
  81: "averse_moderate",
  82: "averse_puternice",
  85: "averse_ninsoare_usoare",
  86: "averse_ninsoare_puternice",
  95: "furtuna",
  96: "furtuna_grindina",
  99: "furtuna_grindina_puternica",
};

export const CONDITION_ICONS: Record<string, string> = {
  senin: "☀️",
  predominant_senin: "🌤️",
  partial_noros: "⛅",
  noros: "☁️",
  ceata: "🌫️",
  ceata_chiciura: "🌫️",
  burinta_usoara: "🌦️",
  burinta_moderata: "🌦️",
  burinta_puternica: "🌧️",
  ploaie_usoara: "🌦️",
  ploaie_moderata: "🌧️",
  ploaie_puternica: "🌧️",
  ploaie_inghet: "🌧️",
  ninsoare_usoara: "🌨️",
  ninsoare_moderata: "❄️",
  ninsoare_puternica: "❄️",
  grindina: "🌨️",
  averse_usoare: "🌦️",
  averse_moderate: "🌧️",
  averse_puternice: "⛈️",
  furtuna: "⛈️",
  furtuna_grindina: "⛈️",
  furtuna_grindina_puternica: "⛈️",
};

export function wmoToCondition(code: number): string {
  return WMO_CONDITIONS[code] || "necunoscut";
}

export function getConditionIcon(condition: string): string {
  return CONDITION_ICONS[condition] || "🌡️";
}

const DAY_NAMES_RO = [
  "Duminică",
  "Luni",
  "Marți",
  "Miercuri",
  "Joi",
  "Vineri",
  "Sâmbătă",
];

export function getDayNameRo(dateStr: string): string {
  const dt = new Date(dateStr + "T00:00:00");
  return DAY_NAMES_RO[dt.getDay()];
}

export interface CurrentData {
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  precipitation: number;
  condition: string;
  condition_icon: string;
}

export interface HourlyData {
  hour: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  precipitation: number;
  condition: string;
}

export interface DailyData {
  date: string;
  day_name: string;
  temp_min: number;
  temp_max: number;
  precipitation: number;
  wind_speed: number;
  condition: string;
}

export interface WeatherSource {
  name: string;
  fetchCurrent(lat: number, lon: number): Promise<CurrentData>;
  fetchHourly(lat: number, lon: number): Promise<HourlyData[]>;
  fetchDaily(lat: number, lon: number): Promise<DailyData[]>;
}
