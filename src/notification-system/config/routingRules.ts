import { NotificationItem } from '../types/notification.types';

export interface RouteResolution {
  tab: string;
  subView?: string;
  filter?: string;
  searchParam?: string;
}

export function resolveNotificationRoute(item: NotificationItem): RouteResolution {
  const code = item.registryCode;
  const dest = item.destination || 'dashboard';

  switch (dest) {
    case 'orders':
      return {
        tab: 'orders',
        filter: item.filterParam || (code.includes('pending') ? 'pending' : undefined),
        searchParam: item.metadata?.orderNumber,
      };
    case 'products':
      return {
        tab: 'products',
        searchParam: item.metadata?.productName || item.metadata?.sku,
      };
    case 'shipping':
      return {
        tab: 'shipping',
        filter: item.filterParam,
      };
    case 'payments':
      return {
        tab: 'payments',
        searchParam: item.metadata?.orderNumber,
      };
    case 'customers':
      return {
        tab: 'customers',
        searchParam: item.metadata?.customerName || item.metadata?.customerPhone,
      };
    case 'marketing':
      return {
        tab: 'marketing',
        subView: item.metadata?.platform?.toLowerCase(),
      };
    case 'analytics':
      return {
        tab: 'analytics',
      };
    case 'reports':
      return {
        tab: 'reports',
      };
    case 'seo':
      return {
        tab: 'seo',
      };
    case 'coupons':
      return {
        tab: 'coupons',
        searchParam: item.metadata?.couponCode,
      };
    case 'themes':
      return {
        tab: 'themes',
      };
    case 'hosting':
      return {
        tab: 'hosting',
      };
    case 'backup':
      return {
        tab: 'backup',
      };
    case 'settings':
      return {
        tab: 'settings',
      };
    default:
      return {
        tab: dest,
      };
  }
}
