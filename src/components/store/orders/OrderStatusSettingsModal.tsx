import React, { useEffect, useState } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { GlobalModal } from '../../common/GlobalModal';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  RotateCcw,
  Check,
  CheckCircle,
  Clock,
  Package,
  Truck,
  RotateCw,
  XCircle,
  RefreshCw,
  ChevronDown,
  Layers,
} from 'lucide-react';

export interface OrderStatusConfigItem {
  id: string;
  active: boolean;
  iconName: 'clock' | 'loader' | 'package' | 'truck' | 'truck-fast' | 'check-circle' | 'x-circle' | 'rotate-ccw' | 'refresh-cw';
  colorHex: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
  systemKey: string;
}

const DEFAULT_STATUS_ITEMS: OrderStatusConfigItem[] = [
  { id: 'st-0a', active: true, iconName: 'package', colorHex: '#94A3B8', nameAr: 'مسودة', nameEn: 'Draft', sortOrder: 1, systemKey: 'draft' },
  { id: 'st-0b', active: true, iconName: 'x-circle', colorHex: '#64748B', nameAr: 'محذوف', nameEn: 'Deleted', sortOrder: 2, systemKey: 'deleted' },
  { id: 'st-1', active: true, iconName: 'clock', colorHex: '#F59E0B', nameAr: 'بانتظار الدفع', nameEn: 'Pending Payment', sortOrder: 3, systemKey: 'pending' },
  { id: 'st-2', active: true, iconName: 'loader', colorHex: '#EAB308', nameAr: 'مدفوع جزئياً', nameEn: 'Partially Paid', sortOrder: 4, systemKey: 'partially_paid' },
  { id: 'st-3', active: true, iconName: 'package', colorHex: '#3B82F6', nameAr: 'بانتظار المراجعة', nameEn: 'Pending Review', sortOrder: 5, systemKey: 'pending_review' },
  { id: 'st-4', active: true, iconName: 'loader', colorHex: '#8B5CF6', nameAr: 'قيد التنفيذ', nameEn: 'Processing', sortOrder: 6, systemKey: 'processing' },
  { id: 'st-5', active: true, iconName: 'check-circle', colorHex: '#059669', nameAr: 'تم التنفيذ', nameEn: 'Completed', sortOrder: 7, systemKey: 'completed' },
  { id: 'st-6', active: true, iconName: 'truck-fast', colorHex: '#F97316', nameAr: 'جاري التوصيل', nameEn: 'Out for Delivery', sortOrder: 8, systemKey: 'out_for_delivery' },
  { id: 'st-7', active: true, iconName: 'check-circle', colorHex: '#10B981', nameAr: 'تم التوصيل', nameEn: 'Delivered', sortOrder: 9, systemKey: 'delivered' },
  { id: 'st-8', active: true, iconName: 'truck', colorHex: '#06B6D4', nameAr: 'تم الشحن', nameEn: 'Shipped', sortOrder: 10, systemKey: 'shipped' },
  { id: 'st-9', active: true, iconName: 'x-circle', colorHex: '#EF4444', nameAr: 'ملغي', nameEn: 'Cancelled', sortOrder: 11, systemKey: 'cancelled' },
  { id: 'st-10', active: true, iconName: 'rotate-ccw', colorHex: '#A855F7', nameAr: 'مسترجع', nameEn: 'Returned', sortOrder: 12, systemKey: 'returned' },
  { id: 'st-11', active: true, iconName: 'refresh-cw', colorHex: '#D946EF', nameAr: 'قيد الإسترجاع', nameEn: 'Return in Progress', sortOrder: 13, systemKey: 'return_in_progress' },
  { id: 'st-12', active: true, iconName: 'package', colorHex: '#64748B', nameAr: 'طلب عرض سعر', nameEn: 'Request for Quotation (RFQ)', sortOrder: 14, systemKey: 'rfq' },
];

interface OrderStatusSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

