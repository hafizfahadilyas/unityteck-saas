import React, { useEffect, useId, useRef, useState } from 'react';
import { Crosshair, Loader2, MapPin, Navigation, Search, ShieldCheck } from 'lucide-react';
import {
  SAUDI_BOUNDS,
  SAUDI_DEFAULT_CENTER,
  googleMapsEmbedUrl,
  googleMapsExternalUrl,
  isInSaudiArabia,
  type GeoPoint,
} from '../../utils/saudiGeo';
import {
  getGooglePlacesApiKey,
  hasGoogleMapsApiKey,
  loadGoogleMaps,
  prefetchGoogleMaps,
  resolveSaudiPlace,
  reverseGeocodeSaudi,
  searchSaudiPlaces,
  type SaudiAddressParts,
  type SaudiPlaceSuggestion,
} from '../../utils/googleMapsLoader';

export type { GeoPoint };

/**
 * Light contrast only — heavy custom styles wash tiles to blank grey and slow first paint.
 * Keep roads/labels readable so the map never looks “still loading”.
 */
const SOUQ_MAP_STYLES: google.maps.MapOptions['styles'] = [
  { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#b8ddd6' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a8d4e8' }] },
];

const TEAL_PIN_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
    <path fill="#0d9488" d="M22 0C10.4 0 1 9.2 1 20.6 1 35.2 22 56 22 56s21-20.8 21-35.4C43 9.2 33.6 0 22 0z"/>
    <circle cx="22" cy="21" r="8" fill="#fff"/>
  </svg>`,
);

type Props = {
  isAr: boolean;
  geo: GeoPoint | null;
  onGeoChange: (point: GeoPoint | null) => void;
  /** Controlled delivery address text (typing + pick sync). */
  address?: string;
  onAddressChange?: (value: string) => void;
  onAddressPartsChange?: (parts: SaudiAddressParts) => void;
  disabled?: boolean;
  /** Optional legacy external input — prefer built-in search for smooth UX. */
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  showInlineSearch?: boolean;
  className?: string;
};

/**
 * Modern Saudi-only Google Maps delivery picker (store dashboard chrome).
 */
export const SaudiGoogleMapPicker: React.FC<Props> = ({
  isAr,
  geo,
  onGeoChange,
  address,
  onAddressChange,
  onAddressPartsChange,
  disabled = false,
  searchInputRef,
  showInlineSearch = true,
  className = '',
}) => {
  const listId = useId();
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const searchBoxRef = useRef<HTMLInputElement | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);

  const wantsInteractive = hasGoogleMapsApiKey();
  const [interactive, setInteractive] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [pickBusy, setPickBusy] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [query, setQuery] = useState(address || '');
  const [suggestions, setSuggestions] = useState<SaudiPlaceSuggestion[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (typeof address === 'string' && address !== query) setQuery(address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Warm Maps JS as soon as the picker mounts (or even while disabled=false path prepares).
  useEffect(() => {
    if (!disabled && wantsInteractive) prefetchGoogleMaps();
  }, [disabled, wantsInteractive]);

  const applyAddressParts = (parts: SaudiAddressParts) => {
    onAddressPartsChange?.(parts);
    const next =
      parts.formatted ||
      [parts.city, parts.district, parts.street].filter(Boolean).join(' - ');
    if (next) {
      setQuery(next);
      onAddressChange?.(next);
    }
  };

  const reverseGeocode = (point: GeoPoint) => {
    if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    reverseAbortRef.current?.abort();
    reverseTimerRef.current = setTimeout(() => {
      const ac = new AbortController();
      reverseAbortRef.current = ac;
      void reverseGeocodeSaudi(point.lat, point.lng, isAr, ac.signal)
        .then((parts) => {
          if (!ac.signal.aborted && parts) applyAddressParts(parts);
        })
        .catch(() => {
          /* keep pin */
        });
    }, 180);
  };

  const setPin = (point: GeoPoint, opts?: { reverse?: boolean; silentOutOfSa?: boolean }) => {
    if (!isInSaudiArabia(point.lat, point.lng)) {
      if (!opts?.silentOutOfSa) {
        setLocError(
          isAr
            ? 'الموقع خارج المملكة العربية السعودية. اختر موقعاً داخل السعودية فقط.'
            : 'Location is outside Saudi Arabia. Choose a pin inside KSA only.',
        );
      }
      return;
    }
    setLocError(null);
    onGeoChange(point);
    if (markerRef.current) markerRef.current.setPosition(point);
    if (mapRef.current) {
      mapRef.current.panTo(point);
      mapRef.current.setZoom(16);
    }
    if (opts?.reverse !== false) reverseGeocode(point);
  };

  const setPinRef = useRef(setPin);
  setPinRef.current = setPin;

  const runPlacesSearch = (raw: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchAbortRef.current?.abort();
    const q = raw.trim();
    if (!getGooglePlacesApiKey() || q.length < 2) {
      setSuggestions([]);
      setActiveIdx(-1);
      setSearchBusy(false);
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      const ac = new AbortController();
      searchAbortRef.current = ac;
      setSearchBusy(true);
      searchSaudiPlaces(q, isAr, ac.signal)
        .then((rows) => {
          if (ac.signal.aborted) return;
          setSuggestions(rows.slice(0, 7));
          setActiveIdx(rows.length ? 0 : -1);
          setSearchOpen(true);
        })
        .catch((err: unknown) => {
          if (ac.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
          setSuggestions([]);
          setLocError(
            isAr
              ? 'تعذر البحث في العناوين السعودية.'
              : err instanceof Error
                ? err.message
                : 'Saudi address search failed.',
          );
        })
        .finally(() => {
          if (!ac.signal.aborted) setSearchBusy(false);
        });
    }, 120);
  };

  const pickSuggestion = async (item: SaudiPlaceSuggestion) => {
    setSuggestions([]);
    setSearchOpen(false);
    setActiveIdx(-1);
    setQuery(item.text);
    onAddressChange?.(item.text);
    setPickBusy(true);
    try {
      const resolved = await resolveSaudiPlace(item.placeId, isAr);
      if (!resolved) {
        setLocError(isAr ? 'تعذر قراءة موقع العنوان المختار' : 'Could not read the selected place');
        return;
      }
      if (!isInSaudiArabia(resolved.point.lat, resolved.point.lng)) {
        setLocError(
          isAr
            ? 'البحث مقيّد بالمملكة العربية السعودية فقط'
            : 'Search is restricted to Saudi Arabia only',
        );
        return;
      }
      setPin(resolved.point, { reverse: false });
      applyAddressParts(
        resolved.parts.formatted ? resolved.parts : { ...resolved.parts, formatted: item.text },
      );
    } catch (err: unknown) {
      setLocError(
        isAr
          ? 'تعذر فتح العنوان المختار'
          : err instanceof Error
            ? err.message
            : 'Could not open the selected place',
      );
    } finally {
      setPickBusy(false);
    }
  };

  useEffect(() => {
    if (disabled || !wantsInteractive) return;
    let cancelled = false;
    let tries = 0;

    const boot = () => {
      if (cancelled) return;
      if (!mapHostRef.current) {
        if (tries++ < 40) requestAnimationFrame(boot);
        return;
      }

      loadGoogleMaps()
        .then((g) => {
          if (cancelled || !mapHostRef.current) return;
          const center = geo && isInSaudiArabia(geo.lat, geo.lng) ? geo : SAUDI_DEFAULT_CENTER;
          const map = new g.maps.Map(mapHostRef.current, {
            center,
            zoom: geo ? 16 : 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            zoomControlOptions: { position: g.maps.ControlPosition.RIGHT_BOTTOM },
            gestureHandling: 'greedy',
            clickableIcons: false,
            disableDefaultUI: false,
            styles: SOUQ_MAP_STYLES,
            restriction: {
              latLngBounds: { ...SAUDI_BOUNDS },
              strictBounds: true,
            },
            // Prefer faster raster tiles over vector when available.
            isFractionalZoomEnabled: false,
          });

          const marker = new g.maps.Marker({
            map,
            position: center,
            draggable: true,
            title: isAr ? 'موقع التوصيل' : 'Delivery pin',
            // No DROP animation — instant pin, faster perceived ready.
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${TEAL_PIN_SVG}`,
              scaledSize: new g.maps.Size(40, 52),
              anchor: new g.maps.Point(20, 52),
            },
            optimized: true,
          });

          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;
            setPinRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          });
          marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            if (!pos) return;
            setPinRef.current({ lat: pos.lat(), lng: pos.lng() });
          });

          mapRef.current = map;
          markerRef.current = marker;
          setInteractive(true);
          setMapReady(true);

          if (geo && isInSaudiArabia(geo.lat, geo.lng)) {
            marker.setPosition(geo);
            map.setCenter(geo);
          }

          // Force tile paint after flex/aspect layout settles (avoids blank grey canvas).
          requestAnimationFrame(() => {
            g.maps.event.trigger(map, 'resize');
            map.setCenter(geo && isInSaudiArabia(geo.lat, geo.lng) ? geo : center);
          });
        })
        .catch(() => {
          if (!cancelled) {
            setInteractive(false);
            setMapReady(false);
          }
        });
    };

    boot();

    return () => {
      cancelled = true;
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapRef.current = null;
      setInteractive(false);
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, wantsInteractive]);

  useEffect(() => {
    if (!mapReady || !geo || !isInSaudiArabia(geo.lat, geo.lng)) return;
    markerRef.current?.setPosition(geo);
    mapRef.current?.panTo(geo);
  }, [geo, mapReady]);

  // Legacy external input still supported
  useEffect(() => {
    const el = searchInputRef?.current;
    if (disabled || !el) return;
    const onInput = () => {
      setQuery(el.value);
      runPlacesSearch(el.value);
      setSearchOpen(true);
    };
    el.addEventListener('input', onInput);
    return () => el.removeEventListener('input', onInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, searchInputRef, isAr]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
      searchAbortRef.current?.abort();
      reverseAbortRef.current?.abort();
    };
  }, []);

  const useMyLocation = () => {
    if (disabled) return;
    setLocError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocError(isAr ? 'الموقع غير مدعوم على هذا الجهاز' : 'Geolocation is not supported on this device');
      return;
    }
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocBusy(false);
        if (!isInSaudiArabia(point.lat, point.lng)) {
          setLocError(
            isAr
              ? 'موقعك الحالي خارج السعودية. ضع الدبوس داخل المملكة فقط.'
              : 'Your live location is outside Saudi Arabia. Drop the pin inside KSA only.',
          );
          return;
        }
        setPin(point);
      },
      () => {
        setLocBusy(false);
        setLocError(
          isAr
            ? 'تعذر قراءة موقعك الحالي. اسمح بالموقع من المتصفح أو ابحث عن عنوان سعودي.'
            : 'Could not read your live location. Allow location or search a Saudi address.',
        );
      },
      // Network/Wi‑Fi fix first — high-accuracy GPS was making “My live pin” feel stuck.
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60_000 },
    );
  };

  const openFullMap = () => {
    const point = geo && isInSaudiArabia(geo.lat, geo.lng) ? geo : SAUDI_DEFAULT_CENTER;
    window.open(googleMapsExternalUrl(point.lat, point.lng), '_blank', 'noopener,noreferrer');
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      void pickSuggestion(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
      setSuggestions([]);
    }
  };

  if (disabled) return null;

  const embedCenter = geo && isInSaudiArabia(geo.lat, geo.lng) ? geo : SAUDI_DEFAULT_CENTER;
  const pinned = Boolean(geo && isInSaudiArabia(geo.lat, geo.lng));

  return (
    <div
      className={`mt-2 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-gradient-to-b from-white via-slate-50/40 to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20 shadow-sm overflow-hidden ${className}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="px-3.5 pt-3.5 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <MapPin className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight truncate">
              {isAr ? 'موقع التوصيل على الخريطة' : 'Delivery location on map'}
            </p>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
              {isAr ? 'اكتب العنوان بسلاسة — النتائج داخل السعودية فقط' : 'Type smoothly — results in Saudi Arabia only'}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50 shrink-0">
          <ShieldCheck className="w-3 h-3" />
          {isAr ? 'السعودية فقط' : 'KSA only'}
        </span>
      </div>

      {/* Smooth typing search */}
      {showInlineSearch ? (
        <div className="px-3.5 pb-2 relative z-20">
          <div className="relative group">
            <Search className="w-4 h-4 text-teal-600/70 dark:text-teal-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={(node) => {
                searchBoxRef.current = node;
              }}
              type="text"
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                onAddressChange?.(v);
                runPlacesSearch(v);
                setSearchOpen(true);
              }}
              onFocus={() => {
                if (suggestions.length) setSearchOpen(true);
              }}
              onBlur={() => {
                // allow click on suggestion
                window.setTimeout(() => setSearchOpen(false), 160);
              }}
              onKeyDown={onSearchKeyDown}
              role="combobox"
              aria-expanded={searchOpen && suggestions.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              placeholder={
                isAr
                  ? 'اكتب المدينة أو الحي أو الشارع داخل السعودية…'
                  : 'Type city, district or street in Saudi Arabia…'
              }
              className="w-full ps-10 pe-10 py-3 text-xs sm:text-[13px] rounded-2xl border-2 border-teal-500/25 dark:border-teal-500/30 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-500/15 shadow-sm transition-all font-semibold"
              autoComplete="off"
              spellCheck={false}
            />
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400">
              {searchBusy || pickBusy ? (
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              ) : null}
            </span>
          </div>

          {searchOpen && suggestions.length > 0 ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute inset-x-3.5 top-[calc(100%-2px)] mt-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl overflow-hidden max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
            >
              {suggestions.map((s, idx) => (
                <li key={s.placeId} role="option" aria-selected={idx === activeIdx}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => void pickSuggestion(s)}
                    className={`w-full flex items-start gap-2.5 text-start px-3.5 py-2.5 text-[12px] font-medium cursor-pointer transition-colors ${
                      idx === activeIdx
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-100'
                        : 'text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-teal-600 shrink-0" />
                    <span className="leading-snug">{s.text}</span>
                  </button>
                </li>
              ))}
              <li className="px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800">
                {isAr ? 'نتائج المملكة العربية السعودية فقط' : 'Saudi Arabia results only'}
              </li>
            </ul>
          ) : null}
        </div>
      ) : null}

      {locError ? (
        <p className="px-3.5 pb-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">{locError}</p>
      ) : null}

      {/* Map stage */}
      <div className="relative mx-3.5 mb-3.5 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/70 bg-slate-100 dark:bg-slate-850 aspect-[16/10] sm:aspect-[16/9] shadow-inner">
        {wantsInteractive ? (
          <div ref={mapHostRef} className="absolute inset-0 w-full h-full" />
        ) : null}

        {/*
          When JS Maps key exists: light skeleton only (do NOT also load embed iframe —
          dual Google loads made the grey “stuck loading” feel).
          Fallback embed only when there is no Maps JS key.
        */}
        {wantsInteractive && !mapReady ? (
          <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-slate-100 to-teal-50/40 dark:from-slate-850 dark:to-teal-950/30 pointer-events-none">
            <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'جارٍ تحميل الخريطة…' : 'Loading map…'}
            </p>
          </div>
        ) : null}

        {!wantsInteractive ? (
          <iframe
            title={isAr ? 'خريطة جوجل لموقع التوصيل' : 'Google Maps delivery location'}
            src={googleMapsEmbedUrl(embedCenter.lat, embedCenter.lng, isAr)}
            className="absolute inset-0 w-full h-full border-0"
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : null}

        {/* Floating controls */}
        <div className="absolute top-2.5 start-2.5 end-2.5 z-10 flex flex-wrap items-center gap-1.5 pointer-events-none">
          <button
            type="button"
            disabled={locBusy}
            onClick={useMyLocation}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[10px] sm:text-[11px] font-black border border-white/70 dark:border-slate-600/80 bg-white/95 dark:bg-slate-900/90 backdrop-blur text-teal-800 dark:text-teal-200 shadow-md cursor-pointer disabled:opacity-50 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-colors"
          >
            {locBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            {locBusy
              ? isAr
                ? 'جارٍ التحديد…'
                : 'Locating…'
              : isAr
                ? 'موقعي الحالي'
                : 'My live pin'}
          </button>
          <button
            type="button"
            onClick={openFullMap}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[10px] sm:text-[11px] font-black border border-white/70 dark:border-slate-600/80 bg-white/95 dark:bg-slate-900/90 backdrop-blur text-slate-700 dark:text-slate-200 shadow-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5" />
            {isAr ? 'خرائط جوجل' : 'Google Maps'}
          </button>
          {pinned ? (
            <span className="ms-auto pointer-events-none inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-mono font-bold bg-slate-900/70 text-white tabular-nums backdrop-blur">
              {geo!.lat.toFixed(5)}, {geo!.lng.toFixed(5)}
            </span>
          ) : null}
        </div>

        {!pinned ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 via-slate-950/35 to-transparent px-3 py-3 pointer-events-none z-10">
            <p className="text-[10px] sm:text-[11px] font-bold text-white leading-snug">
              {isAr
                ? interactive
                  ? 'اكتب العنوان أعلاه أو اضغط على الخريطة لوضع الدبوس داخل السعودية'
                  : 'اكتب عنواناً سعودياً أو استخدم موقعك الحالي'
                : interactive
                  ? 'Type above or tap the map to drop a pin inside Saudi Arabia'
                  : 'Type a Saudi address or use your live location'}
            </p>
          </div>
        ) : (
          <div className="absolute inset-x-2 bottom-2 z-10 pointer-events-none">
            <div className="rounded-xl bg-white/95 dark:bg-slate-900/92 backdrop-blur border border-teal-200/60 dark:border-teal-800/50 shadow-lg px-3 py-2 flex items-start gap-2">
              <span className="mt-0.5 w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase tracking-wide">
                  {isAr ? 'تم تثبيت الموقع' : 'Pin set'}
                </p>
                <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 leading-snug truncate">
                  {query ||
                    (isAr ? 'موقع داخل المملكة العربية السعودية' : 'Location inside Saudi Arabia')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaudiGoogleMapPicker;
