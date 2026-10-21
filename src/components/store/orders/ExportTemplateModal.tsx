import React, { useState } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  X,
  Plus,
  Trash2,
  FileText,
  Info,
  Check,
  FolderOpen,
} from 'lucide-react';

interface ExportTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport?: (selectedFields: string[], format: 'xlsx' | 'csv') => void;
}

interface ExportElement {
  id: string;
  category: string;
  name: string;
  nameAr: string;
}

const AVAILABLE_ELEMENTS: ExportElement[] = [
  // Customer Information
  { id: 'customer_name', category: 'Customer Information', name: 'Customer Name', nameAr: 'اسم العميل' },
  { id: 'customer_phone', category: 'Customer Information', name: 'Mobile Number', nameAr: 'رقم الجوال' },
  { id: 'customer_city', category: 'Customer Information', name: 'City', nameAr: 'المدينة' },
  { id: 'customer_country', category: 'Customer Information', name: 'Country', nameAr: 'الدولة' },
  { id: 'customer_address', category: 'Customer Information', name: 'Customer Address', nameAr: 'عنوان العميل' },
  { id: 'customer_location', category: 'Customer Information', name: 'Customer Location on Google Maps', nameAr: 'موقع العميل على خرائط جوجل' },
  // Order Information
  { id: 'order_number', category: 'Order Information', name: 'Order Number', nameAr: 'رقم الطلب' },
  { id: 'order_date', category: 'Order Information', name: 'Order Date & Time', nameAr: 'تاريخ ووقت الطلب' },
  { id: 'order_status', category: 'Order Information', name: 'Order Status', nameAr: 'حالة الطلب' },
  { id: 'payment_status', category: 'Order Information', name: 'Payment Status', nameAr: 'حالة الدفع' },
  { id: 'payment_method', category: 'Order Information', name: 'Payment Method', nameAr: 'طريقة الدفع' },
  { id: 'total_amount', category: 'Order Information', name: 'Total Amount', nameAr: 'المبلغ الإجمالي' },
  { id: 'items_summary', category: 'Order Information', name: 'Products & Quantities', nameAr: 'المنتجات والكميات' },
];

export const ExportTemplateModal: React.FC<ExportTemplateModalProps> = ({
  isOpen,
  onClose,
  onExport,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [templateName, setTemplateName] = useState('');
  const [addedElementIds, setAddedElementIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleAddElement = (id: string) => {
    if (!addedElementIds.includes(id)) {
      setAddedElementIds((prev) => [...prev, id]);
    }
  };

  const handleRemoveElement = (id: string) => {
    setAddedElementIds((prev) => prev.filter((elId) => elId !== id));
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      toast(isAr ? 'يرجى إدخال اسم القالب' : 'Please enter template name', 'error');
      return;
    }
    if (addedElementIds.length === 0) {
      toast(isAr ? 'يرجى إضافة عنصر واحد على الأقل' : 'Please add at least one element', 'error');
      return;
    }

    toast(
      isAr ? `تم حفظ قالب التصدير "${templateName}" بنجاح` : `Export template "${templateName}" saved`,
      'success'
    );
    if (onExport) {
      onExport(addedElementIds, 'xlsx');
    }
    onClose();
  };

  const categories = Array.from(new Set(AVAILABLE_ELEMENTS.map((el) => el.category)));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#071E26] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Teal Header matching Image 1 */}
        <div
          className="px-6 py-4 flex items-center justify-between text-white"
          style={{ background: '#5eead4', color: '#134e4a' }}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <FileText className="w-4 h-4 text-teal-800" />
            <span>{isAr ? 'إضافة قالب تصدير' : 'Add Export Template'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Template Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <span>{isAr ? 'اسم القالب' : 'Template Name'}</span>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <input
              type="text"
              placeholder={isAr ? 'أدخل اسم القالب' : 'Enter template name'}
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
            />
          </div>

          {/* Two-panel Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Available Elements */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 max-h-80 overflow-y-auto">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                {isAr ? 'العناصر المتاحة' : 'Available Elements'}
              </h4>

              <div className="space-y-4">
                {categories.map((cat) => {
                  const items = AVAILABLE_ELEMENTS.filter((el) => el.category === cat);
                  return (
                    <div key={cat} className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        {isAr && cat === 'Customer Information'
                          ? 'بيانات العميل'
                          : isAr && cat === 'Order Information'
                          ? 'بيانات الطلب'
                          : cat}
                      </span>
                      <div className="space-y-1">
                        {items.map((item) => {
                          const isAdded = addedElementIds.includes(item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleAddElement(item.id)}
                              disabled={isAdded}
                              className={`w-full px-3 py-2 rounded-lg text-start text-xs flex items-center justify-between border transition-all ${
                                isAdded
                                  ? 'opacity-40 bg-slate-100 dark:bg-slate-800 border-transparent cursor-not-allowed text-slate-400'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-500 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs'
                              }`}
                            >
                              <span>{isAr ? item.nameAr : item.name}</span>
                              <Plus className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Added Elements */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 max-h-80 overflow-y-auto flex flex-col">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                {isAr ? 'العناصر المضافة' : 'Added Elements'}
              </h4>

              {addedElementIds.length === 0 ? (
                <div className="my-auto py-8 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400">
                    <FolderOpen className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {isAr ? 'لم تتم إضافة أي عناصر بعد' : 'No elements have been added yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    {isAr
                      ? 'يمكنك إضافة عناصر من القائمة المتاحة على اليسار.'
                      : 'You can add elements from the available list.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 overflow-y-auto">
                  {addedElementIds.map((id, index) => {
                    const el = AVAILABLE_ELEMENTS.find((e) => e.id === id);
                    if (!el) return null;
                    return (
                      <div
                        key={id}
                        className="px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/50 flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 font-bold text-[10px] flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {isAr ? el.nameAr : el.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveElement(id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions matching Image 1 */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm hover:opacity-95 cursor-pointer transition-all"
            style={{ background: '#0d9488' }}
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'حفظ' : 'Save'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
