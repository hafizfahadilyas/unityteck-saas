import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  Type,
  Plus,
  RotateCcw,
  Check,
  Globe,
  Sliders,
  ExternalLink,
} from 'lucide-react';

export interface TypographySettings {
  fontFamily: string;
  sizeDesktop: number;
  sizeTablet: number;
  sizeMobile: number;
  weight: string;
  transform: string;
  lineHeight: number;
  letterSpacing: number;
  customFontUrl?: string;
}

interface TypographyControlProps {
  isAr: boolean;
  value: TypographySettings;
  onChange: (settings: TypographySettings) => void;
  title?: string;
}

export const POPULAR_GOOGLE_FONTS = [
  // Arabic Fonts
  { name: 'Cairo', category: 'Arabic', labelAr: 'القاهرة (Cairo) - افتراضي عصري' },
  { name: 'Tajawal', category: 'Arabic', labelAr: 'تجوال (Tajawal) - حديث وأنيق' },
  { name: 'Almarai', category: 'Arabic', labelAr: 'المراعي (Almarai) - رسمي فاخر' },
  { name: 'Readex Pro', category: 'Arabic', labelAr: 'ريدكس برو (Readex Pro) - تقني متطور' },
  { name: 'Alexandria', category: 'Arabic', labelAr: 'الإسكندرية (Alexandria) - هندسي مميز' },
  { name: 'Amiri', category: 'Arabic', labelAr: 'أميري (Amiri) - كلاسيكي نسخ شريف' },
  { name: 'Changa', category: 'Arabic', labelAr: 'شانغا (Changa) - عريض للعناوين' },
  { name: 'IBM Plex Sans Arabic', category: 'Arabic', labelAr: 'آي بي إم بليكس (IBM Arabic)' },
  { name: 'Noto Sans Arabic', category: 'Arabic', labelAr: 'نوتو سانس (Noto Sans Arabic)' },
  { name: 'Rubik', category: 'Arabic', labelAr: 'روبيك (Rubik Arabic) - مدور ناعم' },
  { name: 'El Messiri', category: 'Arabic', labelAr: 'المسيري (El Messiri) - متموج راقي' },
  { name: 'Marhey', category: 'Arabic', labelAr: 'مرحي (Marhey) - مرح وجذاب' },

  // English & Modern Fonts
  { name: 'Inter', category: 'Latin', labelAr: 'إنتر (Inter) - المعيار العالمي' },
  { name: 'Roboto', category: 'Latin', labelAr: 'روبوتو (Roboto) - جوهرة جوجل' },
  { name: 'Poppins', category: 'Latin', labelAr: 'بوبينز (Poppins) - هندسي جميل' },
  { name: 'Montserrat', category: 'Latin', labelAr: 'مونتسيرات (Montserrat) - فخم' },
  { name: 'Plus Jakarta Sans', category: 'Latin', labelAr: 'بلاس جاكرتا (Plus Jakarta)' },
  { name: 'Outfit', category: 'Latin', labelAr: 'أوتفت (Outfit) - مودرن ساس' },
  { name: 'Playfair Display', category: 'Latin', labelAr: 'بلاي فير (Playfair) - ملكي كلاسيك' },
  { name: 'Cinzel', category: 'Latin', labelAr: 'سينزل (Cinzel) - فخامة ذهبية' },
];

