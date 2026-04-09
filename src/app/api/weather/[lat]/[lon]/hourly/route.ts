import { NextResponse } from "next/server";
import { aggregateHourly } from "@/lib/services/aggregator";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lat: string; lon: string }> },
) {
  const { lat: latStr, lon: lonStr } = await params;
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "Coordonate invalide" }, { status: 400 });
  }

  try {
    const hourly = await aggregateHourly(lat, lon);
    return NextResponse.json({ hourly, cache_hit: false });
  } catch (error) {
    console.error("Hourly API error:", error);
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
