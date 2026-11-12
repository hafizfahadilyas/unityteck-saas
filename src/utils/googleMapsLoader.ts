/**
 * Google Maps keys — supports split Cloud credentials:
 * - VITE_GOOGLE_MAPS_API_KEY → Maps JavaScript API (map + pin)
 * - VITE_GOOGLE_PLACES_API_KEY → Places API (New) Saudi search
 * - VITE_GOOGLE_GEOCODING_API_KEY → Geocoding API (pin → address)
 * Falls back to the Maps key when Places/Geocoding keys are omitted.
 */

type GoogleNs = typeof google;

declare global {
  interface Window {
    __souqGoogleMapsReady?: Promise<GoogleNs>;
    __souqGoogleMapsCb?: () => void;
  }
}

function cleanKey(raw: string | undefined): string {
  const key = String(raw || '').trim();
  if (!key || /x{3,}|REPLACE|your_key|xxxxx|MY_/i.test(key)) return '';
  return key;
}

export function getGoogleMapsApiKey(): string {
  return cleanKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
}

export function getGooglePlacesApiKey(): string {
  return cleanKey(import.meta.env.VITE_GOOGLE_PLACES_API_KEY) || getGoogleMapsApiKey();
}

export function getGoogleGeocodingApiKey(): string {
  return cleanKey(import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY) || getGoogleMapsApiKey();
}

export function hasGoogleMapsApiKey(): boolean {
  return Boolean(getGoogleMapsApiKey());
}

const SAUDI_RECT = { south: 16.0, west: 34.4, north: 32.25, east: 55.7 };

/** Short TTL cache so typing backspace / re-open feels instant. */
const PLACE_SEARCH_TTL_MS = 45_000;
const placeSearchCache = new Map<string, { at: number; rows: SaudiPlaceSuggestion[] }>();

function placeSearchCacheKey(input: string, isAr: boolean): string {
  return `${isAr ? 'ar' : 'en'}|${input.trim().toLowerCase()}`;
}

