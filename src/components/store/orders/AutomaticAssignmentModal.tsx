import React, { useEffect, useState } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { useTenant } from '../../../context/TenantContext';
import { GlobalModal } from '../../common/GlobalModal';
import {
  X,
  Plus,
  Trash2,
  UserCheck,
  User,
  Check,
} from 'lucide-react';
import type { Order } from '../../../types';
import {
  loadAssignmentRules,
  saveAssignmentRules,
  orderMatchesAssignmentConditions,
  type AssignmentRule,
  type AssignmentRuleCondition,
} from '../../../utils/orderExport';

interface AutomaticAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  orders?: Order[];
}

export const AutomaticAssignmentModal: React.FC<AutomaticAssignmentModalProps> = ({
  isOpen,
  onClose,
  storeId,
  orders = [],
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const { updateOrder } = useTenant();

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [conditions, setConditions] = useState<AssignmentRuleCondition[]>([
    { id: 'cond-1', field: 'status', operator: 'equals', value: 'processing' },
  ]);

  useEffect(() => {
    if (!isOpen || !storeId) return;
    const rules = loadAssignmentRules(storeId);
    const latest = rules[0];
    if (latest) {
      setSelectedEmployee(latest.employeeName || '');
      setConditions(
        latest.conditions?.length
          ? latest.conditions
          : [{ id: 'cond-1', field: 'status', operator: 'equals', value: 'processing' }],
      );
    } else {
      setSelectedEmployee('');
      setConditions([{ id: 'cond-1', field: 'status', operator: 'equals', value: 'processing' }]);
    }
  }, [isOpen, storeId]);

  if (!isOpen) return null;

  const handleAddCondition = () => {
    const newCond: AssignmentRuleCondition = {
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

  const handleConditionChange = (id: string, updates: Partial<AssignmentRuleCondition>) => {
    setConditions((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleSave = () => {
    if (!selectedEmployee.trim()) {
      toast(isAr ? 'يرجى إدخال اسم الموظف أولاً' : 'Please enter an employee name first', 'error');
      return;
    }
    if (!storeId) {
      toast(isAr ? 'المتجر غير محدد' : 'Store not identified', 'error');
      return;
    }

    const rule: AssignmentRule = {
      id: `rule-${Date.now()}`,
      employeeName: selectedEmployee.trim(),
      conditions,
      updatedAt: new Date().toISOString(),
    };
    const existing = loadAssignmentRules(storeId).filter(
      (r) => r.employeeName.toLowerCase() !== rule.employeeName.toLowerCase(),
    );
    saveAssignmentRules(storeId, [rule, ...existing]);

    const storeOrders = orders.filter((o) => o.storeId === storeId || !o.storeId);
    let assigned = 0;
    for (const order of storeOrders) {
      if (order.assignedEmployee) continue;
      if (!orderMatchesAssignmentConditions(order, conditions)) continue;
      updateOrder(order.id, { assignedEmployee: rule.employeeName }, storeId);
      assigned += 1;
    }

    toast(
      isAr
        ? `تم حفظ القاعدة وتعيين${assigned}طلب(ات) لـ${rule.employeeName}`
        : `Rule saved — assigned ${assigned} order(s) to ${rule.employeeName}`,
      'success',
    );
    onClose();
  };

  return (
    <GlobalModal
      onClose={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'التعيين التلقائي للطلبات' : 'Automatic Order Assignment'}
    >
      <div className="w-full max-w-xl bg-white dark:bg-[#071E26] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
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

        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isAr
              ? 'قم بتعيين الطلب تلقائياً لموظف عندما يستوفي الطلب أحد الشروط التالية: حالة الطلب، الفرع، الدولة، أو المدينة. يرجى اختيار موظف لتكوين قواعد التعيين.'
              : 'Automatically assign an order to an employee when the order meets one of the following conditions: order status, branch, country, or city. Please select an employee to configure the assignment rules.'}
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'الموظف المعين' : 'Assigned Employee'}</span>
            </label>
            <input
              type="text"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              placeholder={isAr ? 'اسم الموظف' : 'Employee name'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
            />
            <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              {isAr
                ? 'تُحفظ القاعدة لهذا المتجر فقط وتُطبَّق على الطلبات غير المعيَّنة المطابقة.'
                : 'Rule is saved for this store only and applied to matching unassigned orders.'}
            </p>
          </div>

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
                    onChange={(e) =>
                      handleConditionChange(cond.id, {
                        field: e.target.value as AssignmentRuleCondition['field'],
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  >
                    <option value="status">{isAr ? 'حالة الطلب' : 'Order Status'}</option>
                    <option value="branch">{isAr ? 'الفرع' : 'Branch'}</option>
                    <option value="city">{isAr ? 'المدينة' : 'City'}</option>
                    <option value="country">{isAr ? 'الدولة' : 'Country'}</option>
                  </select>

                  <select
                    value={cond.operator}
                    onChange={(e) =>
                      handleConditionChange(cond.id, {
                        operator: e.target.value as AssignmentRuleCondition['operator'],
                      })
                    }
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
            style={{ background: 'var(--portal-cta)' }}
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'حفظ وتطبيق' : 'Save & Apply'}</span>
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};
