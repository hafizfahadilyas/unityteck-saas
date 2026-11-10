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

/** Geocoding REST — reverse pin inside Saudi Arabia. */
export async function reverseGeocodeSaudi(
  lat: number,
  lng: number,
  isAr: boolean,
  signal?: AbortSignal,
): Promise<SaudiAddressParts | null> {
  const key = getGoogleGeocodingApiKey();
  if (!key) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${lat},${lng}`);
  url.searchParams.set('key', key);
  url.searchParams.set('language', isAr ? 'ar' : 'en');
  url.searchParams.set('result_type', 'street_address|route|neighborhood|locality');

  const res = await fetch(url.toString(), { signal });
  const data = (await res.json()) as {
    status: string;
    error_message?: string;
    results?: Array<{
      formatted_address?: string;
      address_components?: google.maps.GeocoderAddressComponent[];
    }>;
  };
  if (data.status !== 'OK' || !data.results?.[0]) {
    if (data.status === 'REQUEST_DENIED') {
      throw new Error(data.error_message || 'Geocoding API denied');
    }
    return null;
  }
  const top = data.results[0];
  const country = top.address_components?.find((c) => c.types.includes('country'));
  if (country && country.short_name !== 'SA') return null;
  return parseGoogleAddressComponents(top.address_components, top.formatted_address);
}
