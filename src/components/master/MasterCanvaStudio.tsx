/**
 * Master Admin Canva — SAME editor as store (`CanvaImageStudioModal`).
 * Save destinations: store media libraries · Master media · local · Google Drive.
 */
import React, { useMemo, useState } from 'react';
import {
  Check,
  Search,
  Store as StoreIcon,
  X,
  Images,
  HardDrive,
  Download,
  Cloud,
} from 'lucide-react';
import { CanvaImageStudioModal, type CanvaSavePayload } from '../store/CanvaImageStudioModal';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import {
  distributeCanvaToStores,
  downloadCanvaLocal,
  handoffCanvaToGoogleDrive,
  saveFullCanvaToMasterAdmin,
  type MasterCanvaSaveDest,
} from '../../services/masterCanvaDistribute';

type Props = {
  onNavigateTab?: (tab: string) => void;
};

type DestState = Record<MasterCanvaSaveDest, boolean>;

const DEFAULT_DEST: DestState = {
  store_media: true,
  master_media: true,
  local: false,
  google_drive: false,
};

export const MasterCanvaStudio: React.FC<Props> = ({ onNavigateTab }) => {
  const { stores, addMediaAsset, activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState<CanvaSavePayload | null>(null);
  const [dest, setDest] = useState<DestState>({ ...DEFAULT_DEST });
  const [scope, setScope] = useState<'all' | 'selected'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [storeQuery, setStoreQuery] = useState('');
  const [busy, setBusy] = useState(false);
  /** Keep Master library row ids so re-save updates the same Master design */
  const [masterTemplateId, setMasterTemplateId] = useState<string | undefined>();
  const [masterStudioDesignId, setMasterStudioDesignId] = useState<string | undefined>();

  const activeStores = useMemo(
    () =>
      (stores || []).filter((s) => {
        const st = String((s as { status?: string }).status || 'active').toLowerCase();
        return st === 'active' || st === 'live' || st === '';
      }),
    [stores],
  );

  const filteredStores = useMemo(() => {
    const q = storeQuery.trim().toLowerCase();
    if (!q) return activeStores;
    return activeStores.filter((s) => {
      const en = (s.name || '').toLowerCase();
      const ar = ((s as { nameAr?: string }).nameAr || '').toLowerCase();
      return en.includes(q) || ar.includes(q) || s.id.toLowerCase().includes(q);
    });
  }, [activeStores, storeQuery]);

  const toggleStore = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleDest = (key: MasterCanvaSaveDest) => {
    // Master library is always saved — cannot turn off
    if (key === 'master_media') return;
    setDest((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openDistribute = (payload: CanvaSavePayload) => {
    setPending(payload);
    setDest({ ...DEFAULT_DEST, master_media: true });
    setScope('all');
    setSelectedIds(activeStores.map((s) => s.id));
    setStoreQuery('');
    setPickerOpen(true);
  };

  const runDistribute = async () => {
    if (!pending) return;

    const payload = {
      dataUrl: pending.dataUrl,
      previewDataUrl: pending.previewDataUrl || pending.dataUrl,
      title: pending.title,
      width: pending.width,
      height: pending.height,
      category: pending.category,
      layers: pending.layers,
      designJson: pending.designJson,
      source: pending.source,
    };

    if (dest.store_media) {
      const targets =
        scope === 'all'
          ? activeStores.map((s) => s.id)
          : [...new Set(selectedIds.filter(Boolean))];
      if (targets.length === 0) {
        toast(isAr ? 'اختر متجراً واحداً على الأقل.' : 'Select at least one store.', 'error');
        return;
      }
    }

    setBusy(true);
    const notes: string[] = [];
    try {
      // ALWAYS: every Canva update is saved into Master Admin (media + editable layers)
      const masterSave = await saveFullCanvaToMasterAdmin({
        payload,
        addMediaAsset,
        isAr,
        templateId: masterTemplateId,
        studioDesignId: masterStudioDesignId,
      });
      if (masterSave.templateId) setMasterTemplateId(masterSave.templateId);
      if (masterSave.studioDesignId) setMasterStudioDesignId(masterSave.studioDesignId);
      if (!masterSave.mediaOk) {
        toast(
          isAr
            ? `تعذر حفظ التحديث في لوحة الماستر${masterSave.error ? ` · ${masterSave.error}` : ''}`
            : `Could not save update to Master Admin${masterSave.error ? ` · ${masterSave.error}` : ''}`,
          'error',
        );
        return;
      }
      notes.push(
        isAr
          ? `لوحة الماستر · وسائط${masterSave.templateOk ? ' + طبقات قابلة للتعديل' : ''}`
          : `Master Admin · media${masterSave.templateOk ? ' + editable layers' : ''}`,
      );

      if (dest.store_media) {
        const targets =
          scope === 'all'
            ? activeStores.map((s) => s.id)
            : [...new Set(selectedIds.filter(Boolean))];
        const results = await distributeCanvaToStores({
          storeIds: targets,
          payload,
          addMediaAsset,
          isAr,
        });
        const ok = results.filter((r) => r.mediaOk).length;
        const fail = results.length - ok;
        notes.push(
          isAr
            ? `مكتبة الوسائط · ${ok} متجر${fail ? ` · فشل ${fail}` : ''}`
            : `Store media · ${ok} store(s)${fail ? ` · ${fail} failed` : ''}`,
        );
        if (fail && ok === 0) {
          toast(
            isAr
              ? `حُفظ في الماستر، لكن فشل إرسال المتاجر · ${notes.join(' · ')}`
              : `Saved to Master, but store push failed · ${notes.join(' · ')}`,
            'error',
          );
          return;
        }
      }

      if (dest.local) {
        await downloadCanvaLocal(payload, 'png');
        notes.push(isAr ? 'تنزيل محلي PNG' : 'Local PC PNG');
      }

      if (dest.google_drive) {
        await handoffCanvaToGoogleDrive(payload);
        notes.push(
          isAr
            ? 'جوجل درايف · نزّل الملف ثم ارفعه في الدرايف'
            : 'Google Drive · file downloaded; upload it in Drive',
        );
      }

      toast(
        isAr ? `تم الحفظ: ${notes.join(' · ')}` : `Saved: ${notes.join(' · ')}`,
        'success',
      );
      setPickerOpen(false);
      setPending(null);
    } catch {
      toast(isAr ? 'تعذر حفظ التصميم.' : 'Could not save the design.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const destCards: Array<{
    id: MasterCanvaSaveDest;
    icon: React.ElementType;
    titleEn: string;
    titleAr: string;
    descEn: string;
    descAr: string;
  }> = [
    {
      id: 'store_media',
      icon: Images,
      titleEn: 'Stores (All or Multiple)',
      titleAr: 'المتاجر (الكل أو عدة متاجر)',
      descEn:
        'Push full editable design + media to All stores or pick Multiple stores (each store_id isolated).',
      descAr:
        'إرسال التصميم الكامل القابل للتعديل مع الوسائط إلى كل المتاجر أو اختيار عدة متاجر (عزل معرف المتجر لكل متجر).',
    },
    {
      id: 'master_media',
      icon: HardDrive,
      titleEn: 'Master Admin (always on)',
      titleAr: 'لوحة الماستر (دائماً)',
      descEn:
        'Every Canva update is always saved here: preview image + every editable layer. Re-save updates the same Master design.',
      descAr:
        'كل تحديث في استوديو التصميم يُحفظ هنا دائماً: صورة المعاينة + كل طبقة قابلة للتعديل. الحفظ مجدداً يحدّث نفس تصميم الماستر.',
    },
    {
      id: 'local',
      icon: Download,
      titleEn: 'Local PC (this device)',
      titleAr: 'الجهاز المحلي (هذا الحاسوب)',
      descEn: 'Download PNG to your computer.',
      descAr: 'تنزيل صورة PNG إلى حاسوبك.',
    },
    {
      id: 'google_drive',
      icon: Cloud,
      titleEn: 'Google Drive',
      titleAr: 'جوجل درايف',
      descEn: 'Download the file and open Drive so you can upload it (no fake connect).',
      descAr: 'تنزيل الملف وفتح درايف لرفعه يدوياً (بدون اتصال وهمي).',
    },
  ];

  if (!activeStore) {
    return (
      <div className="p-8 text-sm" style={{ color: 'var(--muted)' }}>
        {isAr
          ? 'لا يوجد متجر نشط لمعاينة الأصول. أنشئ متجراً أولاً.'
          : 'No active store for asset preview. Create a store first.'}
        <button
          type="button"
          onClick={() => onNavigateTab?.('stores')}
          className="unity-btn-primary ms-3 px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer"
        >
          {isAr ? 'المتاجر' : 'Stores'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <CanvaImageStudioModal
        isOpen
        variant="page"
        masterMode
        onClose={() => onNavigateTab?.('settings')}
        initialAsset={null}
        onSaveNewAsset={() => {
          /* master uses onSaveDesignPayload → destination picker */
        }}
        onSaveDesignPayload={(payload) => openDistribute(payload)}
      />

      <GlobalModal
        isOpen={pickerOpen}
        onClose={() => {
          if (busy) return;
          setPickerOpen(false);
        }}
        dir={isAr ? 'rtl' : 'ltr'}
        aria-label={isAr ? 'خيارات الحفظ' : 'Save options'}
        contentClassName="w-full max-w-lg mx-2"
      >
        <div
          className="rounded-2xl border shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <h3 className="text-sm font-black">
            {isAr ? 'حفظ · الوجهات' : 'Save · destinations'}
          </h3>
          <p className="text-[12px] font-semibold leading-relaxed" style={{ color: 'var(--text)' }}>
            {isAr
              ? 'اختر: لوحة الماستر · كل المتاجر · عدة متاجر · الجهاز المحلي · جوجل درايف'
              : 'Pick: Master · All stores · Multiple stores · Local PC · Google Drive'}
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'الماستر دائماً مفعّل. المتاجر والتنزيل اختياريان. نفس استوديو التصميم لكل المتاجر.'
              : 'Master is always on. Stores and download are optional. Same Design Studio for every store.'}
          </p>

          <div className="space-y-2">
            {destCards.map((card) => {
              const on = card.id === 'master_media' ? true : dest[card.id];
              const locked = card.id === 'master_media';
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => toggleDest(card.id)}
                  disabled={locked}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-start cursor-pointer transition-colors disabled:cursor-default"
                  style={{
                    borderColor: on ? 'var(--accent)' : 'var(--border)',
                    background: on
                      ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                      : 'var(--surface)',
                  }}
                >
                  <span
                    className="w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0"
                    style={{
                      borderColor: on ? 'var(--accent)' : 'var(--border)',
                      background: on ? 'var(--accent)' : 'transparent',
                    }}
                  >
                    {on ? <Check className="w-3 h-3 text-white" /> : null}
                  </span>
                  <Icon
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: on ? 'var(--accent)' : 'var(--muted)' }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-black">
                      {isAr ? card.titleAr : card.titleEn}
                    </span>
                    <span className="block text-[10px] mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {isAr ? card.descAr : card.descEn}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {dest.store_media && (
            <div
              className="space-y-3 rounded-xl border p-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="text-[11px] font-black" style={{ color: 'var(--muted)' }}>
                {isAr ? 'متاجر مكتبة الوسائط' : 'Stores for media library'}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setScope('all');
                    setSelectedIds(activeStores.map((s) => s.id));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black border cursor-pointer ${
                    scope === 'all' ? 'text-white border-transparent' : ''
                  }`}
                  style={
                    scope === 'all'
                      ? { background: 'var(--portal-cta)' }
                      : { borderColor: 'var(--border)', color: 'var(--text)' }
                  }
                >
                  {isAr
                    ? `كل المتاجر (${activeStores.length})`
                    : `All stores (${activeStores.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setScope('selected')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black border cursor-pointer ${
                    scope === 'selected' ? 'text-white border-transparent' : ''
                  }`}
                  style={
                    scope === 'selected'
                      ? { background: 'var(--portal-cta)' }
                      : { borderColor: 'var(--border)', color: 'var(--text)' }
                  }
                >
                  {isAr ? 'عدة متاجر' : 'Multiple stores'}
                </button>
              </div>

              {scope === 'selected' && (
                <>
                  <div className="relative">
                    <Search
                      className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--muted)' }}
                    />
                    <input
                      type="text"
                      value={storeQuery}
                      onChange={(e) => setStoreQuery(e.target.value)}
                      placeholder={isAr ? 'بحث عن متجر…' : 'Search stores…'}
                      className="w-full ps-8 pe-3 py-2 rounded-lg border text-xs"
                      style={{
                        borderColor: 'var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedIds(filteredStores.map((s) => s.id))}
                      className="text-[11px] font-bold cursor-pointer"
                      style={{ color: 'var(--accent)' }}
                    >
                      {isAr ? 'تحديد الكل' : 'Select all'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      className="text-[11px] font-bold cursor-pointer"
                      style={{ color: 'var(--muted)' }}
                    >
                      {isAr ? 'مسح' : 'Clear'}
                    </button>
                  </div>
                  <div
                    className="max-h-44 overflow-y-auto space-y-1 rounded-xl border p-2"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {filteredStores.length === 0 ? (
                      <p className="text-xs text-center py-6" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'لا توجد متاجر.' : 'No stores found.'}
                      </p>
                    ) : (
                      filteredStores.map((s) => {
                        const on = selectedIds.includes(s.id);
                        const label = isAr
                          ? (s as { nameAr?: string }).nameAr || s.name
                          : s.name;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleStore(s.id)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-start cursor-pointer"
                            style={{
                              background: on
                                ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                                : 'transparent',
                              color: 'var(--text)',
                            }}
                          >
                            <span
                              className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                              style={{
                                borderColor: on ? 'var(--accent)' : 'var(--border)',
                                background: on ? 'var(--accent)' : 'transparent',
                              }}
                            >
                              {on ? <Check className="w-3 h-3 text-white" /> : null}
                            </span>
                            <StoreIcon
                              className="w-3.5 h-3.5 shrink-0"
                              style={{ color: 'var(--muted)' }}
                            />
                            <span className="flex-1 text-xs font-bold truncate">{label}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {pending && (
            <div
              className="space-y-2 rounded-xl border p-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="text-[11px] font-black" style={{ color: 'var(--muted)' }}>
                {isAr ? 'تصدير سريع لهذا الجهاز' : 'Quick export to this PC'}
              </div>
              <div className="flex flex-wrap gap-2">
                {(['png', 'jpg', 'webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void downloadCanvaLocal(
                        { dataUrl: pending.dataUrl, title: pending.title },
                        fmt,
                      ).then(() =>
                        toast(
                          isAr
                            ? `تم تنزيل ${fmt.toUpperCase()} على الجهاز`
                            : `${fmt.toUpperCase()} downloaded to this PC`,
                          'success',
                        ),
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-black border cursor-pointer uppercase"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'الاستيراد (قوالب جاهزة / فوتوشوب / صورة): زر رفع في شريط استوديو التصميم.'
                  : 'Import (Templates / PSD / image): use Upload in the Design Studio header.'}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => setPickerOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              <span className="inline-flex items-center gap-1">
                <X className="w-3.5 h-3.5" />
                {isAr ? 'إلغاء' : 'Cancel'}
              </span>
            </button>
            <button
              type="button"
              disabled={busy || !anyDest}
              onClick={() => void runDistribute()}
              className="unity-btn-primary px-4 py-2 rounded-lg text-xs font-black cursor-pointer disabled:opacity-60"
              aria-busy={busy}
            >
              {busy
                ? isAr
                  ? 'جاري الحفظ…'
                  : 'Saving…'
                : isAr
                  ? 'حفظ التصميم'
                  : 'Save design'}
            </button>
          </div>
        </div>
      </GlobalModal>
    </div>
  );
};
