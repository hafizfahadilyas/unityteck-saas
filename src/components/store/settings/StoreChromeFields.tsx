import React from 'react';
import { ALargeSmall, Image as ImageIcon, PaintBucket, Palette } from 'lucide-react';
import { MediaUploadField } from '../../common/MediaUploadField';
import { usePrefs } from '../../../i18n/PrefsContext';
import {
  applySidebarDesign,
  CHROME_GRADIENTS,
  SHELL_WALLPAPER_PRESETS,
  SIDEBAR_DESIGNS,
  type ShellTextMode,
  type StoreChromeBrand,
} from '../../../i18n/storeChrome';

const TEXT_MODES: Array<{ id: ShellTextMode; labelEn: string; labelAr: string }> = [
  { id: 'auto', labelEn: 'Auto (from wallpaper)', labelAr: 'تلقائي (من الخلفية)' },
  { id: 'light', labelEn: 'Dark text', labelAr: 'نص داكن' },
  { id: 'dark', labelEn: 'Light text', labelAr: 'نص فاتح' },
  { id: 'custom', labelEn: 'Custom hex', labelAr: 'لون مخصص' },
];

export const StoreChromeFields: React.FC<{
  chrome: StoreChromeBrand;
  onChange: (next: StoreChromeBrand) => void;
}> = ({ chrome, onChange }) => {
  const { locale, setBrand } = usePrefs();
  const isAr = locale === 'ar';
  const pageBg = chrome.pageBgColor || '';
  const pageText = chrome.pageTextColor || '';
  const textMode: ShellTextMode = chrome.shellTextMode || (pageText ? 'custom' : 'auto');

  const syncBrandColors = (bg: string, text: string) => {
    setBrand({
      customBgHex: bg || null,
      customTextHex: text || null,
    });
  };

  return (
    <div
      className="u-card p-5 rounded-[1.25rem] space-y-5"
      style={{ color: 'var(--text)' }}
    >
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <div>
          <h3 className="font-extrabold text-sm">
            {isAr ? 'تدرج ولون مخصص وخلفية' : 'Gradient, custom color, and background'}
          </h3>
          <p className="text-[11px] opacity-70 mt-0.5">
            {isAr
              ? 'المعاينة فورية لهذا المتجر. بعد التغيير اضغط «حفظ المظهر» أسفل الصفحة.'
              : 'Live preview for this store. After changes, click Save appearance below.'}
          </p>
        </div>
      </div>

      {/* Store-owner global page BG + text (works with picture wallpaper too) */}
      <div className="space-y-3 p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <PaintBucket className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>{isAr ? 'خلفية ونص لوحة التحكم (عام)' : 'Dashboard background & text (global)'}</span>
        </div>
        <p className="text-[11px] opacity-70">
          {isAr
            ? 'يتحكم المالك بلون الخلفية ولون النص لكل صفحات لوحة التحكم لهذا المتجر.'
            : 'Store owner controls page background and text color across this store admin.'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold w-full sm:w-auto">{isAr ? 'لون الخلفية' : 'Background'}</span>
          <input
            type="color"
            value={pageBg && /^#[0-9a-fA-F]{6}$/.test(pageBg) ? pageBg : '#e2e8f0'}
            onChange={(e) => {
              const next = { ...chrome, pageBgColor: e.target.value };
              onChange(next);
              syncBrandColors(e.target.value, pageText);
            }}
            className="w-10 h-9 rounded-lg border cursor-pointer bg-transparent"
            style={{ borderColor: 'var(--border)' }}
            aria-label={isAr ? 'لون خلفية الصفحات' : 'Page background color'}
          />
          <input
            type="text"
            dir="ltr"
            value={pageBg}
            placeholder="#e2e8f0"
            onChange={(e) => {
              const v = e.target.value.trim();
              if (v === '' || /^#[0-9a-fA-F]{0,6}$/.test(v)) {
                if (v.length === 7 || v === '') {
                  onChange({ ...chrome, pageBgColor: v });
                  syncBrandColors(v, pageText);
                }
              }
            }}
            className="flex-1 min-w-[6rem] px-2 py-1.5 text-xs font-mono rounded-lg border"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
          />
          {pageBg ? (
            <button
              type="button"
              className="text-[10px] font-bold cursor-pointer"
              style={{ color: 'var(--accent)' }}
              onClick={() => {
                onChange({ ...chrome, pageBgColor: '' });
                syncBrandColors('', pageText);
              }}
            >
              {isAr ? 'مسح' : 'Clear'}
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ALargeSmall className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span className="text-[10px] font-bold">{isAr ? 'لون النص' : 'Text color'}</span>
          <input
            type="color"
            value={pageText && /^#[0-9a-fA-F]{6}$/.test(pageText) ? pageText : '#0f172a'}
            onChange={(e) => {
              onChange({
                ...chrome,
                pageTextColor: e.target.value,
                shellTextMode: 'custom',
              });
              syncBrandColors(pageBg, e.target.value);
            }}
            className="w-10 h-9 rounded-lg border cursor-pointer bg-transparent"
            style={{ borderColor: 'var(--border)' }}
            aria-label={isAr ? 'لون النص' : 'Text color'}
          />
          <input
            type="text"
            dir="ltr"
            value={pageText}
            placeholder="#0f172a"
            onChange={(e) => {
              const v = e.target.value.trim();
              if (v === '' || /^#[0-9a-fA-F]{0,6}$/.test(v)) {
                if (v.length === 7 || v === '') {
                  onChange({
                    ...chrome,
                    pageTextColor: v,
                    shellTextMode: v ? 'custom' : 'auto',
                  });
                  syncBrandColors(pageBg, v);
                }
              }
            }}
            className="flex-1 min-w-[6rem] px-2 py-1.5 text-xs font-mono rounded-lg border"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
          />
          {pageText ? (
            <button
              type="button"
              className="text-[10px] font-bold cursor-pointer"
              style={{ color: 'var(--accent)' }}
              onClick={() => {
                onChange({ ...chrome, pageTextColor: '', shellTextMode: 'auto' });
                syncBrandColors(pageBg, '');
              }}
            >
              {isAr ? 'مسح' : 'Clear'}
            </button>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold">{isAr ? 'نمط نص العناوين فوق الخلفية' : 'Title text over wallpaper'}</div>
          <div className="flex flex-wrap gap-1.5">
            {TEXT_MODES.map((m) => {
              const active = textMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...chrome,
                      shellTextMode: m.id,
                      ...(m.id !== 'custom' ? { pageTextColor: m.id === 'auto' ? '' : chrome.pageTextColor } : {}),
                    })
                  }
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                    active ? 'ring-2' : ''
                  }`}
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                    background: active ? 'var(--surface)' : 'var(--bg)',
                    color: 'var(--text)',
                  }}
                >
                  {isAr ? m.labelAr : m.labelEn}
                </button>
              );
            })}
          </div>
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
          <span>{isAr ? 'خلفية الزجاج (لوحة التحكم)' : 'Glass dashboard wallpaper'}</span>
        </div>
        <p className="text-[11px] opacity-70">
          {isAr
            ? 'خلفية ضبابية خلف البطاقات الشفافة. يمكن تغييرها في أي وقت لهذا المتجر فقط.'
            : 'Blurred wallpaper behind frosted glass panels. Change anytime for this store only.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SHELL_WALLPAPER_PRESETS.map((p) => {
            const active =
              !chrome.shellWallpaper && (chrome.shellWallpaperPreset || 'city-warm') === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...chrome,
                    shellWallpaperPreset: p.id,
                    shellWallpaper: '',
                  })
                }
                className={`p-2 rounded-xl text-start cursor-pointer transition-shadow ${
                  active ? 'ring-2' : ''
                }`}
                style={{
                  background: 'var(--glass-fill, var(--surface))',
                  boxShadow: active ? '0 0 0 2px var(--accent)' : 'var(--glass-shadow, none)',
                }}
              >
                <span
                  className="block h-10 rounded-lg mb-1.5"
                  data-shell-wallpaper-preview={p.id}
                  style={{
                    background:
                      p.id === 'city-warm'
                        ? 'radial-gradient(circle at 20% 30%, #fbbf24aa, transparent 40%), radial-gradient(circle at 80% 20%, #f472b6aa, transparent 35%), linear-gradient(135deg, #7c6a5a, #4a5568)'
                        : p.id === 'peach-lavender'
                          ? 'linear-gradient(135deg, #f5d0c5, #d4c4e8, #c9b8a8)'
                          : 'radial-gradient(circle at 30% 40%, #38bdf8aa, transparent 45%), linear-gradient(165deg, #0f172a, #1e293b)',
                  }}
                />
                <span className="text-[10px] font-bold">{isAr ? p.labelAr : p.label}</span>
              </button>
            );
          })}
        </div>
        <MediaUploadField
          label={isAr ? 'رفع خلفية مخصصة' : 'Upload custom wallpaper'}
          value={chrome.shellWallpaper}
          onChange={(url) =>
            onChange({
              ...chrome,
              shellWallpaperPreset: url ? 'custom' : 'city-warm',
              shellWallpaper: url,
            })
          }
          aspectRatio="banner"
          allowedTypes={['image']}
          showUrlInput
          chromeImageField="shellWallpaper"
          initialFolder="chrome"
          placeholder={isAr ? 'https://… رابط الصورة' : 'https://… image URL'}
        />
        {chrome.shellWallpaper ? (
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span>{isAr ? 'ضبابية الخلفية' : 'Background blur'}</span>
                <span className="font-mono opacity-70">{chrome.shellWallpaperBlur ?? 10}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={24}
                step={1}
                value={chrome.shellWallpaperBlur ?? 10}
                onChange={(e) =>
                  onChange({
                    ...chrome,
                    shellWallpaperPreset: 'custom',
                    shellWallpaperBlur: Number(e.target.value),
                  })
                }
                className="w-full cursor-pointer accent-[var(--accent)]"
                aria-label={isAr ? 'ضبابية صورة الخلفية' : 'Wallpaper blur'}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span>{isAr ? 'شفافية الخلفية' : 'Background opacity'}</span>
                <span className="font-mono opacity-70">
                  {Math.round((chrome.shellWallpaperOpacity ?? 0.92) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={100}
                step={1}
                value={Math.round((chrome.shellWallpaperOpacity ?? 0.92) * 100)}
                onChange={(e) =>
                  onChange({
                    ...chrome,
                    shellWallpaperPreset: 'custom',
                    shellWallpaperOpacity: Number(e.target.value) / 100,
                  })
                }
                className="w-full cursor-pointer accent-[var(--accent)]"
                aria-label={isAr ? 'شفافية صورة الخلفية' : 'Wallpaper opacity'}
              />
            </div>
            <button
              type="button"
              className="text-[11px] font-semibold cursor-pointer"
              style={{ color: 'var(--accent)' }}
              onClick={() =>
                onChange({
                  ...chrome,
                  shellWallpaperPreset: 'city-warm',
                  shellWallpaper: '',
                })
              }
            >
              {isAr ? 'إزالة الخلفية المخصصة' : 'Remove custom wallpaper'}
            </button>
          </div>
        ) : null}
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
          chromeImageField="bgImage"
          initialFolder="chrome"
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
