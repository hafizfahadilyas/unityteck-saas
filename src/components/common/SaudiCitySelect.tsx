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
  className = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]',
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => {
      const en = c.nameEn.toLowerCase();
      const ar = c.nameAr.toLowerCase();
      const id = c.id.toLowerCase();
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
        <span className={`truncate ${!value || (value === '' && !includeAllOption) ? 'text-slate-400' : ''}`}>
          {selectedLabel}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <FloatingPopover
        open={open && !disabled}
        anchorRef={triggerRef}
        onClose={close}
        width={Math.max(260, triggerRef.current?.offsetWidth || 280)}
        align={isAr ? 'end' : 'start'}
        estimatedHeight={listEstimate}
        preferBelow={preferBelow}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 text-xs"
      >
        <div className="space-y-2">
          <div className="relative">
            <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-2.5' : 'left-2.5'}`} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAr ? 'بحث عن مدينة…' : 'Search city…'}
              className={`w-full py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${isAr ? 'pr-8 pl-2' : 'pl-8 pr-2'}`}
              autoFocus
            />
          </div>

          {manageEnabled && onAddCity ? (
            <button
              type="button"
              onClick={() => setManaging(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-[11px] font-semibold hover:bg-blue-100 dark:hover:bg-blue-950/50"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAr ? 'إضافة مدينة جديدة' : 'Add new city'}
            </button>
          ) : null}

          <ul
            role="listbox"
            className="u-dropdown-list rounded-lg border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800"
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
                  className={`w-full px-2.5 py-2 flex items-center justify-between gap-2 text-start hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    value === 'All' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>{allLabel || (isAr ? 'الكل' : 'All')}</span>
                  {value === 'All' ? <Check className="w-3.5 h-3.5 shrink-0" /> : null}
                </button>
              </li>
            ) : null}

            {filtered.length === 0 ? (
              <li className="px-2.5 py-3 text-slate-400 text-center">
                {isAr ? 'لا توجد مدن مطابقة' : 'No matching cities'}
              </li>
            ) : (
              filtered.map((c) => {
                const selected = saudiCitiesEquivalent(value, c.id, cities);
                return (
                  <li key={c.id}>
                    <div
                      className={`flex items-center gap-1 ${
                        selected ? 'bg-blue-50 dark:bg-blue-950/40' : ''
                      }`}
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          onChange(c.id);
                          close();
                        }}
                        className={`flex-1 min-w-0 px-2.5 py-2 text-start hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          selected
                            ? 'text-blue-700 dark:text-blue-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span className="truncate block">{cityLabel(c, isAr)}</span>
                      </button>
                      {selected ? <Check className="w-3.5 h-3.5 shrink-0 text-blue-600 me-2" /> : null}
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
                  className="w-full px-2.5 py-2 text-start bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 font-semibold"
                >
                  {value}
                </button>
              </li>
            ) : null}
          </ul>

          {manageEnabled && onAddCity && managing ? (
            <form
              onSubmit={handleAdd}
              className="grid grid-cols-1 gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-2"
            >
              <input
                type="text"
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                placeholder={isAr ? 'الاسم بالإنجليزية' : 'English name'}
                className="px-2 py-1.5 text-[11px] border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                autoFocus
              />
              <input
                type="text"
                value={newAr}
                onChange={(e) => setNewAr(e.target.value)}
                placeholder={isAr ? 'الاسم بالعربية' : 'Arabic name'}
                className="px-2 py-1.5 text-[11px] border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                dir="rtl"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700"
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
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          ) : null}

          <button
            type="button"
            onClick={close}
            className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700"
          >
            <X className="w-3 h-3" />
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </FloatingPopover>
    </div>
  );
};
