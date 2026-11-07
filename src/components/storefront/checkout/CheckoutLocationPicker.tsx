import React, { useMemo, useState } from 'react';
import { Crosshair, MapPin, Navigation } from 'lucide-react';

export type CheckoutGeoPoint = {
  lat: number;
  lng: number;
};

type Props = {
  isAr: boolean;
  city: string;
  district: string;
  street: string;
  onCityChange: (v: string) => void;
  onDistrictChange: (v: string) => void;
  onStreetChange: (v: string) => void;
  geo: CheckoutGeoPoint | null;
  onGeoChange: (point: CheckoutGeoPoint | null) => void;
  cities: Array<{ en: string; ar: string }>;
  /** When true, city is free-text instead of select */
  allowCustomCity?: boolean;
};

/**
 * Modern checkout location: map pin (OSM) + geolocation + full manual address.
 */
export const CheckoutLocationPicker: React.FC<Props> = ({
  isAr,
  city,
  district,
  street,
  onCityChange,
  onDistrictChange,
  onStreetChange,
  geo,
  onGeoChange,
  cities,
  allowCustomCity = true,
}) => {
  const [manualMode, setManualMode] = useState(true);
  const [locBusy, setLocBusy] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [customCity, setCustomCity] = useState(false);

  const mapSrc = useMemo(() => {
    const lat = geo?.lat ?? 21.4225;
    const lng = geo?.lng ?? 39.8262;
    // OpenStreetMap embed — no API key, store-safe
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.04}%2C${lat - 0.03}%2C${lng + 0.04}%2C${lat + 0.03}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [geo]);

  const useMyLocation = () => {
    setLocError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocError(isAr ? 'الموقع غير مدعوم على هذا الجهاز' : 'Geolocation is not supported on this device');
      return;
    }
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onGeoChange({ lat, lng });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { Accept: 'application/json' } },
          );
          if (res.ok) {
            const data = (await res.json()) as {
              address?: {
                city?: string;
                town?: string;
                village?: string;
                state?: string;
                suburb?: string;
                neighbourhood?: string;
                road?: string;
                house_number?: string;
              };
              display_name?: string;
            };
            const a = data.address || {};
            const resolvedCity = a.city || a.town || a.village || a.state || '';
            if (resolvedCity) {
              setCustomCity(true);
              onCityChange(resolvedCity);
            }
            if (a.suburb || a.neighbourhood) onDistrictChange(a.suburb || a.neighbourhood || '');
            const road = [a.road, a.house_number].filter(Boolean).join(' ');
            if (road) onStreetChange(road);
            else if (data.display_name && !street) onStreetChange(data.display_name);
          }
        } catch {
          /* keep coords even if reverse geocode fails */
        } finally {
          setLocBusy(false);
          setManualMode(true);
        }
      },
      () => {
        setLocBusy(false);
        setLocError(
          isAr
            ? 'تعذر قراءة موقعك. أدخل العنوان يدوياً أو من الخريطة.'
            : 'Could not read your location. Enter the address manually or use the map.',
        );
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const applyMapClickHint = () => {
    // Manual lat/lng fine-tune via browser prompt would be crude; use OSM link instead.
    const lat = geo?.lat ?? 21.4225;
    const lng = geo?.lng ?? 39.8262;
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setManualMode(true)}
          className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
            manualMode
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white text-neutral-600 border-neutral-200'
          }`}
        >
          {isAr ? 'إدخال يدوي' : 'Manual entry'}
        </button>
        <button
          type="button"
          onClick={() => setManualMode(false)}
          className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
            !manualMode
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white text-neutral-600 border-neutral-200'
          }`}
        >
          {isAr ? 'من الخريطة' : 'From map'}
        </button>
        <button
          type="button"
          disabled={locBusy}
          onClick={useMyLocation}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-800 cursor-pointer disabled:opacity-50"
        >
          <Navigation className="w-3.5 h-3.5" />
          {locBusy
            ? isAr
              ? 'جارٍ التحديد…'
              : 'Locating…'
            : isAr
              ? 'موقعي الحالي'
              : 'Use my location'}
        </button>
      </div>

      {locError ? <p className="text-[11px] text-rose-600">{locError}</p> : null}

      {!manualMode ? (
        <div className="space-y-2">
          <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 aspect-[16/9] relative">
            <iframe
              title={isAr ? 'خريطة موقع التوصيل' : 'Delivery location map'}
              src={mapSrc}
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyMapClickHint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border border-neutral-200 bg-white text-neutral-700 cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5" />
              {isAr ? 'فتح الخريطة الكاملة لتحديد النقطة' : 'Open full map to set pin'}
            </button>
            {geo ? (
              <span className="text-[10px] font-mono text-neutral-500 self-center">
                {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-neutral-500">
            {isAr
              ? 'حدّد الموقع على الخريطة ثم أكمل الحي والشارع يدوياً إن لزم.'
              : 'Set the pin on the map, then complete district and street manually if needed.'}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {isAr ? 'المدينة' : 'City'}
          </label>
          {allowCustomCity && customCity ? (
            <input
              type="text"
              required
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className="w-full bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
              placeholder={isAr ? 'اكتب اسم المدينة' : 'Type city name'}
            />
          ) : (
            <select
              value={city}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setCustomCity(true);
                  onCityChange('');
                  return;
                }
                setCustomCity(false);
                onCityChange(e.target.value);
              }}
              className="w-full bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden cursor-pointer"
            >
              {cities.map((c) => (
                <option key={c.en} value={isAr ? c.ar : c.en}>
                  {isAr ? c.ar : c.en}
                </option>
              ))}
              {allowCustomCity ? (
                <option value="__custom__">{isAr ? 'مدينة أخرى (يدوي)…' : 'Other city (manual)…'}</option>
              ) : null}
            </select>
          )}
          {allowCustomCity && !customCity ? (
            <button
              type="button"
              onClick={() => {
                setCustomCity(true);
                onCityChange('');
              }}
              className="mt-1 text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              {isAr ? 'كتابة المدينة يدوياً' : 'Enter city manually'}
            </button>
          ) : null}
        </div>

        <div>
          <label className="block font-semibold text-neutral-700 mb-1">
            {isAr ? 'الحي' : 'District'}
          </label>
          <input
            type="text"
            required
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="w-full bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block font-semibold text-neutral-700 mb-1">
            {isAr ? 'الشارع ورقم المبنى' : 'Street & Building Details'}
          </label>
          <input
            type="text"
            required
            value={street}
            onChange={(e) => onStreetChange(e.target.value)}
            className="w-full bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
          />
        </div>
      </div>
    </div>
  );
};
