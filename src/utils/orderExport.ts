import type { Order } from '../types';
import { getCustomerDisplayName, getLocalizedItemName } from './storeLocalization';
import {
  localizeOrderStatus,
  localizePaymentMethod,
  localizePaymentStatus,
  localizeSalesChannel,
} from './domainLabels';
import { localeMixedLabel } from './localeMixedLabel';
import { downloadCsv, downloadXlsx } from './exportSpreadsheet';

export { downloadCsv, downloadXlsx } from './exportSpreadsheet';

export type OrderExportFieldId =
  | 'order_number'
  | 'order_date'
  | 'customer_name'
  | 'customer_phone'
  | 'customer_city'
  | 'customer_country'
  | 'customer_address'
  | 'customer_location'
  | 'order_status'
  | 'payment_status'
  | 'payment_method'
  | 'total_amount'
  | 'items_summary'
  | 'source';

export const DEFAULT_ORDER_EXPORT_FIELDS: OrderExportFieldId[] = [
  'order_number',
  'order_date',
  'customer_name',
  'customer_phone',
  'items_summary',
  'total_amount',
  'payment_method',
  'payment_status',
  'order_status',
  'source',
];

const FIELD_LABELS: Record<OrderExportFieldId, { en: string; ar: string }> = {
  order_number: { en: 'Order Number', ar: 'رقم الطلب' },
  order_date: { en: 'Date', ar: 'التاريخ' },
  customer_name: { en: 'Customer Name', ar: 'اسم العميل' },
  customer_phone: { en: 'Phone', ar: 'الهاتف' },
  customer_city: { en: 'City', ar: 'المدينة' },
  customer_country: { en: 'Country', ar: 'الدولة' },
  customer_address: { en: 'Customer Address', ar: 'عنوان العميل' },
  customer_location: { en: 'Customer Location', ar: 'موقع العميل' },
  order_status: { en: 'Order Status', ar: 'حالة الطلب' },
  payment_status: { en: 'Payment Status', ar: 'حالة الدفع' },
  payment_method: { en: 'Payment Method', ar: 'طريقة الدفع' },
  total_amount: { en: 'Total Amount', ar: 'المبلغ الإجمالي' },
  items_summary: { en: 'Products', ar: 'المنتجات' },
  source: { en: 'Source', ar: 'المصدر' },
};

