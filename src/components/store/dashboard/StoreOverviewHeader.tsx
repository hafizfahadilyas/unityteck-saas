import React, { useState, useRef } from 'react';
import { Store, Calendar, ChevronDown, Check } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { FloatingPopover } from '../../common/FloatingPopover';
import { DashboardLookSwitch } from './DashboardLookSwitch';

interface StoreOverviewHeaderProps {
  storeName: string;
  selectedRangeLabel: string;
  onSelectRange: (rangeKey: string) => void;
  activeRangeKey: string;
}

export const StoreOverviewHeader: React.FC<StoreOverviewHeaderProps> = React.memo(({
  storeName,
  selectedRangeLabel,
  onSelectRange,
  activeRangeKey,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateBtnRef = useRef<HTMLButtonElement>(null);

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
          <div className="u-icon-brand w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {isAr ? 'نظرة عامة على المتجر' : 'Store Overview'}
            </h1>
            <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'راقب أداء متجرك واتخذ الإجراءات المناسبة.'
                : 'Monitor your store performance and take action.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 min-w-0">
          {/* Full dashboard look — Glass Soft | Night Luxe */}
          <DashboardLookSwitch variant="compact" />

          {/* Date Range Selector — glass pill */}
          <div>
            <button
              type="button"
              ref={dateBtnRef}
              onClick={() => setShowDatePicker((prev) => !prev)}
              className="w-full sm:w-auto inline-flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-bold rounded-full border transition-all cursor-pointer shadow-2xs"
              style={{
                background: 'var(--glass-fill, var(--surface))',
                color: 'var(--text)',
                borderColor: 'var(--glass-border, var(--border))',
                fontFamily: 'var(--font-ui)',
                backdropFilter: 'blur(12px)',
              }}
              aria-expanded={showDatePicker}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted)' }} strokeWidth={1.75} />
              <span className="truncate">{selectedRangeLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  showDatePicker ? 'rotate-180' : ''
                }`}
                style={{ color: 'var(--muted)' }}
              />
            </button>

            <FloatingPopover
              open={showDatePicker}
              anchorRef={dateBtnRef}
              onClose={() => setShowDatePicker(false)}
              width={256}
              align="end"
              estimatedHeight={280}
              className="p-1.5 rounded-2xl border shadow-xl u-card"
              style={{
                background: 'var(--glass-fill-strong, var(--surface))',
                borderColor: 'var(--glass-border, var(--border))',
              }}
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
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-start transition-colors cursor-pointer"
                    style={
                      isSelected
                        ? {
                            background: 'color-mix(in srgb, var(--accent) 14%, var(--surface))',
                            color: 'var(--accent)',
                            fontWeight: 700,
                          }
                        : { color: 'var(--text)', fontWeight: 600 }
                    }
                  >
                    <span>{isAr ? r.labelAr : r.labelEn}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                  </button>
                );
              })}
            </FloatingPopover>
          </div>
        </div>
      </div>

      {/* Action Required alert temporarily removed (user request). */}

      {/* keep storeName available for a11y / future chips without unused-var */}
      <span className="sr-only">{storeName}</span>
    </div>
  );
});

StoreOverviewHeader.displayName = 'StoreOverviewHeader';
