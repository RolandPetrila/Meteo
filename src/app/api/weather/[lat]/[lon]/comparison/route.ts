import { NextResponse } from "next/server";
import { aggregateCurrent } from "@/lib/services/aggregator";
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
    const { comparison, agreement, avgConfidence } = await aggregateCurrent(
      validated.lat,
      validated.lon,
    );
    return NextResponse.json({
      comparison,
      agreement,
      aggregated_confidence: avgConfidence,
    });
  } catch (error) {
    console.error("Comparison API error:", error);
    return NextResponse.json({ error: "Eroare" }, { status: 500 });
  }
}
