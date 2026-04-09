import { getAllSources } from "@/lib/sources";
import type {
  CurrentData,
  HourlyData,
  DailyData,
  WeatherSource,
} from "@/lib/sources";
import { getConditionIcon } from "@/lib/sources/base";
import type {
  SourceData,
  AgreementInfo,
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
} from "@/lib/types";

interface FetchResult {
  name: string;
  data: CurrentData | HourlyData[] | DailyData[] | null;
  elapsed: number;
  ok: boolean;
}

async function fetchWithTiming(
  source: WeatherSource,
  method: "fetchCurrent" | "fetchHourly" | "fetchDaily",
  lat: number,
  lon: number,
): Promise<FetchResult> {
  const start = Date.now();
  try {
    const data = await source[method](lat, lon);
    return {
      name: source.name,
      data: data as CurrentData,
      elapsed: Date.now() - start,
      ok: true,
    };
  } catch {
    return {
      name: source.name,
      data: null,
      elapsed: Date.now() - start,
      ok: false,
    };
  }
}

function calculateConfidence(
  sourceTemps: Record<string, number>,
): Record<string, number> {
  const values = Object.values(sourceTemps);
  if (values.length < 2) {
    return Object.fromEntries(Object.keys(sourceTemps).map((k) => [k, 95]));
  }

  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const maxSpread = Math.max(...values) - Math.min(...values);

  const scores: Record<string, number> = {};
  for (const [name, temp] of Object.entries(sourceTemps)) {
    const deviation = Math.abs(temp - median);
    let score = Math.max(40, 100 - deviation * 15);
    if (maxSpread < 2) score = Math.min(100, score + 5);
    scores[name] = Math.round(score * 10) / 10;
  }
  return scores;
}

function calculateAgreement(
  sourceTemps: Record<string, number>,
): AgreementInfo {
  const values = Object.values(sourceTemps);
  if (values.length < 2) {
    return {
      level: "necunoscut",
      color: "gray",
      max_deviation: 0,
      description: "Insuficiente surse pentru comparație",
    };
  }

  const maxDev =
    Math.round((Math.max(...values) - Math.min(...values)) * 10) / 10;

  if (maxDev < 2)
    return {
      level: "puternic",
      color: "green",
      max_deviation: maxDev,
      description: `Sursele sunt de acord (diferență: ${maxDev}°C)`,
    };
  if (maxDev < 5)
    return {
      level: "moderat",
      color: "yellow",
      max_deviation: maxDev,
      description: `Acord moderat între surse (diferență: ${maxDev}°C)`,
    };
  return {
    level: "dezacord",
    color: "red",
    max_deviation: maxDev,
    description: `Dezacord între surse (diferență: ${maxDev}°C)`,
  };
}

function weightedAverage(
  temps: Record<string, number>,
  confidence: Record<string, number>,
): number {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [name, temp] of Object.entries(temps)) {
    const w = confidence[name] || 50;
    weightedSum += temp * w;
    totalWeight += w;
  }
  return totalWeight === 0
    ? 0
    : Math.round((weightedSum / totalWeight) * 10) / 10;
}