function injectMapsScript(key: string, resolve: (g: GoogleNs) => void, reject: (e: Error) => void) {
  const existing = document.getElementById('souq-google-maps-js') as HTMLScriptElement | null;
  if (existing) {
    const wait = () => {
      if (window.google?.maps) resolve(window.google);
      else setTimeout(wait, 24);
    };
    wait();
    return;
  }

  window.__souqGoogleMapsCb = () => {
    if (window.google?.maps) resolve(window.google);
    else reject(new Error('Google Maps failed to initialize'));
  };

  const lang =
    document.documentElement.lang?.toLowerCase().startsWith('ar') ||
    document.documentElement.dir === 'rtl'
      ? 'ar'
      : 'en';
  const script = document.createElement('script');
  script.id = 'souq-google-maps-js';
  script.async = true;
  // callback + async only (no defer) — starts download sooner while parser continues
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
    key,
  )}&v=weekly&language=${lang}&region=SA&callback=__souqGoogleMapsCb`;
  script.onerror = () => reject(new Error('Failed to load Google Maps script'));
  document.head.appendChild(script);
}

export function loadGoogleMaps(): Promise<GoogleNs> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps is browser-only'));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }
  if (window.__souqGoogleMapsReady) return window.__souqGoogleMapsReady;

  const key = getGoogleMapsApiKey();
  if (!key) {
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'));
  }

  window.__souqGoogleMapsReady = new Promise<GoogleNs>((resolve, reject) => {
    injectMapsScript(key, resolve, reject);
  });

  return window.__souqGoogleMapsReady;
}

/** Warm the Maps JS download before the picker mounts (modal open / hover). */
export function prefetchGoogleMaps(): void {
  if (typeof window === 'undefined' || !getGoogleMapsApiKey()) return;
  void loadGoogleMaps().catch(() => {
    /* prefetch is best-effort */
  });
}

export type SaudiAddressParts = {
  city?: string;
  district?: string;
  street?: string;
  formatted?: string;
};

export type SaudiPlaceSuggestion = {
  placeId: string;
  text: string;
};

type PlacesAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

function parsePlacesNewComponents(
  components: PlacesAddressComponent[] | undefined,
  formatted?: string,
): SaudiAddressParts {
  const out: SaudiAddressParts = { formatted };
  if (!components?.length) return out;
  const find = (...types: string[]) =>
    components.find((c) => (c.types || []).some((t) => types.includes(t)))?.longText || '';
  const city =
    find('locality', 'administrative_area_level_2') || find('administrative_area_level_1') || '';
  const district = find('sublocality', 'sublocality_level_1', 'neighborhood', 'political') || '';
  const street = [find('route'), find('street_number')].filter(Boolean).join(' ');
  if (city) out.city = city;
  if (district) out.district = district;
  if (street) out.street = street;
  return out;
}

export function parseGoogleAddressComponents(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  formatted?: string,
): SaudiAddressParts {
  const out: SaudiAddressParts = { formatted };
  if (!components?.length) return out;

  const find = (...types: string[]) =>
    components.find((c) => types.some((t) => c.types.includes(t)))?.long_name || '';

  const city =
    find('locality', 'administrative_area_level_2') ||
    find('administrative_area_level_1') ||
    '';
  const district = find('sublocality', 'sublocality_level_1', 'neighborhood', 'political') || '';
  const street = [find('route'), find('street_number')].filter(Boolean).join(' ');

  if (city) out.city = city;
  if (district) out.district = district;
  if (street) out.street = street;
  return out;
}

/** Places API (New) — Saudi Arabia only autocomplete. */
export async function searchSaudiPlaces(
  input: string,
  isAr: boolean,
  signal?: AbortSignal,
): Promise<SaudiPlaceSuggestion[]> {
  const key = getGooglePlacesApiKey();
  const q = input.trim();
  if (!key || q.length < 2) return [];

  const cacheKey = placeSearchCacheKey(q, isAr);
  const hit = placeSearchCache.get(cacheKey);
  if (hit && Date.now() - hit.at < PLACE_SEARCH_TTL_MS) {
    return hit.rows;
  }

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.text',
    },
    body: JSON.stringify({
      input: q,
      languageCode: isAr ? 'ar' : 'en',
      includedRegionCodes: ['sa'],
      locationBias: {
        rectangle: {
          low: { latitude: SAUDI_RECT.south, longitude: SAUDI_RECT.west },
          high: { latitude: SAUDI_RECT.north, longitude: SAUDI_RECT.east },
        },
      },
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    suggestions?: Array<{
      placePrediction?: { placeId?: string; text?: { text?: string } };
    }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `Places search failed (${res.status})`);
  }

  const rows = (data.suggestions || [])
    .map((s) => ({
      placeId: s.placePrediction?.placeId || '',
      text: s.placePrediction?.text?.text || '',
    }))
    .filter((s) => s.placeId && s.text);

  placeSearchCache.set(cacheKey, { at: Date.now(), rows });
  if (placeSearchCache.size > 80) {
    const oldest = placeSearchCache.keys().next().value;
    if (oldest) placeSearchCache.delete(oldest);
  }

  return rows;
}

export async function resolveSaudiPlace(
  placeId: string,
  isAr: boolean,
  signal?: AbortSignal,
): Promise<{ point: { lat: number; lng: number }; parts: SaudiAddressParts } | null> {
  const key = getGooglePlacesApiKey();
  if (!key || !placeId) return null;

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      method: 'GET',
      signal,
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'location,formattedAddress,addressComponents',
        'Accept-Language': isAr ? 'ar' : 'en',
      },
    },
  );
  const data = (await res.json().catch(() => ({}))) as {
    location?: { latitude?: number; longitude?: number };
    formattedAddress?: string;
    addressComponents?: PlacesAddressComponent[];
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `Place details failed (${res.status})`);
  }
  const lat = data.location?.latitude;
  const lng = data.location?.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return {
    point: { lat, lng },
    parts: parsePlacesNewComponents(data.addressComponents, data.formattedAddress),
  };
}

/** Google Plus Codes look like `PX8X+2R` — never show these as the delivery address. */
export function isPlusCodeLabel(raw: string | undefined | null): boolean {
  const s = String(raw || '').trim();
  if (!s) return false;
  if (/^[A-Z0-9]{2,}\+[A-Z0-9]{2,}\b/i.test(s)) return true;
  if (/\b[A-Z0-9]{4,}\+[A-Z0-9]{2,}\b/i.test(s) && !/,/.test(s)) return true;
  return false;
}

function composeSaudiFormatted(parts: SaudiAddressParts, isAr: boolean): string {
  const bits = [parts.street, parts.district, parts.city].filter(
    (x): x is string => Boolean(x && String(x).trim()),
  );
  if (bits.length) return bits.join(isAr ? '، ' : ', ');
  if (parts.formatted && !isPlusCodeLabel(parts.formatted)) return String(parts.formatted).trim();
  return '';
}

type GeocodeResultRow = {
  formatted_address?: string;
  types?: string[];
  address_components?: google.maps.GeocoderAddressComponent[];
};

function scoreGeocodeRow(row: GeocodeResultRow): number {
  const types = row.types || [];
  if (types.includes('street_address') || types.includes('premise')) return 100;
  if (types.includes('route')) return 80;
  if (types.includes('neighborhood') || types.includes('sublocality')) return 60;
  if (types.includes('locality')) return 40;
  if (types.includes('plus_code')) return -50;
  if (isPlusCodeLabel(row.formatted_address)) return -40;
  return 10;
}

function pickBestSaudiGeocode(results: GeocodeResultRow[]): GeocodeResultRow | null {
  const saudi = results.filter((row) => {
    const country = row.address_components?.find((c) => c.types.includes('country'));
    return !country || country.short_name === 'SA';
  });
  if (!saudi.length) return null;
  return [...saudi].sort((a, b) => scoreGeocodeRow(b) - scoreGeocodeRow(a))[0] || null;
}

const REVERSE_TTL_MS = 60_000;
const reverseCache = new Map<string, { at: number; parts: SaudiAddressParts }>();

function reverseCacheKey(lat: number, lng: number, isAr: boolean): string {
  return `${isAr ? 'ar' : 'en'}|${lat.toFixed(4)},${lng.toFixed(4)}`;
}

async function fetchGeocodeJson(
  lat: number,
  lng: number,
  isAr: boolean,
  key: string,
  withResultType: boolean,
  signal?: AbortSignal,
): Promise<GeocodeResultRow[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${lat},${lng}`);
  url.searchParams.set('key', key);
  url.searchParams.set('language', isAr ? 'ar' : 'en');
  url.searchParams.set('region', 'sa');
  if (withResultType) {
    url.searchParams.set(
      'result_type',
      'street_address|premise|route|neighborhood|sublocality|locality',
    );
  }

  const res = await fetch(url.toString(), { signal });
  const data = (await res.json()) as {
    status: string;
    error_message?: string;
    results?: GeocodeResultRow[];
  };
  if (data.status === 'REQUEST_DENIED') {
    throw new Error(data.error_message || 'Geocoding API denied');
  }
  if (data.status !== 'OK' || !data.results?.length) return [];
  return data.results;
}

