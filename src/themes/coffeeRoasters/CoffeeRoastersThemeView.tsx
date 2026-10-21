/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HiBrew KSA Official Storefront Theme View
 * 100% Faithful Port of E:\GOGLE\hibrew-ksa-_-official-coffee-store-متجر-مكائن-ومستلزمات-القهوة
 */

import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { CartProvider, useCart, RouteType } from './context/CartContext';
import { useTenant } from '../../context/TenantContext';
import { readAllThemeSettings } from '../settings/themeSettingsStore';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { MiniCartDrawer } from './components/MiniCartDrawer';
import { SearchModal } from './components/SearchModal';
import { Footer } from './components/Footer';
import { FloatingHelpWidget } from './components/FloatingHelpWidget';
import { CoffeeBrandLoader } from './components/CoffeeBrandLoader';
import { CheckCircle2, Loader2 } from 'lucide-react';
import './coffeeRoasters.css';

// Code-split secondary routes for blazing fast initial homepage load
const ProductsListPage = lazy(() => import('./components/ProductsListPage').then(m => ({ default: m.ProductsListPage })));
const ProductDetailPage = lazy(() => import('./components/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const ProductBuyPage = lazy(() => import('./components/ProductBuyPage').then(m => ({ default: m.ProductBuyPage })));
const CartPage = lazy(() => import('./components/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./components/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ReviewsPage = lazy(() => import('./components/ReviewsPage').then(m => ({ default: m.ReviewsPage })));
const ThankYouPage = lazy(() => import('./components/ThankYouPage').then(m => ({ default: m.ThankYouPage })));
const CoffeeStaticPage = lazy(() => import('./components/CoffeeStaticPage').then(m => ({ default: m.CoffeeStaticPage })));
const CustomOrderPage = lazy(() => import('./components/CustomOrderPage').then(m => ({ default: m.CustomOrderPage })));

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('HiBrew Theme ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isAr = typeof document !== 'undefined' ? (document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl') : true;
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white p-8 rounded-3xl shadow-sm border border-neutral-200/80">
            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              {isAr ? 'عذراً، حدث خطأ غير متوقع' : 'Sorry, an unexpected error occurred'}
            </h2>
            <p className="text-sm text-neutral-600 mb-6">
              {isAr
                ? 'حدث خطأ غير متوقع أثناء معالجة الصفحة. اضغط أدناه لإعادة التحميل.'
                : 'An unexpected error occurred while loading this view. Click below to reload.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {isAr ? 'إعادة التحميل' : 'Reload Page'}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const PageLoader = () => <CoffeeBrandLoader />;

interface CoffeeRoastersThemeViewProps {
  initialPage?: string;
  isAdmin?: boolean;
}

function CoffeeStorefrontContent({ initialPage, isAdmin = false }: { initialPage?: string; isAdmin?: boolean }) {
  const { currentRoute, navigateTo, toastMessage, language } = useCart();

  let tenant: ReturnType<typeof useTenant> | null = null;
  try {
    tenant = useTenant();
  } catch {
    tenant = null;
  }

  const [settingsVer, setSettingsVer] = useState(0);
  useEffect(() => {
    const onThemeChange = () => setSettingsVer((v) => v + 1);
    window.addEventListener('unityteck-theme-settings', onThemeChange);
    return () => window.removeEventListener('unityteck-theme-settings', onThemeChange);
  }, []);

  const isCustomOrderEnabled = useMemo(() => {
    try {
      const storeId = tenant?.activeStore?.id || 'store-coffee';
      const fallbackStore = tenant?.activeStore || { name: 'HiBrew Store' };
      const s = readAllThemeSettings(storeId, fallbackStore);
      return Boolean(s?.customOrder?.enabled);
    } catch {
      return false;
    }
  }, [tenant?.activeStore, settingsVer]);

  useEffect(() => {
    if (currentRoute === 'custom-order' && !isCustomOrderEnabled) {
      navigateTo('home');
    }
  }, [currentRoute, isCustomOrderEnabled, navigateTo]);

  useEffect(() => {
    // Set dynamic SEO & Document metadata for HiBrew KSA
    if (typeof document !== 'undefined') {
      const isAr = language === 'AR';
      document.title = isAr
        ? 'هايبرو السعودية | المتجر الرسمي لمكائن ومستلزمات القهوة المختصة'
        : 'HiBrew KSA | Official Coffee Store - Espresso Machines & Specialty Coffee Gear';

      const updateMeta = (name: string, content: string, isProperty = false) => {
        let el = document.querySelector(isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`);
        if (!el) {
          el = document.createElement('meta');
          if (isProperty) el.setAttribute('property', name);
          else el.setAttribute('name', name);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      const desc = isAr
        ? 'متجر هايبرو السعودية الرسمي. متخصصون في مكائن القهوة 20 بار، مطاحن البن التيتانيوم، وأركان ودواليب القهوة الفاخرة مع توصيل سريع لجميع مناطق المملكة.'
        : 'Official HiBrew KSA store. High-performance 20-bar espresso machines, titanium conical burr grinders, and luxury coffee stations across Saudi Arabia.';
      updateMeta('description', desc);
      updateMeta('og:title', document.title, true);
      updateMeta('og:description', desc, true);
      updateMeta('og:type', 'website', true);
      updateMeta('twitter:card', 'summary_large_image');

      // Inject google fonts if needed
      const fontLinkId = 'hibrew-google-fonts';
      if (!document.getElementById(fontLinkId)) {
        const link = document.createElement('link');
        link.id = fontLinkId;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Staatliches&family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Readex+Pro:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800;900&display=swap';
        document.head.appendChild(link);
      }
    }
  }, []);

  // Handle route switching from initialPage safely (sync only when initialPage prop changes from parent)
  const initialPageRef = React.useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!initialPage) return;
    if (initialPageRef.current === initialPage) return;
    initialPageRef.current = initialPage;

    const p = initialPage.toLowerCase().trim();
    const target: RouteType =
      p === 'catalog' || p === 'products' || p === 'shop'
        ? 'products'
        : p === 'product-buy' || p === 'buy' || p === 'buynow'
        ? 'product-buy'
        : p === 'product' || p === 'product-detail' || p === 'learn-more' || p === 'detail'
        ? 'product-detail'
        : p === 'cart'
        ? 'cart'
        : p === 'checkout'
        ? 'checkout'
        : p === 'profile' || p === 'login'
        ? 'profile'
        : p === 'reviews'
        ? 'reviews'
        : p === 'thankyou'
        ? 'thankyou'
        : p === 'privacy' ||
          p === 'return' ||
          p === 'terms' ||
          p === 'shipping' ||
          p === 'warranty' ||
          p === 'locator' ||
          p === 'track-order' ||
          p === 'about' ||
          p === 'contact' ||
          p === 'faq' ||
          p === 'page'
        ? (p as RouteType)
        : 'home';

    if (target !== currentRoute) {
      navigateTo(target);
    }
  }, [initialPage, currentRoute, navigateTo]);

  // Ensure view is scrolled strictly to top header on any route navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const t = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 50);
      return () => clearTimeout(t);
    }
  }, [currentRoute]);

  const isStaticPolicyRoute =
    currentRoute === 'privacy' ||
    currentRoute === 'return' ||
    currentRoute === 'terms' ||
    currentRoute === 'shipping' ||
    currentRoute === 'warranty' ||
    currentRoute === 'locator' ||
    currentRoute === 'track-order' ||
    currentRoute === 'about' ||
    currentRoute === 'contact' ||
    currentRoute === 'faq' ||
    currentRoute === 'page';

  const isRtl = language === 'AR';

  return (
    <div
      className="hibrew-theme-root min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-neutral-900 selection:text-white w-full max-w-full"
      dir={isRtl ? 'rtl' : 'ltr'}
      lang={isRtl ? 'ar' : 'en'}
    >
      {/* 1. Header with Region notice, Full-Width Hover Mega Menus & Detail Sub-Bar */}
      <Header />

      {/* 2. Main Route Content */}
      <main className="flex-1 w-full max-w-full">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            {currentRoute === 'home' && <HomePage />}
            {currentRoute === 'products' && <ProductsListPage />}
            {currentRoute === 'product-detail' && <ProductDetailPage />}
            {currentRoute === 'product-buy' && <ProductBuyPage isAdmin={isAdmin} />}
            {currentRoute === 'cart' && <CartPage />}
            {currentRoute === 'checkout' && <CheckoutPage />}
            {currentRoute === 'profile' && <ProfilePage />}
            {currentRoute === 'reviews' && <ReviewsPage />}
            {currentRoute === 'thankyou' && <ThankYouPage />}
            {currentRoute === 'custom-order' && isCustomOrderEnabled && <CustomOrderPage />}
            {isStaticPolicyRoute && <CoffeeStaticPage />}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* 3. Slide-over Mini Cart Drawer */}
      <MiniCartDrawer />

      {/* 4. Instant Search Modal */}
      <SearchModal />

      {/* 5. Footer */}
      <Footer />

      {/* Floating Customer Support & Quick Dock */}
      <FloatingHelpWidget />

      {/* 6. Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-full flex items-center gap-2.5 text-xs font-semibold animate-bounce shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export const CoffeeRoastersThemeView: React.FC<CoffeeRoastersThemeViewProps> = ({
  initialPage = 'home',
  isAdmin = false,
}) => {
  return (
    <ErrorBoundary>
      <CartProvider>
        <CoffeeStorefrontContent initialPage={initialPage} isAdmin={isAdmin} />
      </CartProvider>
    </ErrorBoundary>
  );
};
