/** Per-store abandoned-cart reminder sequence (1st / 2nd / 3rd) — local memory. */

const STORAGE_PREFIX = 'unityteck_abandoned_cart_sequence_';

export type AbandonedReminderChannel = 'whatsapp' | 'sms' | 'email';

export type AbandonedReminderStep = {
  enabled: boolean;
  time: string;
  unit: string;
  channel: AbandonedReminderChannel;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  minCartValue: string;
  targetMarket: string;
  freeShipping: boolean;
  discount: boolean;
};

export type AbandonedCartSequenceConfig = {
  first: AbandonedReminderStep;
  second: AbandonedReminderStep;
  third: AbandonedReminderStep;
};

export const DEFAULT_ABANDONED_SEQUENCE: AbandonedCartSequenceConfig = {
  first: {
    enabled: true,
    time: '1',
    unit: 'Hour',
    channel: 'whatsapp',
    title: 'Gentle Reminder',
    titleAr: 'تذكير لطيف',
    message:
      "Hi {name} 👋\n\nWe noticed you left some products in your cart and haven't completed your order yet.\n\nDo you need any help?\nYou can complete your order using the link below:\n{checkout_link}\n\nWe're here to help anytime! 💙",
    messageAr:
      'مرحباً {name} 👋\n\nلاحظنا أنك تركت بعض المنتجات في سلتك ولم تكمل الطلب بعد.\n\nهل تحتاج مساعدة؟\nيمكنك إتمام طلبك عبر الرابط أدناه:\n{checkout_link}\n\nنحن هنا لمساعدتك في أي وقت! 💙',
    minCartValue: '50.00',
    targetMarket: 'All Markets',
    freeShipping: false,
    discount: false,
  },
  second: {
    enabled: true,
    time: '24',
    unit: 'Hours',
    channel: 'sms',
    title: 'Special Offer',
    titleAr: 'عرض خاص',
    message:
      'Hello {name}, your cart is waiting! Use code SAVE10 to get 10% off your order: {checkout_link}',
    messageAr:
      'مرحباً {name}، سلتك بانتظارك! استخدم كود الخصم للحصول على خصم بنسبة ١٠٪ على طلبك: {checkout_link}',
    minCartValue: '100.00',
    targetMarket: 'All Markets',
    freeShipping: true,
    discount: true,
  },
  third: {
    enabled: true,
    time: '3',
    unit: 'Days',
    channel: 'email',
    title: 'Last Chance',
    titleAr: 'الفرصة الأخيرة',
    message:
      'Dear {name}, this is your last chance to complete your order at {store_name} before items sell out: {checkout_link}',
    messageAr:
      'عزيزي {name}، هذه فرصتك الأخيرة لإتمام طلبك من {store_name} قبل نفاد المنتجات: {checkout_link}',
    minCartValue: '50.00',
    targetMarket: 'All Markets',
    freeShipping: true,
    discount: true,
  },
};

function storageKey(storeId: string) {
  return `${STORAGE_PREFIX}${storeId}`;
}

export function readAbandonedCartSequence(storeId: string): AbandonedCartSequenceConfig {
  const base = JSON.parse(JSON.stringify(DEFAULT_ABANDONED_SEQUENCE)) as AbandonedCartSequenceConfig;
  if (typeof window === 'undefined' || !storeId) return base;
  try {
    const raw = localStorage.getItem(storageKey(storeId));
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<AbandonedCartSequenceConfig>;
    return {
      first: { ...base.first, ...(parsed.first || {}) },
      second: { ...base.second, ...(parsed.second || {}) },
      third: { ...base.third, ...(parsed.third || {}) },
    };
  } catch {
    return base;
  }
}

export function writeAbandonedCartSequence(
  storeId: string,
  config: AbandonedCartSequenceConfig,
): void {
  if (typeof window === 'undefined' || !storeId) return;
  localStorage.setItem(storageKey(storeId), JSON.stringify(config));
}