function finalizeGeocodeParts(
  top: GeocodeResultRow | null,
  isAr: boolean,
): SaudiAddressParts | null {
  if (!top) return null;
  const parts = parseGoogleAddressComponents(top.address_components, top.formatted_address);
  const formatted = composeSaudiFormatted(parts, isAr);
  if (!formatted) return null;
  return { ...parts, formatted };
}

/** Instant path: Maps JS Geocoder (already loaded with the pin map) — no second REST hop. */
function reverseViaJsGeocoder(
  lat: number,
  lng: number,
  isAr: boolean,
  signal?: AbortSignal,
): Promise<GeocodeResultRow[]> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const g = typeof window !== 'undefined' ? window.google : undefined;
    if (!g?.maps?.Geocoder) {
      resolve([]);
      return;
    }
    let settled = false;
    const onAbort = () => {
      if (settled) return;
      settled = true;
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const geocoder = new g.maps.Geocoder();
      geocoder.geocode(
        {
          location: { lat, lng },
          region: 'sa',
          language: isAr ? 'ar' : 'en',
          componentRestrictions: { country: 'SA' },
        },
        (results, status) => {
          if (settled) return;
          settled = true;
          signal?.removeEventListener('abort', onAbort);
          if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          if (status === 'OK' && results?.length) {
            resolve(
              results.map((r) => ({
                formatted_address: r.formatted_address,
                types: r.types,
                address_components: r.address_components,
              })),
            );
            return;
          }
          resolve([]);
        },
      );
    } catch {
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      resolve([]);
    }
  });
}

/**
 * Reverse pin → full Saudi street/district/city (never Plus Code alone).
 * Prefers in-memory Maps JS Geocoder (ultra-fast when map is open), then Geocoding REST.
 */
export async function reverseGeocodeSaudi(
  lat: number,
  lng: number,
  isAr: boolean,
  signal?: AbortSignal,
): Promise<SaudiAddressParts | null> {
  const cacheKey = reverseCacheKey(lat, lng, isAr);
  const hit = reverseCache.get(cacheKey);
  if (hit && Date.now() - hit.at < REVERSE_TTL_MS) {
    return hit.parts;
  }

  // 1) JS Geocoder — same session as the live map (fastest).
  try {
    const jsRows = await reverseViaJsGeocoder(lat, lng, isAr, signal);
    let top = pickBestSaudiGeocode(jsRows);
    if (top && scoreGeocodeRow(top) >= 40 && !isPlusCodeLabel(top.formatted_address)) {
      const out = finalizeGeocodeParts(top, isAr);
      if (out) {
        reverseCache.set(cacheKey, { at: Date.now(), parts: out });
        return out;
      }
    }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    /* fall through to REST */
  }

  // 2) Geocoding REST fallback (narrow types, then open query).
  const key = getGoogleGeocodingApiKey();
  if (!key) return null;

  let rows = await fetchGeocodeJson(lat, lng, isAr, key, true, signal);
  let top = pickBestSaudiGeocode(rows);
  if (!top || scoreGeocodeRow(top) < 40 || isPlusCodeLabel(top.formatted_address)) {
    rows = await fetchGeocodeJson(lat, lng, isAr, key, false, signal);
    top = pickBestSaudiGeocode(rows);
  }

  const out = finalizeGeocodeParts(top, isAr);
  if (!out) return null;
  reverseCache.set(cacheKey, { at: Date.now(), parts: out });
  if (reverseCache.size > 120) {
    const oldest = reverseCache.keys().next().value;
    if (oldest) reverseCache.delete(oldest);
  }
  return out;
}
