import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Bell,
  CheckCircle2,
  Lock,
  Globe,
  Palette,
  Share2,
  Megaphone,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from './ToastProvider';
import { type AdvanceFeatureConfig } from '../../services/advanceFeaturesService';

interface AdvanceFeatureComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: AdvanceFeatureConfig | null;
}

export const AdvanceFeatureComingSoonModal: React.FC<AdvanceFeatureComingSoonModalProps> = ({
  isOpen,
  onClose,
  feature,
}) => {
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const [isNotified, setIsNotified] = useState(false);

  if (!isOpen || !feature) return null;

  const title = isAr ? feature.nameAr : feature.nameEn;
  const description = isAr ? feature.descriptionAr : feature.descriptionEn;
  const tag = isAr ? feature.comingSoonTagAr : feature.comingSoonTagEn;

  const handleNotifyMe = () => {
    setIsNotified(true);
    toast(
      isAr
        ? `تم تسجيل طلب التنبيه لميزة "${title}" بنجاح! ستصلك إشعار فور إطلاقها.`
        : `Notification alert registered for "${title}"! You will be notified when it launches.`,
      'success'
    );
  };

  const getFeatureIcon = () => {
    switch (feature.iconName) {
      case 'Globe':
        return <Globe className="w-8 h-8 text-blue-500" />;
      case 'Sparkles':
        return <Sparkles className="w-8 h-8 text-purple-500" />;
      case 'Palette':
        return <Palette className="w-8 h-8 text-emerald-500" />;
      case 'Share2':
        return <Share2 className="w-8 h-8 text-amber-500" />;
      case 'Megaphone':
      default:
        return <Megaphone className="w-8 h-8 text-teal-500" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all text-start"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ambient Accent Glow */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-teal-500 via-amber-500 to-indigo-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={isAr ? 'إغلاق' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Top Badge & Icon */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner shrink-0"
              style={{
                background: 'color-mix(in srgb, var(--accent) 12%, var(--surface))',
                borderColor: 'var(--border)',
              }}
            >
              {getFeatureIcon()}
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{tag || (isAr ? 'قريباً' : 'Coming Soon')}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight leading-snug">
                {title}
              </h2>
            </div>
          </div>

          {/* Description */}
          <div
            className="p-4 rounded-2xl border text-sm leading-relaxed"
            style={{
              background: 'var(--bg)',
              borderColor: 'var(--border)',
              color: 'var(--muted)',
            }}
          >
            <p className="font-medium text-slate-700 dark:text-slate-200">{description}</p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? 'ماذا سيقدم لك هذا التحديث المتقدم؟' : 'What will this advanced module include?'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div
                className="p-3 rounded-xl border flex items-center gap-2"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'تكامل سحابي فوري 1-Click' : '1-Click Cloud Sync'}
                </span>
              </div>
              <div
                className="p-3 rounded-xl border flex items-center gap-2"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'إدارة مركزية موثوقة' : 'Master Central Control'}
                </span>
              </div>
            </div>
          </div>

          {/* Master Admin Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 text-xs text-teal-800 dark:text-teal-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-teal-600 dark:text-teal-400" />
            <p className="leading-snug">
              {isAr
                ? 'تم ضبط هذه الميزة حالياً كـ "قريباً" عبر الإدارة المركزية (Master Admin). يمكنك طلب التنبيه وسيجري إشعارك فور تفعيلها لمتجرك.'
                : 'This module is marked as "Coming Soon" by the Master Administrator. You can register below to be notified as soon as it goes live.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isNotified}
              onClick={handleNotifyMe}
              className={`w-full sm:flex-1 py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isNotified
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20 active:scale-[0.98]'
              }`}
            >
              {isNotified ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'تم طلب التنبيه بنجاح' : 'Alert Registered'}</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>{isAr ? 'أبلغني فور الإطلاق' : 'Notify Me Upon Launch'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl border text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border)' }}
            >
              {isAr ? 'حسناً، فهمت' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
