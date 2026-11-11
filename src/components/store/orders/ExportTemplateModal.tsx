import React, { useEffect, useState } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { GlobalModal } from '../../common/GlobalModal';
import {
  X,
  Plus,
  Trash2,
  FileText,
  Info,
  Check,
  FolderOpen,
} from 'lucide-react';
import { loadExportTemplates, saveExportTemplate } from '../../../utils/orderExport';

interface ExportTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onExport?: (selectedFields: string[], format: 'xlsx' | 'csv') => void;
}

interface ExportElement {
  id: string;
  category: string;
  categoryAr: string;
  name: string;
  nameAr: string;
}

const AVAILABLE_ELEMENTS: ExportElement[] = [
  { id: 'customer_name', category: 'Customer Information', categoryAr: 'بيانات العميل', name: 'Customer Name', nameAr: 'اسم العميل' },
  { id: 'customer_phone', category: 'Customer Information', categoryAr: 'بيانات العميل', name: 'Mobile Number', nameAr: 'رقم الجوال' },
  { id: 'customer_city', category: 'Customer Information', categoryAr: 'بيانات العميل', name: 'City', nameAr: 'المدينة' },
  { id: 'customer_country', category: 'Customer Information', categoryAr: 'بيانات العميل', name: 'Country', nameAr: 'الدولة' },
  { id: 'customer_address', category: 'Customer Information', categoryAr: 'بيانات العميل', name: 'Customer Address', nameAr: 'عنوان العميل' },
  { id: 'customer_location', category: 'Customer Information', categoryAr: 'بيانات العميل', name: 'Customer Location on Maps', nameAr: 'موقع العميل على الخرائط' },
  { id: 'order_number', category: 'Order Information', categoryAr: 'بيانات الطلب', name: 'Order Number', nameAr: 'رقم الطلب' },
  { id: 'order_date', category: 'Order Information', categoryAr: 'بيانات الطلب', name: 'Order Date & Time', nameAr: 'تاريخ ووقت الطلب' },
  { id: 'order_status', category: 'Order Information', categoryAr: 'بيانات الطلب', name: 'Order Status', nameAr: 'حالة الطلب' },
  { id: 'payment_status', category: 'Order Information', categoryAr: 'بيانات الطلب', name: 'Payment Status', nameAr: 'حالة الدفع' },
  { id: 'payment_method', category: 'Order Information', categoryAr: 'بيانات الطلب', name: 'Payment Method', nameAr: 'طريقة الدفع' },
  { id: 'total_amount', category: 'Order Information', categoryAr: 'بيانات الطلب', name: 'Total Amount', nameAr: 'المبلغ الإجمالي' },
  { id: 'items_summary', category: 'Order Information', categoryAr: 'بيانات الطلب', name: 'Products & Quantities', nameAr: 'المنتجات والكميات' },
  { id: 'source', category: 'Order Information', categoryAr: 'بيانات الطلب', name: 'Order Source', nameAr: 'مصدر الطلب' },
];

export const ExportTemplateModal: React.FC<ExportTemplateModalProps> = ({
  isOpen,
  onClose,
  storeId,
  onExport,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [templateName, setTemplateName] = useState('');
  const [addedElementIds, setAddedElementIds] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (!isOpen || !storeId) return;
    const saved = loadExportTemplates(storeId);
    setSavedCount(saved.length);
    if (saved[0]?.fields?.length) {
      setTemplateName(saved[0].name);
      setAddedElementIds(saved[0].fields);
    } else {
      setTemplateName('');
      setAddedElementIds([]);
    }
  }, [isOpen, storeId]);

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
    if (!storeId) {
      toast(isAr ? 'المتجر غير محدد' : 'Store not identified', 'error');
      return;
    }

    const list = saveExportTemplate(storeId, {
      name: templateName.trim(),
      fields: addedElementIds,
    });
    setSavedCount(list.length);

    toast(
      isAr ? `تم حفظ قالب التصدير "${templateName.trim}" بنجاح` : `Export template "${templateName.trim()}" saved`,
      'success',
    );
    if (onExport) {
      onExport(addedElementIds, exportFormat);
    }
    onClose();
  };

  const categories = Array.from(
    new Map(AVAILABLE_ELEMENTS.map((el) => [el.category, el.categoryAr])).entries(),
  );

  return (
    <GlobalModal
      onClose={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'إضافة قالب تصدير' : 'Add Export Template'}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#071E26] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
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

        <div className="p-6 space-y-5">
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
            {savedCount > 0 ? (
              <p className="mt-1.5 text-[10px] text-slate-500">
                {isAr
                  ? `${savedCount}قالب محفوظ لهذا المتجر`
                  : `${savedCount} saved template(s) for this store`}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'صيغة التصدير' : 'Export format'}
            </span>
            <button
              type="button"
              onClick={() => setExportFormat('xlsx')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                exportFormat === 'xlsx'
                  ? 'border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {isAr ? 'إكسل' : 'Excel'}
            </button>
            <button
              type="button"
              onClick={() => setExportFormat('csv')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                exportFormat === 'csv'
                  ? 'border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {isAr ? 'ملف نصي' : 'CSV'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30 max-h-80 overflow-y-auto">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                {isAr ? 'العناصر المتاحة' : 'Available Elements'}
              </h4>

              <div className="space-y-4">
                {categories.map(([catEn, catAr]) => {
                  const items = AVAILABLE_ELEMENTS.filter((el) => el.category === catEn);
                  return (
                    <div key={catEn} className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        {isAr ? catAr : catEn}
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
                      ? 'يمكنك إضافة عناصر من القائمة المتاحة.'
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
            style={{ background: 'var(--portal-cta)' }}
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'حفظ وتصدير' : 'Save & Export'}</span>
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};
