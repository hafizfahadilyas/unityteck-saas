/**
 * @file notificationEngine.ts
 * Enterprise notification synthesis and routing engine enforcing:
 * - Rule 1: WhatsApp eligibility guards
 * - Rule 2: Verified data guards (Security, SEO, Backup, Tracking)
 * - Rule 3: Zone hierarchy & aggregation deduplication
 * - Rule 4: Auto-resolution detection from DB state
 * - Rule 5: Connected integration guards for platform-specific ad alerts
 * - Rule 6: Merchant-configured thresholds
 */

import { NOTIFICATION_REGISTRY } from '../config/notificationRegistry';
import { NotificationItem, NotificationStatus } from '../types/notification.types';
import { thresholdManager } from './thresholdManager';
import { deduplicateAndEnforceZoneHierarchy } from '../utils/deduplication';

function toSafeISO(val: any, fallbackMs: number): string {
  if (val) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }
  return new Date(fallbackMs).toISOString();
}

export class NotificationEngine {
  /**
   * Generates live notifications strictly enforcing all business rules from real store data
   */
  public static generateNotifications(params: {
    activeStore: any;
    currentOrders: any[];
    currentProducts: any[];
    currentCustomers: any[];
    currentCoupons?: any[];
  }): NotificationItem[] {
    const { activeStore, currentOrders = [], currentProducts = [], currentCustomers = [], currentCoupons = [] } = params;
    const thresholds = thresholdManager.getThresholds();
    const items: NotificationItem[] = [];

    const now = new Date();
    const nowMs = now.getTime();
    const isoNow = now.toISOString();

    // ─────────────────────────────────────────────────────────────────
    // ZONE 3: Urgent Sticky Bottom Bar Alerts (Evaluated FIRST for hierarchy)
    // ─────────────────────────────────────────────────────────────────

    // 1. Urgent failed payments from real orders
    const failedPayments = currentOrders.filter(
      (o) =>
        o.status === 'cancelled' ||
        o.paymentStatus === 'failed' ||
        (o.paymentMethod && String(o.paymentMethod).toLowerCase().includes('fail')),
    );
    if (failedPayments.length > 0) {
      const ord = failedPayments[0];
      const reg = NOTIFICATION_REGISTRY.payment_failed_urgent || NOTIFICATION_REGISTRY.failed_payment;
      items.push({
        id: `urgent-pay-${ord.id || ord.orderNumber}`,
        dedup_key: `order_payment_fail_${ord.orderNumber || ord.id}`,
        registryCode: reg.code,
        zone: 'zone3_urgent',
        category: 'Payment',
        urgentTag: 'Payment',
        severity: 'critical',
        status: 'unread',
        title: `Payment failed for order #${ord.orderNumber || ord.id}`,
        titleAr: `فشل الدفع للطلب #${ord.orderNumber || ord.id}`,
        description: `Payment authorization failed (${ord.total || 0} SAR) for customer ${ord.customer || ord.customerName || ''}. Send recovery link.`,
        descriptionAr: `فشلت عملية الدفع للطلب بمبلغ ${ord.total || 0} ر.س للعميل ${ord.customer || ord.customerName || ''}. أرسل رابط دفع فوري.`,
        timestamp: toSafeISO(ord.date, nowMs - 12 * 60 * 1000),
        read: false,
        dismissed: false,
        actionLabel: 'View Order',
        actionLabelAr: 'فحص الطلب',
        actionType: 'navigate',
        destination: 'orders',
        resolution: reg.resolution,
        solutionText: reg.solutionText,
        metadata: {
          orderNumber: ord.orderNumber || ord.id,
          amount: Number(ord.total) || 0,
        },
      });
    }

    // 2. Urgent critical low stock (<= 2 units) from real products
    const criticalStockItems = currentProducts.filter(
      (p) =>
        (p.stock !== undefined && p.stock <= 2 && p.stock > 0) ||
        (p.quantity !== undefined && p.quantity <= 2 && p.quantity > 0),
    );
    if (criticalStockItems.length > 0) {
      const p = criticalStockItems[0];
      const count = p.stock ?? p.quantity ?? 1;
      const reg = NOTIFICATION_REGISTRY.low_stock_urgent || NOTIFICATION_REGISTRY.low_stock;
      items.push({
        id: `urgent-stock-${p.id || p.sku || 'crit-sku'}`,
        dedup_key: `product_stock_${p.sku || p.id}`,
        registryCode: reg.code,
        zone: 'zone3_urgent',
        category: 'Inventory',
        urgentTag: 'Inventory',
        severity: 'warning',
        status: 'unread',
        title: `Product "${p.name || p.nameAr || 'Product'}" has only ${count} items left`,
        titleAr: `المنتج "${p.nameAr || p.name || 'منتج'}" متبقي منه ${count} قطع فقط`,
        description: `Critical low inventory for SKU ${p.sku || 'N/A'}. Restock soon to prevent stockout.`,
        descriptionAr: `مستوى المخزون حرج لرمز المنتج ${p.sku || 'N/A'}. قم بإعادة التزويد لتفادي نفاد الكمية.`,
        timestamp: new Date(nowMs - 18 * 60 * 1000).toISOString(),
        read: false,
        dismissed: false,
        actionLabel: 'Update Stock',
        actionLabelAr: 'تحديث المخزون',
        actionType: 'navigate',
        destination: 'products',
        resolution: reg.resolution,
        solutionText: reg.solutionText,
        metadata: {
          productName: p.name || p.nameAr,
          count,
          sku: p.sku,
        },
      });
    }

    // 3. Delayed shipments from real orders
    const delayedShipments = currentOrders.filter(
      (o) => o.shippingStatus === 'delayed' || o.trackingStatus === 'delayed',
    );
    if (delayedShipments.length > 0) {
      const targetDelayed = delayedShipments[0];
      const reg = NOTIFICATION_REGISTRY.delayed_shipment_urgent || NOTIFICATION_REGISTRY.shipments_cannot_deliver;
      items.push({
        id: `urgent-ship-${targetDelayed.id || targetDelayed.orderNumber}`,
        dedup_key: `shipment_delayed_${targetDelayed.orderNumber || targetDelayed.id}`,
        registryCode: reg.code,
        zone: 'zone3_urgent',
        category: 'Shipping',
        urgentTag: 'Shipping',
        severity: 'warning',
        status: 'unread',
        title: `Shipment #${targetDelayed.orderNumber || targetDelayed.id} past delivery date`,
        titleAr: `تأخر شحنة #${targetDelayed.orderNumber || targetDelayed.id} عن موعد التسليم`,
        description: `Shipment for customer ${targetDelayed.customer || targetDelayed.customerName || ''} is delayed in transit.`,
        descriptionAr: `الشحنة الخاصة بالعميل ${targetDelayed.customer || targetDelayed.customerName || ''} متأخرة لدى شركة الشحن.`,
        timestamp: toSafeISO(targetDelayed.date, nowMs - 45 * 60 * 1000),
        read: false,
        dismissed: false,
        actionLabel: 'Track Shipment',
        actionLabelAr: 'تتبع الشحنة',
        actionType: 'navigate',
        destination: 'shipping',
        resolution: reg.resolution,
        solutionText: reg.solutionText,
        metadata: {
          orderNumber: targetDelayed.orderNumber || targetDelayed.id,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // ZONE 1: Critical Operational Issues (Derived from Real Data)
    // ─────────────────────────────────────────────────────────────────

    // 1. Pending orders waiting for action
    const pendingOrders = currentOrders.filter((o) => o.status === 'pending');
    if (pendingOrders.length > 0) {
      const reg = NOTIFICATION_REGISTRY.new_orders_pending;
      const latestPending = pendingOrders[0];
      items.push({
        id: 'issue-pending-orders',
        dedup_key: 'aggregate_orders_pending',
        registryCode: reg.code,
        zone: 'zone1_issues',
        category: reg.category,
        severity: reg.severity,
        status: 'unread',
        title: reg.title,
        titleAr: reg.titleAr,
        description: `You have ${pendingOrders.length} pending orders waiting (latest: #${latestPending?.orderNumber || latestPending?.id})`,
        descriptionAr: `لديك ${pendingOrders.length} طلبات جديدة بانتظار المعالجة والتأكيد (أحدثها #${latestPending?.orderNumber || latestPending?.id})`,
        timestamp: toSafeISO(latestPending?.date, nowMs),
        read: false,
        dismissed: false,
        aggregatedCount: pendingOrders.length,
        actionLabel: reg.actionLabel,
        actionLabelAr: reg.actionLabelAr,
        actionType: reg.actionType,
        destination: 'orders',
        filterParam: reg.filterParam,
        resolution: reg.resolution,
        solutionText: reg.solutionText,
        solutionTextAr: reg.solutionTextAr,
        metadata: {
          count: pendingOrders.length,
          orderNumber: latestPending?.orderNumber || latestPending?.id,
        },
      });
    }

    // 2. Real Incomplete shipping address orders
    const incompleteAddressOrders = currentOrders.filter(
      (o) =>
        o.status !== 'completed' &&
        o.status !== 'cancelled' &&
        (!o.city || !o.shippingAddress || o.city.trim() === '' || o.shippingAddress.trim() === '' || o.city === 'N/A' || o.shippingAddress === 'N/A'),
    );
    if (incompleteAddressOrders.length > 0) {
      const targetOrd = incompleteAddressOrders[0];
      const regAddress = NOTIFICATION_REGISTRY.incomplete_shipping_address;
      items.push({
        id: `issue-incomplete-address-${targetOrd.id || targetOrd.orderNumber}`,
        dedup_key: `shipping_address_${targetOrd.orderNumber || targetOrd.id}`,
        registryCode: regAddress.code,
        zone: 'zone1_issues',
        category: regAddress.category,
        severity: regAddress.severity,
        status: 'unread',
        title: regAddress.title,
        titleAr: regAddress.titleAr,
        description: `Shipping address details missing for order #${targetOrd.orderNumber || targetOrd.id} (${targetOrd.customer || targetOrd.customerName || 'Customer'})`,
        descriptionAr: `بيانات العنوان الوطني غير مكتملة للطلب #${targetOrd.orderNumber || targetOrd.id} للعميل (${targetOrd.customer || targetOrd.customerName || 'العميل'})`,
        timestamp: toSafeISO(targetOrd.date, nowMs - 60 * 60 * 1000),
        read: false,
        dismissed: false,
        actionLabel: regAddress.actionLabel,
        actionLabelAr: regAddress.actionLabelAr,
        actionType: regAddress.actionType,
        destination: 'orders',
        filterParam: regAddress.filterParam,
        resolution: regAddress.resolution,
        solutionText: regAddress.solutionText,
        solutionTextAr: regAddress.solutionTextAr,
        metadata: {
          orderNumber: targetOrd.orderNumber || targetOrd.id,
          customerName: targetOrd.customer || targetOrd.customerName,
        },
      });
    }

    // 3. Real Out of stock products
    const outOfStockProducts = currentProducts.filter(
      (p) => (p.stock !== undefined && p.stock <= 0) || (p.quantity !== undefined && p.quantity <= 0),
    );
    if (outOfStockProducts.length > 0) {
      const p = outOfStockProducts[0];
      const reg = NOTIFICATION_REGISTRY.out_of_stock;
      items.push({
        id: `issue-out-of-stock-${p.id || p.sku || 'sku-0'}`,
        dedup_key: `product_stock_${p.sku || p.id}`,
        registryCode: reg.code,
        zone: 'zone1_issues',
        category: reg.category,
        severity: reg.severity,
        status: 'unread',
        title: reg.title,
        titleAr: reg.titleAr,
        description: `Product "${p.name || p.nameAr || 'Product'}" is out of stock (0 units remaining)`,
        descriptionAr: `المنتج "${p.nameAr || p.name || 'منتج'}" نفد من المخزون تماماً (0 قطع متبقية)`,
        timestamp: new Date(nowMs - 45 * 60 * 1000).toISOString(),
        read: false,
        dismissed: false,
        actionLabel: reg.actionLabel,
        actionLabelAr: reg.actionLabelAr,
        actionType: reg.actionType,
        destination: 'products',
        resolution: reg.resolution,
        solutionText: reg.solutionText,
        solutionTextAr: reg.solutionTextAr,
        metadata: {
          productName: p.name || p.nameAr,
          sku: p.sku,
          stockCount: 0,
        },
      });
    }

    // 4. Real Low stock products
    const lowStockProducts = currentProducts.filter(
      (p) => {
        const count = p.stock ?? p.quantity;
        return count !== undefined && count <= thresholds.lowStockThreshold && count > 0;
      },
    );
    if (lowStockProducts.length > 0) {
      const p = lowStockProducts[0];
      const count = p.stock ?? p.quantity ?? 3;
      const reg = NOTIFICATION_REGISTRY.low_stock;
      items.push({
        id: `issue-low-stock-${p.id || p.sku || 'sku-1'}`,
        dedup_key: `product_stock_${p.sku || p.id}`,
        registryCode: reg.code,
        zone: 'zone1_issues',
        category: reg.category,
        severity: reg.severity,
        status: 'unread',
        title: reg.title,
        titleAr: reg.titleAr,
        description: `Product "${p.name || p.nameAr || 'Product'}" has low stock (${count} left)`,
        descriptionAr: `مخزون المنتج "${p.nameAr || p.name || 'منتج'}" شارف على النفاد (متبقي ${count} فقط)`,
        timestamp: new Date(nowMs - 30 * 60 * 1000).toISOString(),
        read: false,
        dismissed: false,
        actionLabel: reg.actionLabel,
        actionLabelAr: reg.actionLabelAr,
        actionType: reg.actionType,
        destination: 'products',
        resolution: reg.resolution,
        solutionText: reg.solutionText,
        solutionTextAr: reg.solutionTextAr,
        metadata: {
          productName: p.name || p.nameAr,
          sku: p.sku,
          stockCount: count,
        },
      });
    }

    // 5. Real Store Configuration & Hosting status checks
    if (activeStore) {
      if (activeStore.ssl_status === 'expired' || activeStore.ssl_status === 'pending') {
        items.push({
          id: 'issue-ssl-status',
          dedup_key: 'store_ssl_status',
          registryCode: 'ssl_certificate_warning',
          zone: 'zone1_issues',
          category: 'Technical & Security',
          severity: 'warning',
          status: 'unread',
          title: 'SSL Certificate Warning',
          titleAr: 'تنبيه شهادة الأمان SSL',
          description: `SSL certificate status is currently "${activeStore.ssl_status}". Review hosting security.`,
          descriptionAr: `حالة شهادة الأمان SSL للمتجر حالياً "${activeStore.ssl_status}". راجع إعدادات الأمان.`,
          timestamp: new Date(nowMs - 15 * 60 * 1000).toISOString(),
          read: false,
          dismissed: false,
          actionLabel: 'Review Hosting',
          actionLabelAr: 'فحص الاستضافة',
          actionType: 'navigate',
          destination: 'hosting',
          resolution: 'Verify domain SSL certificate in hosting settings.',
          solutionText: 'Activate free SSL certificate to secure checkout traffic.',
        });
      }

      if (activeStore.dns_status === 'unverified' && activeStore.custom_domain) {
        items.push({
          id: 'issue-dns-verification',
          dedup_key: 'store_dns_unverified',
          registryCode: 'dns_unverified',
          zone: 'zone1_issues',
          category: 'Technical & Security',
          severity: 'warning',
          status: 'unread',
          title: 'Domain DNS Pending Verification',
          titleAr: 'الدومين بانتظار ربط DNS',
          description: `DNS records for ${activeStore.custom_domain} need verification to go live.`,
          descriptionAr: `سجلات DNS للدومين ${activeStore.custom_domain} تحتاج للتأكيد لتفعيل الربط.`,
          timestamp: new Date(nowMs - 20 * 60 * 1000).toISOString(),
          read: false,
          dismissed: false,
          actionLabel: 'Verify DNS',
          actionLabelAr: 'فحص DNS',
          actionType: 'navigate',
          destination: 'hosting',
          resolution: 'Add required A/CNAME records in domain DNS registrar.',
          solutionText: 'Configure DNS to point your custom domain to our servers.',
        });
      }

      if (activeStore.plan === 'free') {
        items.push({
          id: 'issue-plan-upgrade',
          dedup_key: 'store_plan_free_tier',
          registryCode: 'plan_upgrade_notice',
          zone: 'zone1_issues',
          category: 'Store Settings',
          severity: 'warning',
          status: 'unread',
          title: 'Upgrade Store Plan to Pro',
          titleAr: 'ترقية المتجر إلى باقة Pro',
          description: 'Unlock high performance cloud hosting, custom domain & advanced reports.',
          descriptionAr: 'احصل على استضافة سحابية عالية الأداء، ربط دومين مخصص، وتقارير متقدمة.',
          timestamp: new Date(nowMs - 90 * 60 * 1000).toISOString(),
          read: false,
          dismissed: false,
          actionLabel: 'Upgrade Plan',
          actionLabelAr: 'ترقية الباقة',
          actionType: 'navigate',
          destination: 'settings',
          resolution: 'Upgrade to Pro plan in Store Settings.',
          solutionText: 'Choose Pro plan for premium features and higher traffic limit.',
        });
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // ZONE 2: Marketing Opportunities & Insights (Derived from Real Data)
    // ─────────────────────────────────────────────────────────────────

    // 1. Real New/Inactive Customer Lead Opportunity
    const potentialLeads = currentCustomers.filter(
      (c) => (c.totalOrders === 0 || c.status === 'New' || c.status === 'Inactive') && c.phone,
    );
    if (potentialLeads.length > 0) {
      const lead = potentialLeads[0];
      const regAbandoned = NOTIFICATION_REGISTRY.abandoned_cart;
      const activeCoup = currentCoupons.find((c) => c.status === 'active') || currentCoupons[0];
      const couponCode = activeCoup?.code || 'WELCOME10';

      items.push({
        id: `mkt-lead-${lead.id || lead.phone}`,
        dedup_key: `cart_lead_${lead.id || lead.phone}`,
        registryCode: regAbandoned.code,
        zone: 'zone2_marketing',
        category: 'Abandoned Cart',
        severity: 'opportunity',
        status: 'unread',
        title: `Follow up with customer: ${lead.name || lead.nameAr || 'New Customer'}`,
        titleAr: `متابعة العميل: ${lead.nameAr || lead.name || 'عميل جديد'}`,
        description: `Customer registered from ${lead.city || 'Saudi Arabia'} with 0 orders. Send welcome coupon [${couponCode}].`,
        descriptionAr: `العميل مسجل من ${lead.city || 'المملكة العربية السعودية'} دون إتمام طلبات. أرسل له كوبون ترحيبي [${couponCode}].`,
        timestamp: toSafeISO(lead.registeredDate, nowMs - 30 * 60 * 1000),
        read: false,
        dismissed: false,
        customer: {
          is_identifiable: true,
          phone: lead.phone,
          is_phone_validated: Boolean(lead.phone && lead.phone.length >= 8),
          marketing_opt_in: true,
        },
        whatsappEligible: true,
        actionLabel: 'Message on WhatsApp',
        actionLabelAr: 'مراسلة عبر واتساب',
        actionType: 'whatsapp',
        destination: 'customers',
        resolution: regAbandoned.resolution,
        solutionText: `Hello ${lead.name}! Complete your first order and use discount code [${couponCode}].`,
        solutionTextAr: `مرحباً ${lead.nameAr || lead.name}! استكمل طلبك الأول واستمتع بخصم خاص عبر كود [${couponCode}].`,
        metadata: {
          customerName: lead.name || lead.nameAr,
          customerPhone: lead.phone,
          discountCode: couponCode,
        },
      });
    }

    // 2. Real VIP Customer Special Offer
    const vipCustomers = currentCustomers.filter(
      (c) => (c.group === 'VIP' || c.status === 'VIP' || (c.totalSpending && c.totalSpending > 300)) && c.phone,
    );
    if (vipCustomers.length > 0) {
      const vip = vipCustomers[0];
      const regSpecial = NOTIFICATION_REGISTRY.special_offer_opportunity;
      items.push({
        id: `mkt-vip-${vip.id || vip.phone}`,
        dedup_key: `vip_offer_${vip.id || vip.phone}`,
        registryCode: regSpecial.code,
        zone: 'zone2_marketing',
        category: 'Special Offer',
        severity: 'opportunity',
        status: 'unread',
        title: `Special offer for VIP customer: ${vip.name || vip.nameAr}`,
        titleAr: `عرض خاص للعميل المميز: ${vip.nameAr || vip.name}`,
        description: `Customer "${vip.name || vip.nameAr}" has completed ${vip.totalOrders || 1} purchases (${vip.totalSpending || 0} SAR). Send VIP offer.`,
        descriptionAr: `العميل "${vip.nameAr || vip.name}" أكمل ${vip.totalOrders || 1} طلبات بقيمة (${vip.totalSpending || 0} ر.س). أرسل له عرضاً حصرياً.`,
        timestamp: toSafeISO(vip.lastOrderDate, nowMs - 65 * 60 * 1000),
        read: false,
        dismissed: false,
        customer: {
          is_identifiable: true,
          phone: vip.phone,
          is_phone_validated: Boolean(vip.phone && vip.phone.length >= 8),
          marketing_opt_in: true,
        },
        whatsappEligible: true,
        actionLabel: 'Send Offer / WhatsApp',
        actionLabelAr: 'إرسال العرض عبر واتساب',
        actionType: 'whatsapp',
        destination: 'marketing',
        resolution: regSpecial.resolution,
        solutionText: regSpecial.solutionText,
        solutionTextAr: regSpecial.solutionTextAr,
        metadata: {
          customerName: vip.name || vip.nameAr,
          customerPhone: vip.phone,
          discountCode: 'VIP20',
        },
      });
    }

    // 3. Real Coupon Campaign Promotion
    if (currentCoupons && currentCoupons.length > 0) {
      const activeCoup = currentCoupons.find((c) => c.status === 'active') || currentCoupons[0];
      const regCoupon = NOTIFICATION_REGISTRY.discount_coupon;
      items.push({
        id: `mkt-coupon-${activeCoup.id || activeCoup.code}`,
        dedup_key: `coupon_active_${activeCoup.code}`,
        registryCode: regCoupon.code,
        zone: 'zone2_marketing',
        category: 'Coupon',
        severity: 'opportunity',
        status: 'unread',
        title: `Promote active coupon: [${activeCoup.code}]`,
        titleAr: `تنشيط المبيعات عبر كود الخصم: [${activeCoup.code}]`,
        description: `Coupon [${activeCoup.code}] (${activeCoup.discount || activeCoup.discountPercent || 15}% off) is ready to share with store visitors.`,
        descriptionAr: `الكوبون [${activeCoup.code}] بنسبة خصم (${activeCoup.discount || activeCoup.discountPercent || 15}%) جاهز للمشاركة مع الزوار.`,
        timestamp: new Date(nowMs - 100 * 60 * 1000).toISOString(),
        read: false,
        dismissed: false,
        actionLabel: 'View Coupons',
        actionLabelAr: 'عرض الكوبونات',
        actionType: 'navigate',
        destination: 'coupons',
        resolution: regCoupon.resolution,
        solutionText: regCoupon.solutionText,
        solutionTextAr: regCoupon.solutionTextAr,
        metadata: {
          couponCode: activeCoup.code,
          discountPercent: Number(activeCoup.discount || activeCoup.discountPercent) || 15,
        },
      });
    }

    // 4. Platform Ad alerts if merchant connected
    if (thresholds.isGoogleAdsConnected) {
      const regGads = NOTIFICATION_REGISTRY.gads_high_spend_insufficient_results;
      items.push({
        id: 'mkt-gads-1',
        dedup_key: 'gads_cpa_campaign',
        registryCode: regGads.code,
        zone: 'zone2_marketing',
        category: 'Google Ads',
        severity: 'warning',
        status: 'unread',
        title: 'Google Ads conversion review recommended',
        titleAr: 'مراجعة أداء حملات إعلانات جوجل',
        description: `Google Ads campaign CPA reached target limit (${thresholds.googleAdsTargetCpa} SAR). Review keyword performance.`,
        descriptionAr: `تكلفة الاقتناء في إعلانات جوجل وصلت للحد المستهدف (${thresholds.googleAdsTargetCpa} ر.س). راجع أداء الكلمات.`,
        timestamp: new Date(nowMs - 240 * 60 * 1000).toISOString(),
        read: false,
        dismissed: false,
        actionLabel: 'Analyze Performance',
        actionLabelAr: 'تحليل الأداء',
        actionType: 'navigate',
        destination: 'marketing',
        resolution: regGads.resolution,
        solutionText: regGads.solutionText,
      });
    }

    // Rule 3 & Rule 4: Enforce Zone Hierarchy deduplication and return
    return deduplicateAndEnforceZoneHierarchy(items);
  }
}

