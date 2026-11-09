import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_SAUDI_CITIES,
  emptySaudiCityCatalog,
  loadSaudiCityCatalog,
  resolveSaudiCities,
  saveSaudiCityCatalog,
  type SaudiCityCatalogState,
  type SaudiCityOption,
} from '../data/saudiCities';

function slugCityId(raw: string): string {
  const base = raw
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 64);
  if (!base) return '';
  // Prefer Latin slug when present; otherwise keep Unicode id for Arabic-only names
  const latin = base
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return latin || base;
}

/**
 * Store-scoped Saudi city options with add / remove.
 * Built-in catalog + merchant custom cities (per store_id).
 */
export function useSaudiCityOptions(storeId: string | undefined | null) {
  const sid = storeId || '';
  const [catalog, setCatalog] = useState<SaudiCityCatalogState>(() =>
    sid ? loadSaudiCityCatalog(sid) : emptySaudiCityCatalog(),
  );

  useEffect(() => {
    setCatalog(sid ? loadSaudiCityCatalog(sid) : emptySaudiCityCatalog());
  }, [sid]);

  const persist = useCallback(
    (next: SaudiCityCatalogState) => {
      setCatalog(next);
      if (sid) saveSaudiCityCatalog(sid, next);
    },
    [sid],
  );

  const cities = useMemo(() => resolveSaudiCities(catalog), [catalog]);

  const addCity = useCallback(
    (input: { nameEn: string; nameAr?: string; id?: string }) => {
      const nameEn = input.nameEn.trim();
      const nameAr = (input.nameAr || input.nameEn).trim();
      if (!nameEn && !nameAr) return false;
      const id = (input.id || slugCityId(nameEn || nameAr)).trim();
      if (!id) return false;

      const allIds = new Set(
        [...DEFAULT_SAUDI_CITIES, ...catalog.custom].map((c) => c.id.toLowerCase()),
      );
      if (allIds.has(id.toLowerCase())) {
        // Re-enable if it was removed from defaults
        if (catalog.removedIds.includes(id) || catalog.removedIds.some((r) => r.toLowerCase() === id.toLowerCase())) {
          persist({
            ...catalog,
            removedIds: catalog.removedIds.filter((r) => r.toLowerCase() !== id.toLowerCase()),
          });
          return true;
        }
        return false;
      }

      const option: SaudiCityOption = {
        id,
        nameEn: nameEn || nameAr,
        nameAr: nameAr || nameEn,
      };
      persist({ ...catalog, custom: [...catalog.custom, option] });
      return true;
    },
    [catalog, persist],
  );

  const removeCity = useCallback(
    (cityId: string) => {
      const id = cityId.trim();
      if (!id) return;
      const isDefault = DEFAULT_SAUDI_CITIES.some((c) => c.id === id);
      if (isDefault) {
        if (catalog.removedIds.includes(id)) return;
        persist({ ...catalog, removedIds: [...catalog.removedIds, id] });
        return;
      }
      persist({
        ...catalog,
        custom: catalog.custom.filter((c) => c.id !== id),
      });
    },
    [catalog, persist],
  );

  const resetCities = useCallback(() => {
    persist(emptySaudiCityCatalog());
  }, [persist]);

  return {
    cities,
    catalog,
    addCity,
    removeCity,
    resetCities,
    defaultCount: DEFAULT_SAUDI_CITIES.length,
  };
}
