import React, { useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from './ToastProvider';

/**
 * Live DB status + Refresh — lives on Settings pages only (not chrome banner).
 */
export const DbSyncSettingsCard: React.FC = () => {
  const {
    dataSource,
    apiReady,
    apiError,
    softRefreshTenantData,
    stores,
    currentProducts,
    currentOrders,
    activeStore,
    mode,
  } = useTenant();
  const { t } = usePrefs();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (dataSource !== 'api') return null;

  const statusText = apiError
    ? `${t('dbSyncIssue')}: ${apiError}`
    : !apiReady
      ? t('loadingLiveDb')
      : `${t('liveDbBanner')} · ${stores.length} ${t('storeShort').toLowerCase()} · ${currentProducts.length} ${t('navProducts').toLowerCase()} · ${currentOrders.length} ${t('navOrders').toLowerCase()}${
          mode === 'store' && activeStore?.name ? ` · ${activeStore.name}` : ''
        }`;

  const onRefresh = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await softRefreshTenantData();
      toast(t('refreshData'), 'success');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="p-5 rounded-2xl border space-y-4"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--card-shadow)',
        fontFamily: 'var(--font-ui)',
      }}
      data-settings="db-sync"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Database className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden />
          <div className="min-w-0">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              {t('liveDbBanner')}
            </h3>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
              {statusText}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          aria-busy={busy}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60 active:scale-[0.98]"
          style={{ background: 'var(--portal-cta)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden />
          {busy ? '…' : t('refreshData')}
        </button>
      </div>
      {apiError ? (
        <p className="text-[11px] font-semibold" style={{ color: 'var(--tone-danger)' }}>
          {t('dbSyncIssue')}: {apiError}
        </p>
      ) : null}
    </div>
  );
};
