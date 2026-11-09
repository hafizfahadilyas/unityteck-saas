import { useState, useMemo, useCallback } from 'react';
import type {
  Order,
  OrderItemDetail,
  PaymentMethod,
  OrderSource,
  DeliveryMode,
  PaymentPlan,
} from '../types';

export interface ManualOrderItem extends OrderItemDetail {
  image?: string;
}

export type DeliveryMethod = 'delivery' | 'pickup';
export type ManualPaymentStatus = 'Paid' | 'Pending Payment';

export interface UseManualOrderFormOptions {
  initialShippingFee?: number;
  taxRate?: number; // 0.15 for 15% VAT
  defaultCountryCode?: string;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  initialItems?: ManualOrderItem[];
}

export const useManualOrderForm = (options: UseManualOrderFormOptions = {}) => {
  const {
    initialShippingFee = 15.0,
    taxRate = 0.15,
    defaultCountryCode = '+966',
    initialCustomerName = '',
    initialCustomerPhone = '',
    initialItems = [],
  } = options;

  // SECTION 1: Customer Info
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [customerName, setCustomerName] = useState(initialCustomerName);

  // SECTION 2: Products
  const [items, setItems] = useState<ManualOrderItem[]>(initialItems);

  // SECTION 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<string>('mada');
  const [paymentStatus, setPaymentStatus] = useState<ManualPaymentStatus>('Paid');
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>('full');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [bankAccountId, setBankAccountId] = useState<string>('');

  // SECTION 4: Delivery
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('shipping_company');
  const [driverId, setDriverId] = useState<string>('');
  const [shippingFee, setShippingFee] = useState<number>(initialShippingFee);
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [shippingCompany, setShippingCompany] = useState<string>('');

  // Additional Meta
  const [orderSource, setOrderSource] = useState<OrderSource>('Direct');

  // Product Actions
  const addItem = useCallback((item?: Partial<ManualOrderItem>) => {
    if (item && item.id && item.name && typeof item.price === 'number') {
      const newItemId = item.id;
      const newItemName = item.name;
      const newItemPrice = item.price;
      const newItemSku = item.sku || `SKU-${Date.now().toString().slice(-4)}`;
      const newItemQty = item.quantity || 1;
      const newItemImage = item.image;

      setItems((prev) => {
        const existing = prev.find((p) => p.id === newItemId);
        if (existing) {
          return prev.map((p) =>
            p.id === newItemId
              ? {
                  ...p,
                  quantity: p.quantity + 1,
                  total: Number(((p.quantity + 1) * p.price).toFixed(2)),
                }
              : p
          );
        }
        return [
          ...prev,
          {
            id: newItemId,
            name: newItemName,
            sku: newItemSku,
            price: newItemPrice,
            quantity: newItemQty,
            total: Number((newItemPrice * newItemQty).toFixed(2)),
            image: newItemImage,
          },
        ];
      });
      return;
    }

    // If no specific item supplied, create new manual item
    setItems((prev) => {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const newCustomItem: ManualOrderItem = {
        id: `custom-prod-${Date.now()}`,
        name: `Item #${randomNum}`,
        sku: `SKU-${randomNum}`,
        price: 100.0,
        quantity: 1,
        total: 100.0,
      };
      return [...prev, newCustomItem];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, deltaOrExact: number, isExact = false) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.id !== id) return [item];
        const newQty = isExact
          ? Math.max(0, deltaOrExact)
          : item.quantity + deltaOrExact;
        if (newQty <= 0) return [];
        return [
          {
            ...item,
            quantity: newQty,
            total: Number((item.price * newQty).toFixed(2)),
          },
        ];
      }),
    );
  }, []);

  const updateItemPrice = useCallback((id: string, price: number) => {
    const validPrice = Math.max(0, price);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          price: validPrice,
          total: Number((validPrice * item.quantity).toFixed(2)),
        };
      })
    );
  }, []);

  // Delivery toggle handler
  const handleDeliveryMethodChange = useCallback((method: DeliveryMethod) => {
    setDeliveryMethod(method);
    if (method === 'pickup') {
      setShippingFee(0);
      setDriverId('');
    } else if (shippingFee === 0) {
      setShippingFee(initialShippingFee);
    }
  }, [initialShippingFee, shippingFee]);

  // SECTION 5: Dynamic Order Summary Calculations
  const subtotal = useMemo(() => {
    const sum = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return Number(sum.toFixed(2));
  }, [items]);

  const effectiveShippingFee = useMemo(() => {
    return deliveryMethod === 'pickup' ? 0 : Number(shippingFee || 0);
  }, [deliveryMethod, shippingFee]);

  // Saudi VAT Calculation: (Subtotal + Shipping) * 0.15
  const tax = useMemo(() => {
    const taxableBase = subtotal + effectiveShippingFee;
    return Number((taxableBase * taxRate).toFixed(2));
  }, [subtotal, effectiveShippingFee, taxRate]);

  // Grand Total = Subtotal + Shipping + Tax
  const grandTotal = useMemo(() => {
    return Number((subtotal + effectiveShippingFee + tax).toFixed(2));
  }, [subtotal, effectiveShippingFee, tax]);

  const remainingBalance = useMemo(() => {
    if (paymentPlan === 'full') return 0;
    return Number(Math.max(0, grandTotal - Number(amountPaid || 0)).toFixed(2));
  }, [paymentPlan, grandTotal, amountPaid]);

  // Validation
  const isValid = useMemo(() => {
    return (
      customerName.trim().length > 0 &&
      customerPhone.trim().length > 0 &&
      items.length > 0 &&
      (deliveryMethod === 'pickup' || shippingAddress.trim().length > 0)
    );
  }, [customerName, customerPhone, items, deliveryMethod, shippingAddress]);

  // Generate finalized Order payload for submission
  const getOrderPayload = useCallback(
    (storeId?: string): Partial<Order> => {
      const fullPhone = `${countryCode} ${customerPhone.trim()}`.trim();
      const itemsSummary = items.map((i) => `${i.quantity}x ${i.name}`).join(', ');

      const paymentMap: Record<string, PaymentMethod> = {
        mada: 'Mada',
        apple: 'Apple Pay',
        visa: 'Visa/MC',
        stc: 'stc pay',
        tabby: 'Tabby',
        tamara: 'Tamara',
        cash: 'COD',
        bank_transfer: 'Bank Transfer',
      };
      const resolvedPayment = paymentMap[paymentMethod] || (paymentMethod as PaymentMethod);

      const resolvedDeliveryMode: DeliveryMode | undefined =
        deliveryMethod === 'pickup' ? undefined : deliveryMode;

      const paid =
        paymentPlan === 'full'
          ? grandTotal
          : Number(Math.min(Math.max(0, amountPaid || 0), grandTotal).toFixed(2));
      const remaining =
        paymentPlan === 'full' ? 0 : Number(Math.max(0, grandTotal - paid).toFixed(2));

      return {
        storeId,
        orderNumber: undefined as unknown as string, // assigned sequentially by addOrder (#001+)
        customerName: customerName.trim(),
        customerPhone: fullPhone,
        itemsCount: items.reduce((acc, i) => acc + i.quantity, 0),
        itemsSummary,
        items,
        subtotal,
        shippingFee: effectiveShippingFee,
        tax,
        total: grandTotal,
        source: orderSource,
        sourceDetails: `Manual Store Order · ${orderSource}`,
        deliveryLocation: deliveryMethod === 'pickup' ? 'Branch Pickup' : shippingAddress.trim(),
        status: paymentStatus === 'Paid' ? 'processing' : 'pending',
        paymentMethod: resolvedPayment,
        paymentStatus: paymentStatus === 'Paid' ? 'Paid' : 'Pending',
        shippingStatus: (deliveryMethod === 'pickup' ? 'Pending' : 'Pending') as any,
        shippingCompany:
          deliveryMethod === 'delivery' && deliveryMode === 'shipping_company'
            ? shippingCompany.trim() || undefined
            : undefined,
        deliveryMode: resolvedDeliveryMode,
        driverId:
          deliveryMethod === 'delivery' && deliveryMode === 'own_delivery' && driverId
            ? driverId
            : undefined,
        bankAccountId: bankAccountId || undefined,
        paymentPlan,
        amountPaid: paid,
        remainingBalance: remaining,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    },
    [
      countryCode,
      customerPhone,
      customerName,
      items,
      subtotal,
      effectiveShippingFee,
      tax,
      grandTotal,
      orderSource,
      deliveryMethod,
      deliveryMode,
      driverId,
      shippingAddress,
      shippingCompany,
      paymentStatus,
      paymentMethod,
      paymentPlan,
      amountPaid,
      bankAccountId,
    ]
  );

  const resetForm = useCallback(() => {
    setCountryCode(defaultCountryCode);
    setCustomerPhone('');
    setCustomerName('');
    setItems([]);
    setPaymentMethod('mada');
    setPaymentStatus('Paid');
    setPaymentPlan('full');
    setAmountPaid(0);
    setBankAccountId('');
    setDeliveryMethod('delivery');
    setDeliveryMode('shipping_company');
    setDriverId('');
    setShippingFee(initialShippingFee);
    setShippingAddress('Riyadh, Saudi Arabia');
    setShippingCompany('');
  }, [defaultCountryCode, initialShippingFee]);

  return {
    // Form fields
    countryCode,
    setCountryCode,
    customerPhone,
    setCustomerPhone,
    customerName,
    setCustomerName,
    items,
    setItems,
    paymentMethod,
    setPaymentMethod,
    paymentStatus,
    setPaymentStatus,
    paymentPlan,
    setPaymentPlan,
    amountPaid,
    setAmountPaid,
    bankAccountId,
    setBankAccountId,
    deliveryMethod,
    setDeliveryMethod: handleDeliveryMethodChange,
    deliveryMode,
    setDeliveryMode,
    driverId,
    setDriverId,
    shippingFee,
    setShippingFee,
    shippingAddress,
    setShippingAddress,
    shippingCompany,
    setShippingCompany,
    orderSource,
    setOrderSource,

    // Actions
    addItem,
    removeItem,
    updateQuantity,
    updateItemPrice,
    resetForm,
    getOrderPayload,

    // Calculations
    subtotal,
    effectiveShippingFee,
    tax,
    grandTotal,
    remainingBalance,
    isValid,
  };
};
