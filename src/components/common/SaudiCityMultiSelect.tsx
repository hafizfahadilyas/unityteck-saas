import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import {
  cityLabel,
  findSaudiCityOption,
  type SaudiCityOption,
} from '../../data/saudiCities';
import { FloatingPopover } from './FloatingPopover';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  cities: SaudiCityOption[];
  isAr: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  preferBelow?: boolean;
};

function uniqueIds(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values || []) {
    const id = String(raw || '').trim();
    if (!id) continue;
    const key = id.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(id);
  }
  return out;
}

/**
 * Multi-select Saudi city picker with checkboxes (delivery areas, targeting, etc.).
 * Portal-based — safe inside modals / overflow containers.
 */
export const SaudiCityMultiSelect: React.FC<Props> = ({
  value,
  onChange,
  cities,
  isAr,
  disabled,
  className = 'w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-[var(--input-bg)] text-[var(--input-fg)] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--accent)]',
  placeholder,
  preferBelow = true,
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(() => uniqueIds(value), [value]);

  const normalizedCities = useMemo(() => {
    const seen = new Set<string>();
    const out: SaudiCityOption[] = [];
    for (const c of cities || []) {
      if (!c?.id) continue;
      const key = c.id.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  }, [cities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedCities;
    return normalizedCities.filter((c) => {
      const en = String(c.nameEn || '').toLowerCase();
      const ar = String(c.nameAr || '').toLowerCase();
      const id = String(c.id || '').toLowerCase();
      return en.includes(q) || ar.includes(q) || id.includes(q);
    });
  }, [normalizedCities, query]);

  const selectedLabels = useMemo(() => {
    return selected.map((id) => {
      const hit = findSaudiCityOption(id, normalizedCities);
      return hit ? cityLabel(hit, isAr) : id;
    });
  }, [selected, normalizedCities, isAr]);

  const triggerText = useMemo(() => {
    if (selected.length === 0) {
      return placeholder || (isAr ? 'اختر المدن' : 'Select cities');
    }
    if (selected.length === 1) return selectedLabels[0];
    if (selected.length === 2) return selectedLabels.join(isAr ? '، ' : ', ');
    return isAr
      ? `${selected.length} مدن مختارة`
      : `${selected.length} cities selected`;
  }, [selected, selectedLabels, isAr, placeholder]);

  const allSelected =
    normalizedCities.length > 0 && selected.length >= normalizedCities.length;

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const toggle = (cityId: string) => {
    const key = cityId.toLowerCase();
    const exists = selected.some((s) => s.toLowerCase() === key);
    if (exists) {
      onChange(selected.filter((s) => s.toLowerCase() !== key));
    } else {
      onChange([...selected, cityId]);
    }
  };

  const selectAll = () => {
    onChange(normalizedCities.map((c) => c.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  const removeChip = (cityId: string) => {
    const key = cityId.toLowerCase();
    onChange(selected.filter((s) => s.toLowerCase() !== key));
  };

  const listEstimate = Math.min(56 + filtered.length * 36 + 48, 420);

  return (
    <div className="relative w-full min-w-0 space-y-2">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-multiselectable
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className={`${className} min-h-[2.5rem] flex items-center justify-between gap-2 text-start cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`.trim()}
      >
        <span
          className="truncate"
          style={{ color: selected.length ? 'var(--input-fg)' : 'var(--muted)' }}
        >
          {triggerText}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--muted)' }}
        />
      </button>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.slice(0, 8).map((id) => {
            const hit = findSaudiCityOption(id, normalizedCities);
            const label = hit ? cityLabel(hit, isAr) : id;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 max-w-full px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                style={{
                  borderColor: 'var(--border)',
                  background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
                  color: 'var(--text)',
                }}
              >
                <span className="truncate">{label}</span>
                {!disabled ? (
                  <button
                    type="button"
                    aria-label={isAr ? `إزالة ${label}` : `Remove ${label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeChip(id);
                    }}
                    className="shrink-0 rounded p-0.5 hover:opacity-80 cursor-pointer"
                    style={{ color: 'var(--muted)' }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : null}
              </span>
            );
          })}
          {selected.length > 8 ? (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold"
              style={{ color: 'var(--muted)' }}
            >
              +{selected.length - 8}
            </span>
          ) : null}
        </div>
      ) : null}

      <FloatingPopover
        open={open && !disabled}
        anchorRef={triggerRef}
        onClose={close}
        width={Math.max(280, triggerRef.current?.offsetWidth || 300)}
        align={isAr ? 'end' : 'start'}
        estimatedHeight={listEstimate}
        preferBelow={preferBelow}
        className="rounded-xl shadow-xl p-2 text-xs"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          overflowY: 'hidden',
          overflowX: 'hidden',
        }}
      >
        <div className="flex flex-col gap-2 min-h-0 max-h-full">
          <div className="relative shrink-0">
            <Search
              className={`w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-2.5' : 'left-2.5'}`}
              style={{ color: 'var(--muted)' }}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAr ? 'بحث عن مدينة…' : 'Search city…'}
              className={`w-full py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 ${isAr ? 'pr-8 pl-2' : 'pl-8 pr-2'}`}
              style={{
                borderColor: 'var(--border)',
                background: 'var(--input-bg)',
                color: 'var(--input-fg)',
              }}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between gap-2 shrink-0 px-0.5">
            <button
              type="button"
              onClick={allSelected ? clearAll : selectAll}
              className="text-[11px] font-bold cursor-pointer hover:opacity-80"
              style={{ color: 'var(--accent)' }}
            >
              {allSelected
                ? isAr
                  ? 'مسح الكل'
                  : 'Clear all'
                : isAr
                  ? 'تحديد الكل'
                  : 'Select all'}
            </button>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
              {isAr
                ? `${selected.length} محددةارة`
                : `${selected.length} selected`}
            </span>
          </div>

          <div
            className="overflow-y-auto min-h-0 space-y-0.5 pr-0.5"
            role="listbox"
            aria-multiselectable="true"
            style={{ maxHeight: 280 }}
          >
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد نتائج' : 'No cities found'}
              </div>
            ) : (
              filtered.map((c) => {
                const on = selected.some((s) => s.toLowerCase() === c.id.toLowerCase());
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => toggle(c.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-start cursor-pointer transition-colors ${
                      on ? '' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                    style={
                      on
                        ? {
                            background:
                              'color-mix(in srgb, var(--accent) 12%, transparent)',
                          }
                        : undefined
                    }
                  >
                    <span
                      className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                      style={{
                        borderColor: on ? 'var(--accent)' : 'var(--border)',
                        background: on ? 'var(--accent)' : 'var(--input-bg)',
                      }}
                    >
                      {on ? <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} /> : null}
                    </span>
                    <span className="truncate font-semibold text-[var(--text)]">
                      {cityLabel(c, isAr)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </FloatingPopover>
    </div>
  );
};

/** Map legacy driver service_area tokens → catalog city ids. */
export function normalizeDriverServiceAreas(
  raw: string[] | null | undefined,
  cities: SaudiCityOption[],
): string[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (id: string) => {
    const key = id.toLowerCase();
    if (!id || seen.has(key)) return;
    seen.add(key);
    out.push(id);
  };

  for (const item of raw) {
    const key = String(item || '').trim();
    if (!key) continue;
    const lower = key.toLowerCase();

    if (lower === 'all_saudi' || lower === 'all saudi arabia' || lower === 'كل السعودية') {
      cities.forEach((c) => push(c.id));
      continue;
    }
    // Legacy non-city tokens — skip (merchant re-picks cities)
    if (lower === 'makkah_outside' || lower === 'outside makkah' || lower === 'خارج مكة') {
      continue;
    }

    const hit = findSaudiCityOption(key, cities);
    if (hit) {
      push(hit.id);
      continue;
    }
    push(key);
  }

  return out;
}
