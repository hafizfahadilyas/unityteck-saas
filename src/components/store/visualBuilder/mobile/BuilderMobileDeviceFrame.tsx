import React from 'react';
import {
  Wifi,
  Battery,
  Signal,
  Home,
  Grid,
  Truck,
  ShoppingCart,
  User,
  MessageCircle,
} from 'lucide-react';

interface BuilderMobileDeviceFrameProps {
  device: 'desktop' | 'laptop' | 'tablet' | 'mobile';
  canvasDarkMode: boolean;
  isAr: boolean;
  children: React.ReactNode;
  activePage: string;
  onNavigatePage: (page: string) => void;
  onOpenCart?: () => void;
  cartCount?: number;
}

export const BuilderMobileDeviceFrame: React.FC<BuilderMobileDeviceFrameProps> = ({
  device,
  canvasDarkMode,
  isAr,
  children,
  activePage,
  onNavigatePage,
  onOpenCart,
  cartCount = 1,
}) => {
  if (device === 'mobile') {
    return (
      <div className="relative mx-auto my-4 flex flex-col items-center select-text">
        {/* Authentic iPhone 15 Pro Titanium Frame */}
        <div
          className="relative w-[390px] min-h-[844px] rounded-[52px] p-3 shadow-2xl transition-all duration-300"
          style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
            boxShadow:
              '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15) inset, 0 0 0 4px #0f172a',
          }}
        >
          {/* Outer Volume & Power Buttons Simulation */}
          <div className="absolute -left-[5px] top-28 w-[3px] h-9 bg-slate-700 rounded-l-sm" />
          <div className="absolute -left-[5px] top-42 w-[3px] h-12 bg-slate-700 rounded-l-sm" />
          <div className="absolute -left-[5px] top-58 w-[3px] h-12 bg-slate-700 rounded-l-sm" />
          <div className="absolute -right-[5px] top-36 w-[3px] h-16 bg-slate-700 rounded-r-sm" />

          {/* Screen Container */}
          <div
            className={`w-full min-h-[820px] rounded-[42px] overflow-hidden flex flex-col relative transition-colors ${
              canvasDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
            }`}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Top iOS Status Bar */}
            <div className="h-10 px-6 pt-2 flex items-center justify-between text-[11px] font-bold shrink-0 z-30 select-none bg-inherit">
              <span className="font-mono tracking-tight font-black">9:41</span>

              {/* Dynamic Island Pill */}
              <div className="w-24 h-5 rounded-full bg-black flex items-center justify-center gap-1.5 px-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/80" />
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-1.5 text-current opacity-80">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Scrollable Screen Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
              {children}
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="shrink-0 z-30 border-t border-slate-200/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around text-[10px] font-bold shadow-lg">
              <button
                type="button"
                onClick={() => onNavigatePage('home')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl cursor-pointer transition-all ${
                  activePage === 'home'
                    ? 'text-indigo-600 font-black scale-105'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{isAr ? 'الرئيسية' : 'Home'}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigatePage('product')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl cursor-pointer transition-all ${
                  activePage === 'product'
                    ? 'text-indigo-600 font-black scale-105'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>{isAr ? 'المنتجات' : 'Products'}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigatePage('track-order')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl cursor-pointer transition-all ${
                  activePage === 'track-order'
                    ? 'text-indigo-600 font-black scale-105'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>{isAr ? 'تتبع' : 'Track'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenCart || (() => onNavigatePage('cart'))}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl cursor-pointer transition-all relative ${
                  activePage === 'cart'
                    ? 'text-indigo-600 font-black scale-105'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="absolute -top-1 end-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-mono flex items-center justify-center font-bold">
                  {cartCount}
                </span>
                <span>{isAr ? 'السلة' : 'Cart'}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigatePage('contact')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl cursor-pointer transition-all ${
                  activePage === 'contact'
                    ? 'text-indigo-600 font-black scale-105'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'تواصل' : 'Contact'}</span>
              </button>
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="h-4 flex items-center justify-center shrink-0 bg-inherit pb-1">
              <div className="w-32 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (device === 'tablet') {
    return (
      <div className="relative mx-auto my-4 flex flex-col items-center select-text">
        {/* Tablet Frame (768px) */}
        <div
          className="relative w-[768px] min-h-[920px] rounded-[38px] p-3 shadow-2xl transition-all duration-300"
          style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div
            className={`w-full min-h-[890px] rounded-[28px] overflow-hidden flex flex-col relative transition-colors ${
              canvasDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
            }`}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Tablet Status Bar */}
            <div className="h-6 px-6 pt-1 flex items-center justify-between text-[10px] font-bold shrink-0 opacity-70">
              <span>9:41 AM · iPad Pro</span>
              <div className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                <Battery className="w-3 h-3" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop or Laptop
  const containerWidth = device === 'laptop' ? '1024px' : '100%';

  return (
    <div
      className={`transition-all duration-300 rounded-2xl shadow-xl overflow-hidden border ${
        canvasDarkMode
          ? 'bg-slate-950 text-white border-slate-800'
          : 'bg-white text-slate-900 border-slate-200'
      } min-h-[900px] relative w-full`}
      style={{ maxWidth: containerWidth }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {children}
    </div>
  );
};
