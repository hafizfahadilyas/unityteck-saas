import React, { useMemo, useState } from 'react';
import { Crosshair, Navigation } from 'lucide-react';
import type { CheckoutGeoPoint } from '../storefront/checkout/CheckoutLocationPicker';

type Props = {
  isAr: boolean;
  onAddressChange: (value: string) => void;
  geo: CheckoutGeoPoint | null;
  onGeoChange: (point: CheckoutGeoPoint | null) => void;
  disabled?: boolean;
};

/**
 * Compact live GPS pin + OSM map for admin manual order delivery address.
 * Reuses the same Nominatim + OpenStreetMap approach as storefront checkout.
 */
export const DeliveryLiveMapPin: React.FC<Props> = ({
  isAr,
  onAddressChange,
  geo,
  onGeoChange,
  disabled = false,
}) => {
  const [locBusy, setLocBusy] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const mapSrc = useMemo(() => {
    const lat = geo?.lat ?? 21.4225;
    const lng = geo?.lng ?? 39.8262;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.04}%2C${lat - 0.03}%2C${lng + 0.04}%2C${lat + 0.03}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [geo]);

  const useMyLocation = () => {
    if (disabled) return;
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
            const city = a.city || a.town || a.village || a.state || '';
            const district = a.suburb || a.neighbourhood || '';
            const road = [a.road, a.house_number].filter(Boolean).join(' ');
            const composed = [city, district, road].filter(Boolean).join(' - ');
            if (composed) onAddressChange(composed);
            else if (data.display_name) onAddressChange(data.display_name);
          }
        } catch {
          /* keep pin even if reverse geocode fails */
        } finally {
          setLocBusy(false);
        }
      },
      () => {
        setLocBusy(false);
        setLocError(
          isAr
            ? 'تعذر قراءة موقعك الحالي. اسمح بالموقع من المتصفح أو أدخل العنوان يدوياً.'
            : 'Could not read your live location. Allow location in the browser or enter the address manually.',
        );
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const openFullMap = () => {
    const lat = geo?.lat ?? 21.4225;
    const lng = geo?.lng ?? 39.8262;
    window.open(
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  if (disabled) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={locBusy}
          onClick={useMyLocation}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 cursor-pointer disabled:opacity-50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          {locBusy
            ? isAr
              ? 'جارٍ تحديد الموقع الحي…'
              : 'Getting live location…'
            : isAr
              ? 'موقعي الحالي (دبوس حي)'
              : 'Use my live location pin'}
        </button>
        <button
          type="button"
          onClick={openFullMap}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Crosshair className="w-3.5 h-3.5" />
          {isAr ? 'فتح الخريطة الكاملة' : 'Open full map'}
        </button>
        {geo ? (
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 self-center tabular-nums">
            {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
          </span>
        ) : null}
      </div>

      {locError ? <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">{locError}</p> : null}

      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-850 aspect-[16/9] relative shadow-2xs">
        <iframe
          title={isAr ? 'خريطة موقع التوصيل الحي' : 'Live delivery location map'}
          src={mapSrc}
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {!geo ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent px-3 py-2.5 pointer-events-none">
            <p className="text-[10px] font-bold text-white">
              {isAr
                ? 'اضغط «موقعي الحالي» لوضع دبوس الموقع الحي على الخريطة'
                : 'Tap “Use my live location pin” to drop your GPS pin on the map'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DeliveryLiveMapPin;
