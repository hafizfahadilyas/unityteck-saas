import React, { useState, useEffect, useCallback } from 'react';
import {
  Code2,
  FileCode,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  Copy,
  Terminal,
  ShieldAlert,
  Zap,
  Info,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';

export interface CustomCodeSettings {
  customCss: string;
  customHeadJs: string;
  customFooterJs: string;
  enableCustomCss: boolean;
  enableHeadJs: boolean;
  enableFooterJs: boolean;
}

const DEFAULT_CUSTOM_CODE: CustomCodeSettings = {
  customCss: `/* UnityTeck Custom CSS */
.unity-custom-glow {
  transition: all 0.3s ease;
}
.unity-custom-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}`,
  customHeadJs: `<!-- Snap / Meta / TikTok Pixel or Head Meta Tags -->
<!-- e.g. <meta name="theme-custom" content="unityteck" /> -->`,
  customFooterJs: `<!-- Custom Footer / Analytics Tracking Scripts -->`,
  enableCustomCss: true,
  enableHeadJs: true,
  enableFooterJs: true,
};

export const getCustomCodeStorageKey = (storeId: string) => `unityteck_custom_code_${storeId}`;

export const readCustomCodeSettings = (storeId: string): CustomCodeSettings => {
  try {
    const raw = localStorage.getItem(getCustomCodeStorageKey(storeId));
    if (raw) {
      return { ...DEFAULT_CUSTOM_CODE, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to read custom code settings:', err);
  }
  return DEFAULT_CUSTOM_CODE;
};

export const writeCustomCodeSettings = (storeId: string, settings: CustomCodeSettings): void => {
  try {
    localStorage.setItem(getCustomCodeStorageKey(storeId), JSON.stringify(settings));

    // Live inject/update custom CSS in document
    if (typeof document !== 'undefined') {
      let styleTag = document.getElementById('unityteck-live-custom-css') as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'unityteck-live-custom-css';
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = settings.enableCustomCss ? settings.customCss : '';
    }

    // Fire live sync events
    window.dispatchEvent(new CustomEvent('unityteck-theme-settings'));
    window.dispatchEvent(new CustomEvent('unityteck-data'));
  } catch (err) {
    console.error('Failed to write custom code settings:', err);
  }
};

export const CustomCodeForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'css' | 'head' | 'footer'>('css');
  const [settings, setSettings] = useState<CustomCodeSettings>(() =>
    readCustomCodeSettings(activeStore?.id || 'default'),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Sync settings when active store changes
  useEffect(() => {
    setSettings(readCustomCodeSettings(activeStore?.id || 'default'));
  }, [activeStore?.id]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    writeCustomCodeSettings(activeStore?.id || 'default', settings);
    setTimeout(() => {
      setIsSaving(false);
      toast(
        isAr ? 'تم حفظ وتطبيق الأكواد البرمجية مباشرة!' : 'Custom code saved and applied live!',
        'success',
      );
    }, 200);
  }, [activeStore?.id, settings, isAr, toast]);

  const handleReset = useCallback(() => {
    setSettings(DEFAULT_CUSTOM_CODE);
    writeCustomCodeSettings(activeStore?.id || 'default', DEFAULT_CUSTOM_CODE);
    toast(isAr ? 'تمت استعادة الأكواد الافتراضية' : 'Reset to default code snippets', 'info');
  }, [activeStore?.id, isAr, toast]);

  const handleAppendSnippet = (code: string, tab: 'css' | 'head' | 'footer', snippetId: string) => {
    if (tab === 'css') {
      setSettings((prev) => ({
        ...prev,
        customCss: `${prev.customCss}\n\n${code}`,
      }));
    } else if (tab === 'head') {
      setSettings((prev) => ({
        ...prev,
        customHeadJs: `${prev.customHeadJs}\n\n${code}`,
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        customFooterJs: `${prev.customFooterJs}\n\n${code}`,
      }));
    }
    setCopiedSnippet(snippetId);
    setTimeout(() => setCopiedSnippet(null), 2000);
    toast(isAr ? 'تمت إضافة الكود الجاهز للمحرر' : 'Snippet added to editor', 'success');
  };

  const SNIPPETS = [
    {
      id: 'snip-hover',
      titleAr: 'تأثير التحويم والرفع للبطاقات',
      titleEn: 'Card Hover Lift Animation',
      tab: 'css' as const,
      code: `/* Smooth Card Lift on Hover */
.product-card-item, .card, [data-card] {
  transition: transform 0.25s ease, box-shadow 0.25s ease !important;
}
.product-card-item:hover, .card:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15) !important;
}`,
    },
    {
      id: 'snip-gold',
      titleAr: 'توهج وتدرج ذهبي فاخر للعناوين',
      titleEn: 'Luxury Gold Metallic Headings',
      tab: 'css' as const,
      code: `/* Luxury Gold Text Gradient */
.gold-heading-accent, h1.hero-title, .brand-title {
  background: linear-gradient(135deg, #f7d070 0%, #d4af37 50%, #aa7c11 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}`,
    },
    {
      id: 'snip-scrollbar',
      titleAr: 'تخصيص شريط التمرير الناعم',
      titleEn: 'Slim Luxury Scrollbar',
      tab: 'css' as const,
      code: `/* Ultra-Slim Custom Scrollbar */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.04);
}
::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.4);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.8);
}`,
    },
    {
      id: 'snip-pixel',
      titleAr: 'قالب كود بكسل التتبع (Meta / Snap)',
      titleEn: 'Ad Tracking Pixel Template',
      tab: 'head' as const,
      code: `<!-- Ad Pixel Tracking Template -->
<script>
  window._unityPixelQueue = window._unityPixelQueue || [];
  console.log('UnityTeck Storefront: Ad Pixel Initialized for Store: ${activeStore?.id || 'live'}');
</script>`,
    },
  ];

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Informative Header Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 space-y-1.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-xs">
              {isAr ? 'الأكواد البرمجية والتنسيقات المخصصة' : 'Custom Code & Custom CSS/JS'}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold">
            {isAr ? 'تطبيق حي ومباشر' : 'Live Injection'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isAr
            ? 'أضف تنسيقات CSS مخصصة لتعديل مظهر القالب، أو أكواد التتبع مثل Snap Pixel وميتا وجوجل أناليتكس بكل سهولة.'
            : 'Add custom CSS styles to tailor the theme look-and-feel, or inject Meta/Snap/TikTok tracking pixels and header tags.'}
        </p>
      </div>

      {/* Editor Sub-Tabs (CSS / Head JS / Footer JS) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('css')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'css'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>{isAr ? 'CSS مخصص' : 'Custom CSS'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('head')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'head'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{isAr ? 'أكواد <head>' : '<head> Scripts'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('footer')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'footer'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isAr ? 'أكواد الفوتر' : 'Footer Scripts'}</span>
        </button>
      </div>

      {/* Editor Content Area */}
      {activeTab === 'css' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>{isAr ? 'محرر CSS المباشر:' : 'Live Custom CSS Editor:'}</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-500">
              <input
                type="checkbox"
                checked={settings.enableCustomCss}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, enableCustomCss: e.target.checked }))
                }
                className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
              />
              <span>{isAr ? 'تفعيل التنسيقات' : 'Enable CSS'}</span>
            </label>
          </div>

          <div className="relative rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-950 overflow-hidden font-mono text-[12px] shadow-inner">
            <div className="h-6 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500/80" />
                <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                <span className="ms-1.5 text-slate-500">style.css</span>
              </div>
              <span>{settings.customCss.length} chars</span>
            </div>
            <textarea
              value={settings.customCss}
              onChange={(e) => setSettings((prev) => ({ ...prev, customCss: e.target.value }))}
              placeholder="/* Add your custom CSS styles here */"
              rows={12}
              dir="ltr"
              className="w-full p-3 bg-transparent text-emerald-400 outline-none resize-y placeholder:text-slate-600 font-mono text-[12px] leading-relaxed selection:bg-indigo-600 selection:text-white"
            />
          </div>
        </div>
      )}

      {activeTab === 'head' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>{isAr ? 'أكواد الهيدر والتتبع (<head>):' : '<head> Header & Pixel Tracking Code:'}</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-500">
              <input
                type="checkbox"
                checked={settings.enableHeadJs}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, enableHeadJs: e.target.checked }))
                }
                className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
              />
              <span>{isAr ? 'تفعيل أكواد الهيدر' : 'Enable Head Scripts'}</span>
            </label>
          </div>

          <div className="relative rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-950 overflow-hidden font-mono text-[12px] shadow-inner">
            <div className="h-6 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500/80" />
                <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                <span className="ms-1.5 text-slate-500">head-scripts.html</span>
              </div>
              <span>{settings.customHeadJs.length} chars</span>
            </div>
            <textarea
              value={settings.customHeadJs}
              onChange={(e) => setSettings((prev) => ({ ...prev, customHeadJs: e.target.value }))}
              placeholder="<!-- Add your tracking pixels or meta tags here -->"
              rows={12}
              dir="ltr"
              className="w-full p-3 bg-transparent text-cyan-300 outline-none resize-y placeholder:text-slate-600 font-mono text-[12px] leading-relaxed selection:bg-indigo-600 selection:text-white"
            />
          </div>
        </div>
      )}

      {activeTab === 'footer' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>{isAr ? 'أكواد الفوتر ونهاية الصفحة (قبل </body>):' : 'Footer Scripts & Widgets (before </body>):'}</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-500">
              <input
                type="checkbox"
                checked={settings.enableFooterJs}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, enableFooterJs: e.target.checked }))
                }
                className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
              />
              <span>{isAr ? 'تفعيل أكواد الفوتر' : 'Enable Footer Scripts'}</span>
            </label>
          </div>

          <div className="relative rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-950 overflow-hidden font-mono text-[12px] shadow-inner">
            <div className="h-6 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500/80" />
                <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                <span className="ms-1.5 text-slate-500">footer-scripts.html</span>
              </div>
              <span>{settings.customFooterJs.length} chars</span>
            </div>
            <textarea
              value={settings.customFooterJs}
              onChange={(e) => setSettings((prev) => ({ ...prev, customFooterJs: e.target.value }))}
              placeholder="<!-- Add your footer scripts or live chat snippets here -->"
              rows={12}
              dir="ltr"
              className="w-full p-3 bg-transparent text-amber-300 outline-none resize-y placeholder:text-slate-600 font-mono text-[12px] leading-relaxed selection:bg-indigo-600 selection:text-white"
            />
          </div>
        </div>
      )}

      {/* Ready-to-Use Snippets Section */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>{isAr ? 'أكواد وتأثيرات سريعة جاهزة للإضافة' : 'Quick Ready-to-Use Snippets'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SNIPPETS.map((snip) => (
            <button
              key={snip.id}
              type="button"
              onClick={() => handleAppendSnippet(snip.code, snip.tab, snip.id)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-900 text-start flex items-center justify-between gap-2 cursor-pointer transition-all hover:shadow-xs group"
            >
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white block truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {isAr ? snip.titleAr : snip.titleEn}
                </span>
                <span className="text-[9px] font-mono text-slate-400 uppercase mt-0.5 block">
                  {snip.tab.toUpperCase()}
                </span>
              </div>
              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                {copiedSnippet === snip.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'إعادة الضبط' : 'Reset'}</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ وتطبيق الكود' : 'Save & Apply Code'}</span>
        </button>
      </div>
    </div>
  );
};
