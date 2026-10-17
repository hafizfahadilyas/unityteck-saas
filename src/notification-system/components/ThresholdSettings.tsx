/**
 * @file ThresholdSettings.tsx
 * Merchant Settings panel for configuring operational notification thresholds and integration guards.
 */

import React, { useState } from 'react';
import {
  Sliders,
  Check,
  RotateCcw,
  ShieldCheck,
  MessageCircle,
  TrendingDown,
  ShoppingBag,
  Clock,
  Layers,
} from 'lucide-react';
import { thresholdManager, DEFAULT_THRESHOLDS } from '../services/thresholdManager';
import { MerchantThresholds } from '../types/notification.types';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../../components/common/ToastProvider';

export const ThresholdSettings: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [thresholds, setThresholds] = useState<MerchantThresholds>(() =>
    thresholdManager.getThresholds(),
  );

  const handleSave = () => {
    thresholdManager.updateThresholds(thresholds);
    toast(
      isAr
        ? 'تم حفظ إعدادات عتبات التنبيهات بنجاح!'
        : 'Notification threshold rules updated successfully!',
      'success',
    );
  };

  const handleReset = () => {
    setThresholds(DEFAULT_THRESHOLDS);
    thresholdManager.updateThresholds(DEFAULT_THRESHOLDS);
    toast(
      isAr ? 'تمت استعادة الإعدادات الافتراضية' : 'Reset to system default thresholds',
      'info',
    );
  };

  return (
    <div
      className="u-panel p-6 rounded-2xl shadow-sm border space-y-6"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold">
              {isAr ? 'إعدادات عتبات التنبيهات والربط' : 'Notification Thresholds & Integrations'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'تحكم في الحدود الرقمية لإطلاق التنبيهات التشغيلية وشروط مراسلة الواتساب'
                : 'Configure trigger limits for operational alerts, stock ceilings, and WhatsApp rules'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'الافتراضي' : 'Reset'}</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Threshold Numerical Limits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* 1. Low stock threshold */}
        <div className="p-4 rounded-xl border space-y-1.5" style={{ borderColor: 'var(--border)' }}>
          <label className="font-bold block opacity-90">
            {isAr ? 'حد تنبيه انخفاض المخزون (قطع)' : 'Low Stock Alert Threshold (Units)'}
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={thresholds.lowStockThreshold}
            onChange={(e) =>
              setThresholds((prev) => ({ ...prev, lowStockThreshold: Number(e.target.value) || 5 }))
            }
            className="w-full px-3 py-1.5 rounded-lg border outline-none font-mono font-bold"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
          />
          <span className="text-[10px] text-slate-400 block">
            {isAr ? 'إطلاق تنبيه عند وصول الكمية لهذا الرقم' : 'Trigger alert when item quantity drops below this'}
          </span>
        </div>

        {/* 2. Abandoned cart timer */}
        <div className="p-4 rounded-xl border space-y-1.5" style={{ borderColor: 'var(--border)' }}>
          <label className="font-bold block opacity-90">
            {isAr ? 'مدة انتظار السلة المتروكة (دقيقة)' : 'Abandoned Cart Wait Time (Minutes)'}
          </label>
          <input
            type="number"
            min={5}
            max={180}
            value={thresholds.abandonedCartWaitMinutes}
            onChange={(e) =>
              setThresholds((prev) => ({ ...prev, abandonedCartWaitMinutes: Number(e.target.value) || 30 }))
            }
            className="w-full px-3 py-1.5 rounded-lg border outline-none font-mono font-bold"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
          />
          <span className="text-[10px] text-slate-400 block">
            {isAr ? 'افتراضي: 30 دقيقة قبل إرسال فرصة الاسترجاع' : 'Standard 30 min before triggering recovery message'}
          </span>
        </div>

        {/* 3. Google Ads Target CPA */}
        <div className="p-4 rounded-xl border space-y-1.5" style={{ borderColor: 'var(--border)' }}>
          <label className="font-bold block opacity-90">
            {isAr ? 'الحد المستهدف لتكلفة إعلانات جوجل (SAR)' : 'Google Ads Target CPA Ceiling (SAR)'}
          </label>
          <input
            type="number"
            min={5}
            max={500}
            value={thresholds.googleAdsTargetCpa}
            onChange={(e) =>
              setThresholds((prev) => ({ ...prev, googleAdsTargetCpa: Number(e.target.value) || 25 }))
            }
            className="w-full px-3 py-1.5 rounded-lg border outline-none font-mono font-bold"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
          />
          <span className="text-[10px] text-slate-400 block">
            {isAr ? 'تنبيه إذا تجاوزت تكلفة التحويل هذا الحد' : 'Alert when CPA exceeds target acquisition ceiling'}
          </span>
        </div>

        {/* 4. Cart Abandonment Rate Alert */}
        <div className="p-4 rounded-xl border space-y-1.5" style={{ borderColor: 'var(--border)' }}>
          <label className="font-bold block opacity-90">
            {isAr ? 'عتبة نسبة السلات المتروكة (%)' : 'Cart Abandonment Rate Alert (%)'}
          </label>
          <input
            type="number"
            min={10}
            max={99}
            value={thresholds.cartAbandonmentRateAlert}
            onChange={(e) =>
              setThresholds((prev) => ({ ...prev, cartAbandonmentRateAlert: Number(e.target.value) || 70 }))
            }
            className="w-full px-3 py-1.5 rounded-lg border outline-none font-mono font-bold"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
          />
          <span className="text-[10px] text-slate-400 block">
            {isAr ? 'تنبيه تحذيري عند تجاوز معدل التخلي' : 'Trigger warning when abandonment rate exceeds this'}
          </span>
        </div>

        {/* 5. Cancellation Rate Alert */}
        <div className="p-4 rounded-xl border space-y-1.5" style={{ borderColor: 'var(--border)' }}>
          <label className="font-bold block opacity-90">
            {isAr ? 'عتبة نسبة إلغاء الطلبات (%)' : 'Order Cancellation Rate Alert (%)'}
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={thresholds.cancellationRateAlert}
            onChange={(e) =>
              setThresholds((prev) => ({ ...prev, cancellationRateAlert: Number(e.target.value) || 15 }))
            }
            className="w-full px-3 py-1.5 rounded-lg border outline-none font-mono font-bold"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
          />
          <span className="text-[10px] text-slate-400 block">
            {isAr ? 'تنبيه عند تجاوز معدل الإلغاء الأسبوعي' : 'Trigger warning if cancellation percentage surges'}
          </span>
        </div>

        {/* 6. Stale Data Threshold */}
        <div className="p-4 rounded-xl border space-y-1.5" style={{ borderColor: 'var(--border)' }}>
          <label className="font-bold block opacity-90">
            {isAr ? 'عتبة البيانات القديمة (دقيقة)' : 'Stale Data Age Threshold (Minutes)'}
          </label>
          <input
            type="number"
            min={10}
            max={720}
            value={thresholds.staleDataThresholdMinutes}
            onChange={(e) =>
              setThresholds((prev) => ({ ...prev, staleDataThresholdMinutes: Number(e.target.value) || 60 }))
            }
            className="w-full px-3 py-1.5 rounded-lg border outline-none font-mono font-bold"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
          />
          <span className="text-[10px] text-slate-400 block">
            {isAr ? 'إظهار شارة "البيانات قد تكون قديمة" بعد انقضاء هذه المدة' : 'Show "Data may be outdated" badge past this age'}
          </span>
        </div>
      </div>

      {/* Integration Connection Guards */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <h4 className="font-bold text-xs uppercase tracking-wider mb-3 opacity-75">
          {isAr ? 'حالة ربط القنوات وبوابات الإشعارات' : 'Connected Integrations & Guard Status'}
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { key: 'isWhatsappConnected', label: 'WhatsApp Business API' },
            { key: 'isMetaConnected', label: 'Meta Pixel & Marketing' },
            { key: 'isGoogleAdsConnected', label: 'Google Ads & GMC' },
            { key: 'isTiktokConnected', label: 'TikTok for Business' },
            { key: 'isSnapchatConnected', label: 'Snapchat Conversions' },
            { key: 'isXConnected', label: 'X (Twitter) Ads' },
            { key: 'isPinterestConnected', label: 'Pinterest Business' },
            { key: 'isYoutubeConnected', label: 'YouTube Shopping' },
          ].map((item) => {
            const isConnected = (thresholds as any)[item.key];
            return (
              <label
                key={item.key}
                className="flex items-center gap-2 p-3 rounded-xl border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors select-none"
                style={{ borderColor: 'var(--border)' }}
              >
                <input
                  type="checkbox"
                  checked={isConnected}
                  onChange={(e) =>
                    setThresholds((prev) => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="font-semibold text-xs truncate">{item.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
