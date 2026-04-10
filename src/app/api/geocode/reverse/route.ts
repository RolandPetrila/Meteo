import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/services/geocoding";
import { validateCoords } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get("lat") || "";
  const lonStr = searchParams.get("lon") || "";

  const validated = validateCoords(latStr, lonStr);
  if (!validated) {
    return NextResponse.json({ error: "Coordonate invalide" }, { status: 400 });
  }

  const name = await reverseGeocode(validated.lat, validated.lon);
  return NextResponse.json({ name });
}