export const BuilderTypographyControl: React.FC<TypographyControlProps> = ({
  isAr,
  value,
  onChange,
  title,
}) => {
  const [deviceTab, setDeviceTab] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showCustomImport, setShowCustomImport] = useState(false);
  const [customImportText, setCustomImportText] = useState(value.customFontUrl || '');

  // Dynamically load Google Font into document head when selected
  useEffect(() => {
    if (value.fontFamily) {
      const fontNameClean = value.fontFamily.replace(/\s+/g, '+');
      const linkId = `google-font-${fontNameClean}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontNameClean}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [value.fontFamily]);

  const currentSize =
    deviceTab === 'desktop'
      ? value.sizeDesktop
      : deviceTab === 'tablet'
        ? value.sizeTablet
        : value.sizeMobile;

  const handleSizeChange = (num: number) => {
    if (deviceTab === 'desktop') {
      onChange({ ...value, sizeDesktop: num });
    } else if (deviceTab === 'tablet') {
      onChange({ ...value, sizeTablet: num });
    } else {
      onChange({ ...value, sizeMobile: num });
    }
  };

  const handleApplyCustomFont = () => {
    if (!customImportText.trim()) return;
    const fontName = customImportText.trim();
    // Load link
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = customImportText.startsWith('http')
      ? customImportText
      : `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}&display=swap`;
    document.head.appendChild(link);

    onChange({
      ...value,
      fontFamily: fontName,
      customFontUrl: customImportText,
    });
    setShowCustomImport(false);
  };

  return (
    <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-4 text-xs">
      {/* Header (Like Image 4: Typography title with reset & import icons) */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2 font-black text-slate-800">
          <Type className="w-4 h-4 text-indigo-600" />
          <span>{title || (isAr ? 'الخط والطباعة (Typography)' : 'Typography Control')}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowCustomImport(!showCustomImport)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            title={isAr ? 'استيراد خط مخصص من جوجل' : 'Import Custom Google Font'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({
                fontFamily: 'Cairo',
                sizeDesktop: 16,
                sizeTablet: 15,
                sizeMobile: 14,
                weight: '600',
                transform: 'none',
                lineHeight: 1.6,
                letterSpacing: 0,
              })
            }
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            title={isAr ? 'إعادة تعيين' : 'Reset'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Custom Font Import Box */}
      {showCustomImport && (
        <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
          <span className="text-[11px] font-bold text-indigo-900 block">
            {isAr ? 'استيراد خط جوجل مخصص بالاسم أو الرابط:' : 'Custom Google Font Name or URL:'}
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={customImportText}
              onChange={(e) => setCustomImportText(e.target.value)}
              placeholder="e.g. Readex Pro or https://..."
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs"
            />
            <button
              type="button"
              onClick={handleApplyCustomFont}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer"
            >
              {isAr ? 'تطبيق' : 'Import'}
            </button>
          </div>
        </div>
      )}

      {/* Font Family Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-600 block">
          {isAr ? 'عائلة الخط (Font Family):' : 'Font Family:'}
        </label>
        <select
          value={value.fontFamily}
          onChange={(e) => onChange({ ...value, fontFamily: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          style={{ fontFamily: value.fontFamily }}
        >
          <optgroup label={isAr ? 'الخطوط العربية الفاخرة' : 'Arabic Google Fonts'}>
            {POPULAR_GOOGLE_FONTS.filter((f) => f.category === 'Arabic').map((f) => (
              <option key={f.name} value={f.name}>
                {isAr ? f.labelAr : f.name}
              </option>
            ))}
          </optgroup>
          <optgroup label={isAr ? 'الخطوط الإنجليزية والعالمية' : 'English / Latin Fonts'}>
            {POPULAR_GOOGLE_FONTS.filter((f) => f.category === 'Latin').map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Responsive Size Control with Device Switcher (Exact Elementor Image 4) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600">
              {isAr ? 'حجم الخط (Size):' : 'Size:'}
            </span>

            {/* Device tabs toggle popup (Like Image 4 purple circle) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-0.5">
              <button
                type="button"
                onClick={() => setDeviceTab('desktop')}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  deviceTab === 'desktop'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Desktop Size"
              >
                <Monitor className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceTab('tablet')}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  deviceTab === 'tablet'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Tablet Size"
              >
                <Tablet className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceTab('mobile')}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  deviceTab === 'mobile'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Mobile Size"
              >
                <Smartphone className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 font-mono text-xs font-bold">
            <input
              type="number"
              min={10}
              max={80}
              value={currentSize}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="w-14 px-2 py-1 rounded-lg border border-slate-200 text-center text-xs font-bold"
            />
            <span className="text-slate-400 text-[10px]">px</span>
          </div>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min={10}
          max={80}
          value={currentSize}
          onChange={(e) => handleSizeChange(Number(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer"
        />
      </div>

      {/* Font Weight */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-600 block">
          {isAr ? 'سماكة الخط (Weight):' : 'Weight:'}
        </label>
        <select
          value={value.weight}
          onChange={(e) => onChange({ ...value, weight: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer"
        >
          <option value="400">{isAr ? 'عادي (Regular 400)' : 'Regular 400'}</option>
          <option value="500">{isAr ? 'متوسط (Medium 500)' : 'Medium 500'}</option>
          <option value="600">{isAr ? 'شبه عريض (Semi-Bold 600)' : 'Semi-Bold 600'}</option>
          <option value="700">{isAr ? 'عريض (Bold 700)' : 'Bold 700'}</option>
          <option value="800">{isAr ? 'عريض جداً (Extra-Bold 800)' : 'Extra-Bold 800'}</option>
          <option value="900">{isAr ? 'أسود سميك (Black 900)' : 'Black 900'}</option>
        </select>
      </div>

      {/* Font Preview Sample Box */}
      <div
        className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center transition-all truncate"
        style={{
          fontFamily: value.fontFamily,
          fontWeight: value.weight,
        }}
      >
        <span className="text-slate-800 font-bold block text-sm">
          {isAr ? 'زهور مكة الفاخرة · أجود باقات الورد' : 'Makkah Fresh Luxury Flowers'}
        </span>
        <span className="text-[10px] text-slate-400">
          Font: {value.fontFamily} · {value.weight}
        </span>
      </div>
    </div>
  );
};
