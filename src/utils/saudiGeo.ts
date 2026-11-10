/** Kingdom of Saudi Arabia geographic helpers — delivery / checkout pin only. */

export type GeoPoint = { lat: number; lng: number };

/** Approximate KSA bounding box (mainland + near islands). */
export const SAUDI_BOUNDS = {
  south: 16.0,
  west: 34.4,
  north: 32.25,
  east: 55.7,
} as const;

/** Default pin: Makkah center (KSA). */
export const SAUDI_DEFAULT_CENTER: GeoPoint = { lat: 21.4225, lng: 39.8262 };

export function isInSaudiArabia(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return (
    lat >= SAUDI_BOUNDS.south &&
    lat <= SAUDI_BOUNDS.north &&
    lng >= SAUDI_BOUNDS.west &&
    lng <= SAUDI_BOUNDS.east
  );
}

export function clampToSaudiOrNull(lat: number, lng: number): GeoPoint | null {
  return isInSaudiArabia(lat, lng) ? { lat, lng } : null;
}

export function googleMapsExternalUrl(lat: number, lng: number, zoom = 16): string {
  return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}`;
}

/** Google Maps embed (no JS API required). Always Google tiles — never OSM. */
export function googleMapsEmbedUrl(lat: number, lng: number, isAr: boolean, zoom = 15): string {
  const hl = isAr ? 'ar' : 'en';
  return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&hl=${hl}&output=embed`;
}
