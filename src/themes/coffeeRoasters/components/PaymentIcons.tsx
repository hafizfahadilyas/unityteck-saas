import React from 'react';
import { PAYMENT_METHOD_LOGO, resolvePaymentLogoFromMethod } from '../../../utils/paymentMethodLogos';

interface PaymentIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

/**
 * Brand payment marks — official PNGs from /public/payment-methods.
 * Always sit on a white tile so black-canvas / dark logos stay visible
 * in both light and dark admin chrome (never black-on-black).
 */
function PayLogo({
  src,
  title,
  className = 'h-5 w-auto',
}: {
  src: string;
  title: string;
  className?: string;
}) {
  return (
    <span
      className={`u-logo-tile inline-flex items-center justify-center rounded-md px-1.5 py-0.5 shrink-0 ${className}`}
      title={title}
      role="img"
      aria-label={title}
    >
      <img
        src={src}
        alt={title}
        className="h-full w-auto max-h-5 max-w-[4.5rem] object-contain"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </span>
  );
}

export const MadaIcon: React.FC<PaymentIconProps> = ({ className = 'h-5 w-auto', title = 'Mada' }) => (
  <PayLogo src={PAYMENT_METHOD_LOGO.mada} title={title} className={className} />
);

export const ApplePayIcon: React.FC<PaymentIconProps> = ({ className = 'h-5 w-auto', title = 'Apple Pay' }) => (
  <PayLogo src={PAYMENT_METHOD_LOGO.apple} title={title} className={className} />
);

export const TabbyIcon: React.FC<PaymentIconProps> = ({ className = 'h-5 w-auto', title = 'Tabby' }) => (
  <PayLogo src={PAYMENT_METHOD_LOGO.tabby} title={title} className={className} />
);

export const TamaraIcon: React.FC<PaymentIconProps> = ({ className = 'h-5 w-auto', title = 'Tamara' }) => (
  <PayLogo src={PAYMENT_METHOD_LOGO.tamara} title={title} className={className} />
);

export const StcPayIcon: React.FC<PaymentIconProps> = ({ className = 'h-5 w-auto', title = 'stc pay' }) => (
  <PayLogo src={PAYMENT_METHOD_LOGO.stc} title={title} className={className} />
);

export const VisaIcon: React.FC<PaymentIconProps> = ({ className = 'h-5 w-auto', title = 'Visa' }) => (
  <PayLogo src={PAYMENT_METHOD_LOGO.visa} title={title} className={className} />
);

/** No dedicated Mastercard PNG in pack — compact brand mark on white tile */
export const MastercardIcon: React.FC<PaymentIconProps> = ({ className = 'h-5 w-auto', title = 'Mastercard' }) => (
  <span
    className={`u-logo-tile inline-flex items-center justify-center rounded-md px-1.5 py-0.5 shrink-0 ${className}`}
    title={title}
    role="img"
    aria-label={title}
  >
    <svg viewBox="0 0 36 22" className="h-3.5 w-auto" aria-hidden>
      <circle cx="12" cy="11" r="9" fill="#EB001B" />
      <circle cx="24" cy="11" r="9" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
  </span>
);

export const CodIcon: React.FC<PaymentIconProps & { titleText?: string }> = ({
  className = 'h-5 w-auto',
  titleText,
  title,
}) => {
  const label = titleText || title || 'COD';
  return (
    <span
      className={`u-logo-tile inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-slate-800 shrink-0 ${className}`}
      title={label}
      aria-label={label}
    >
      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <span>COD</span>
    </span>
  );
};

export const PayPalIcon: React.FC<PaymentIconProps> = ({ className = 'h-5 w-auto', title = 'PayPal' }) => (
  <PayLogo src={PAYMENT_METHOD_LOGO.paypal} title={title} className={className} />
);

export const SamsungPayIcon: React.FC<PaymentIconProps> = ({ className = 'h-5 w-auto', title = 'Samsung Pay' }) => (
  <PayLogo src={PAYMENT_METHOD_LOGO.samsung} title={title} className={className} />
);

export const GooglePayIcon: React.FC<PaymentIconProps> = ({ className = 'h-5 w-auto', title = 'Google Pay' }) => (
  <PayLogo src={PAYMENT_METHOD_LOGO.googlepay} title={title} className={className} />
);

export const EmkanIcon: React.FC<PaymentIconProps> = ({ className = 'h-5 w-auto', title = 'Emkan' }) => (
  <PayLogo src={PAYMENT_METHOD_LOGO.emkan} title={title} className={className} />
);

export const BankTransferIcon: React.FC<PaymentIconProps> = ({
  className = 'h-5 w-auto',
  title = 'Bank Transfer',
}) => <PayLogo src={PAYMENT_METHOD_LOGO.bank_transfer} title={title} className={className} />;

/** Resolve any order/payment string → logo mark (PNG tile or COD). */
export function PaymentMethodMark({
  method,
  className = 'h-5 w-auto',
}: {
  method?: string | null;
  className?: string;
}) {
  const src = resolvePaymentLogoFromMethod(method);
  const label = (method || 'Payment').trim() || 'Payment';
  const lower = label.toLowerCase();
  if (lower.includes('cash') || lower.includes('cod') || lower.includes('استلام')) {
    return <CodIcon className={className} titleText={label} />;
  }
  if (src) {
    return <PayLogo src={src} title={label} className={className} />;
  }
  if (lower.includes('master')) {
    return <MastercardIcon className={className} title={label} />;
  }
  return <VisaIcon className={className} title={label} />;
}

export const AllPaymentLogos: React.FC<{ compact?: boolean }> = ({ compact }) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? 'justify-start' : 'justify-center'}`}>
      <MadaIcon />
      <ApplePayIcon />
      <TabbyIcon />
      <TamaraIcon />
      <StcPayIcon />
      <VisaIcon />
      <MastercardIcon />
      <CodIcon />
    </div>
  );
};
