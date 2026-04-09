export const DEFAULT_LAT = 46.194;
export const DEFAULT_LON = 21.233;
export const DEFAULT_NAME = "Nădlac";

export const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minute

export const SOURCE_COLORS: Record<string, string> = {
  open_meteo: "#ef4444",
  openweather: "#3b82f6",
  weatherapi: "#22c55e",
  ecmwf: "#f59e0b",
};

export const SOURCE_NAMES: Record<string, string> = {
  open_meteo: "Open-Meteo",
  openweather: "OpenWeather",
  weatherapi: "WeatherAPI",
  ecmwf: "ECMWF",
};

export const CONDITION_LABELS: Record<string, string> = {
  senin: "Senin",
  predominant_senin: "Predominant senin",
  partial_noros: "Parțial noros",
  noros: "Noros",
  ceata: "Ceață",
  ceata_chiciura: "Ceață cu chiciură",
  burinta_usoara: "Burniță ușoară",
  burinta_moderata: "Burniță moderată",
  burinta_puternica: "Burniță puternică",
  ploaie_usoara: "Ploaie ușoară",
  ploaie_moderata: "Ploaie moderată",
  ploaie_puternica: "Ploaie puternică",
  ploaie_inghet: "Ploaie cu îngheț",
  ninsoare_usoara: "Ninsoare ușoară",
  ninsoare_moderata: "Ninsoare moderată",
  ninsoare_puternica: "Ninsoare puternică",
  averse_usoare: "Averse ușoare",
  averse_moderate: "Averse moderate",
  averse_puternice: "Averse puternice",
  furtuna: "Furtună",
  furtuna_grindina: "Furtună cu grindină",
  necunoscut: "Necunoscut",
};
