import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type PortalHubCardProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  /** Flip truck / directional icons in RTL */
  flipIconRtl?: boolean;
  isAr?: boolean;
};

/**
 * Global big hub button — same UI/UX as Marketing Tools cards.
 * Icon box on top → bold title → muted description. Whole card is clickable.
 */
export const PortalHubCard: React.FC<PortalHubCardProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
  active = false,
  className = '',
  flipIconRtl = false,
  isAr = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active || undefined}
      className={`u-hub-card group ${active ? 'is-active' : ''} ${className}`.trim()}
    >
      <span className="u-hub-card__icon" aria-hidden>
        <Icon className={`w-6 h-6 ${flipIconRtl && isAr ? 'rotate-180' : ''}`} />
      </span>
      <span className="u-hub-card__body">
        <span className="u-hub-card__title">{title}</span>
        {description ? <span className="u-hub-card__desc">{description}</span> : null}
      </span>
    </button>
  );
};
