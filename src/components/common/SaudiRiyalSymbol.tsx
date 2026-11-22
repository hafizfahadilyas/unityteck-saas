import React from 'react';

type SaudiRiyalSymbolProps = {
  className?: string;
  style?: React.CSSProperties;
  /** When true, hide from AT; parent should provide accessible amount text. */
  decorative?: boolean;
  /** Locale for aria-label (Riyal / ريال). */
  isAr?: boolean;
  title?: string;
};

/** Official SAMA Saudi Riyal Sign paths (U+20C1). viewBox matches public/currency/saudi-riyal-symbol.svg */
const SAR_PATHS = [
  'M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z',
  'M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z',
] as const;

/**
 * Filled geometric Saudi Riyal sign (SAMA official).
 * Prefer this over bare U+20C1 in critical price chips — many fonts still lack the glyph.
 * Uses currentColor so it inherits text/icon color from parent.
 */
export const SaudiRiyalSymbol: React.FC<SaudiRiyalSymbolProps> = ({
  className = 'inline-block w-[1em] h-[1.12em] align-[-0.15em]',
  style,
  decorative = false,
  isAr = false,
  title,
}) => {
  const label = title ?? (isAr ? 'ريال' : 'Riyal');

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 1124.14 1256.39"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
    >
      {!decorative ? <title>{label}</title> : null}
      {SAR_PATHS.map((d) => (
        <path key={d.slice(0, 24)} fill="currentColor" d={d} />
      ))}
    </svg>
  );
};

export default SaudiRiyalSymbol;
