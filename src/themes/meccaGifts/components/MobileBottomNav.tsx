import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Grid, Heart, ShoppingBag, User } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    language,
    currentPage,
    setCurrentPage,
    setSelectedCategory,
    cartCount,
    wishlist,
    setIsCartOpen,
    setIsAuthModalOpen,
    user
  } = useApp();

  const isAr = language === 'ar';

  return (
    <nav aria-label="Mobile Navigation" className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-gradient-to-r from-[#041109] via-[#0c2618] to-[#041109] border-t border-[#d4af37]/40 py-1 px-2 shadow-2xl backdrop-blur-lg select-none">
      <div className="flex items-center justify-around">
        {/* Home */}
        <button
          onClick={() => {
            setCurrentPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 gap-1 transition-all cursor-pointer ${
            currentPage === 'home'
              ? 'text-[#f3e5ab] font-bold scale-105'
              : 'text-white/90 hover:text-white'
          }`}
          aria-label="Home"
        >
          <Home className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] tracking-wide">{isAr ? 'الرئيسية' : 'Home'}</span>
        </button>

        {/* Catalog */}
        <button
          onClick={() => {
            setSelectedCategory(null);
            setCurrentPage('catalog');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 gap-1 transition-all cursor-pointer ${
            currentPage === 'catalog'
              ? 'text-[#f3e5ab] font-bold scale-105'
              : 'text-white/90 hover:text-white'
          }`}
          aria-label="Catalog"
        >
          <Grid className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] tracking-wide">{isAr ? 'الأقسام' : 'Catalog'}</span>
        </button>

        {/* Wishlist */}
        <button
          onClick={() => {
            setCurrentPage('crm');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 gap-1 relative text-white/90 hover:text-white transition-all cursor-pointer"
          aria-label="Wishlist"
        >
          <Heart className="w-5 h-5 stroke-[2]" />
          {wishlist.length > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 bg-[#8b263e] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white/40 shadow-xs">
              {wishlist.length}
            </span>
          )}
          <span className="text-[10px] tracking-wide">{isAr ? 'المفضلة' : 'Wishlist'}</span>
        </button>

        {/* Cart */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 gap-1 relative text-white/90 hover:text-white transition-all cursor-pointer"
          aria-label="Shopping Bag"
        >
          <ShoppingBag className="w-5 h-5 stroke-[2]" />
          {cartCount > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 bg-[#d4af37] text-[#0a1810] text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white/60 shadow-xs">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] tracking-wide">{isAr ? 'السلة' : 'Cart'}</span>
        </button>

        {/* User Account / VIP */}
        <button
          onClick={() => {
            if (user.isLoggedIn) {
              setCurrentPage('crm');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              setIsAuthModalOpen(true);
            }
          }}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 gap-1 transition-all cursor-pointer ${
            currentPage === 'crm'
              ? 'text-[#f3e5ab] font-bold scale-105'
              : 'text-white/90 hover:text-white'
          }`}
          aria-label="Account"
        >
          {user.isLoggedIn ? (
            <div className="w-5 h-5 rounded-full overflow-hidden border border-[#d4af37]">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <User className="w-5 h-5 stroke-[2]" />
          )}
          <span className="text-[10px] tracking-wide">
            {user.isLoggedIn ? (isAr ? 'حسابي' : 'Account') : (isAr ? 'دخول' : 'Login')}
          </span>
        </button>
      </div>
    </nav>
  );
};
