import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import {
  aggregateCurrent,
  aggregateHourly,
  aggregateDaily,
} from "@/lib/services/aggregator";
import { generateSummary } from "@/lib/services/ai-summary";
import { validateCoords } from "@/lib/utils";
import type { WeatherResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Vercel max 30s pe free tier

const getAggregatedData = (lat: number, lon: number) => {
  return unstable_cache(
    async () => {
      const [{ current, comparison, agreement, avgConfidence }, hourly, daily] =
        await Promise.all([
          aggregateCurrent(lat, lon),
          aggregateHourly(lat, lon),
          aggregateDaily(lat, lon),
        ]);
      return { current, comparison, agreement, avgConfidence, hourly, daily };
    },
    [`weather-${lat.toFixed(3)}-${lon.toFixed(3)}`],
    { revalidate: 900 },
  )();
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lat: string; lon: string }> },
) {
  const { lat: latStr, lon: lonStr } = await params;
  const validated = validateCoords(latStr, lonStr);

  if (!validated) {
    return NextResponse.json(
      { error: "Coordonate invalide. Lat: -90..90, Lon: -180..180" },
      { status: 400 },
    );
  }
  const { lat, lon } = validated;

  try {
    const { current, comparison, agreement, avgConfidence, hourly, daily } =
      await getAggregatedData(lat, lon);

    const aiSummary = await generateSummary(current);

    // Determina numele locatiei
    const isNadlac =
      Math.abs(lat - 46.194) < 0.01 && Math.abs(lon - 21.233) < 0.01;
    const locationName = isNadlac
      ? "Nădlac"
      : `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`;

    const response: WeatherResponse = {
      location: {
        name: locationName,
        latitude: lat,
        longitude: lon,
        timezone: "Europe/Bucharest",
      },
      timestamp: new Date().toLocaleString("sv-SE", {
        timeZone: "Europe/Bucharest",
      }),
      current,
      forecast_hourly: hourly,
      forecast_7days: daily,
      comparison,
      agreement,
      aggregated_confidence: avgConfidence,
      ai_summary: aiSummary,
      cache_hit: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      { error: "Eroare la obținerea datelor meteo" },
      { status: 500 },
    );
  }
}
