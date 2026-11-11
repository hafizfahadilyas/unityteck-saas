import React from 'react';

export type ModernSegmentedTabItem<T extends string = string> = {
  id: T;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  count?: number | string;
  disabled?: boolean;
};

export type ModernSegmentedAccent = 'portal' | 'blue' | 'emerald' | 'teal' | 'indigo' | 'rose';

/** Global Holst only — no blue/emerald/indigo one-off brand accents on toggles. */
const PORTAL_ACCENT = {
  activeBg: 'var(--portal-cta)',
  activeShadow: '0 6px 16px -8px color-mix(in srgb, var(--portal-cta) 55%, transparent)',
  badgeActive: 'bg-white/20 text-white',
  badgeIdle: 'text-[color:var(--muted)]',
};

const ACCENT_STYLES: Record<
  ModernSegmentedAccent,
  { activeBg: string; activeShadow: string; badgeActive: string; badgeIdle: string }
> = {
  portal: PORTAL_ACCENT,
  blue: PORTAL_ACCENT,
  emerald: PORTAL_ACCENT,
  teal: PORTAL_ACCENT,
  indigo: PORTAL_ACCENT,
  rose: PORTAL_ACCENT,
};

export interface ModernSegmentedTabsProps<T extends string = string> {
  items: ModernSegmentedTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  accent?: ModernSegmentedAccent;
  className?: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  'aria-label'?: string;
}

/**
 * Platform-wide modern toggle / segmented tab control.
 * Use for page sub-nav — never plain underline text links.
 */
export function ModernSegmentedTabs<T extends string = string>({
  items,
  value,
  onChange,
  accent = 'portal',
  className = '',
  size = 'md',
  fullWidth = false,
  'aria-label': ariaLabel,
}: ModernSegmentedTabsProps<T>) {
  const tone = ACCENT_STYLES[accent] ?? ACCENT_STYLES.portal;
  const pad = size === 'sm' ? 'px-3 py-1.5' : 'px-3.5 py-2';
  const text = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`p-1.5 rounded-2xl border flex items-center gap-1.5 overflow-x-auto scrollbar-none font-bold ${
        fullWidth ? 'w-full' : 'w-full sm:w-auto'
      } ${text} ${className}`}
      style={{
        background: 'color-mix(in srgb, var(--surface) 92%, var(--border))',
        borderColor: 'var(--border)',
        boxShadow: 'inset 0 1px 0 color-mix(in srgb, #fff 40%, transparent)',
      }}
    >
      {items.map((tab) => {
        const active = value === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={tab.disabled}
            onClick={() => {
              if (!tab.disabled) onChange(tab.id);
            }}
            className={`${pad} rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
              fullWidth ? 'flex-1' : ''
            } ${active ? 'text-white scale-[1.02]' : 'opacity-85 hover:opacity-100'}`}
            style={
              active
                ? {
                    background: tone.activeBg,
                    boxShadow: `${tone.activeShadow}, inset 0 1px 0 rgba(255,255,255,0.22)`,
                    color: '#fff',
                  }
                : { background: 'transparent', color: 'var(--muted)' }
            }
          >
            {Icon ? <Icon className="w-3.5 h-3.5 shrink-0" /> : null}
            <span className="truncate">{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && tab.count !== '' ? (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-black leading-none ${
                  active ? tone.badgeActive : tone.badgeIdle
                }`}
              >
                {tab.count}
              </span>
            ) : null}
            {tab.badge ? (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold leading-none ${
                  active ? 'bg-white/20 text-white' : ''
                }`}
                style={
                  active
                    ? undefined
                    : {
                        background: 'color-mix(in srgb, var(--accent) 12%, var(--surface))',
                        color: 'var(--accent)',
                        border: '1px solid color-mix(in srgb, var(--accent) 22%, var(--border))',
                      }
                }
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default ModernSegmentedTabs;
