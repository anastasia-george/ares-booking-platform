// lib/geo.ts
// Distance computation for location-based filtering and sorting.

const R_KM = 6371; // Earth's radius in km

/**
 * Calculate the distance between two lat/lng points using the Haversine formula.
 * Returns distance in kilometres.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
