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
import { resolveCoffeeThemeSettings } from '../settings/coffeeThemeDefaults';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { MiniCartDrawer } from './components/MiniCartDrawer';
import { SearchModal } from './components/SearchModal';
import { Footer } from './components/Footer';
import { FloatingHelpWidget } from './components/FloatingHelpWidget';
import { CheckCircle2 } from 'lucide-react';
import './coffeeRoasters.css';
import './themeFlow.css';
import { captureTrafficSource } from '../../utils/trafficSource';
import { trackStorefrontEvent } from '../../utils/storefrontAnalytics';
import { LoyaltyGiftPointsPopup } from '../../components/storefront/LoyaltyGiftPointsPopup';
import { readSfCustomer } from '../flowersPremium/sfCustomerSession';

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
    try {
      (window as unknown as { __HIBREW_LAST_ERROR?: string }).__HIBREW_LAST_ERROR =
        `${error?.message || error}\n${errorInfo?.componentStack || ''}`.slice(0, 4000);
    } catch {
      /* ignore */
    }
  }

  render() {
    if (this.state.hasError) {
      const isAr = typeof document !== 'undefined' ? (document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl') : true;
      const detail = this.state.error?.message || '';
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
            {detail ? (
              <p className="text-[11px] text-rose-700 mb-4 break-words font-mono text-start" data-hibrew-error={detail}>
                {detail}
              </p>
            ) : null}
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

/** Route chunk fallback — thin skeleton, not full brand splash (keeps nav snappy). */
const PageLoader = () => (
  <div className="w-full min-h-[28vh] bg-white flex items-start justify-center pt-16" aria-busy="true" role="status">
    <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-[#8B5A2B] animate-spin" />
  </div>
);

interface CoffeeRoastersThemeViewProps {
  initialPage?: string;
  isAdmin?: boolean;
}

function CoffeeStorefrontContent({ initialPage, isAdmin = false }: { initialPage?: string; isAdmin?: boolean }) {
  const { currentRoute, navigateTo, toastMessage, language, selectedProduct } = useCart();

  let tenant: ReturnType<typeof useTenant> | null = null;
  try {
    tenant = useTenant();
  } catch {
    tenant = null;
  }

  const [settingsVer, setSettingsVer] = useState(0);
  const storeIdForLoyalty = tenant?.activeStore?.id || '';
  const [loyaltyCustomerId, setLoyaltyCustomerId] = useState<string | null>(() =>
    storeIdForLoyalty ? readSfCustomer(storeIdForLoyalty)?.customerId || null : null,
  );
  useEffect(() => {
    const onThemeChange = () => setSettingsVer((v) => v + 1);
    window.addEventListener('unityteck-theme-settings', onThemeChange);
    return () => window.removeEventListener('unityteck-theme-settings', onThemeChange);
  }, []);

  useEffect(() => {
    if (!storeIdForLoyalty) {
      setLoyaltyCustomerId(null);
      return;
    }
    const sync = () => setLoyaltyCustomerId(readSfCustomer(storeIdForLoyalty)?.customerId || null);
    sync();
    window.addEventListener('unityteck-sf-customer-ready', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('unityteck-sf-customer-ready', sync);
      window.removeEventListener('storage', sync);
    };
  }, [storeIdForLoyalty]);

  useEffect(() => {
    if (isAdmin) return;
    captureTrafficSource();
    const storeId = tenant?.activeStore?.id;
    trackStorefrontEvent(storeId, 'page_view', {
      path: typeof location !== 'undefined' ? location.pathname : `/${currentRoute || 'home'}`,
    });
  }, [isAdmin, tenant?.activeStore?.id, currentRoute]);

  useEffect(() => {
    if (isAdmin) return;
    if (currentRoute !== 'product-detail' && currentRoute !== 'product-buy') return;
    const storeId = tenant?.activeStore?.id;
    const product = selectedProduct;
    if (!storeId || !product?.id) return;
    trackStorefrontEvent(storeId, 'product_view', {
      path: typeof location !== 'undefined' ? location.pathname : `/${currentRoute}`,
      meta: {
        product_id: String(product.id),
        product_name: product.nameAr || product.name || undefined,
      },
    });
  }, [isAdmin, tenant?.activeStore?.id, currentRoute, selectedProduct?.id]);

  useEffect(() => {
    const alias: Record<string, string> = {
      '01_store_identity': '00_header_builder',
      '02_colors': '00_header_builder',
    };
    const onMsg = (event: MessageEvent) => {
      const data = event.data as { type?: string; section?: string; index?: number } | null;
      if (!data || data.type !== 'UNITYTECK_PREVIEW_FOCUS') return;
      const raw = String(data.section || '');
      const section = (alias[raw] || raw).replace(/[^a-zA-Z0-9_-]/g, '');
      if (!section) return;
      document.querySelectorAll('.unityteck-customize-focus').forEach((node) => {
        node.classList.remove('unityteck-customize-focus');
      });
      const el = document.querySelector(`[data-customize-section~="${section}"]`);
      if (el) {
        el.classList.add('unityteck-customize-focus');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if ((raw === 'C-HERO' || section === 'C-HERO') && typeof data.index === 'number') {
        window.dispatchEvent(new CustomEvent('unityteck-hero-slide', { detail: { index: data.index } }));
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const coffeeSettings = useMemo(() => {
    try {
      const storeId = tenant?.activeStore?.id;
      if (!storeId) return null;
      return resolveCoffeeThemeSettings(storeId, tenant.activeStore);
    } catch {
      return null;
    }
  }, [tenant?.activeStore, settingsVer]);

  const [globalTokens, setGlobalTokens] = useState<{
    fontFamily?: string;
    radius?: number;
    containerWidth?: number;
    colors?: { button?: string };
  } | null>(null);

  useEffect(() => {
    const storeId = tenant?.activeStore?.id;
    if (!storeId) return;
    let cancelled = false;
    import('../../api/tenantApi')
      .then(({ fetchStorefrontThemeApi }) => fetchStorefrontThemeApi(storeId))
      .then((payload) => {
        if (cancelled) return;
        const tokens = payload?.theme?.tokens;
        if (!tokens || typeof tokens !== 'object') {
          setGlobalTokens(null);
          return;
        }
        const colors = tokens.colors && typeof tokens.colors === 'object' ? tokens.colors : {};
        setGlobalTokens({
          fontFamily: typeof tokens.fontFamily === 'string' ? tokens.fontFamily : undefined,
          radius: typeof tokens.radius === 'number' ? tokens.radius : undefined,
          containerWidth: typeof tokens.containerWidth === 'number' ? tokens.containerWidth : undefined,
          colors: typeof colors.button === 'string' ? { button: colors.button } : undefined,
        });
      })
      .catch(() => {
        if (!cancelled) setGlobalTokens(null);
      });
    return () => {
      cancelled = true;
    };
  }, [tenant?.activeStore?.id, settingsVer]);

  const isCustomOrderEnabled = useMemo(() => {
    const co = coffeeSettings?.customOrder;
    if (co && co.enabled === false) return false;
    return true;
  }, [coffeeSettings]);

  // Accent and widget tokens only. Never paint page background from colors.background.
  const themeColorStyle = useMemo(() => {
    const c = coffeeSettings?.colors;
    const button = globalTokens?.colors?.button;
    const style: React.CSSProperties = {
      ['--theme-accent' as string]: c?.promoLabelBgColor || '#C88A58',
      ['--theme-header-bg' as string]: c?.headerBgColor || '#FFFFFF',
      ['--theme-header-text' as string]: c?.headerTextColor || '#111111',
    };
    if (button) style['--theme-button' as string] = button;
    if (globalTokens?.fontFamily) style.fontFamily = globalTokens.fontFamily;
    if (typeof globalTokens?.radius === 'number') style['--theme-radius' as string] = `${globalTokens.radius}px`;
    if (typeof globalTokens?.containerWidth === 'number') {
      style['--theme-container' as string] = `${globalTokens.containerWidth}px`;
    }
    delete (style as { backgroundColor?: string }).backgroundColor;
    return style;
  }, [coffeeSettings, globalTokens]);

  useEffect(() => {
    if (currentRoute === 'custom-order' && !isCustomOrderEnabled) {
      navigateTo('home');
    }
  }, [currentRoute, isCustomOrderEnabled, navigateTo]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const isAr = language === 'AR';
    const storeName = isAr
      ? (tenant?.activeStore?.nameAr || tenant?.activeStore?.name || 'متجر القهوة')
      : (tenant?.activeStore?.nameEn || tenant?.activeStore?.name || 'Coffee Store');
    const titles: Record<string, string> = isAr
      ? {
          home: `${storeName} | متجر القهوة`,
          products: `المنتجات | ${storeName}`,
          'product-detail': `تفاصيل المنتج | ${storeName}`,
          'product-buy': `شراء المنتج | ${storeName}`,
          cart: `السلة | ${storeName}`,
          checkout: `إتمام الطلب | ${storeName}`,
          about: `من نحن | ${storeName}`,
          contact: `تواصل معنا | ${storeName}`,
          faq: `الأسئلة الشائعة | ${storeName}`,
        }
      : {
          home: `${storeName} | Coffee Store`,
          products: `Products | ${storeName}`,
          'product-detail': `Product | ${storeName}`,
          'product-buy': `Buy | ${storeName}`,
          cart: `Cart | ${storeName}`,
          checkout: `Checkout | ${storeName}`,
          about: `About | ${storeName}`,
          contact: `Contact | ${storeName}`,
          faq: `Questions | ${storeName}`,
        };
    document.title = titles[currentRoute] || titles.home;
    const desc = isAr
      ? `تصفح منتجات${storeName}. تصفية حسب التصنيف، أسعار بالريال، وتوصيل داخل المملكة.`
      : `Browse ${storeName} products. Filter by category, with prices in SAR and delivery across Saudi Arabia.`;
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
    updateMeta('description', desc);
    updateMeta('og:title', document.title, true);
    updateMeta('og:description', desc, true);
    updateMeta('og:type', currentRoute === 'products' ? 'website' : 'website', true);
    updateMeta('twitter:card', 'summary_large_image');
    if (!isAdmin) {
      document.documentElement.lang = isAr ? 'ar' : 'en';
      document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    }
    const fontLinkId = 'hibrew-google-fonts';
    if (!document.getElementById(fontLinkId)) {
      const link = document.createElement('link');
      link.id = fontLinkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Staatliches&family=Outfit:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;600;700&family=Readex+Pro:wght@400;600;700&family=Tajawal:wght@400;700&display=swap';
      document.head.appendChild(link);
    }
  }, [language, currentRoute, isAdmin, tenant?.activeStore?.name, tenant?.activeStore?.nameAr, tenant?.activeStore?.nameEn]);

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
        : p === 'custom-order' || p === 'customorder' || p === 'builder'
        ? 'custom-order'
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
      data-paint-page-background="false"
      style={themeColorStyle}
    >
      <style>{`.hibrew-theme-root .unityteck-customize-focus{outline:2px solid #4f46e5;outline-offset:3px;border-radius:12px}${globalTokens?.colors?.button ? '.hibrew-theme-root .hibrew-inherit-btn{background-color:var(--theme-button);border-radius:var(--theme-radius,9999px)}' : ''}`}</style>
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

      {/* Loyalty gift points popup (store-scoped; real ledger credits) */}
      {storeIdForLoyalty ? (
        <LoyaltyGiftPointsPopup storeId={storeIdForLoyalty} customerId={loyaltyCustomerId} />
      ) : null}

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
