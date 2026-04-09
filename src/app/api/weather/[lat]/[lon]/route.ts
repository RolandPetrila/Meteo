import { NextResponse } from "next/server";
import {
  aggregateCurrent,
  aggregateHourly,
  aggregateDaily,
} from "@/lib/services/aggregator";
import { generateSummary } from "@/lib/services/ai-summary";
import { getCached, setCache } from "@/lib/services/cache";
import type { WeatherResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Vercel max 30s pe free tier

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lat: string; lon: string }> },
) {
  const { lat: latStr, lon: lonStr } = await params;
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (
    isNaN(lat) ||
    isNaN(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return NextResponse.json({ error: "Coordonate invalide" }, { status: 400 });
  }

  // Check cache
  const cached = getCached<WeatherResponse>(lat, lon, "full");
  if (cached) {
    return NextResponse.json({ ...cached, cache_hit: true });
  }

  try {
    const [{ current, comparison, agreement, avgConfidence }, hourly, daily] =
      await Promise.all([
        aggregateCurrent(lat, lon),
        aggregateHourly(lat, lon),
        aggregateDaily(lat, lon),
      ]);

    const aiSummary = generateSummary(current);

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
      cache_hit: false,
    };

    setCache(lat, lon, response, "full");

    return NextResponse.json(response);
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      { error: "Eroare la obținerea datelor meteo" },
      { status: 500 },
    );
  }
}
