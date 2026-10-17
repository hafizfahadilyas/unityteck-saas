import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Car, 
  ShoppingCart, 
  AlertTriangle, 
  Info, 
  X, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export type ToastType = 'success' | 'vehicle-match' | 'warranty' | 'cart' | 'whatsapp' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  titleEn?: string;
  message: string;
  messageEn?: string;
  duration?: number;
  actionLabel?: string;
  actionLabelEn?: string;
  onAction?: () => void;
  metadata?: {
    carName?: string;
    brandLogo?: string;
    colorHex?: string;
    price?: number;
  };
}

interface LuxuryToastSystemProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  isAr?: boolean;
  hasOpenModal?: boolean;
}

export const LuxuryToastSystem: React.FC<LuxuryToastSystemProps> = ({
  toasts,
  onDismiss,
  isAr = true,
  hasOpenModal = false,
}) => {
  // If user has any modal open, or no toasts, suppress toast display so it never clutters
  if (hasOpenModal || toasts.length === 0) return null;

  // Show only the latest toast so it never piles up on screen
  const latestToast = toasts[0];

  return (
    <div 
      className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 max-w-md w-[92vw] sm:w-[420px] pointer-events-none transition-all duration-300"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <ToastCard 
        key={latestToast.id} 
        toast={latestToast} 
        onDismiss={() => onDismiss(latestToast.id)} 
        isAr={isAr} 
      />
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void; isAr: boolean }> = ({
  toast,
  onDismiss,
  isAr,
}) => {
  const duration = toast.duration || 3200;
  const onDismissRef = React.useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismissRef.current();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  // Icon & theme styling per toast type
  const getIconAndStyle = () => {
    switch (toast.type) {
      case 'vehicle-match':
        return {
          icon: <Car className="w-5 h-5 text-[#f6c344]" />,
          border: 'border-[#d5a027]/70 shadow-[0_12px_32px_rgba(213,160,39,0.35)]',
          badgeBg: 'bg-amber-400/20 text-[#f6c344] border border-[#d5a027]/40',
          glow: 'from-[#2a064e] via-[#1a0330] to-[#0d0119]',
          progressColor: 'bg-gradient-to-r from-[#d5a027] to-[#f6c344]',
        };
      case 'warranty':
        return {
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          border: 'border-emerald-500/60 shadow-[0_12px_32px_rgba(16,185,129,0.25)]',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
          glow: 'from-[#063321] via-[#092218] to-[#04130d]',
          progressColor: 'bg-gradient-to-r from-emerald-500 to-teal-300',
        };
      case 'cart':
        return {
          icon: <ShoppingCart className="w-5 h-5 text-[#f6c344]" />,
          border: 'border-[#d5a027]/60 shadow-[0_12px_32px_rgba(213,160,39,0.25)]',
          badgeBg: 'bg-purple-500/20 text-[#f6c344] border border-[#d5a027]/40',
          glow: 'from-[#2b0849] via-[#1a042e] to-[#0c0216]',
          progressColor: 'bg-gradient-to-r from-[#d5a027] to-[#f6c344]',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          border: 'border-amber-500/60 shadow-[0_12px_32px_rgba(245,158,11,0.25)]',
          badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
          glow: 'from-[#3a2007] via-[#241304] to-[#120a02]',
          progressColor: 'bg-gradient-to-r from-amber-400 to-orange-400',
        };
      case 'success':
      default:
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-[#f6c344]" />,
          border: 'border-[#d5a027]/50 shadow-[0_12px_32px_rgba(213,160,39,0.22)]',
          badgeBg: 'bg-amber-400/20 text-[#f6c344] border border-[#d5a027]/30',
          glow: 'from-[#1c0438] via-[#140228] to-[#090112]',
          progressColor: 'bg-gradient-to-r from-[#d5a027] to-[#f6c344]',
        };
    }
  };

  const toastStyle = getIconAndStyle();
  const titleText = isAr ? toast.title : (toast.titleEn || toast.title);
  const messageText = isAr ? toast.message : (toast.messageEn || toast.message);
  const actionText = isAr ? toast.actionLabel : (toast.actionLabelEn || toast.actionLabel);

  return (
    <div 
      className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-gradient-to-br ${toastStyle.glow} text-white p-3.5 sm:p-4 border backdrop-blur-xl transition-all duration-300 transform translate-y-0 scale-100 ${toastStyle.border}`}
      style={{
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
      }}
    >
      {/* Subtle background ambient glow */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#d5a027]/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-start gap-3">
        {/* Icon / Brand Logo Badge */}
        <div className={`p-2 rounded-xl shrink-0 ${toastStyle.badgeBg} flex items-center justify-center shadow-inner`}>
          {toast.metadata?.brandLogo ? (
            <img 
              src={toast.metadata.brandLogo} 
              alt="Car Logo" 
              className="w-5 h-5 object-contain" 
            />
          ) : (
            toastStyle.icon
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h5 className="text-xs sm:text-sm font-black text-white tracking-tight leading-tight">
              {titleText}
            </h5>
            {toast.metadata?.carName && (
              <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-bold text-[#f6c344] border border-white/10 truncate max-w-[150px]">
                {toast.metadata.carName}
              </span>
            )}
          </div>

          <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed font-medium">
            {messageText}
          </p>

          {/* Action button if present */}
          {toast.onAction && actionText && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => {
                  toast.onAction?.();
                  onDismiss();
                }}
                className="px-3 py-1 bg-gradient-to-r from-[#d5a027] to-[#f6c344] text-[#120224] text-[11px] font-black rounded-lg shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>{actionText}</span>
                {isAr ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Animated Progress Timer Line (Pure CSS Hardware Accelerated) */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10 overflow-hidden">
        <div 
          className={`h-full ${toastStyle.progressColor} w-full`}
          style={{
            animation: `toastCountdown ${duration}ms linear forwards`,
            transformOrigin: isAr ? 'right' : 'left',
          }}
        />
      </div>
    </div>
  );
};
