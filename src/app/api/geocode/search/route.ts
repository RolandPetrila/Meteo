import { NextResponse } from "next/server";
import { searchLocations } from "@/lib/services/geocoding";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchLocations(query, 5);
  // Returnam doar campurile necesare clientului
  return NextResponse.json({
    results: results.map((r) => ({
      name: r.display_name.split(",")[0],
      full_name: r.display_name,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
    })),
  });
}
