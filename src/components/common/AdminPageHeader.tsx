import React from 'react';

type Props = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

/** Shared Master + Store page header — Holst tokens, designs/Master_Admin_UIUX chrome rhythm. */
export const AdminPageHeader: React.FC<Props> = ({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${className}`.trim()}
  >
    <div className="min-w-0">
      <h1
        className="text-xl sm:text-2xl font-extrabold tracking-tight truncate"
        style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
          {subtitle}
        </p>
      ) : null}
    </div>
    <div className="flex items-center gap-2 flex-wrap shrink-0">
      {badge}
      {actions}
    </div>
  </div>
);

export const AdminPageShell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`u-page p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 max-w-[1650px] mx-auto w-full min-w-0 overflow-x-hidden contain-inline-size ${className}`.trim()}
    style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
  >
    {children}
  </div>
);