function majorityCondition(conditions: Record<string, string>): string {
  const counts: Record<string, number> = {};
  for (const c of Object.values(conditions)) {
    counts[c] = (counts[c] || 0) + 1;
  }
  let best = "necunoscut";
  let bestCount = 0;
  for (const [c, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return best;
}

export async function aggregateCurrent(
  lat: number,
  lon: number,
): Promise<{
  current: CurrentWeather;
  comparison: SourceData[];
  agreement: AgreementInfo;
  avgConfidence: number;
}> {
  const sources = getAllSources();
  const results = await Promise.all(
    sources.map((s) => fetchWithTiming(s, "fetchCurrent", lat, lon)),
  );

  const sourceTemps: Record<string, number> = {};
  const sourceConditions: Record<string, string> = {};
  const sourceHumidity: Record<string, number> = {};
  const sourceWind: Record<string, number> = {};

  for (const r of results) {
    if (r.ok && r.data) {
      const d = r.data as CurrentData;
      sourceTemps[r.name] = d.temperature;
      sourceConditions[r.name] = d.condition;
      sourceHumidity[r.name] = d.humidity;
      sourceWind[r.name] = d.wind_speed;
    }
  }

  const confidence = calculateConfidence(sourceTemps);
  const agreement = calculateAgreement(sourceTemps);

  const comparison: SourceData[] = results.map((r) => {
    const d = r.ok ? (r.data as CurrentData) : null;
    return {
      source: r.name,
      temperature: d?.temperature ?? null,
      humidity: d?.humidity ?? null,
      wind_speed: d?.wind_speed ?? null,
      condition: d?.condition ?? null,
      available: r.ok && d !== null,
      confidence: confidence[r.name] || 0,
      response_time_ms: r.elapsed,
    };
  });

  const condition = majorityCondition(sourceConditions);
  let windDir = 0;
  let precip = 0;
  for (const r of results) {
    if (r.ok && r.data) {
      windDir = (r.data as CurrentData).wind_direction;
      precip = (r.data as CurrentData).precipitation;
      break;
    }
  }

  const current: CurrentWeather = {
    temperature: weightedAverage(sourceTemps, confidence),
    humidity: Math.round(
      weightedAverage(
        Object.fromEntries(
          Object.entries(sourceHumidity).map(([k, v]) => [k, v]),
        ),
        confidence,
      ),
    ),
    wind_speed: Math.round(weightedAverage(sourceWind, confidence) * 10) / 10,
    wind_direction: windDir,
    precipitation: precip,
    condition,
    condition_icon: getConditionIcon(condition),
  };

  const confValues = Object.values(confidence);
  const avgConfidence = confValues.length
    ? Math.round(
        (confValues.reduce((a, b) => a + b, 0) / confValues.length) * 10,
      ) / 10
    : 0;

  return { current, comparison, agreement, avgConfidence };
}

export async function aggregateHourly(
  lat: number,
  lon: number,
): Promise<HourlyForecast[]> {
  const sources = getAllSources();
  const results = await Promise.all(
    sources.map((s) => fetchWithTiming(s, "fetchHourly", lat, lon)),
  );

  // Open-Meteo ca baza
  let primary: HourlyData[] | null = null;
  for (const r of results) {
    if (r.name === "open_meteo" && r.ok && r.data) {
      primary = r.data as HourlyData[];
      break;
    }
  }
  if (!primary) {
    for (const r of results) {
      if (r.ok && r.data) {
        primary = r.data as HourlyData[];
        break;
      }
    }
  }

  return (primary || []).map((h) => ({
    hour: h.hour,
    timestamp: h.timestamp,
    temperature: h.temperature,
    humidity: h.humidity,
    wind_speed: h.wind_speed,
    precipitation: h.precipitation,
    condition: h.condition,
  }));
}

export async function aggregateDaily(
  lat: number,
  lon: number,
): Promise<DailyForecast[]> {
  const sources = getAllSources();
  const results = await Promise.all(
    sources.map((s) => fetchWithTiming(s, "fetchDaily", lat, lon)),
  );

  const daysData: Record<string, DailyData[]> = {};
  for (const r of results) {
    if (r.ok && r.data) {
      for (const day of r.data as DailyData[]) {
        if (!daysData[day.date]) daysData[day.date] = [];
        daysData[day.date].push(day);
      }
    }
  }

  return Object.keys(daysData)
    .sort()
    .slice(0, 7)
    .map((dateStr) => {
      const items = daysData[dateStr];
      const mins = items.map((d) => d.temp_min);
      const maxs = items.map((d) => d.temp_max);
      const conditions = items.map((d) => d.condition);
      const condCounts: Record<string, number> = {};
      for (const c of conditions) condCounts[c] = (condCounts[c] || 0) + 1;
      let bestCond = "necunoscut";
      let bestCount = 0;
      for (const [c, n] of Object.entries(condCounts)) {
        if (n > bestCount) {
          bestCond = c;
          bestCount = n;
        }
      }

      return {
        date: dateStr,
        day_name: items[0].day_name,
        temp_min:
          Math.round((mins.reduce((a, b) => a + b, 0) / mins.length) * 10) / 10,
        temp_max:
          Math.round((maxs.reduce((a, b) => a + b, 0) / maxs.length) * 10) / 10,
        humidity: 0,
        precipitation:
          Math.round(Math.max(...items.map((d) => d.precipitation)) * 10) / 10,
        wind_speed:
          Math.round(Math.max(...items.map((d) => d.wind_speed)) * 10) / 10,
        condition: bestCond,
      };
    });
}
