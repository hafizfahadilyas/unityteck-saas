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
    className={`flex flex-col sm:flex-row sm:items-start lg:items-center justify-between gap-3 sm:gap-4 ${className}`.trim()}
  >
    <div className="min-w-0 flex-1">
      <h1
        className="text-xl sm:text-2xl font-extrabold tracking-tight"
        style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p className="text-xs mt-0.5 max-w-2xl" style={{ color: 'var(--muted)' }}>
          {subtitle}
        </p>
      ) : null}
    </div>
    <div className="flex items-center gap-2 flex-wrap shrink-0 w-full sm:w-auto sm:justify-end">
      {badge}
      {actions}
    </div>
  </div>
);

/** Shared page root — min-w-0 keeps flex column from overlapping the sidebar. No overflow-x-clip (clips filter dropdowns). */
export const PAGE_SHELL_CLASS =
  'u-page p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 max-w-[1650px] mx-auto w-full min-w-0';

export const AdminPageShell: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** When true, drop the default max-w + centering so content fills the main pane. */
  fullWidth?: boolean;
}> = ({ children, className = '', fullWidth = false }) => (
  <div
    className={`${fullWidth ? PAGE_SHELL_CLASS.replace('max-w-[1650px] mx-auto ', '') : PAGE_SHELL_CLASS} ${className}`.trim()}
    style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
    data-page-shell="1"
  >
    {children}
  </div>
);

