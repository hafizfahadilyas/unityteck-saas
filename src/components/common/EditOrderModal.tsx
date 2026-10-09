import React, { useState, useEffect } from 'react';
import type { Order, OrderStatus } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import { X, Check, Edit, ShieldCheck, Truck, CreditCard, Package } from 'lucide-react';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSave: (orderId: string, updates: Partial<Order>) => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onSave,
}) => {
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';

  const [status, setStatus] = useState<OrderStatus>('pending');
  const [paymentStatus, setPaymentStatus] = useState<string>('Paid');
  const [shippingCompany, setShippingCompany] = useState<string>('SMSA Express');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [shippingStatus, setShippingStatus] = useState<string>('Delivered');

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus || 'Paid');
      setShippingCompany(order.shippingCompany || 'SMSA Express');
      setTrackingNumber(order.trackingNumber || '');
      setShippingStatus(order.shippingStatus || 'Delivered');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(order.id, {
      status,
      paymentStatus: paymentStatus as any,
      shippingCompany,
      trackingNumber,
      shippingStatus: shippingStatus as any,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-[#071E26] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Edit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? `تعديل الطلب #${order.orderNumber}` : `Edit Order #${order.orderNumber}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'تحديث حالة الطلب والشحن والدفع' : 'Update fulfillment, payment, and shipment details'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Order Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('orderStatus')}</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">{t('awaitingPaymentTab')}</option>
              <option value="processing">{t('processingTab')}</option>
              <option value="shipped">{t('shippedTab')}</option>
              <option value="out_for_delivery">{t('outForDeliveryTab')}</option>
              <option value="delivered">{t('deliveredTab')}</option>
              <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
              <option value="cancelled">{t('cancelledTab')}</option>
              <option value="returned">{t('returnedTab')}</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('paymentStatus')}</span>
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="Paid">{t('paidStatus')}</option>
              <option value="Pending">{isAr ? 'قيد الانتظار' : 'Pending'}</option>
              <option value="Refunded">{isAr ? 'مسترجع' : 'Refunded'}</option>
              <option value="Failed">{isAr ? 'فشلت العملية' : 'Failed'}</option>
            </select>
          </div>

          {/* Shipping Carrier & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('shippingCompany')}</span>
              </label>
              <select
                value={shippingCompany}
                onChange={(e) => setShippingCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="SMSA Express">SMSA Express</option>
                <option value="Aramex">Aramex</option>
                <option value="Saudi Post SPL">SPL (البريد السعودي)</option>
                <option value="DHL Express">DHL Express</option>
                <option value="RedBox">RedBox</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('shippingStatus')}
              </label>
              <select
                value={shippingStatus}
                onChange={(e) => setShippingStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="Delivered">{t('deliveredTab')}</option>
                <option value="Out for Delivery">{t('outForDeliveryTab')}</option>
                <option value="Shipped">{t('shippedTab')}</option>
                <option value="Processing">{t('processingTab')}</option>
              </select>
            </div>
          </div>

          {/* Tracking Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('trackingNumber')}</span>
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. SM123456789"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer transition-all hover:opacity-95 flex items-center gap-1.5"
              style={{ background: 'var(--portal-cta, #0284c7)' }}
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
