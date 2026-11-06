import React from 'react';
import { Image as ImageIcon, Palette } from 'lucide-react';
import { MediaUploadField } from '../../common/MediaUploadField';
import { usePrefs } from '../../../i18n/PrefsContext';
import {
  applySidebarDesign,
  CHROME_GRADIENTS,
  SIDEBAR_DESIGNS,
  type StoreChromeBrand,
} from '../../../i18n/storeChrome';

export const StoreChromeFields: React.FC<{
  chrome: StoreChromeBrand;
  onChange: (next: StoreChromeBrand) => void;
}> = ({ chrome, onChange }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  return (
    <div
      className="p-5 rounded-2xl border shadow-2xs space-y-5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
    >
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <div>
          <h3 className="font-extrabold text-sm">
            {isAr ? 'تدرج ولون مخصص وخلفية' : 'Gradient, custom color, and background'}
          </h3>
          <p className="text-[11px] opacity-70 mt-0.5">
            {isAr
              ? 'يُحفظ لهذا المتجر فقط. الشريط والقائمة والأيقونات تتبدل فوراً.'
              : 'Saved for this store only. Sidebar, header, and icons update immediately.'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-bold">{isAr ? 'تصميم الشريط الجانبي' : 'Sidebar design'}</div>
        <p className="text-[11px] opacity-70">
          {isAr
            ? 'اختر تصميماً. الشكل والأيقونات والألوان تتبدل لهذا المتجر فقط.'
            : 'Pick a design. Shape, icons, and colors change for this store only.'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SIDEBAR_DESIGNS.map((d) => {
            const active = (chrome.sidebarDesign || 'classic') === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onChange(applySidebarDesign(chrome, d.id))}
                className={`p-2 rounded-xl border text-start cursor-pointer ${active ? 'ring-2' : ''}`}
                style={{ borderColor: active ? d.accent : 'var(--border)', background: 'var(--bg)' }}
              >
                <span
                  className="block rounded-lg p-1.5 mb-1.5"
                  style={{ background: `linear-gradient(180deg, ${d.from}, ${d.to})` }}
                >
                  <span className="block h-1.5 w-8 rounded-full mb-1" style={{ background: d.idle, opacity: 0.7 }} />
                  <span className="block h-2.5 rounded-full" style={{ background: d.cta }} />
                  <span className="block h-1.5 w-10 rounded-full mt-1" style={{ background: d.idle, opacity: 0.45 }} />
                </span>
                <span className="text-[10px] font-bold">{isAr ? d.labelAr : d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-bold">{isAr ? 'تدرجات جاهزة' : 'Gradient presets'}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CHROME_GRADIENTS.map((g) => {
            const active = chrome.fill === 'gradient' && chrome.gradientFrom === g.from && chrome.gradientTo === g.to;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onChange({ ...chrome, fill: 'gradient', gradientFrom: g.from, gradientTo: g.to })}
                className={`p-2 rounded-xl border text-start cursor-pointer ${active ? 'ring-2' : ''}`}
                style={{ borderColor: active ? 'var(--accent)' : 'var(--border)' }}
              >
                <span
                  className="block h-8 rounded-lg mb-1.5"
                  style={{ background: `linear-gradient(90deg, ${g.from}, ${g.to})` }}
                />
                <span className="text-[10px] font-bold">{isAr ? g.labelAr : g.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-bold">{isAr ? 'لون مخصص' : 'Custom color'}</div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label={isAr ? 'اختيار لون' : 'Pick a color'}
            value={chrome.customColor}
            onChange={(e) => onChange({ ...chrome, fill: 'custom', customColor: e.target.value })}
            className="w-12 h-10 rounded-lg border cursor-pointer bg-transparent"
            style={{ borderColor: 'var(--border)' }}
          />
          <input
            type="text"
            value={chrome.customColor}
            onChange={(e) => {
              const next = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(next)) onChange({ ...chrome, fill: 'custom', customColor: next });
            }}
            onBlur={() => {
              if (!/^#[0-9a-fA-F]{6}$/.test(chrome.customColor)) {
                onChange({ ...chrome, customColor: '#1d8b94' });
              }
            }}
            className="flex-1 px-3 py-2 text-xs rounded-xl border font-mono"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{isAr ? 'صورة خلفية للشريط' : 'Sidebar background image'}</span>
        </div>
        <MediaUploadField
          label={isAr ? 'صورة الخلفية' : 'Background image'}
          value={chrome.bgImage}
          onChange={(url) => onChange({ ...chrome, fill: url ? 'image' : 'palette', bgImage: url })}
          aspectRatio="banner"
          allowedTypes={['image']}
        />
        {chrome.bgImage ? (
          <button
            type="button"
            className="text-[11px] font-semibold cursor-pointer"
            style={{ color: 'var(--accent)' }}
            onClick={() => onChange({ ...chrome, fill: 'palette', bgImage: '' })}
          >
            {isAr ? 'إزالة صورة الخلفية' : 'Remove background image'}
          </button>
        ) : null}
      </div>
    </div>
  );
};
