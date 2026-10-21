import React, { useState, useMemo } from 'react';
import type {
  InvoiceDocument,
  InvoiceDocumentType,
  InvoiceLineItem,
  DocumentPartyDetails,
} from '../../../types/invoices';
import { invoiceService, getStoreInvoiceProfile } from '../../../services/invoiceService';
import { getCustomerDisplayName, getLocalizedAddress } from '../../../utils/storeLocalization';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import { generateZatcaTlvBase64 } from '../../../utils/zatca';
import {
  X,
  Plus,
  Trash2,
  FileText,
  Building,
  User,
  ShoppingBag,
  CreditCard,
  Truck,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

interface InvoiceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (doc: InvoiceDocument) => void;
  initialType?: InvoiceDocumentType;
  initialOrderId?: string;
}

export const InvoiceCreateModal: React.FC<InvoiceCreateModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialType = 'order_invoice',
  initialOrderId,
}) => {
  const { activeStore, currentOrders, currentProducts, currentCustomers } = useTenant();
  const { t, locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [documentType, setDocumentType] = useState<InvoiceDocumentType>(initialType);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  const suppliers = useMemo(() => invoiceService.getSuppliers(activeStore.id), [activeStore.id]);

  // Parties State
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerVat, setBuyerVat] = useState('');

  // Special Fields
  const [cancellationReason, setCancellationReason] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [refundMethod, setRefundMethod] = useState(isAr ? 'إعادة إلى البطاقة البنكية' : 'Card Reversal');
  const [refundStatus, setRefundStatus] = useState<'succeeded' | 'pending'>('succeeded');
  const [paymentMethod, setPaymentMethod] = useState(isAr ? 'مدى / دفع إلكتروني' : 'Mada / Card');
  const [courierCompany, setCourierCompany] = useState(isAr ? 'شركة الشحن السريع' : 'Express Logistics');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [validDays, setValidDays] = useState(15);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(isAr ? 'السداد خلال 15 يوماً' : 'Net 15 Days');

  // Items State
  const [items, setItems] = useState<InvoiceLineItem[]>(() => {
    const firstProd = currentProducts && currentProducts.length > 0 ? currentProducts[0] : null;
    if (firstProd) {
      const price = Number(firstProd.price) || 100;
      const vat = Math.round(price * 0.15 * 100) / 100;
      return [
        {
          id: 'item-1',
          name: firstProd.name,
          nameAr: (firstProd as any).nameAr || firstProd.name,
          sku: firstProd.sku || 'SKU-001',
          quantity: 1,
          unitPrice: price,
          discount: 0,
          taxRate: 15,
          taxAmount: vat,
          total: price + vat,
        },
      ];
    }
    return [
      {
        id: 'item-1',
        name: isAr ? 'باقة منتجات المتجر' : 'Store Product Item',
        nameAr: 'باقة منتجات المتجر',
        sku: 'SKU-001',
        quantity: 1,
        unitPrice: 150,
        discount: 0,
        taxRate: 15,
        taxAmount: 22.5,
        total: 172.5,
      },
    ];
  });

  const [shippingFee, setShippingFee] = useState<number>(35);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Auto-fill from selected Order
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = currentOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return;

    setBuyerName(order.customerName || '');
    setBuyerEmail(order.customerEmail || '');
    setBuyerPhone(order.customerPhone || '');
    setBuyerAddress(order.deliveryLocation || '');
    setShippingFee(order.shippingFee || 35);
    setDiscountAmount(order.discountAmount || 0);
    setPaymentMethod(order.paymentMethod || 'Apple Pay');

    if (order.items && order.items.length > 0) {
      const mappedItems: InvoiceLineItem[] = order.items.map((it, idx) => {
        const lineTotal = it.price * it.quantity;
        const lineVat = lineTotal * 0.15;
        return {
          id: `item-${idx + 1}`,
          name: it.name,
          sku: it.sku || `SKU-${idx + 1}`,
          quantity: it.quantity || 1,
          unitPrice: it.price,
          discount: 0,
          taxRate: 15,
          taxAmount: lineVat,
          total: lineTotal + lineVat,
        };
      });
      setItems(mappedItems);
    }
  };

  // Auto-fill from selected Supplier
  const handleSelectSupplier = (supId: string) => {
    setSelectedSupplierId(supId);
    const sup = suppliers.find((s) => s.id === supId);
    if (!sup) return;

    setBuyerName(sup.name);
    setBuyerEmail(sup.email);
    setBuyerPhone(sup.phone);
    setBuyerAddress(sup.address);
    setBuyerVat(sup.vatNumber || '');
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + it.unitPrice * it.quantity - (it.discount || 0), 0);
  }, [items]);

  const totalVat = useMemo(() => {
    return items.reduce((sum, it) => {
      const lineNet = it.unitPrice * it.quantity - (it.discount || 0);
      return sum + lineNet * ((it.taxRate ?? 15) / 100);
    }, 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + shippingFee + totalVat);
  }, [subtotal, discountAmount, shippingFee, totalVat]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}`,
      name: 'Custom Product / Service Item',
      sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      quantity: 1,
      unitPrice: 100,
      discount: 0,
      taxRate: 15,
      taxAmount: 15,
      total: 115,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (index: number, patch: Partial<InvoiceLineItem>) => {
    setItems((prev) => {
      const next = [...prev];
      const it = { ...next[index], ...patch };
      const lineNet = it.unitPrice * it.quantity - (it.discount || 0);
      const lineVat = lineNet * ((it.taxRate ?? 15) / 100);
      it.taxAmount = lineVat;
      it.total = lineNet + lineVat;
      next[index] = it;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerName.trim()) {
      toast(isAr ? 'يرجى إدخال اسم العميل / المستلم' : 'Please enter party name', 'error');
      return;
    }

    const docNumber = invoiceService.getNextDocumentNumber(activeStore.id, documentType);
    const now = new Date().toISOString();

    const profile = getStoreInvoiceProfile(activeStore.id, activeStore);
    const sellerParty: DocumentPartyDetails = {
      name: profile.nameEn,
      nameAr: profile.nameAr,
      nameEn: profile.nameEn,
      companyName: profile.companyNameEn,
      companyNameAr: profile.companyNameAr,
      companyNameEn: profile.companyNameEn,
      email: profile.email,
      phone: profile.phone,
      address: profile.addressEn,
      addressAr: profile.addressAr,
      addressEn: profile.addressEn,
      city: profile.cityEn,
      cityAr: profile.cityAr,
      country: profile.countryEn,
      vatNumber: profile.vatNumber,
      crNumber: profile.crNumber,
    };

    const buyerParty: DocumentPartyDetails = {
      name: buyerName,
      nameAr: buyerName,
      nameEn: getCustomerDisplayName(buyerName, 'en'),
      email: buyerEmail,
      phone: buyerPhone,
      address: buyerAddress,
      addressAr: buyerAddress,
      addressEn: getLocalizedAddress(buyerAddress, 'en'),
      city: profile.cityEn,
      cityAr: profile.cityAr,
      country: profile.countryEn,
      vatNumber: buyerVat || undefined,
    };

    const isPaid = documentType === 'order_invoice' || documentType === 'payment_receipt' || documentType === 'tax_invoice';

    const validUntilDate = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();

    const newDoc = invoiceService.createDocument(
      activeStore.id,
      {
        storeId: activeStore.id,
        documentType,
        documentNumber: docNumber,
        title: documentType.replace(/_/g, ' ').toUpperCase(),
        orderNumber: selectedOrderId ? selectedOrderId : undefined,
        issueDate: now,
        validUntil: documentType === 'proforma_invoice' || documentType === 'quotation' ? validUntilDate : undefined,
        cancellationDate: documentType === 'cancelled_order_invoice' ? now : undefined,
        refundDate: documentType === 'refund_receipt' ? now : undefined,
        dispatchDate: documentType === 'delivery_note' ? now : undefined,
        seller: documentType === 'purchase_invoice' ? buyerParty : sellerParty,
        buyer: documentType === 'purchase_invoice' ? sellerParty : buyerParty,
        items,
        subtotal,
        discountAmount,
        shippingFee: documentType === 'delivery_note' ? 0 : shippingFee,
        taxRate: 15,
        taxAmount: totalVat,
        grandTotal: documentType === 'delivery_note' ? 0 : grandTotal,
        amountPaid: isPaid ? grandTotal : 0,
        outstandingBalance: isPaid ? 0 : grandTotal,
        currency: 'SAR',
        cancellationReason: documentType === 'cancelled_order_invoice' ? cancellationReason : undefined,
        refundAmount: documentType === 'refund_receipt' ? grandTotal : undefined,
        refundMethod: documentType === 'refund_receipt' ? refundMethod : undefined,
        refundStatus: documentType === 'refund_receipt' ? refundStatus : undefined,
        creditReason: documentType === 'credit_note' ? creditReason : undefined,
        courierCompany: documentType === 'delivery_note' ? courierCompany : undefined,
        trackingNumber: documentType === 'delivery_note' ? trackingNumber : undefined,
        paymentMethod,
        paymentTerms,
        notes,
        status: isPaid ? 'paid' : documentType === 'cancelled_order_invoice' ? 'cancelled' : 'issued',
        isLocked: true,
        zatca:
          documentType === 'tax_invoice' || documentType === 'order_invoice'
            ? {
                invoiceCategory: buyerVat ? 'standard' : 'simplified',
                invoiceType: '388',
                qrPayloadBase64: generateZatcaTlvBase64({
                  sellerName: sellerParty.name,
                  vatNumber: sellerParty.vatNumber || '300948215600003',
                  timestamp: now,
                  invoiceTotal: grandTotal,
                  vatTotal: totalVat,
                }),
                complianceStatus: 'compliant_preview',
                vatCategoryCode: 'S',
              }
            : undefined,
      },
      'Store Administrator'
    );

    toast(
      isAr
        ? `تم إنشاء المستند بنجاح (${newDoc.documentNumber})`
        : `Document generated successfully (${newDoc.documentNumber})`,
      'success'
    );

    onCreated(newDoc);
    onClose();
  };

  const documentTypeOptions: { id: InvoiceDocumentType; titleEn: string; titleAr: string; icon: any }[] = [
    { id: 'order_invoice', titleEn: 'Order Invoice', titleAr: 'فاتورة مبيعات طلب', icon: FileText },
    { id: 'tax_invoice', titleEn: 'Tax Invoice (ZATCA)', titleAr: 'فاتورة ضريبية معتمدة', icon: ShieldCheck },
    { id: 'quotation', titleEn: 'Quotation / Estimate', titleAr: 'عرض أسعار تجاري', icon: Sparkles },
    { id: 'proforma_invoice', titleEn: 'Proforma Invoice', titleAr: 'فاتورة شكلية أولية', icon: FileSpreadsheet },
    { id: 'payment_receipt', titleEn: 'Payment Receipt', titleAr: 'سند قبض وإيصال سداد', icon: Receipt },
    { id: 'delivery_note', titleEn: 'Delivery Note', titleAr: 'سند تسليم وبوليصة شحن', icon: Truck },
    { id: 'credit_note', titleEn: 'Credit Note', titleAr: 'إشعار دائن محاسبي', icon: CreditCard },
    { id: 'refund_receipt', titleEn: 'Refund Receipt', titleAr: 'إيصال استرجاع مالي', icon: RotateCcw },
    { id: 'cancelled_order_invoice', titleEn: 'Cancellation Record', titleAr: 'سجل إلغاء طلب', icon: AlertTriangle },
    { id: 'purchase_invoice', titleEn: 'Purchase Invoice', titleAr: 'فاتورة مشتريات وتوريد', icon: Building },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-white">
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isAr ? 'إنشاء وتوليد مستند جديد' : 'Generate New Document'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'اختر نوع المستند وقم بتعبئة البيانات أو استيرادها من طلب حقيقي' : 'Select document type & populate fields'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Document Type Selector Tabs */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              {isAr ? 'اختر نوع المستند المطلوب (10 نماذج مستقلة):' : 'Select Document Type (10 Dedicated Templates):'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {documentTypeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = documentType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDocumentType(opt.id)}
                    className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-white shadow-xs ring-1 ring-blue-500'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <div>
                      <p className="text-xs font-bold leading-tight">{isAr ? opt.titleAr : opt.titleEn}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real Order / Supplier Quick-Fill */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isAr ? 'استيراد من طلب موجود (تعبئة تلقائية):' : 'Import from Real Order (Auto-Fill):'}
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => handleSelectOrder(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              >
                <option value="">{isAr ? '— اختر طلباً لتعبئة البنود —' : '— Select an existing order —'}</option>
                {currentOrders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.orderNumber} - {ord.customerName} ({ord.total} SAR)
                  </option>
                ))}
              </select>
            </div>

            {documentType === 'purchase_invoice' && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'اختر المورد المسجل:' : 'Select Registered Supplier:'}
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => handleSelectSupplier(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="">{isAr ? '— اختر مورداً —' : '— Select Supplier —'}</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Party Details Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {documentType === 'purchase_invoice'
                ? isAr ? 'بيانات المورد (البائع)' : 'Supplier Details'
                : isAr ? 'بيانات العميل (المشتري)' : 'Customer / Recipient Details'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isAr ? 'الاسم الكامل' : 'Full Name'} *</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder={isAr ? 'عبدالرحمن السديس' : 'e.g. John Doe'}
                  required
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isAr ? 'رقم الجوال' : 'Phone'}</label>
                <input
                  type="text"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="+966 50 123 4567"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 dir-ltr"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isAr ? 'العنوان الوطني / موقع التوصيل' : 'Address'}</label>
                <input
                  type="text"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  placeholder={isAr ? 'مكة المكرمة، برج الساعة، جناح 1804' : 'Street address / City'}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{isAr ? 'الرقم الضريبي (إن وجد)' : 'VAT Number (Optional)'}</label>
                <input
                  type="text"
                  value={buyerVat}
                  onChange={(e) => setBuyerVat(e.target.value)}
                  placeholder="300XXXXXXXXXXXX"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Type-Specific Fields */}
          {documentType === 'cancelled_order_invoice' && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 space-y-2">
              <label className="text-xs font-bold text-rose-700 dark:text-rose-300 block">{isAr ? 'سبب الإلغاء الرسمي:' : 'Cancellation Reason:'}</label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={2}
                placeholder={isAr ? 'أدخل سبب الإلغاء المعتمد...' : 'Reason for cancelling order...'}
                className="w-full bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          )}

          {documentType === 'credit_note' && (
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 space-y-2">
              <label className="text-xs font-bold text-purple-700 dark:text-purple-300 block">{isAr ? 'سبب إصدار الإشعار الدائن:' : 'Credit Note Reason:'}</label>
              <textarea
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                rows={2}
                placeholder={isAr ? 'تسوية خصم، تعديل سعر، أو تعويض...' : 'Reason for credit adjustment...'}
                className="w-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          )}

          {documentType === 'delivery_note' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 text-xs">
              <div>
                <label className="block text-sky-700 dark:text-sky-300 mb-1">{isAr ? 'شركة الشحن' : 'Courier Company'}</label>
                <input
                  type="text"
                  value={courierCompany}
                  onChange={(e) => setCourierCompany(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sky-700 dark:text-sky-300 mb-1">{isAr ? 'رقم التتبع (Tracking #)' : 'Tracking AWB'}</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="AWB-884920"
                  className="w-full bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          )}

          {/* Line Items Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isAr ? 'بنود ومنتجات الفاتورة' : 'Document Line Items'}
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة بند' : 'Add Item'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={it.id || idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2.5 text-xs"
                >
                  <span className="font-mono text-slate-400 dark:text-slate-500 w-5 text-center">{idx + 1}</span>
                  <input
                    type="text"
                    value={it.name}
                    onChange={(e) => handleUpdateItem(idx, { name: e.target.value })}
                    placeholder={isAr ? 'اسم المنتج / الخدمة' : 'Item description'}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={it.sku}
                    onChange={(e) => handleUpdateItem(idx, { sku: e.target.value })}
                    placeholder="SKU"
                    className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-mono"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 dark:text-slate-400">{isAr ? 'الكمية:' : 'Qty:'}</span>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => handleUpdateItem(idx, { quantity: Number(e.target.value) || 1 })}
                      className="w-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 dark:text-slate-400">{isAr ? 'السعر:' : 'Price:'}</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={it.unitPrice}
                      onChange={(e) => handleUpdateItem(idx, { unitPrice: Number(e.target.value) || 0 })}
                      className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white text-end font-mono"
                    />
                  </div>
                  <div className="w-20 text-end font-mono font-bold text-slate-900 dark:text-white">
                    {it.total.toFixed(2)} SAR
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-full max-w-xs p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span className="font-mono text-slate-900 dark:text-white">{subtotal.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{isAr ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
                <span className="font-mono text-slate-900 dark:text-white">{totalVat.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{isAr ? 'الشحن والتوصيل:' : 'Shipping:'}</span>
                <input
                  type="number"
                  min={0}
                  value={shippingFee}
                  onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                  className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm px-1.5 py-0.5 text-end text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{isAr ? 'الخصم المطبق:' : 'Discount:'}</span>
                <input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm px-1.5 py-0.5 text-end text-emerald-600 dark:text-emerald-400 font-mono"
                />
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>{isAr ? 'الإجمالي الكلي:' : 'Grand Total:'}</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{grandTotal.toFixed(2)} SAR</span>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="h-16 px-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'توليد وإصدار المستند' : 'Generate & Issue Document'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
