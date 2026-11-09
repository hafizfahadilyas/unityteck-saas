import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Wallet } from 'lucide-react';
import { isApiEnabled } from '../../api/client';
import {
  adjustCustomerWalletApi,
  fetchNotificationSettingsApi,
} from '../../api/tenantApi';
import { readAuthSession } from '../../auth/session';
import { applyLocalWalletAdjust } from '../../utils/customerWalletStorage';
import { fetchWhatsAppOverview } from '../../services/whatsappManagerService';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';

export type WalletAdjustResult = {
  balance: number;
  loyaltyPoints: number;
};

type NotifyChannel = 'email' | 'sms' | 'whatsapp' | 'none';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  customerId: string;
  customerName: string;
  currentBalance: number;
  isAr: boolean;
  onApplied: (result: WalletAdjustResult) => void;
};

export const CustomerWalletAdjustModal: React.FC<Props> = ({
  isOpen,
  onClose,
  storeId,
  customerId,
  customerName,
  currentBalance,
  isAr,
  onApplied,
}) => {
  const { toast } = useToast();
  const [txType, setTxType] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState('');
  const [resetLoyalty, setResetLoyalty] = useState(false);
  const [reason, setReason] = useState('');
  const [notifyChannel, setNotifyChannel] = useState<NotifyChannel>('none');
  const [busy, setBusy] = useState(false);
  const [channels, setChannels] = useState({
    email: false,
    sms: false,
    whatsapp: false,
  });

  useEffect(() => {
    if (!isOpen) return;
    setTxType('add');
    setAmount('');
    setResetLoyalty(false);
    setReason('');
    setNotifyChannel('none');

    if (!isApiEnabled()) return;

    (async () => {
      let email = false;
      let sms = false;
      let whatsapp = false;
      try {
        const wa = await fetchWhatsAppOverview(storeId);
        whatsapp = Boolean(wa?.connection?.is_connected);
      } catch {
        whatsapp = false;
      }
      try {
        const ns = await fetchNotificationSettingsApi(storeId);
        const data = ns?.data ?? ns;
        email = Boolean(data?.email?.enabled && data?.email?.provider);
        sms = Boolean(data?.sms?.enabled && data?.sms?.provider);
      } catch {
        /* not connected */
      }
      setChannels({ email, sms, whatsapp });
    })();
  }, [isOpen, storeId]);

  const notifyOptions = useMemo(() => {
    const opts: { value: NotifyChannel; label: string; enabled: boolean }[] = [
      {
        value: 'none',
        label: isAr ? 'بدون إشعار' : 'None',
        enabled: true,
      },
      {
        value: 'email',
        label: isAr ? 'البريد الإلكتروني' : 'Email',
        enabled: channels.email,
      },
      {
        value: 'sms',
        label: isAr ? 'رسالة نصية' : 'SMS',
        enabled: channels.sms,
      },
      {
        value: 'whatsapp',
        label: isAr ? 'واتساب' : 'WhatsApp',
        enabled: channels.whatsapp,
      },
    ];
    return opts;
  }, [channels, isAr]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(/,/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast(isAr ? 'أدخل مبلغاً صحيحاً أكبر من صفر' : 'Enter a valid amount greater than zero', 'warning');
      return;
    }
    if (txType === 'deduct' && parsed > currentBalance) {
      toast(isAr ? 'الرصيد غير كافٍ للخصم' : 'Insufficient balance for deduction', 'warning');
      return;
    }

    const session = readAuthSession();
    const employeeId = session?.user?.id;
    const employeeName = session?.user?.name;

    const selectedNotify = notifyChannel;
    const channelConnected =
      selectedNotify === 'none' ||
      (selectedNotify === 'email' && channels.email) ||
      (selectedNotify === 'sms' && channels.sms) ||
      (selectedNotify === 'whatsapp' && channels.whatsapp);

    setBusy(true);
    try {
      if (isApiEnabled()) {
        const result = await adjustCustomerWalletApi(storeId, customerId, {
          type: txType,
          amount: parsed,
          reason: reason.trim() || undefined,
          reset_loyalty: resetLoyalty,
          notify_channel: selectedNotify,
          employee_id: employeeId,
          employee_name: employeeName,
        });
        onApplied({
          balance: result.wallet.balance,
          loyaltyPoints: result.wallet.loyaltyPoints,
        });
      } else {
        const local = applyLocalWalletAdjust(storeId, customerId, {
          type: txType,
          amount: parsed,
          reason: reason.trim() || undefined,
          reset_loyalty: resetLoyalty,
          notify_channel: selectedNotify === 'none' ? null : selectedNotify,
          employee_id: employeeId,
          employee_name: employeeName,
        });
        if (!local.ok) {
          toast(
            local.error === 'insufficient_balance'
              ? isAr
                ? 'الرصيد غير كافٍ'
                : 'Insufficient balance'
              : isAr
                ? 'تعذر تنفيذ العملية'
                : 'Could not apply adjustment',
            'error',
          );
          return;
        }
        onApplied({
          balance: local.state.balance,
          loyaltyPoints: local.state.loyalty_points,
        });
      }

      if (selectedNotify !== 'none' && !channelConnected) {
        toast(
          isAr
            ? 'تم تعديل الرصيد — لم يُرسل إشعار (القناة غير متصلة)'
            : 'Balance updated — notification skipped (channel not connected)',
          'info',
        );
      } else {
        toast(
          isAr ? 'تم تنفيذ تعديل المحفظة بنجاح' : 'Wallet adjustment applied successfully',
          'success',
        );
      }
      onClose();
    } catch {
      toast(isAr ? 'فشل تعديل المحفظة' : 'Wallet adjustment failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'تعديل رصيد المحفظة' : 'Wallet Balance Adjustment'}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'تعديل رصيد المحفظة' : 'Wallet Balance Adjustment'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                {customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              {isAr ? 'نوع العملية' : 'Transaction Type'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['add', 'deduct'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxType(t)}
                  className={`py-2 rounded-xl border font-semibold transition-colors cursor-pointer ${
                    txType === t
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t === 'add'
                    ? isAr
                      ? 'إضافة رصيد'
                      : 'Add Balance'
                    : isAr
                      ? 'خصم رصيد'
                      : 'Deduct Balance'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              {isAr ? 'المبلغ (ر.س)' : 'Amount (SAR)'}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={resetLoyalty}
              onChange={(e) => setResetLoyalty(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {isAr ? 'إعادة تعيين نقاط الولاء إلى صفر' : 'Reset loyalty points to zero'}
            </span>
          </label>

          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              {isAr ? 'رسالة للعميل / السبب' : 'Customer message / reason'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">
              {isAr ? 'طريقة الإشعار' : 'Notification Method'}
            </label>
            <select
              value={notifyChannel}
              onChange={(e) => setNotifyChannel(e.target.value as NotifyChannel)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {notifyOptions.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={!opt.enabled && opt.value !== 'none'}>
                  {opt.label}
                  {!opt.enabled && opt.value !== 'none'
                    ? isAr
                      ? '(غير متصل)'
                      : ' (Not connected)'
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{isAr ? 'تنفيذ' : 'Execute'}</span>
          </button>
        </form>
      </div>
    </GlobalModal>
  );
};
