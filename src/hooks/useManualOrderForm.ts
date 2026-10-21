import { useState, useMemo, useCallback } from 'react';
import type { Order, OrderItemDetail, PaymentMethod, OrderSource } from '../types';

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

  // SECTION 4: Delivery
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [shippingFee, setShippingFee] = useState<number>(initialShippingFee);
  const [shippingAddress, setShippingAddress] = useState<string>('Riyadh, Saudi Arabia');

  // Additional Meta
  const [orderSource, setOrderSource] = useState<OrderSource>('Instagram');

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
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = isExact
          ? Math.max(1, deltaOrExact)
          : Math.max(1, item.quantity + deltaOrExact);
        return {
          ...item,
          quantity: newQty,
          total: Number((item.price * newQty).toFixed(2)),
        };
      })
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

      return {
        storeId,
        orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
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
        deliveryLocation: deliveryMethod === 'pickup' ? 'Branch Pickup' : shippingAddress.trim(),
        status: paymentStatus === 'Paid' ? 'processing' : 'pending',
        paymentMethod: paymentMethod as PaymentMethod,
        paymentStatus: paymentStatus === 'Paid' ? 'Paid' : 'Pending',
        shippingStatus: (deliveryMethod === 'pickup' ? 'Pending' : 'Pending') as any,
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
      shippingAddress,
      paymentStatus,
      paymentMethod,
    ]
  );

  const resetForm = useCallback(() => {
    setCountryCode(defaultCountryCode);
    setCustomerPhone('');
    setCustomerName('');
    setItems([]);
    setPaymentMethod('mada');
    setPaymentStatus('Paid');
    setDeliveryMethod('delivery');
    setShippingFee(initialShippingFee);
    setShippingAddress('Riyadh, Saudi Arabia');
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
    deliveryMethod,
    setDeliveryMethod: handleDeliveryMethodChange,
    shippingFee,
    setShippingFee,
    shippingAddress,
    setShippingAddress,
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
    isValid,
  };
};
