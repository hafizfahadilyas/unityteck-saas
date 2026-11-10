/** Minimal Google Maps JS typings used by Saudi delivery map picker. */
declare namespace google.maps {
  class Map {
    constructor(el: HTMLElement, opts?: MapOptions);
    setCenter(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    panTo(latLng: LatLng | LatLngLiteral): void;
    fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
    addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setPosition(latLng: LatLng | LatLngLiteral): void;
    setMap(map: Map | null): void;
    getPosition(): LatLng | null;
    addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  enum ControlPosition {
    RIGHT_BOTTOM,
    RIGHT_TOP,
    LEFT_BOTTOM,
    LEFT_TOP,
  }

  class LatLngBounds {
    constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
    extend(point: LatLng | LatLngLiteral): void;
    contains(latLng: LatLng | LatLngLiteral): boolean;
  }

  class Geocoder {
    geocode(
      request: GeocoderRequest,
      callback: (results: GeocoderResult[] | null, status: string) => void,
    ): void;
  }

  class Circle {
    constructor(opts?: any);
  }

  interface MapsEventListener {
    remove(): void;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    zoomControl?: boolean;
    zoomControlOptions?: { position?: ControlPosition };
    gestureHandling?: string;
    clickableIcons?: boolean;
    disableDefaultUI?: boolean;
    isFractionalZoomEnabled?: boolean;
    restriction?: {
      latLngBounds: LatLngBounds | LatLngBoundsLiteral;
      strictBounds?: boolean;
    };
    styles?: unknown[];
  }

  interface MarkerOptions {
    map?: Map;
    position?: LatLng | LatLngLiteral;
    draggable?: boolean;
    title?: string;
    animation?: unknown;
    optimized?: boolean;
    icon?:
      | string
      | {
          url: string;
          scaledSize?: Size;
          anchor?: Point;
          size?: Size;
        };
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface LatLngBoundsLiteral {
    south: number;
    west: number;
    north: number;
    east: number;
  }

  interface MapMouseEvent {
    latLng: LatLng | null;
  }

  interface GeocoderRequest {
    location?: LatLng | LatLngLiteral;
    address?: string;
    componentRestrictions?: { country?: string | string[] };
    region?: string;
  }

  interface GeocoderResult {
    formatted_address?: string;
    address_components?: GeocoderAddressComponent[];
    geometry?: { location: LatLng };
  }

  interface GeocoderAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }

  enum Animation {
    DROP,
    BOUNCE,
  }

  namespace places {
    class Autocomplete {
      constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
      getPlace(): PlaceResult;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
      setBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
      setComponentRestrictions(restrictions: { country: string | string[] }): void;
    }

    interface AutocompleteOptions {
      fields?: string[];
      bounds?: LatLngBounds | LatLngBoundsLiteral;
      componentRestrictions?: { country: string | string[] };
      strictBounds?: boolean;
      types?: string[];
    }

    interface PlaceResult {
      formatted_address?: string;
      name?: string;
      geometry?: { location?: LatLng };
      address_components?: GeocoderAddressComponent[];
    }
  }

  namespace event {
    function clearInstanceListeners(instance: object): void;
    function trigger(instance: object, eventName: string, ...args: unknown[]): void;
  }
}

declare const google: {
  maps: typeof google.maps;
};

interface Window {
  google?: typeof google;
}
