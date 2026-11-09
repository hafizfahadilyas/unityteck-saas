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

const ACCENT_STYLES: Record<
  ModernSegmentedAccent,
  { activeBg: string; activeShadow: string; badgeActive: string; badgeIdle: string }
> = {
  portal: {
    activeBg: 'var(--portal-cta)',
    activeShadow: '0 6px 16px -8px color-mix(in srgb, var(--portal-cta) 55%, transparent)',
    badgeActive: 'bg-white/20 text-white',
    badgeIdle: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  blue: {
    activeBg: '#2563eb',
    activeShadow: '0 6px 16px -8px rgba(37,99,235,0.55)',
    badgeActive: 'bg-white/20 text-white',
    badgeIdle: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  emerald: {
    activeBg: '#059669',
    activeShadow: '0 6px 16px -8px rgba(5,150,105,0.55)',
    badgeActive: 'bg-white/20 text-white',
    badgeIdle: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  teal: {
    activeBg: '#0d9488',
    activeShadow: '0 6px 16px -8px rgba(13,148,136,0.55)',
    badgeActive: 'bg-white/20 text-white',
    badgeIdle: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  },
  indigo: {
    activeBg: '#4f46e5',
    activeShadow: '0 6px 16px -8px rgba(79,70,229,0.55)',
    badgeActive: 'bg-white/20 text-white',
    badgeIdle: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  },
  rose: {
    activeBg: '#e11d48',
    activeShadow: '0 6px 16px -8px rgba(225,29,72,0.55)',
    badgeActive: 'bg-white/20 text-white',
    badgeIdle: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  },
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
            } ${
              active
                ? 'text-white scale-[1.02]'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 opacity-85 hover:opacity-100'
            }`}
            style={
              active
                ? {
                    background: tone.activeBg,
                    boxShadow: `${tone.activeShadow}, inset 0 1px 0 rgba(255,255,255,0.22)`,
                  }
                : { background: 'transparent' }
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
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40'
                }`}
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
