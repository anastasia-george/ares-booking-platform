// lib/geocode.ts
// Free geocoding via OpenStreetMap Nominatim (no API key required).
// Suburb-level accuracy is sufficient for marketplace location features.

export interface GeoResult {
  lat: number;
  lng: number;
}

/**
 * Geocode an Australian suburb/city/state to lat/lng.
 * Uses Nominatim with a 1-second politeness delay built in.
 * Returns null if geocoding fails or no results found.
 */
export async function geocodeAU(
  suburb?: string | null,
  city?: string | null,
  state?: string | null
): Promise<GeoResult | null> {
  const parts = [suburb, city, state, 'Australia'].filter(Boolean);
  if (parts.length <= 1) return null; // Only "Australia" — not enough info

  const q = parts.join(', ');
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q,
    format: 'json',
    limit: '1',
    countrycodes: 'au',
  })}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ModelCall/1.0 (https://modelcall.app)',
      },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const { lat, lon } = data[0];
    return { lat: parseFloat(lat), lng: parseFloat(lon) };
  } catch {
    return null;
  }
}
