import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import { useTenant } from '../../../../context/TenantContext';
import { usePrefs } from '../../../../i18n/PrefsContext';
import { useToast } from '../../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  resolveStoreActiveThemeId,
  type AllThemeSettings,
} from '../../../../themes/settings/themeSettingsStore';
import { isCoffeeStore, resolveCoffeeThemeSettings } from '../../../../themes/settings/coffeeThemeDefaults';

const SLICE_LIST: Partial<Record<string, string>> = {
  heroBanners: 'banners',
  featuredCategoriesProducts: 'sections',
  featuredSectionBanners: 'banners',
  featuredProducts: 'tabs',
  imageBanners: 'items',
  exclusiveBenefits: 'items',
  customOrder: 'fields',
  footer: 'columns',
  announcementBar: 'messages',
  enhancedFeatures: 'features',
  slider: 'slides',
  banners: 'banners',
};

function listLength(slice: unknown, field: string | undefined): number {
  if (!field || !slice || typeof slice !== 'object') return 0;
  const list = (slice as Record<string, unknown>)[field];
  return Array.isArray(list) ? list.length : 0;
}

/** Keep the storefront list when a remote save stored an empty array over real rows. */
export function preferVisibleSlice<T>(key: string, visible: T, remote: T): T {
  const field = SLICE_LIST[key];
  if (!field || remote == null || typeof remote !== 'object') return remote ?? visible;
  if (listLength(remote, field) === 0 && listLength(visible, field) > 0) {
    return { ...(remote as object), [field]: (visible as Record<string, unknown>)[field] } as T;
  }
  return remote;
}

export function editorThemeSettings(
  storeId: string,
  store: { id?: string; name?: string; category?: string },
): AllThemeSettings {
  if (isCoffeeStore(store)) return resolveCoffeeThemeSettings(storeId, store);
  return readAllThemeSettings(storeId, store as Parameters<typeof readAllThemeSettings>[1]);
}

export function duplicateAt<T extends { id: string }>(list: T[], index: number, prefix: string): T[] {
  const src = list[index];
  if (!src) return list;
  const copy = { ...src, id: `${prefix}-${Date.now()}` };
  const next = [...list];
  next.splice(index + 1, 0, copy);
  return next;
}

export function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const next = [...list];
  const j = index + dir;
  if (j < 0 || j >= next.length) return list;
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}

