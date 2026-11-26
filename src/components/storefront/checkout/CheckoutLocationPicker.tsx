import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  SaudiGoogleMapPicker,
  type GeoPoint,
} from '../../maps/SaudiGoogleMapPicker';
import { SaudiCitySelect } from '../../common/SaudiCitySelect';
import { type SaudiCityOption } from '../../../data/saudiCities';
import { prefetchGoogleMaps, type SaudiAddressParts } from '../../../utils/googleMapsLoader';

export type CheckoutGeoPoint = GeoPoint;

type LocationMode = 'manual' | 'map';

/** Catalog shape preferred; legacy `{en,ar}` still accepted by SaudiCitySelect. */
type CheckoutCityOption = SaudiCityOption | { en: string; ar: string };

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
  cities: CheckoutCityOption[];
  /** When true, city is free-text instead of select */
  allowCustomCity?: boolean;
  /** Hide street/building row (city + district only checkout) */
  compactAddress?: boolean;
};

/**
 * Checkout location: type address OR drop map pin (no typing required when pin is set).
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
  compactAddress = false,
}) => {
  const [mode, setMode] = useState<LocationMode>('map');
  const [customCity, setCustomCity] = useState(false);
  const pinSet = Boolean(geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lng));
  /** Manual = typed fields required. Map = pin alone is enough (fields optional). */
  const fieldsRequired = mode === 'manual';

  useEffect(() => {
    prefetchGoogleMaps();
  }, []);

  const applyParts = (parts: SaudiAddressParts) => {
    if (parts.city) {
      setCustomCity(true);
      onCityChange(parts.city);
    }
    if (parts.district) onDistrictChange(parts.district);
    if (parts.street) onStreetChange(parts.street);
    else if (parts.formatted && !street) onStreetChange(parts.formatted);
  };

  const ensurePinFallbackAddress = (point: CheckoutGeoPoint) => {
    if (city.trim() || district.trim() || street.trim()) return;
    const label = isAr
      ? `موقع الدبوس · ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
      : `Map pin · ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
    onStreetChange(label);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={isAr ? 'طريقة تحديد العنوان' : 'Address entry method'}>
        <button
          type="button"
          onClick={() => setMode('map')}
          aria-pressed={mode === 'map'}
          data-checkout-loc-mode="map"
          className={`px-3 py-2 rounded-xl text-[11px] font-extrabold border cursor-pointer ${
            mode === 'map' ? 'border-neutral-900' : 'border-neutral-200'
          }`}
          style={
            mode === 'map'
              ? { backgroundColor: '#171717', color: '#ffffff' }
              : { backgroundColor: '#ffffff', color: '#404040' }
          }
        >
          {isAr ? 'تثبيت بالدبوس' : 'Drop pin'}
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          aria-pressed={mode === 'manual'}
          data-checkout-loc-mode="manual"
          className={`px-3 py-2 rounded-xl text-[11px] font-extrabold border cursor-pointer ${
            mode === 'manual' ? 'border-neutral-900' : 'border-neutral-200'
          }`}
          style={
            mode === 'manual'
              ? { backgroundColor: '#171717', color: '#ffffff' }
              : { backgroundColor: '#ffffff', color: '#404040' }
          }
        >
          {isAr ? 'إدخال يدوي' : 'Manual entry'}
        </button>
      </div>

      {mode === 'map' ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-neutral-600 leading-snug">
            {isAr
              ? 'اسحب الدبوس أو اضغط على الخريطة — الموقع يُثبَّت تلقائياً دون كتابة.'
              : 'Drag the pin or tap the map — location locks automatically with no typing.'}
          </p>
          {/* Force a pin before submit when using map mode */}
          <input
            type="text"
            required={!pinSet}
            value={pinSet ? `${geo!.lat},${geo!.lng}` : ''}
            onChange={() => undefined}
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          <SaudiGoogleMapPicker
            isAr={isAr}
            geo={geo}
            onGeoChange={(point) => {
              onGeoChange(point);
              if (point) ensurePinFallbackAddress(point);
            }}
            onAddressPartsChange={(parts) => {
              applyParts(parts);
            }}
            showInlineSearch
            className="mt-0"
          />
          {pinSet ? (
            <p className="text-[10px] font-bold text-emerald-700">
              {isAr
                ? 'تم تثبيت الموقع بالدبوس. يمكنك تعديل العنوان أدناه اختيارياً.'
                : 'Pin locked. You can optionally refine the address below.'}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs min-w-0">
        <div className="min-w-0">
          <label className="block font-semibold text-neutral-700 mb-1 flex flex-wrap items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {isAr ? 'المدينة' : 'City'}
            {fieldsRequired ? (
              <span className="text-rose-600" aria-hidden="true">*</span>
            ) : (
              <span className="font-medium text-neutral-400">
                ({isAr ? 'اختياري مع الدبوس' : 'optional with pin'})
              </span>
            )}
          </label>
          {allowCustomCity && customCity ? (
            <input
              type="text"
              required={fieldsRequired}
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className="w-full bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
              placeholder={isAr ? 'اكتب اسم المدينة' : 'Type city name'}
            />
          ) : (
            <SaudiCitySelect
              value={city}
              onChange={(v) => {
                setCustomCity(false);
                onCityChange(v);
              }}
              cities={cities}
              isAr={isAr}
              required={fieldsRequired}
              placeholder={isAr ? 'اختر المدينة' : 'Select city'}
              className="w-full bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
            />
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

        <div className="min-w-0">
          <label className="block font-semibold text-neutral-700 mb-1">
            {isAr ? 'الحي' : 'District'}
            {fieldsRequired ? (
              <span className="text-rose-600 ms-0.5" aria-hidden="true">*</span>
            ) : (
              <span className="ms-1 font-medium text-neutral-400">
                ({isAr ? 'اختياري' : 'optional'})
              </span>
            )}
          </label>
          <input
            type="text"
            required={fieldsRequired}
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="w-full min-w-0 bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
          />
        </div>

        {!compactAddress ? (
          <div className="sm:col-span-2 min-w-0">
            <label className="block font-semibold text-neutral-700 mb-1">
              {isAr ? 'الشارع ورقم المبنى' : 'Street & Building Details'}
              <span className="ms-1 font-medium text-neutral-400">
                ({isAr ? 'اختياري' : 'optional'})
              </span>
            </label>
            <input
              type="text"
              value={street}
              onChange={(e) => onStreetChange(e.target.value)}
              className="w-full min-w-0 bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
