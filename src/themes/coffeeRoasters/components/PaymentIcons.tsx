import React from 'react';

interface PaymentIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MadaIcon: React.FC<PaymentIconProps> = ({ className = "h-5 w-auto" }) => (
  <div className={`inline-flex items-center justify-center bg-white px-2 py-1 rounded ${className}`} title="Mada مدى">
    <svg viewBox="0 0 100 35" className="h-4 w-auto" fill="none">
      {/* Mada Saudi Payment Scheme official colors & curves */}
      <rect width="100" height="35" rx="3" fill="#ffffff"/>
      <path d="M12 25V10h5.5l4.5 9 4.5-9H32v15h-4.5v-9l-4.5 9h-2l-4.5-9v9H12z" fill="#007953" />
      <path d="M40 18a7 7 0 1 0 0-0.1z" fill="#95C11E" />
      <path d="M48 25V10h4.5v15H48z" fill="#007953" />
      <circle cx="68" cy="18" r="7" fill="#007953" />
      <path d="M80 10h4.5v15H80z" fill="#95C11E" />
      <text x="88" y="24" fontSize="11" fontWeight="bold" fill="#007953" fontFamily="sans-serif">مدى</text>
    </svg>
  </div>
);

export const ApplePayIcon: React.FC<PaymentIconProps> = ({ className = "h-5 w-auto" }) => (
  <div className={`inline-flex items-center justify-center bg-black text-white px-2.5 py-1 rounded ${className}`} title="Apple Pay">
    <svg viewBox="0 0 50 20" className="h-3.5 w-auto" fill="currentColor">
      <path d="M7.4 9.3c0-1.7 1.4-2.6 1.5-2.7-0.8-1.2-2-1.3-2.5-1.4-1.1-0.1-2.1 0.7-2.7 0.7-0.5 0-1.4-0.6-2.3-0.6C0.3 5.3-0.7 6.4-1.2 7.3c-1.1 1.9-0.3 4.7 0.8 6.2 0.5 0.7 1.1 1.5 1.9 1.5 0.8-0.1 1.1-0.5 2-0.5 1 0 1.2 0.5 2 0.5 0.8 0 1.4-0.8 1.9-1.5 0.6-0.8 0.8-1.6 0.8-1.7C8.2 11.8 7.4 10.6 7.4 9.3z" transform="translate(6, 1) scale(0.9)"/>
      <path d="M5.4 3.9c0.4-0.6 0.7-1.4 0.7-2.2 0-0.1 0-0.2 0-0.3-0.7 0-1.6 0.5-2.1 1.1-0.4 0.5-0.7 1.3-0.7 2.1 0 0.1 0 0.2 0 0.2 0.8 0.1 1.6-0.3 2.1-0.9z" transform="translate(6, 1) scale(0.9)"/>
      <text x="18" y="14" fontSize="11" fontWeight="600" fill="currentColor" fontFamily="system-ui, sans-serif">Pay</text>
    </svg>
  </div>
);

export const TabbyIcon: React.FC<PaymentIconProps> = ({ className = "h-5 w-auto" }) => (
  <div className={`inline-flex items-center justify-center bg-[#3EFEBA] text-neutral-950 font-bold px-2 py-0.5 rounded text-xs tracking-tight ${className}`} title="Tabby تابي - قسط على 4 دفعات">
    <span className="font-extrabold text-[11px] leading-tight">tabby</span>
  </div>
);

export const TamaraIcon: React.FC<PaymentIconProps> = ({ className = "h-5 w-auto" }) => (
  <div className={`inline-flex items-center justify-center bg-gradient-to-r from-[#F9A55B] to-[#F1728A] text-white font-bold px-2 py-0.5 rounded text-xs tracking-tight ${className}`} title="Tamara تمارا - قسط بدون فوائد">
    <span className="font-black text-[11px] leading-tight">tamara</span>
  </div>
);

export const StcPayIcon: React.FC<PaymentIconProps> = ({ className = "h-5 w-auto" }) => (
  <div className={`inline-flex items-center justify-center bg-[#4f008c] text-white px-2 py-1 rounded font-semibold text-[10px] tracking-tight ${className}`} title="stc pay">
    <span>stc pay</span>
  </div>
);

export const VisaIcon: React.FC<PaymentIconProps> = ({ className = "h-5 w-auto" }) => (
  <div className={`inline-flex items-center justify-center bg-white px-2 py-1 rounded ${className}`} title="Visa">
    <svg viewBox="0 0 48 16" className="h-3 w-auto" fill="none">
      <path d="M19.1 0.7L12.5 15.3H8.3L5 3.3C4.8 2.5 4.6 2.2 4 1.9C3 1.4 1.4 0.9 0 0.6L0.2 0.7H7.1C8 0.7 8.8 1.3 9 2.3L10.7 11.2L15 0.7H19.1ZM36 10.4C36 6.4 30.5 6.2 30.5 4.4C30.5 3.9 31 3.3 32.1 3.2C32.7 3.1 34.2 3.1 35.8 3.8L36.4 0.9C35.5 0.6 34.4 0.3 33 0.3C28.9 0.3 26.1 2.4 26.1 5.5C26.1 7.8 28.1 9.1 29.7 9.8C31.3 10.6 31.8 11.1 31.8 11.8C31.8 12.8 30.6 13.3 29.5 13.3C27.4 13.3 26.2 13 25.2 12.5L24.6 15.5C25.6 15.9 27.4 16.3 29.2 16.3C33.5 16.3 36 14.1 36 10.4ZM46.6 15.3H50.2L47 0.7H43.7C42.9 0.7 42.2 1.1 41.9 1.8L35.8 15.3H40L40.8 13.1H45.9L46.6 15.3ZM41.9 10.2L44 4.5L45.2 10.2H41.9ZM25.3 0.7L22 15.3H18.1L21.4 0.7H25.3Z" fill="#1A1F71"/>
    </svg>
  </div>
);

export const MastercardIcon: React.FC<PaymentIconProps> = ({ className = "h-5 w-auto" }) => (
  <div className={`inline-flex items-center justify-center bg-neutral-900 px-2 py-1 rounded ${className}`} title="Mastercard">
    <svg viewBox="0 0 36 22" className="h-3 w-auto">
      <circle cx="12" cy="11" r="9" fill="#EB001B"/>
      <circle cx="24" cy="11" r="9" fill="#F79E1B" fillOpacity="0.9"/>
    </svg>
  </div>
);

export const CodIcon: React.FC<PaymentIconProps> = ({ className = "h-5 w-auto" }) => (
  <div className={`inline-flex items-center gap-1.5 bg-neutral-800 text-neutral-200 px-2 py-1 rounded text-xs ${className}`} title="Cash on Delivery الدفع عند الاستلام">
    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    <span className="text-[11px] font-medium">COD</span>
  </div>
);

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