export function useCoffeeDraft<K extends keyof AllThemeSettings>(key: K) {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const [draft, setDraft] = useState(() => editorThemeSettings(activeStore.id, activeStore)[key]);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const local = editorThemeSettings(activeStore.id, activeStore);
    setDraft(local[key]);

    let cancelled = false;
    void import('../../../../api/client')
      .then(({ isApiEnabled }) => {
        if (!isApiEnabled()) return null;
        return import('../../../../api/tenantApi').then(({ fetchThemeSettingsApi }) =>
          fetchThemeSettingsApi(activeStore.id),
        );
      })
      .then((row) => {
        if (cancelled || !row) return;
        const remoteSettings = (row.settings || {}) as Record<string, unknown>;
        const byTheme = (remoteSettings.by_theme as Record<string, Record<string, unknown>> | undefined)?.[row.theme_id];
                const remote = (remoteSettings[key as string] ?? byTheme?.[key as string]) as AllThemeSettings[K] | undefined;
        if (remote == null || typeof remote !== 'object') return;
        const picked = preferVisibleSlice(String(key), local[key], remote);
        setDraft(picked);
        const field = SLICE_LIST[String(key)];
        const remoteEmpty = field && listLength(remote, field) === 0 && listLength(local[key], field) > 0;
        if (remoteEmpty) return;
        const next = { ...local, [key]: picked } as AllThemeSettings;
        // Hydrate cache only — do not echo GET back as PUT
        void writeAllThemeSettings(activeStore.id, next, undefined, { syncApi: false });
      })
      .catch(() => {
        /* keep local draft */
      });

    return () => {
      cancelled = true;
    };
  }, [activeStore.id, key]);

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const full = readAllThemeSettings(activeStore.id, activeStore);
      (full as unknown as Record<string, unknown>)[key as string] = draft;
      // Keep legacy slider in sync when coffee hero banners are saved
      if (key === 'heroBanners' && draft && typeof draft === 'object') {
        const hero = draft as AllThemeSettings['heroBanners'];
        full.slider = {
          ...full.slider,
          enabled: hero.enabled !== false,
          autoPlay: !!hero.autoplay,
          transitionDuration: Math.max(3, Math.round((hero.intervalMs || 5000) / 1000)),
          slides: (hero.banners || []).map((b) => ({
            id: b.id,
            type: 'image' as const,
            image: b.image || '',
            title: b.titleEn || b.titleAr || '',
            titleEn: b.titleEn || '',
            titleAr: b.titleAr || '',
            subtitle: b.descriptionEn || b.descriptionAr || '',
            subtitleEn: b.descriptionEn || '',
            subtitleAr: b.descriptionAr || '',
            badge: b.promoEn || b.promoAr || '',
            badgeEn: b.promoEn || '',
            badgeAr: b.promoAr || '',
            buttonText: b.buyNowEn || b.learnMoreEn || '',
            buttonTextEn: b.buyNowEn || '',
            buttonTextAr: b.buyNowAr || '',
            buttonUrl: b.learnMoreUrl || '',
            buttonLink: b.learnMoreUrl || '',
            productId: b.productId || '',
            priceEn: b.price || '',
            priceAr: b.price || '',
          })),
        };
      }
      if (key === 'footer' && draft && typeof draft === 'object') {
        const foot = draft as AllThemeSettings['footer'];
        full.general = {
          ...full.general,
          footerLayout: foot?.layout || full.general?.footerLayout || 'columns',
        };
      }
      await writeAllThemeSettings(activeStore.id, full);

      // Real Hostinger persist — coffee modular key into store_themes.settings (by_theme)
      try {
        const { isApiEnabled } = await import('../../../../api/client');
        if (isApiEnabled()) {
          const { updateThemeSettingsApi } = await import('../../../../api/tenantApi');
          const themeId = resolveStoreActiveThemeId(activeStore.id) || 'theme-coffee-artisan';
          const payloadSettings: Record<string, unknown> = {
            [key as string]: draft,
          };
          if (key === 'heroBanners' && full.slider) {
            payloadSettings.slider = full.slider;
          }
          if (key === 'footer' && full.general) {
            payloadSettings.general = {
              ...full.general,
              footerLayout: (draft as AllThemeSettings['footer'])?.layout || full.general.footerLayout,
            };
          }
          await updateThemeSettingsApi(activeStore.id, {
            theme_id: themeId,
            settings: payloadSettings,
          });
        }
      } catch {
        toast(
          isAr
            ? 'حُفظ محلياً، لكن مزامنة الخادم فشلت. أعد المحاولة.'
            : 'Saved locally, but server sync failed. Try again.',
          'error',
        );
        setSaving(false);
        return;
      }

      setSavedFlash(true);
      toast(
        isAr ? 'تم الحفظ في الخادم. الواجهة تتحدّث بعد هذا الحفظ.' : 'Saved to the server. The storefront updates after this save.',
        'success',
      );
      window.setTimeout(() => setSavedFlash(false), 2200);
    } catch {
      toast(isAr ? 'فشل الحفظ في الخادم. المسودة المحلية ما زالت محفوظة.' : 'Server save failed. The local draft is still kept.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return { draft, setDraft, save, saving, savedFlash, isAr, activeStore, toast };
}

export const DraftNote: React.FC<{ isAr: boolean }> = ({ isAr }) => (
  <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
    {isAr
      ? 'المعاينة أدناه مسودة. المتجر المباشر يتحدّث بعد حفظ التغييرات (نشر عبر حفظ إعدادات الثيم).'
      : 'Preview below is a draft. The live storefront updates after Save (theme settings publish).'}
  </p>
);

export const SaveBar: React.FC<{
  isAr: boolean;
  saving: boolean;
  savedFlash: boolean;
  onSave: (e: React.FormEvent) => void;
}> = ({ isAr, saving, savedFlash, onSave }) => (
  <div className="flex items-center justify-end gap-2 pt-2">
    <button
      type="button"
      onClick={(e) => onSave(e as unknown as React.FormEvent)}
      disabled={saving}
      className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 disabled:opacity-60"
    >
      <Save className="w-3.5 h-3.5" />
      {savedFlash ? (isAr ? 'تم الحفظ' : 'Saved') : saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : isAr ? 'حفظ التغييرات' : 'Save Changes'}
    </button>
  </div>
);

export const EnableRow: React.FC<{
  isAr: boolean;
  enabled: boolean;
  onChange: (v: boolean) => void;
  labelEn?: string;
  labelAr?: string;
}> = ({ isAr, enabled, onChange, labelEn = 'Enable section', labelAr = 'تفعيل القسم' }) => (
  <label className="flex items-center justify-between gap-3 text-xs font-bold">
    <span>{isAr ? labelAr : labelEn}</span>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`w-11 h-6 rounded-full p-0.5 transition-colors ${enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
      aria-pressed={enabled}
    >
      <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
    </button>
  </label>
);

export const BiFields: React.FC<{
  isAr: boolean;
  labelEn: string;
  labelAr: string;
  en: string;
  ar: string;
  onEn: (v: string) => void;
  onAr: (v: string) => void;
  max?: number;
}> = ({ isAr, labelEn, labelAr, en, ar, onEn, onAr, max }) => {
  const enTag = isAr ? 'إنجليزي' : 'English';
  const arTag = isAr ? 'عربي' : 'Arabic';
  const base = isAr ? labelAr : labelEn;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <label className="text-[11px] font-bold space-y-1">
        <span>{`${base} (${enTag})`}{max ? ` · ${(en || '').length}/${max}` : ''}</span>
        <input
          value={en || ''}
          maxLength={max}
          onChange={(e) => onEn(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border text-xs"
          style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
          dir="ltr"
        />
      </label>
      <label className="text-[11px] font-bold space-y-1">
        <span>{`${base} (${arTag})`}{max ? ` · ${(ar || '').length}/${max}` : ''}</span>
        <input
          value={ar || ''}
          maxLength={max}
          onChange={(e) => onAr(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border text-xs"
          style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
          dir="rtl"
        />
      </label>
    </div>
  );
};

export const RowTools: React.FC<{
  index: number;
  total: number;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  visible?: boolean;
  onToggleVisible?: () => void;
  isAr?: boolean;
}> = ({ index, total, onUp, onDown, onDelete, onDuplicate, visible = true, onToggleVisible, isAr }) => (
  <div className="flex items-center gap-1">
    {onToggleVisible ? (
      <button
        type="button"
        onClick={onToggleVisible}
        className="p-1 rounded-lg border"
        style={{ borderColor: 'var(--border)' }}
        title={isAr ? (visible ? 'إخفاء' : 'إظهار') : visible ? 'Hide' : 'Show'}
        aria-label={isAr ? (visible ? 'إخفاء' : 'إظهار') : visible ? 'Hide' : 'Show'}
      >
        {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>
    ) : null}
    <button type="button" disabled={index === 0} onClick={onUp} className="p-1 rounded-lg border disabled:opacity-30" style={{ borderColor: 'var(--border)' }} title={isAr ? 'تحريك لأعلى' : 'Move up'}>
      <ChevronUp className="w-3.5 h-3.5" />
    </button>
    <button type="button" disabled={index === total - 1} onClick={onDown} className="p-1 rounded-lg border disabled:opacity-30" style={{ borderColor: 'var(--border)' }} title={isAr ? 'تحريك لأسفل' : 'Move down'}>
      <ChevronDown className="w-3.5 h-3.5" />
    </button>
    {onDuplicate ? (
      <button type="button" onClick={onDuplicate} className="p-1 rounded-lg border" style={{ borderColor: 'var(--border)' }} title={isAr ? 'نسخ' : 'Duplicate'} aria-label={isAr ? 'نسخ' : 'Duplicate'}>
        <Copy className="w-3.5 h-3.5" />
      </button>
    ) : null}
    <button type="button" onClick={onDelete} className="p-1 rounded-lg border text-rose-600" style={{ borderColor: 'var(--border)' }} title={isAr ? 'حذف' : 'Delete'} aria-label={isAr ? 'حذف' : 'Delete'}>
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

export const AddButton: React.FC<{ isAr: boolean; onClick: () => void; labelEn: string; labelAr: string }> = ({
  isAr,
  onClick,
  labelEn,
  labelAr,
}) => (
  <button type="button" onClick={onClick} className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
    <Plus className="w-3.5 h-3.5" />
    {isAr ? labelAr : labelEn}
  </button>
);

export const cardCls = 'rounded-2xl border p-4 space-y-3';
export const cardStyle = { background: 'var(--surface)', borderColor: 'var(--border)' } as const;
