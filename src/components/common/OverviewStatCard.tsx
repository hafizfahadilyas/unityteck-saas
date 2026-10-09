import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Sparkline } from './Sparkline';

export type OverviewTone = 'accent' | 'success' | 'info' | 'warn' | 'danger' | 'violet';

const TONE_CSS: Record<OverviewTone, { accent: string }> = {
  accent: { accent: 'var(--accent)' },
  success: { accent: 'var(--tone-success)' },
  info: { accent: 'var(--tone-info)' },
  warn: { accent: 'var(--tone-warn)' },
  danger: { accent: 'var(--tone-danger)' },
  violet: { accent: 'var(--tone-violet)' },
};

export type OverviewStatCardProps = {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: OverviewTone;
  sparkline?: number[];
  delta?: number | null;
  deltaLabel?: string;
  footer?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export const OverviewStatCard: React.FC<OverviewStatCardProps> = ({
  label,
  value,
  icon: Icon,
  tone = 'accent',
  sparkline,
  delta,
  deltaLabel = '',
  footer,
  className = '',
  compact = false,
}) => {
  const toneAccent = TONE_CSS[tone].accent;
  const up = delta == null ? null : delta >= 0;

  return (
    <article
      className={`u-overview-card group ${compact ? 'u-overview-card--compact' : ''} ${className}`.trim()}
      style={{ ['--card-tone' as string]: toneAccent }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="u-overview-card__icon" aria-hidden>
          <Icon className="w-4 h-4" strokeWidth={2.25} />
        </span>
      </div>

      <p className="u-overview-card__label">{label}</p>
      <p className={`u-overview-card__value ${typeof value === 'string' && value.length > 12 ? 'u-overview-card__value--sm' : ''}`}>
        {value}
      </p>

      <div className="flex items-center justify-between mt-auto pt-2.5 gap-2">
        {delta != null ? (
          <p className={`u-overview-card__delta ${up ? 'is-up' : 'is-down'}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span className="font-semibold tabular-nums">{Math.abs(delta)}%</span>
            {deltaLabel ? <span className="u-overview-card__delta-muted text-[10px]">{deltaLabel}</span> : null}
          </p>
        ) : <span />}
        {sparkline && sparkline.length > 1 ? (
          <span className="u-overview-card__spark shrink-0">
            <Sparkline data={sparkline} color={toneAccent} height={22} width={56} />
          </span>
        ) : null}
      </div>
      {footer ? <div className="u-overview-card__footer mt-1">{footer}</div> : null}
    </article>
  );
};

export type OverviewWideStatProps = {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: OverviewTone;
  sparkline?: number[];
  delta?: number | null;
  deltaLabel?: string;
};

/** Horizontal KPI strip (pending orders / promotions style). */
export const OverviewWideStat: React.FC<OverviewWideStatProps> = ({
  label,
  value,
  icon: Icon,
  tone = 'accent',
  sparkline,
  delta,
  deltaLabel = '',
}) => {
  const toneAccent = TONE_CSS[tone].accent;
  const up = delta == null ? null : delta >= 0;

  return (
    <article className="u-overview-wide" style={{ ['--card-tone' as string]: toneAccent }}>
      <div className="u-overview-wide__main">
        <span className="u-overview-card__icon u-overview-card__icon--lg" aria-hidden>
          <Icon className="w-5 h-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="u-overview-card__label">{label}</p>
          <p className="u-overview-card__value">{value}</p>
          {delta != null ? (
            <p className={`u-overview-card__delta ${up ? 'is-up' : 'is-down'}`}>
              {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span className="font-semibold tabular-nums">{Math.abs(delta)}%</span>
              {deltaLabel ? <span className="u-overview-card__delta-muted">{deltaLabel}</span> : null}
            </p>
          ) : null}
        </div>
      </div>
      {sparkline && sparkline.length > 1 ? (
        <span className="u-overview-card__spark shrink-0">
          <Sparkline data={sparkline} color={toneAccent} height={32} width={80} />
        </span>
      ) : null}
    </article>
  );
};

export const ChartPanel: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, children, className = '' }) => (
  <section className={`u-chart-panel ${className}`.trim()}>
    <header className="u-chart-panel__head">
      <div className="min-w-0">
        <h3 className="u-chart-panel__title">{title}</h3>
        {subtitle ? <p className="u-chart-panel__sub">{subtitle}</p> : null}
      </div>
      {action ? <div className="u-chart-panel__action shrink-0">{action}</div> : null}
    </header>
    <div className="u-chart-panel__body">{children}</div>
  </section>
);
