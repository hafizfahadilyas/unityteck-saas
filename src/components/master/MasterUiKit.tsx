import React from 'react';

type Tab = { id: string; label: string };

/** Phase 1 pill tabs — Holst luxury chrome, RTL-safe, mobile scroll. */
export const MasterTabPills: React.FC<{
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}> = ({ tabs, active, onChange, className = '' }) => (
  <div
    className={`flex flex-nowrap sm:flex-wrap gap-2 overflow-x-auto overscroll-x-contain pb-1 -mx-1 px-1 custom-scroll ${className}`.trim()}
    role="tablist"
  >
    {tabs.map((t) => {
      const isOn = active === t.id;
      return (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={isOn}
          onClick={() => onChange(t.id)}
          className={`unity-tab-pill text-xs font-bold whitespace-nowrap shrink-0 ${isOn ? 'is-active' : ''}`}
        >
          {t.label}
        </button>
      );
    })}
  </div>
);

type LuxePanelProps = {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'md' | 'lg' | 'none';
  as?: 'div' | 'section' | 'article';
};

/** Shared content card — hover + readable text on master Phase 1 pages. */
export const MasterLuxePanel: React.FC<LuxePanelProps> = ({
  children,
  className = '',
  interactive = false,
  padding = 'md',
  as: Tag = 'div',
}) => (
  <Tag
    className={[
      'u-luxe-panel',
      interactive ? 'u-luxe-panel--interactive' : '',
      padding === 'lg' ? 'u-luxe-panel--lg' : '',
      padding === 'none' ? 'u-luxe-panel--flush' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    style={{ fontFamily: 'var(--font-ui)', color: 'var(--text)' }}
  >
    {children}
  </Tag>
);

export const MasterMetaLine: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <p className={`unity-meta-line mt-2 ${className}`.trim()}>{children}</p>
);

/** Ghost / secondary actions (refresh, filters) with consistent hover. */
export const masterGhostBtnClass = 'unity-btn-ghost text-sm inline-flex items-center gap-1.5';

/** Responsive KPI row — 2 cols phone → 3 tablet → 4–6 desktop (100+ store dashboards). */
export const MasterKpiGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** 4 = plans/services; 6 = stores hub */
  cols?: 4 | 5 | 6;
}> = ({ children, className = '', cols = 4 }) => {
  const colClass =
    cols === 6
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
      : cols === 5
        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4';
  return (
    <div className={`grid ${colClass} gap-3 min-w-0 w-full ${className}`.trim()} data-master-kpi="1">
      {children}
    </div>
  );
};