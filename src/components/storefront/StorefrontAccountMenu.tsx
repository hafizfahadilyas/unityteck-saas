import React, { useEffect, useRef } from 'react';
import {
  Bell,
  Package,
  ShoppingCart,
  Heart,
  Wallet,
  Gift,
  UserCircle,
  Settings,
  LogOut,
} from 'lucide-react';

export type StorefrontAccountSection =
  | 'notifications'
  | 'orders'
  | 'pending_payment'
  | 'wishlist'
  | 'wallet'
  | 'loyalty'
  | 'account'
  | 'settings';

type Props = {
  open: boolean;
  onClose: () => void;
  isAr: boolean;
  isLoggedIn: boolean;
  onNavigate: (section: StorefrontAccountSection) => void;
  onLogout: () => void;
  onLogin: () => void;
  anchorClassName?: string;
};

const ITEMS: Array<{
  id: StorefrontAccountSection;
  icon: React.ComponentType<{ className?: string }>;
  en: string;
  ar: string;
}> = [
  { id: 'notifications', icon: Bell, en: 'Notifications', ar: 'الإشعارات' },
  { id: 'orders', icon: Package, en: 'Orders', ar: 'الطلبات' },
  { id: 'pending_payment', icon: ShoppingCart, en: 'Pending payment', ar: 'بانتظار الدفع' },
  { id: 'wishlist', icon: Heart, en: 'Wishlist', ar: 'المفضلة' },
  { id: 'wallet', icon: Wallet, en: 'My wallet', ar: 'محفظتي' },
  { id: 'loyalty', icon: Gift, en: 'Loyalty points', ar: 'نقاط الولاء' },
  { id: 'account', icon: UserCircle, en: 'My account', ar: 'حسابي' },
  { id: 'settings', icon: Settings, en: 'Settings', ar: 'الإعدادات' },
];

/**
 * Shared customer account dropdown — each storefront owns navigation via onNavigate.
 * Data stays store-scoped in the parent (coffee / flowers / …).
 */
export function StorefrontAccountMenu({
  open,
  onClose,
  isAr,
  isLoggedIn,
  onNavigate,
  onLogout,
  onLogin,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={isAr ? 'قائمة حساب العميل' : 'Customer account menu'}
      className="absolute top-full end-0 mt-2 z-[80] w-56 rounded-2xl border border-neutral-200 bg-white shadow-xl py-2 text-start"
    >
      {!isLoggedIn ? (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onLogin();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
        >
          <UserCircle className="w-4 h-4 text-neutral-500 shrink-0" />
          <span>{isAr ? 'تسجيل الدخول' : 'Sign in'}</span>
        </button>
      ) : (
        <>
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 cursor-pointer"
              >
                <Icon className="w-4 h-4 text-neutral-500 shrink-0" />
                <span>{isAr ? item.ar : item.en}</span>
              </button>
            );
          })}
          <div className="my-1 border-t border-neutral-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'تسجيل الخروج' : 'Log out'}</span>
          </button>
        </>
      )}
    </div>
  );
}
