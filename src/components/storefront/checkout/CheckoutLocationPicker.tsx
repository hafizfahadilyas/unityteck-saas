import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  SaudiGoogleMapPicker,
  type GeoPoint,
} from '../../maps/SaudiGoogleMapPicker';
import { SaudiCitySelect } from '../../common/SaudiCitySelect';
import { prefetchGoogleMaps, type SaudiAddressParts } from '../../../utils/googleMapsLoader';

export type CheckoutGeoPoint = GeoPoint;

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
 * Checkout location: Google Maps pin (Saudi Arabia only) + manual address.
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
  const [customCity, setCustomCity] = useState(false);

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
          {isAr ? 'من خرائط جوجل' : 'From Google Maps'}
        </button>
      </div>

      {!manualMode ? (
        <SaudiGoogleMapPicker
          isAr={isAr}
          geo={geo}
          onGeoChange={(point) => {
            onGeoChange(point);
            setManualMode(false);
          }}
          onAddressPartsChange={(parts) => {
            applyParts(parts);
            setManualMode(true);
          }}
          showInlineSearch
          className="mt-0"
        />
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
            <SaudiCitySelect
              value={city}
              onChange={(v) => {
                setCustomCity(false);
                onCityChange(v);
              }}
              cities={cities}
              isAr={isAr}
              required
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