function parseCityCountry(order: Order, isAr: boolean): { city: string; country: string } {
  const raw = String(order.shippingAddress || order.deliveryLocation || '').trim();
  if (!raw) {
    return { city: '', country: isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia' };
  }
  const parts = raw.split(/[|,/]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts[parts.length - 2] || parts[0], country: parts[parts.length - 1] };
  }
  return { city: parts[0] || '', country: isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia' };
}

function itemsSummary(order: Order, locale: string, isAr: boolean): string {
  if (order.items?.length) {
    return order.items
      .map((it) => `${getLocalizedItemName(it, locale)} x${it.quantity}`)
      .join('; ');
  }
  return (
    localeMixedLabel((order as { itemsSummary?: string }).itemsSummary, isAr) ||
    (isAr ? 'منتج x 1' : 'Product x 1')
  );
}

export function resolveOrderExportField(
  order: Order,
  fieldId: string,
  locale: string,
): string {
  const isAr = locale === 'ar';
  const { city, country } = parseCityCountry(order, isAr);
  const address = String(order.shippingAddress || order.deliveryLocation || '').trim();

  switch (fieldId as OrderExportFieldId) {
    case 'order_number':
      return String(order.orderNumber || order.id || '');
    case 'order_date': {
      const raw = [order.date, order.time].filter(Boolean).join(' ') || order.createdAt || '';
      // Keep as plain text so Excel does not split "2026-11-09" across columns
      return String(raw).replace(/,/g, ' ');
    }
    case 'customer_name':
      return getCustomerDisplayName(order.customerName, locale) || String(order.customerName || '');
    case 'customer_phone':
      return String(order.customerPhone || '');
    case 'customer_city':
      return city;
    case 'customer_country':
      return country;
    case 'customer_address':
      return address;
    case 'customer_location':
      return address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
        : '';
    case 'order_status':
      return localizeOrderStatus(order.status, locale);
    case 'payment_status':
      return localizePaymentStatus(order.paymentStatus, locale);
    case 'payment_method':
      return localizePaymentMethod(order.paymentMethod, locale);
    case 'total_amount':
      return String(order.total ?? '');
    case 'items_summary':
      return itemsSummary(order, locale, isAr);
    case 'source':
      return localizeSalesChannel(order.source, locale);
    default:
      return '';
  }
}

export function buildOrderExportTable(
  orders: Order[],
  fieldIds: string[],
  locale: string,
): string[][] {
  const isAr = locale === 'ar';
  const fields = (fieldIds.length ? fieldIds : DEFAULT_ORDER_EXPORT_FIELDS).filter(
    (id): id is OrderExportFieldId => id in FIELD_LABELS,
  );
  const safeFields = fields.length ? fields : DEFAULT_ORDER_EXPORT_FIELDS;
  const headers = safeFields.map((id) => (isAr ? FIELD_LABELS[id].ar : FIELD_LABELS[id].en));
  const rows = orders.map((order) =>
    safeFields.map((id) => resolveOrderExportField(order, id, locale)),
  );
  return [headers, ...rows];
}

export function exportOrdersSpreadsheet(
  orders: Order[],
  options: {
    format: 'xlsx' | 'csv';
    filename: string;
    fieldIds?: string[];
    locale: string;
    sheetName?: string;
  },
): void {
  const fieldIds = options.fieldIds || DEFAULT_ORDER_EXPORT_FIELDS;
  const table = buildOrderExportTable(orders, fieldIds, options.locale);
  if (options.format === 'xlsx') {
    const fields = (fieldIds.length ? fieldIds : DEFAULT_ORDER_EXPORT_FIELDS).filter(
      (id): id is OrderExportFieldId => id in FIELD_LABELS,
    );
    const safeFields = fields.length ? fields : DEFAULT_ORDER_EXPORT_FIELDS;
    const textColumnIndexes = safeFields
      .map((id, i) => (id === 'customer_phone' || id === 'order_number' ? i : -1))
      .filter((i) => i >= 0);
    downloadXlsx(
      options.filename,
      options.sheetName || (options.locale === 'ar' ? 'الطلبات' : 'Orders'),
      table,
      { rtl: options.locale === 'ar', textColumnIndexes },
    );
  } else {
    downloadCsv(options.filename, table);
  }
}

/** Store-scoped export templates (no cross-tenant leak). */
export interface StoredExportTemplate {
  id: string;
  name: string;
  fields: string[];
  updatedAt: string;
}

function templatesKey(storeId: string) {
  return `store_order_export_templates_${storeId}`;
}

export function loadExportTemplates(storeId: string): StoredExportTemplate[] {
  if (!storeId) return [];
  try {
    const raw = localStorage.getItem(templatesKey(storeId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveExportTemplate(storeId: string, template: Omit<StoredExportTemplate, 'id' | 'updatedAt'> & { id?: string }): StoredExportTemplate[] {
  const list = loadExportTemplates(storeId);
  const next: StoredExportTemplate = {
    id: template.id || `tpl-${Date.now()}`,
    name: template.name.trim(),
    fields: template.fields,
    updatedAt: new Date().toISOString(),
  };
  const idx = list.findIndex((t) => t.id === next.id || t.name === next.name);
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  localStorage.setItem(templatesKey(storeId), JSON.stringify(list));
  return list;
}

/** Store-scoped automatic assignment rules. */
export interface AssignmentRuleCondition {
  id: string;
  field: 'status' | 'branch' | 'city' | 'country';
  operator: 'equals' | 'in';
  value: string;
}

export interface AssignmentRule {
  id: string;
  employeeName: string;
  conditions: AssignmentRuleCondition[];
  updatedAt: string;
}

function assignmentKey(storeId: string) {
  return `store_order_assignment_rules_${storeId}`;
}

export function loadAssignmentRules(storeId: string): AssignmentRule[] {
  if (!storeId) return [];
  try {
    const raw = localStorage.getItem(assignmentKey(storeId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAssignmentRules(storeId: string, rules: AssignmentRule[]): void {
  if (!storeId) return;
  localStorage.setItem(assignmentKey(storeId), JSON.stringify(rules));
}

export function orderMatchesAssignmentConditions(
  order: Order,
  conditions: AssignmentRuleCondition[],
): boolean {
  if (!conditions.length) return false;
  return conditions.some((cond) => {
    const needle = String(cond.value || '').trim().toLowerCase();
    if (!needle) return false;
    let hay = '';
    if (cond.field === 'status') hay = String(order.status || '');
    else if (cond.field === 'city') hay = parseCityCountry(order, false).city;
    else if (cond.field === 'country') hay = parseCityCountry(order, false).country;
    else if (cond.field === 'branch') {
      hay = String((order as { branch?: string }).branch || order.sourceDetails || '');
    }
    hay = hay.toLowerCase();
    if (cond.operator === 'in') {
      return needle.split(/[,|]/).map((p) => p.trim()).filter(Boolean).some((p) => hay.includes(p));
    }
    return hay === needle || hay.includes(needle);
  });
}
