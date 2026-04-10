import { NextResponse } from "next/server";
import { aggregateHourly } from "@/lib/services/aggregator";
import { validateCoords } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

  try {
    const hourly = await aggregateHourly(validated.lat, validated.lon);
    return NextResponse.json({ hourly, cache_hit: false });
  } catch (error) {
    console.error("Hourly API error:", error);
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
