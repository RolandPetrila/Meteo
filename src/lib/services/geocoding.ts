/**
 * Geocoding cu OpenStreetMap Nominatim (gratuit, fara API key).
 * Limita: 1 request/secunda. Bun pentru uz personal.
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const TIMEOUT = 5000;

export interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  importance?: number;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
}

/**
 * Returneaza numele localitatii pentru coordonate. Null la eroare.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      format: "json",
      lat: lat.toString(),
      lon: lon.toString(),
      zoom: "12",
      "accept-language": "ro",
    });
    const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      headers: {
        "User-Agent": "MeteoNadlac/1.0 (https://meteo-ten-mu.vercel.app)",
      },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr: NominatimAddress = data.address || {};
    return (
      addr.city ||
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.municipality ||
      addr.county ||
      addr.state ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Cauta locatii dupa nume. Filtreaza la Romania, Ungaria, Moldova default.
 */
export async function searchLocations(
  query: string,
  limit = 5,
): Promise<NominatimSearchResult[]> {
  if (query.trim().length < 2) return [];
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: limit.toString(),
      "accept-language": "ro",
      countrycodes: "ro,hu,md,rs,bg,ua",
    });
    const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: {
        "User-Agent": "MeteoNadlac/1.0 (https://meteo-ten-mu.vercel.app)",
      },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
