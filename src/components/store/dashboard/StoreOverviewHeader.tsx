import React, { useState, useRef, useEffect } from 'react';
import { Store, Calendar, ChevronDown, Check, AlertTriangle, X } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';

interface StoreOverviewHeaderProps {
  storeName: string;
  selectedRangeLabel: string;
  onSelectRange: (rangeKey: string) => void;
  activeRangeKey: string;
  missingSettingsCount?: number;
  onOpenMissingActions?: () => void;
  onNavigateTab: (tab: string) => void;
}

export const StoreOverviewHeader: React.FC<StoreOverviewHeaderProps> = React.memo(({
  storeName,
  selectedRangeLabel,
  onSelectRange,
  activeRangeKey,
  missingSettingsCount = 4,
  onOpenMissingActions,
  onNavigateTab,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAlertActions, setShowAlertActions] = useState(false);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowAlertActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ranges = [
    { key: 'today', labelEn: 'Today', labelAr: 'اليوم' },
    { key: 'yesterday', labelEn: 'Yesterday', labelAr: 'أمس' },
    { key: 'week', labelEn: 'Last 7 Days', labelAr: 'آخر 7 أيام' },
    { key: 'month', labelEn: 'This Month', labelAr: 'هذا الشهر' },
    { key: 'all', labelEn: 'All Time (Custom)', labelAr: 'جميع الفترات (مخصص)' },
  ];

  return (
    <div className="space-y-4">
      {/* ── Page Title & Date Range Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
            style={{
              background: 'color-mix(in srgb, #004d5a 12%, var(--surface))',
              borderColor: 'color-mix(in srgb, #004d5a 25%, var(--border))',
              color: '#004d5a',
            }}
          >
            <Store className="w-5 h-5 text-teal-700 dark:text-teal-400" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {isAr ? 'نظرة عامة على المتجر' : 'Store Overview'}
            </h1>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold">
              {isAr
                ? 'راقب أداء متجرك واتخذ الإجراءات المناسبة.'
                : 'Monitor your store performance and take action.'}
            </p>
          </div>
        </div>

        {/* Date Range Selector Dropdown */}
        <div className="relative" ref={datePickerRef}>
          <button
            type="button"
            onClick={() => setShowDatePicker((prev) => !prev)}
            className="inline-flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-800 shadow-2xs hover:border-teal-500/50"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
            <span className="truncate">{selectedRangeLabel}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-400 transition-transform ${
                showDatePicker ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showDatePicker && (
            <div
              className="absolute end-0 top-full mt-1.5 w-64 p-1.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              {ranges.map((r) => {
                const isSelected = activeRangeKey === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => {
                      onSelectRange(r.key);
                      setShowDatePicker(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-start transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                    }`}
                  >
                    <span>{isAr ? r.labelAr : r.labelEn}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Action Required Alert Banner (Pixel-perfect Amber Banner) ── */}
      {!isAlertDismissed && (
        <div className="p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/90 dark:bg-amber-950/25 border-amber-200/90 dark:border-amber-800/50 transition-all">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-300/60 dark:border-amber-700/60 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100">
                  {isAr ? 'إجراء مطلوب: إعدادات ناقصة' : 'Action Required: Missing Configurations'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  {missingSettingsCount} {isAr ? 'بنود' : 'items'}
                </span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200 mt-0.5 leading-relaxed font-semibold">
                {isAr
                  ? 'بعض الإعدادات المهمة غير مكتملة. يرجى إكمالها لضمان عمل متجرك بكفاءة كاملة.'
                  : 'Some important settings are missing. Please complete them to ensure your store works properly.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto relative" ref={actionsRef}>
            <button
              type="button"
              onClick={() => setShowAlertActions((prev) => !prev)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer bg-amber-100/80 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-amber-200 flex items-center gap-1.5"
            >
              <span>{isAr ? 'عرض الإجراءات' : 'View Actions'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showAlertActions ? 'rotate-180' : ''}`} />
            </button>

            {showAlertActions && (
              <div className="absolute end-0 top-full mt-1.5 w-60 p-1.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('payments');
                    setShowAlertActions(false);
                  }}
                  className="w-full text-start px-3 py-2 text-xs font-semibold rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? '1. ربط بوابات الدفع الإلكتروني' : '1. Connect Payment Gateways'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('shipping');
                    setShowAlertActions(false);
                  }}
                  className="w-full text-start px-3 py-2 text-xs font-semibold rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? '2. تفعيل شركات الشحن والتوصيل' : '2. Setup Shipping Couriers'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('seo');
                    setShowAlertActions(false);
                  }}
                  className="w-full text-start px-3 py-2 text-xs font-semibold rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? '3. التحقق من أدوات تحسين محركات البحث' : '3. Verify Google Search Console'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('hosting');
                    setShowAlertActions(false);
                  }}
                  className="w-full text-start px-3 py-2 text-xs font-semibold rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? '4. ربط النطاق المخصص للمتجر' : '4. Connect Store Custom Domain'}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsAlertDismissed(true)}
              aria-label="Dismiss alert"
              className="p-1 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-200/60 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

StoreOverviewHeader.displayName = 'StoreOverviewHeader';
