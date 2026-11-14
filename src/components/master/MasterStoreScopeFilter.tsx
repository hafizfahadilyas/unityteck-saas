import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, Store as StoreIcon, X } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { getStoreDisplayName } from '../../utils/storeLocalization';
import type { Store } from '../../types';

export type MasterStoreScopeValue = 'all' | string;

export type MasterStoreScopeFilterProps = {
  value: MasterStoreScopeValue;
  onChange: (storeId: MasterStoreScopeValue) => void;
  /** Optional store status chip filter (narrows the dropdown list). */
  statusFilter?: 'all' | Store['status'];
  onStatusFilterChange?: (status: 'all' | Store['status']) => void;
  showStatusChips?: boolean;
  className?: string;
  /** Compact trigger for dense toolbars. */
  compact?: boolean;
};

const STATUS_OPTS: Array<'all' | Store['status']> = ['all', 'active', 'pending', 'suspended'];

/**
 * Searchable store scope for Master pages — scales to 100+ tenants.
 * Value `all` = platform-wide; otherwise exact `store_id`.
 */
export const MasterStoreScopeFilter: React.FC<MasterStoreScopeFilterProps> = ({
  value,
  onChange,
  statusFilter = 'all',
  onStatusFilterChange,
  showStatusChips = true,
  className = '',
  compact = false,
}) => {
  const { stores } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ('');
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return stores
      .filter((s) => (statusFilter === 'all' ? true : s.status === statusFilter))
      .filter((s) => {
        if (!needle) return true;
        const name = getStoreDisplayName(s, locale).toLowerCase();
        const hay = [
          name,
          s.id,
          s.slug,
          s.ownerEmail,
          s.domain,
          s.custom_domain,
          s.plan,
          s.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) =>
        getStoreDisplayName(a, locale).localeCompare(getStoreDisplayName(b, locale), locale),
      );
  }, [stores, statusFilter, q, locale]);

  const selectedLabel =
    value === 'all'
      ? isAr
        ? 'جميع المتاجر'
        : 'All stores'
      : (() => {
          const hit = stores.find((s) => s.id === value);
          return hit ? getStoreDisplayName(hit, locale) : value;
        })();

  const statusLabel = (s: 'all' | Store['status']) => {
    if (s === 'all') return isAr ? 'الكل' : 'All';
    if (s === 'active') return isAr ? 'نشط' : 'Active';
    if (s === 'pending') return isAr ? 'قيد المراجعة' : 'Pending';
    return isAr ? 'موقوف' : 'Suspended';
  };

  const ctrlStyle: React.CSSProperties = {
    background: 'var(--surface)',
    borderColor: 'var(--border)',
    color: 'var(--text)',
    fontFamily: 'var(--font-ui)',
    borderRadius: 'var(--radius-ctrl, 0.75rem)',
  };

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex flex-col gap-1.5 min-w-0 ${className}`.trim()}
      data-master-store-scope="1"
    >
      {showStatusChips && onStatusFilterChange ? (
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label={isAr ? 'حالة المتجر' : 'Store status'}>
          {STATUS_OPTS.map((s) => {
            const on = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onStatusFilterChange(s)}
                className="px-2.5 py-1 text-[10px] font-bold border transition-colors"
                style={{
                  ...ctrlStyle,
                  background: on
                    ? 'color-mix(in srgb, var(--accent) 14%, var(--surface))'
                    : 'var(--surface)',
                  borderColor: on ? 'var(--accent)' : 'var(--border)',
                  color: on ? 'var(--accent)' : 'var(--muted)',
                }}
              >
                {statusLabel(s)}
              </button>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`inline-flex items-center gap-2 border shadow-xs cursor-pointer text-start ${
          compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'
        } font-bold min-w-[12rem] max-w-[20rem]`}
        style={ctrlStyle}
      >
        <StoreIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden />
        <span className="truncate flex-1">{selectedLabel}</span>
        <span
          className="text-[10px] font-extrabold tabular-nums px-1.5 py-0.5 rounded-full shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
            color: 'var(--accent)',
          }}
        >
          {stores.length}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open ? (
        <div
          className="absolute z-50 top-full mt-1 start-0 w-[min(22rem,calc(100vw-2rem))] border shadow-lg overflow-hidden"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius-ctrl, 0.75rem)',
            fontFamily: 'var(--font-ui)',
          }}
          role="listbox"
          aria-label={isAr ? 'اختيار متجر' : 'Select store'}
        >
          <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ insetInlineStart: 10, color: 'var(--muted)' }}
                aria-hidden
              />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم أو المعرف أو البريد…' : 'Search name, id, email…'}
                className="w-full text-xs py-2 border bg-transparent"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                  borderRadius: '0.65rem',
                  paddingInlineStart: 32,
                  paddingInlineEnd: q ? 28 : 10,
                }}
              />
              {q ? (
                <button
                  type="button"
                  className="absolute top-1/2 -translate-y-1/2 p-0.5"
                  style={{ insetInlineEnd: 8, color: 'var(--muted)' }}
                  onClick={() => setQ('')}
                  aria-label={isAr ? 'مسح' : 'Clear'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto custom-scroll py-1">
            <button
              type="button"
              role="option"
              aria-selected={value === 'all'}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-start hover:opacity-95"
              style={{
                background:
                  value === 'all'
                    ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                    : 'transparent',
                color: 'var(--text)',
              }}
              onClick={() => {
                onChange('all');
                setOpen(false);
              }}
            >
              <span className="flex-1 truncate">{isAr ? 'جميع المتاجر (المنصة)' : 'All stores (platform)'}</span>
              {value === 'all' ? <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} /> : null}
            </button>

            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-[11px]" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد متاجر مطابقة' : 'No matching stores'}
              </p>
            ) : (
              filtered.map((s) => {
                const label = getStoreDisplayName(s, locale);
                const selected = value === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-start"
                    style={{
                      background: selected
                        ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                        : 'transparent',
                      color: 'var(--text)',
                    }}
                    onClick={() => {
                      onChange(s.id);
                      setOpen(false);
                    }}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold truncate">{label}</span>
                      <span className="block text-[10px] truncate" style={{ color: 'var(--muted)' }}>
                        {s.id} · {s.plan} · {statusLabel(s.status)}
                      </span>
                    </span>
                    {selected ? <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
