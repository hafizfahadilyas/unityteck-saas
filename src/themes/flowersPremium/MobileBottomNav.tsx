import React from 'react';
import {
  Home,
  Grid,
  Truck,
  ShoppingCart,
  User,
  Heart,
} from 'lucide-react';
import type { FlowersSfPage } from './pack';

interface MobileBottomNavProps {
  activePage: FlowersSfPage;
  onSelectPage: (page: FlowersSfPage) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  lang: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePage,
  onSelectPage,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenProfile,
  lang,
}) => {
  const isAr = lang === 'ar';

  const items = [
    {
      id: 'home',
      label: isAr ? 'الرئيسية' : 'Home',
      icon: Home,
      onClick: () => onSelectPage('home'),
      active: activePage === 'home',
    },
    {
      id: 'shop',
      label: isAr ? 'المتجر' : 'Shop',
      icon: Grid,
      onClick: () => onSelectPage('shop'),
      active: activePage === 'shop',
    },
    {
      id: 'track-order',
      label: isAr ? 'تتبع الطلب' : 'Track',
      icon: Truck,
      onClick: () => onSelectPage('track-order'),
      active: activePage === 'track-order',
      highlightBadge: true,
    },
    {
      id: 'cart',
      label: isAr ? 'السلة' : 'Bag',
      icon: ShoppingCart,
      onClick: onOpenCart,
      badge: cartCount,
      active: false,
    },
    {
      id: 'profile',
      label: isAr ? 'حسابي' : 'Account',
      icon: User,
      onClick: onOpenProfile,
      active: activePage === 'profile',
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="sticky bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl shadow-2xl px-2 py-1.5 flex items-center justify-around transition-all"
      style={{
        background: 'color-mix(in srgb, var(--sf-surface, #ffffff) 92%, transparent)',
        borderColor: 'var(--sf-border, #e2e8f0)',
        color: 'var(--sf-text, #0f172a)',
      }}
    >
      {items.map((item) => {
        const IconComponent = item.icon;
        const isActive = item.active;

        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl min-w-[58px] transition-all cursor-pointer ${
              isActive
                ? 'scale-105 font-black'
                : 'opacity-70 hover:opacity-100 hover:scale-100'
            }`}
            style={{
              color: isActive ? 'var(--sf-accent, #059669)' : 'var(--sf-text, #475569)',
            }}
          >
            <div className="relative">
              <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -end-2 min-w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black px-1 flex items-center justify-center shadow-xs">
                  {item.badge}
                </span>
              )}
              {item.highlightBadge && (
                <span className="absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
              {item.label}
            </span>
            {isActive && (
              <span
                className="w-3.5 h-0.5 rounded-full mt-0.5"
                style={{ background: 'var(--sf-accent, #059669)' }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
