import React, { useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Search, Trash2, X } from 'lucide-react';
import {
  cityLabel,
  findSaudiCityOption,
  saudiCitiesEquivalent,
  type SaudiCityOption,
} from '../../data/saudiCities';
import { FloatingPopover } from './FloatingPopover';

type SaudiCitySelectProps = {
  value: string;
  onChange: (cityId: string) => void;
  cities: SaudiCityOption[];
  isAr: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  includeAllOption?: boolean;
  allLabel?: string;
  placeholder?: string;
  /** Show compact add/remove controls under the select */
  manageEnabled?: boolean;
  onAddCity?: (nameEn: string, nameAr: string) => boolean;
  onRemoveCity?: (cityId: string) => void;
  /** Keep list under the trigger (modal-safe). Default true. */
  preferBelow?: boolean;
};

/**
 * Portal-based Saudi city picker — never clipped by overflow / never overlaps siblings.
 * Built-in catalog + optional add/remove for the active store.
 */
export const SaudiCitySelect: React.FC<SaudiCitySelectProps> = ({
  value,
  onChange,
  cities,
  isAr,
  disabled,
  required,
  className = 'w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--input-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]',
  includeAllOption,
  allLabel,
  placeholder,
  manageEnabled,
  onAddCity,
  onRemoveCity,
  preferBelow = true,
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [query, setQuery] = useState('');
  const [newEn, setNewEn] = useState('');
  const [newAr, setNewAr] = useState('');
  const listEstimate = Math.min(16 + (includeAllOption ? 1 : 0) * 40 + cities.length * 40 + (manageEnabled ? 56 : 0), 520);

  const selectedLabel = useMemo(() => {
    if (includeAllOption && value === 'All') {
      return allLabel || (isAr ? 'الكل' : 'All');
    }
    const hit = findSaudiCityOption(value, cities);
    if (hit) return cityLabel(hit, isAr);
    if (value) return value;
    return placeholder || (isAr ? 'اختر المدينة' : 'Select city');
  }, [allLabel, cities, includeAllOption, isAr, placeholder, value]);

  const hasSelection = Boolean(value) && !(value === '' && !includeAllOption);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => {
      const en = String(c?.nameEn || '').toLowerCase();
      const ar = String(c?.nameAr || '').toLowerCase();
      const id = String(c?.id || '').toLowerCase();
      return en.includes(q) || ar.includes(q) || id.includes(q);
    });
  }, [cities, query]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddCity) return;
    const en = newEn.trim() || newAr.trim();
    const ar = newAr.trim() || newEn.trim();
    if (!en && !ar) return;
    const ok = onAddCity(en, ar);
    if (ok) {
      // Match useSaudiCityOptions slug so the new city is selected immediately
      const latin = en
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      const id = (latin || en || ar).slice(0, 64);
      if (id) onChange(id);
      setNewEn('');
      setNewAr('');
      setManaging(false);
      setQuery('');
    }
  };

  const close = () => {
    setOpen(false);
    setQuery('');
    setManaging(false);
  };

  return (
    <div className="relative z-10 space-y-1.5 w-full min-w-0">
      {/* Keep native select for form required / accessibility fallback (visually hidden) */}
      {required ? (
        <select
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => undefined}
          className="sr-only"
        >
          <option value="">{placeholder || ''}</option>
          {includeAllOption ? <option value="All">{allLabel || 'All'}</option> : null}
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {cityLabel(c, isAr)}
            </option>
          ))}
        </select>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className={`${className} min-h-[2.25rem] flex items-center justify-between gap-2 text-start cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed`.trim()}
      >
        <span
          className="truncate"
          style={{ color: hasSelection ? 'var(--input-fg)' : 'var(--muted)' }}
        >
          {selectedLabel}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--muted)' }}
        />
      </button>

      <FloatingPopover
        open={open && !disabled}
        anchorRef={triggerRef}
        onClose={close}
        width={Math.max(260, triggerRef.current?.offsetWidth || 280)}
        align={isAr ? 'end' : 'start'}
        estimatedHeight={listEstimate}
        preferBelow={preferBelow}
        className="rounded-xl shadow-xl p-2 text-xs"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        <div className="space-y-2">
          <div className="relative">
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

          {manageEnabled && onAddCity ? (
            managing ? (
              <form
                onSubmit={handleAdd}
                className="grid grid-cols-1 gap-1.5 rounded-lg border border-dashed p-2"
                style={{ borderColor: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}
              >
                <input
                  type="text"
                  value={newEn}
                  onChange={(e) => setNewEn(e.target.value)}
                  placeholder={isAr ? 'الاسم بالإنجليزية' : 'English name'}
                  className="px-2 py-1.5 text-[11px] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--input-bg)',
                    color: 'var(--input-fg)',
                  }}
                  autoFocus
                />
                <input
                  type="text"
                  value={newAr}
                  onChange={(e) => setNewAr(e.target.value)}
                  placeholder={isAr ? 'الاسم بالعربية' : 'Arabic name'}
                  className="px-2 py-1.5 text-[11px] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--input-bg)',
                    color: 'var(--input-fg)',
                  }}
                  dir="rtl"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="submit"
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-[11px] font-semibold unity-btn-primary"
                  >
                    <Plus className="w-3 h-3" />
                    {isAr ? 'إضافة' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManaging(false);
                      setNewEn('');
                      setNewAr('');
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold hover:opacity-80"
                    style={{ color: 'var(--muted)' }}
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setManaging(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-dashed text-[11px] font-semibold hover:opacity-90"
                style={{
                  borderColor: 'var(--accent)',
                  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                {isAr ? 'إضافة مدينة جديدة' : 'Add new city'}
              </button>
            )
          ) : null}

          <ul
            role="listbox"
            className="u-dropdown-list rounded-lg border divide-y"
            style={{ borderColor: 'var(--border)' }}
          >
            {includeAllOption ? (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === 'All'}
                  onClick={() => {
                    onChange('All');
                    close();
                  }}
                  className="w-full px-2.5 py-2 flex items-center justify-between gap-2 text-start"
                  style={
                    value === 'All'
                      ? {
                          background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                          color: 'var(--accent)',
                          fontWeight: 600,
                        }
                      : { color: 'var(--text)' }
                  }
                >
                  <span>{allLabel || (isAr ? 'الكل' : 'All')}</span>
                  {value === 'All' ? <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} /> : null}
                </button>
              </li>
            ) : null}

            {filtered.length === 0 ? (
              <li className="px-2.5 py-3 text-center" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد مدن مطابقة' : 'No matching cities'}
              </li>
            ) : (
              filtered.map((c) => {
                const selected = saudiCitiesEquivalent(value, c.id, cities);
                return (
                  <li key={c.id}>
                    <div
                      className="flex items-center gap-1"
                      style={
                        selected
                          ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          onChange(c.id);
                          close();
                        }}
                        className="flex-1 min-w-0 px-2.5 py-2 text-start hover:opacity-90"
                        style={
                          selected
                            ? { color: 'var(--accent)', fontWeight: 600 }
                            : { color: 'var(--text)' }
                        }
                      >
                        <span className="truncate block">{cityLabel(c, isAr)}</span>
                      </button>
                      {selected ? (
                        <Check className="w-3.5 h-3.5 shrink-0 me-1" style={{ color: 'var(--accent)' }} />
                      ) : null}
                      {manageEnabled && onRemoveCity ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveCity(c.id);
                            if (value === c.id) {
                              const next = cities.find((x) => x.id !== c.id);
                              onChange(includeAllOption ? 'All' : next?.id || '');
                            }
                          }}
                          className="p-1.5 me-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                          title={isAr ? 'حذف المدينة' : 'Remove city'}
                          aria-label={isAr ? 'حذف المدينة' : 'Remove city'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })
            )}

            {value &&
            value !== 'All' &&
            !cities.some((c) => c.id === value) ? (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected
                  onClick={() => close()}
                  className="w-full px-2.5 py-2 text-start font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200"
                >
                  {value}
                </button>
              </li>
            ) : null}
          </ul>

          <button
            type="button"
            onClick={close}
            className="inline-flex items-center gap-1 text-[10px] hover:opacity-80"
            style={{ color: 'var(--muted)' }}
          >
            <X className="w-3 h-3" />
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </FloatingPopover>
    </div>
  );
};
