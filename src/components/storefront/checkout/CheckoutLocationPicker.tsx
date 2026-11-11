import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  SaudiGoogleMapPicker,
  type GeoPoint,
} from '../../maps/SaudiGoogleMapPicker';
import { SaudiCitySelect } from '../../common/SaudiCitySelect';
import { prefetchGoogleMaps, type SaudiAddressParts } from '../../../utils/googleMapsLoader';

export type CheckoutGeoPoint = GeoPoint;

type LocationMode = 'manual' | 'map';

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
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode('map')}
          className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
            mode === 'map'
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white text-neutral-600 border-neutral-200'
          }`}
        >
          {isAr ? 'تثبيت بالدبوس' : 'Drop pin'}
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
            mode === 'manual'
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white text-neutral-600 border-neutral-200'
          }`}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {isAr ? 'المدينة' : 'City'}
            {!fieldsRequired ? (
              <span className="font-medium text-neutral-400">
                ({isAr ? 'اختياري مع الدبوس' : 'optional with pin'})
              </span>
            ) : null}
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

        <div>
          <label className="block font-semibold text-neutral-700 mb-1">
            {isAr ? 'الحي' : 'District'}
            {!fieldsRequired ? (
              <span className="ms-1 font-medium text-neutral-400">
                ({isAr ? 'اختياري' : 'optional'})
              </span>
            ) : null}
          </label>
          <input
            type="text"
            required={fieldsRequired}
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="w-full bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block font-semibold text-neutral-700 mb-1">
            {isAr ? 'الشارع ورقم المبنى' : 'Street & Building Details'}
            {!fieldsRequired ? (
              <span className="ms-1 font-medium text-neutral-400">
                ({isAr ? 'اختياري' : 'optional'})
              </span>
            ) : null}
          </label>
          <input
            type="text"
            required={fieldsRequired}
            value={street}
            onChange={(e) => onStreetChange(e.target.value)}
            className="w-full bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
          />
        </div>
      </div>
    </div>
  );
};
