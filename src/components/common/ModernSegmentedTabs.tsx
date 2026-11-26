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
 * Opaque track + explicit active/idle ink so dark-shell wallpaper never
 * washes Holst CTA labels (white-on-teal / dark-on-frost).
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
      data-u-segmented-tabs="true"
      className={`u-segmented-tabs p-1.5 rounded-2xl border flex flex-wrap sm:flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-none font-bold min-w-0 ${
        fullWidth ? 'w-full' : 'w-full sm:w-auto'
      } ${text} ${className}`}
      style={{
        background: '#ffffff',
        backgroundColor: '#ffffff',
        borderColor: 'var(--border)',
        color: '#0f172a',
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
            data-u-segmented-tab={active ? 'active' : 'idle'}
            disabled={tab.disabled}
            onClick={() => {
              if (!tab.disabled) onChange(tab.id);
            }}
            className={`u-segmented-tab ${pad} rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
              fullWidth ? 'flex-1' : ''
            } ${active ? 'u-segmented-tab--active scale-[1.02]' : 'u-segmented-tab--idle hover:opacity-100'}`}
            style={
              active
                ? {
                    background: tone.activeBg,
                    backgroundColor: 'var(--portal-600, #1d8b94)',
                    boxShadow: `${tone.activeShadow}, inset 0 1px 0 rgba(255,255,255,0.22)`,
                    color: '#ffffff',
                  }
                : { background: 'transparent', color: '#334155' }
            }
          >
            {Icon ? <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden /> : null}
            <span className="truncate">{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && tab.count !== '' ? (
              <span
                className={`u-segmented-tab__count text-[10px] px-1.5 py-0.5 rounded-full font-black leading-none ${
                  active ? 'bg-white/20' : ''
                }`}
              >
                {tab.count}
              </span>
            ) : null}
            {tab.badge ? (
              <span
                className={`u-segmented-tab__badge text-[9px] px-1.5 py-0.5 rounded-md font-bold leading-none ${
                  active ? 'bg-white/20' : ''
                }`}
                style={
                  active
                    ? { color: '#ffffff' }
                    : {
                        background: 'color-mix(in srgb, var(--accent) 12%, #ffffff)',
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
