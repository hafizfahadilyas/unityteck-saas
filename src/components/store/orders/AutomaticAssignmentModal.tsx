import React, { useState } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  X,
  Plus,
  Trash2,
  UserCheck,
  User,
  Sliders,
  Check,
} from 'lucide-react';

interface AutomaticAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

interface AssignmentCondition {
  id: string;
  field: 'status' | 'branch' | 'city' | 'country';
  operator: 'equals' | 'in';
  value: string;
}

const EMPLOYEES = [
  { id: 'emp-1', name: 'Sarah Ahmed', nameAr: 'سارة أحمد', initials: 'SA', role: 'Order Specialist' },
  { id: 'emp-2', name: 'Mohammed Ali', nameAr: 'محمد علي', initials: 'MA', role: 'Fulfillment Lead' },
  { id: 'emp-3', name: 'Fahad Al-Otaibi', nameAr: 'فهد العتيبي', initials: 'FA', role: 'Logistics Manager' },
  { id: 'emp-4', name: 'Lina Khaled', nameAr: 'لينا خالد', initials: 'LK', role: 'Customer Service' },
];

export const AutomaticAssignmentModal: React.FC<AutomaticAssignmentModalProps> = ({
  isOpen,
  onClose,
  storeId,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [conditions, setConditions] = useState<AssignmentCondition[]>([
    { id: 'cond-1', field: 'status', operator: 'equals', value: 'processing' },
  ]);

  if (!isOpen) return null;

  const handleAddCondition = () => {
    const newCond: AssignmentCondition = {
      id: `cond-${Date.now()}`,
      field: 'status',
      operator: 'equals',
      value: 'processing',
    };
    setConditions((prev) => [...prev, newCond]);
  };

  const handleRemoveCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const handleConditionChange = (id: string, updates: Partial<AssignmentCondition>) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleSave = () => {
    if (!selectedEmployee) {
      toast(isAr ? 'يرجى اختيار موظف أولاً' : 'Please select an employee first', 'error');
      return;
    }

    toast(
      isAr
        ? 'تم حفظ قاعدة التعيين التلقائي للطلبات بنجاح'
        : 'Automatic order assignment rule saved successfully',
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-[#071E26] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Teal Header matching Image 1 */}
        <div
          className="px-6 py-4 flex items-center justify-between text-white"
          style={{ background: '#5eead4', color: '#134e4a' }}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <UserCheck className="w-4 h-4 text-teal-800" />
            <span>{isAr ? 'التعيين التلقائي للطلبات' : 'Automatic Order Assignment'}</span>
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
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isAr
              ? 'قم بتعيين الطلب تلقائياً لموظف عندما يستوفي الطلب أحد الشروط التالية: حالة الطلب، الفرع، الدولة، أو المدينة. يرجى اختيار موظف لتكوين قواعد التعيين.'
              : 'Automatically assign an order to an employee when the order meets one of the following conditions: order status, branch, country, or city. Please select an employee to configure the assignment rules.'}
          </p>

          {/* Select Employee */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'اختر الموظف' : 'Select Employee'}</span>
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
            >
              <option value="">{isAr ? '-- اختر موظفاً --' : '-- Select an employee --'}</option>
              {EMPLOYEES.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {isAr ? emp.nameAr : emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          {/* Conditions List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'الشروط وقواعد التطابق' : 'Rule Conditions'}
              </span>
              <button
                type="button"
                onClick={handleAddCondition}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة شرط' : 'Add Condition'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {conditions.map((cond) => (
                <div
                  key={cond.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center gap-2"
                >
                  <select
                    value={cond.field}
                    onChange={(e) => handleConditionChange(cond.id, { field: e.target.value as any })}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  >
                    <option value="status">{isAr ? 'حالة الطلب' : 'Order Status'}</option>
                    <option value="branch">{isAr ? 'الفرع' : 'Branch'}</option>
                    <option value="city">{isAr ? 'المدينة' : 'City'}</option>
                    <option value="country">{isAr ? 'الدولة' : 'Country'}</option>
                  </select>

                  <select
                    value={cond.operator}
                    onChange={(e) => handleConditionChange(cond.id, { operator: e.target.value as any })}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  >
                    <option value="equals">{isAr ? 'يساوي' : 'Equals'}</option>
                    <option value="in">{isAr ? 'ضمن' : 'In'}</option>
                  </select>

                  <input
                    type="text"
                    value={cond.value}
                    onChange={(e) => handleConditionChange(cond.id, { value: e.target.value })}
                    placeholder={isAr ? 'القيمة...' : 'Value...'}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />

                  {conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(cond.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
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
            {isAr ? 'إغلاق' : 'Close'}
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
