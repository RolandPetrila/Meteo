import { NextResponse } from "next/server";
import { aggregateCurrent } from "@/lib/services/aggregator";

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
    const { comparison, agreement, avgConfidence } = await aggregateCurrent(
      lat,
      lon,
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
