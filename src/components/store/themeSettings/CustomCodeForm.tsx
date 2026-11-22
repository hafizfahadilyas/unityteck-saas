import React, { useCallback, useEffect, useState } from 'react';
import { Code2 } from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { readAllThemeSettings, writeAllThemeSettings } from '../../../themes/settings/themeSettingsStore';
import {
  EMPTY_STORE_CUSTOM_CODE,
  applyStoreCustomCodeLive,
  normalizeStoreCustomCode,
  type StoreCustomCodeSettings,
} from '../../../themes/settings/storeScopedCustomCode';
import { BuilderSiteCodePanel } from '../visualBuilder/BuilderSiteCodePanel';
import { updateThemeSettingsApi } from '../../../api/tenantApi';

/** @deprecated Prefer theme-settings.customCode — key kept only for one-time migration read. */
export const getCustomCodeStorageKey = (storeId: string) => `unityteck_custom_code_${storeId}`;

export const readCustomCodeSettings = (
  storeId: string,
  fallback?: { name: string },
): StoreCustomCodeSettings => {
  if (!storeId) return { ...EMPTY_STORE_CUSTOM_CODE };
  try {
    const fromTheme = readAllThemeSettings(storeId, fallback || { name: '' }).customCode;
    if (fromTheme && (fromTheme.customCss || fromTheme.customFontFamily || fromTheme.customFontUrl)) {
      return normalizeStoreCustomCode(fromTheme);
    }
  } catch {
    /* fall through */
  }
  try {
    const raw = localStorage.getItem(getCustomCodeStorageKey(storeId));
    if (raw) {
      const parsed = normalizeStoreCustomCode(JSON.parse(raw));
      // Migrate once into theme-settings; drop fake demo defaults
      if (parsed.customCss.includes('UnityTeck Custom CSS') && parsed.customCss.includes('unity-custom-glow')) {
        return { ...EMPTY_STORE_CUSTOM_CODE };
      }
      return parsed;
    }
  } catch {
    /* empty */
  }
  return { ...EMPTY_STORE_CUSTOM_CODE };
};

export const writeCustomCodeSettings = (
  storeId: string,
  settings: StoreCustomCodeSettings,
  fallback?: { name: string },
): void => {
  if (!storeId) return;
  const next = normalizeStoreCustomCode(settings);
  const full = readAllThemeSettings(storeId, fallback || { name: '' });
  full.customCode = next;
  if (next.customFontFamily) {
    full.general = { ...full.general, fontFamily: next.customFontFamily, customFontUrl: next.customFontUrl || undefined };
  }
  writeAllThemeSettings(storeId, full);
  applyStoreCustomCodeLive(storeId, next);
  try {
    localStorage.removeItem(getCustomCodeStorageKey(storeId));
  } catch {
    /* ignore */
  }
};

export const CustomCodeForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const storeId = activeStore?.id || '';

  const storeFallback = activeStore || { name: '' };
  const [settings, setSettings] = useState<StoreCustomCodeSettings>(() =>
    readCustomCodeSettings(storeId || 'default', storeFallback),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSettings(readCustomCodeSettings(storeId, storeFallback));
  }, [storeId, activeStore?.id]);

  const handleSave = useCallback(
    async (next: StoreCustomCodeSettings) => {
      if (!storeId) return;
      setIsSaving(true);
      try {
        writeCustomCodeSettings(storeId, next, storeFallback);
        setSettings(normalizeStoreCustomCode(next));
        await updateThemeSettingsApi(storeId, {
          settings: { customCode: normalizeStoreCustomCode(next) } as Record<string, unknown>,
          publish: true,
        });
        toast(
          isAr ? 'تم حفظ الخط والتنسيقات المخصصة لهذا المتجر' : 'Custom font and CSS saved for this store',
          'success',
        );
      } catch {
        toast(isAr ? 'تعذر حفظ الأكواد المخصصة' : 'Could not save custom code', 'error');
      } finally {
        setIsSaving(false);
      }
    },
    [storeId, isAr, toast, storeFallback],
  );

  if (!storeId) {
    return (
      <div className="p-4 text-xs" style={{ color: 'var(--muted)' }}>
        {isAr ? 'لا توجد سجلات' : 'No records found'}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs font-sans" style={{ fontFamily: 'var(--font-ui)' }}>
      <div
        className="p-3.5 rounded-2xl border space-y-1.5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        <div className="flex items-center gap-2 font-bold">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }}
          >
            <Code2 className="w-4 h-4" />
          </span>
          <span>{isAr ? 'خط مخصص وتنسيقات مخصصة' : 'Custom Font & Custom CSS'}</span>
        </div>
        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
          {isAr
            ? 'يُحفظ على قاعدة البيانات لهذا المتجر فقط. بدون أكواد وهمية.'
            : 'Persisted to MySQL for this store only. No demo snippets.'}
        </p>
      </div>

      <BuilderSiteCodePanel
        storeId={storeId}
        isAr={isAr}
        value={settings}
        onChange={setSettings}
        onSave={handleSave}
        saving={isSaving}
      />
    </div>
  );
};
