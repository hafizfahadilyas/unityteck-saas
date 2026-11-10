import React from 'react';
import {
  SaudiGoogleMapPicker,
  type GeoPoint,
} from '../maps/SaudiGoogleMapPicker';

export type CheckoutGeoPoint = GeoPoint;

type Props = {
  isAr: boolean;
  address?: string;
  onAddressChange: (value: string) => void;
  geo: CheckoutGeoPoint | null;
  onGeoChange: (point: CheckoutGeoPoint | null) => void;
  disabled?: boolean;
};

/**
 * Admin manual-order delivery pin — modern Google Maps, Saudi Arabia only.
 */
export const DeliveryLiveMapPin: React.FC<Props> = ({
  isAr,
  address,
  onAddressChange,
  geo,
  onGeoChange,
  disabled = false,
}) => (
  <SaudiGoogleMapPicker
    isAr={isAr}
    address={address}
    onAddressChange={onAddressChange}
    geo={geo}
    onGeoChange={onGeoChange}
    disabled={disabled}
    showInlineSearch
  />
);

export default DeliveryLiveMapPin;
