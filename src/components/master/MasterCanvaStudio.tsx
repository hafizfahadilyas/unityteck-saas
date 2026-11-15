/**
 * Master Admin Canva — SAME editor as store (`CanvaImageStudioModal`).
 * Only difference: Save → All stores / Select stores (per store_id Media + Canva library).
 */
import React, { useMemo, useState } from 'react';
import { Check, Search, Store as StoreIcon, X } from 'lucide-react';
import { CanvaImageStudioModal, type CanvaSavePayload } from '../store/CanvaImageStudioModal';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import { distributeCanvaToStores } from '../../services/masterCanvaDistribute';

type Props = {
  onNavigateTab?: (tab: string) => void;
};

export const MasterCanvaStudio: React.FC<Props> = ({ onNavigateTab }) => {
  const { stores, addMediaAsset, activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState<CanvaSavePayload | null>(null);
  const [scope, setScope] = useState<'all' | 'selected'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [storeQuery, setStoreQuery] = useState('');
  const [busy, setBusy] = useState(false);

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

  const openDistribute = (payload: CanvaSavePayload) => {
    setPending(payload);
    setScope('all');
    setSelectedIds(activeStores.map((s) => s.id));
    setPickerOpen(true);
  };

  const runDistribute = async () => {
    if (!pending) return;
    const targets =
      scope === 'all' ? activeStores.map((s) => s.id) : [...new Set(selectedIds.filter(Boolean))];
    if (targets.length === 0) {
      toast(isAr ? 'اختر متجراً واحداً على الأقل.' : 'Select at least one store.', 'error');
      return;
    }
    setBusy(true);
    try {
      const results = await distributeCanvaToStores({
        storeIds: targets,
        payload: {
          dataUrl: pending.dataUrl,
          title: pending.title,
          width: pending.width,
          height: pending.height,
          category: pending.category,
          layers: pending.layers,
          designJson: pending.designJson,
          source: pending.source,
        },
        addMediaAsset,
        isAr,
      });
      const ok = results.filter((r) => r.mediaOk).length;
      const fail = results.length - ok;
      toast(
        isAr
          ? `تم الحفظ في ${ok} متجر${fail ? ` · فشل ${fail}` : ''} (وسائط + مكتبة التصميم)`
          : `Saved to ${ok} store(s)${fail ? ` · ${fail} failed` : ''} (Media + Canva library)`,
        fail && ok === 0 ? 'error' : 'success',
      );
      setPickerOpen(false);
      setPending(null);
    } catch {
      toast(isAr ? 'تعذر توزيع التصميم.' : 'Could not distribute the design.', 'error');
    } finally {
      setBusy(false);
    }
  };

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

  // Same shell as store SharedCanvaEditorPage — identical Canva chrome
  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <CanvaImageStudioModal
        isOpen
        variant="page"
        masterMode
        onClose={() => onNavigateTab?.('settings')}
        initialAsset={null}
        onSaveNewAsset={() => {
          /* master uses onSaveDesignPayload → All / Select stores */
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
        aria-label={isAr ? 'خيارات الحفظ للمتاجر' : 'Save options for stores'}
        contentClassName="w-full max-w-md mx-2"
      >
        <div
          className="rounded-2xl border shadow-2xl p-5 space-y-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <h3 className="text-sm font-black">
            {isAr ? 'خيارات الحفظ' : 'Save options'}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'نفس التصميم يظهر في مكتبة الوسائط ومكتبة التصميم لكل متجر تختاره. كل متجر يحفظ بنسخته (عزل معرف المتجر).'
              : 'Same design goes to Media + Canva library for each store you pick. Each store gets its own copy (store_id isolated).'}
          </p>

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
              {isAr ? `كل المتاجر (${activeStores.length})` : `All stores (${activeStores.length})`}
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
              {isAr ? 'اختيار متاجر' : 'Select stores'}
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
                className="max-h-56 overflow-y-auto space-y-1 rounded-xl border p-2"
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
                        <StoreIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted)' }} />
                        <span className="flex-1 text-xs font-bold truncate">{label}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </>
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
              disabled={busy}
              onClick={() => void runDistribute()}
              className="unity-btn-primary px-4 py-2 rounded-lg text-xs font-black cursor-pointer disabled:opacity-60"
              aria-busy={busy}
            >
              {busy
                ? isAr
                  ? 'جاري الحفظ…'
                  : 'Saving…'
                : isAr
                  ? `حفظ ${scope === 'all' ? `لـ ${activeStores.length}` : `لـ ${selectedIds.length}`} متجر`
                  : `Save to ${scope === 'all' ? activeStores.length : selectedIds.length} store(s)`}
            </button>
          </div>
        </div>
      </GlobalModal>
    </div>
  );
};