export const OrderStatusSettingsModal: React.FC<OrderStatusSettingsModalProps> = ({
  isOpen,
  onClose,
  storeId,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const storageKey = `store_order_statuses_${storeId}`;
  const [statuses, setStatuses] = useState<OrderStatusConfigItem[]>(DEFAULT_STATUS_ITEMS);

  useEffect(() => {
    if (!isOpen || !storeId) return;
    try {
      const saved = localStorage.getItem(`store_order_statuses_${storeId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          const byKey = new Map(
            parsed
              .filter((s: OrderStatusConfigItem) => s?.systemKey)
              .map((s: OrderStatusConfigItem) => [String(s.systemKey), s]),
          );
          const merged = DEFAULT_STATUS_ITEMS.map((def) => {
            const hit = byKey.get(def.systemKey);
            return hit ? { ...def, ...hit, systemKey: def.systemKey, id: hit.id || def.id } : def;
          });
          // Keep any custom rows merchant added (no systemKey or unknown key)
          const known = new Set(DEFAULT_STATUS_ITEMS.map((d) => d.systemKey));
          const custom = parsed.filter(
            (s: OrderStatusConfigItem) => !s?.systemKey || !known.has(String(s.systemKey)),
          );
          setStatuses([...merged, ...custom]);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setStatuses(DEFAULT_STATUS_ITEMS);
  }, [isOpen, storeId]);

  if (!isOpen) return null;

  const renderIcon = (name: string, color: string) => {
    const props = { className: 'w-4 h-4', style: { color } };
    switch (name) {
      case 'clock':
        return <Clock {...props} />;
      case 'loader':
        return <RotateCw {...props} />;
      case 'package':
        return <Package {...props} />;
      case 'truck':
        return <Truck {...props} />;
      case 'truck-fast':
        return <Truck {...props} />;
      case 'check-circle':
        return <CheckCircle {...props} />;
      case 'x-circle':
        return <XCircle {...props} />;
      case 'rotate-ccw':
        return <RotateCcw {...props} />;
      case 'refresh-cw':
        return <RefreshCw {...props} />;
      default:
        return <Package {...props} />;
    }
  };

  const handleToggleActive = (id: string) => {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  };

  const handleDelete = (id: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== id));
    toast(isAr ? 'تم حذف الحالة' : 'Status removed', 'info');
  };

  const handleNameChange = (id: string, field: 'nameAr' | 'nameEn', value: string) => {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleSortChange = (id: string, newOrder: number) => {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, sortOrder: newOrder } : s)));
  };

  const handleAddNewStatus = () => {
    const newId = `st-${Date.now()}`;
    const nextOrder = statuses.length + 1;
    const newItem: OrderStatusConfigItem = {
      id: newId,
      active: true,
      iconName: 'package',
      colorHex: '#3B82F6',
      nameAr: 'حالة جديدة',
      nameEn: 'New Status',
      sortOrder: nextOrder,
      systemKey: `custom_${nextOrder}`,
    };
    setStatuses((prev) => [...prev, newItem]);
    toast(isAr ? 'تمت إضافة حالة جديدة' : 'New status added', 'success');
  };

  const handleResetToDefault = () => {
    setStatuses(DEFAULT_STATUS_ITEMS);
    localStorage.removeItem(storageKey);
    toast(isAr ? 'تمت استعادة الإعدادات الافتراضية' : 'Reset to default settings', 'info');
  };

  const handleSave = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(statuses));
      toast(isAr ? 'تم حفظ الحالات بنجاح' : 'Order statuses saved successfully', 'success');
      onClose();
    } catch {
      toast(isAr ? 'تعذر حفظ البيانات' : 'Failed to save', 'error');
    }
  };

  return (
    <GlobalModal
      onClose={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'حالات الطلب' : 'Order Statuses'}
    >
      <div className="w-full max-w-5xl bg-white dark:bg-[#071E26] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1 flex-wrap">
              <span>{isAr ? 'الرئيسية' : 'Home'}</span>
              <span>/</span>
              <span>{isAr ? 'إعدادات المتجر' : 'Store Settings'}</span>
              <span>/</span>
              <span className="text-teal-600 dark:text-teal-400 font-bold">
                {isAr ? 'حالات الطلب' : 'Order Statuses'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {isAr ? 'حالات الطلب' : 'Order Statuses'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'يمكنك إضافة وإدارة حالات الطلب حسب احتياجات متجرك.'
                    : 'You can add and manage order statuses based on your store needs.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAddNewStatus}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-xs hover:opacity-90 cursor-pointer transition-all"
              style={{ background: '#0d9488' }}
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة حالة جديدة' : 'Add New Status'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-x-auto max-h-[60vh]">
          <table className="w-full text-start text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                <th className="pb-3 text-start w-16">{isAr ? 'تفعيل' : 'Active'}</th>
                <th className="pb-3 text-start w-20">{isAr ? 'إجراءات' : 'Actions'}</th>
                <th className="pb-3 text-start w-20">{isAr ? 'أيقونة' : 'Icon'}</th>
                <th className="pb-3 text-start w-28">{isAr ? 'اللون' : 'Color'}</th>
                <th className="pb-3 text-start min-w-[140px]">
                  {isAr ? 'اسم الحالة بالعربية' : 'Status Name (Arabic)'}
                </th>
                <th className="pb-3 text-start min-w-[140px]">
                  {isAr ? 'اسم الحالة بالإنجليزية' : 'Status Name (English)'}
                </th>
                <th className="pb-3 text-center w-24">{isAr ? 'الترتيب' : 'Sort Order'}</th>
                <th className="pb-3 text-center w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {statuses.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                >
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item.id)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative ${
                        item.active ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      aria-label={isAr ? 'تفعيل الحالة' : 'Toggle status'}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          item.active
                            ? isAr
                              ? '-translate-x-4'
                              : 'translate-x-4'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title={isAr ? 'تعديل' : 'Edit'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  <td className="py-3">
                    <div className="w-12 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between px-2">
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                      {renderIcon(item.iconName, item.colorHex)}
                    </div>
                  </td>

                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      <span className="font-mono text-slate-600 dark:text-slate-300 uppercase text-[11px]">
                        {item.colorHex}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 pe-3">
                    <input
                      type="text"
                      value={item.nameAr}
                      onChange={(e) => handleNameChange(item.id, 'nameAr', e.target.value)}
                      dir="rtl"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
                      placeholder={isAr ? 'الاسم بالعربية' : 'Arabic name'}
                    />
                  </td>

                  <td className="py-3 pe-3">
                    <input
                      type="text"
                      value={item.nameEn}
                      onChange={(e) => handleNameChange(item.id, 'nameEn', e.target.value)}
                      dir="ltr"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
                      placeholder={isAr ? 'الاسم بالإنجليزية' : 'English name'}
                    />
                  </td>

                  <td className="py-3 text-center">
                    <input
                      type="number"
                      value={item.sortOrder}
                      onChange={(e) => handleSortChange(item.id, parseInt(e.target.value, 10) || 1)}
                      className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-center text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
                    />
                  </td>

                  <td className="py-3 text-center text-slate-400">
                    <GripVertical className="w-4 h-4 inline-block cursor-grab" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'استعادة الافتراضي' : 'Reset to Default'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm hover:opacity-95 cursor-pointer transition-all"
            style={{ background: '#0d9488' }}
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'حفظ التغييرات' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};
