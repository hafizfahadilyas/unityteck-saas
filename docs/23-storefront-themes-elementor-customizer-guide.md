# 23 — Storefront Themes & Elementor-Style Customizer Guide

## 1. Overview & Quick Access Links
Is document me Storefront Preview, Elementor-style Visual Customizer, Flowers Luxury Theme enhancements, aur Saare Storefront pages ki complete architecture aur configuration guide di gayi hai.

### Quick Access URLs:
- **Embedded Storefront Preview**: `http://localhost:3010/?tab=storefront`
- **Fullscreen Standalone Storefront (New Tab)**: `http://localhost:3010/?tab=storefront&fullscreen=1`
- **Store Themes Manager**: `http://localhost:3010/?tab=themes`
- **Visual Builder (Elementor Mode)**: Store Themes ya Storefront Preview me **"محرر التصميم (Elementor)"** button par click karein.

---

## 2. Elementor Ki Tarah Customization Options Kahan Hain?

Merchant ko Store customize karne ke do direct raaste diye gaye hain:

### Option A: Storefront Preview Top Toolbar
Storefront Preview (`/?tab=storefront`) ke top floating bar me buttons available hain:
1. **"فتح في نافذة جديدة" (Open in New Tab)**: Naye tab me full-screen store open karta hai baghair admin sidebars ke.
2. **"محرر التصميم (Elementor)" (Visual Builder)**: Direct live visual drag-and-drop and real-time settings open karta hai.
3. **"قوالب المتجر" (Themes Gallery)**: Themes switch karne ka direct link.

### Option B: Merchant Dashboard -> Themes (`قوالب المتجر`)
Sidebar me `قوالb المتجر` (Store Themes) par click karein:
- **Visual Theme Builder**: Elementor jaisa live split-screen editor jahan left panel me controls hain aur right side me live storefront render hota hai.
- **Granular 18-Panel Settings**:
  - `Layout & Container`: Page width (Boxed 1200px, Standard 1280px, Wide 1440px, ya Full Fluid 100%), spacing, container padding.
  - `Typography & Branding`: Custom Google Fonts, Font sizing, Font weights, line-height.
  - `Colors & Dark Mode`: Primary brand color, Surface, Background, Text contrast, Button hover colors.
  - `Header & Announcement Bar`: Sticky header, Top marquee announcement bar, Logo sizing, Navigation links, Currency & Language switchers.
  - `Custom CSS & Custom HTML`: Har section ke andar custom code injection widget.
  - `Pro vs Free Gating`: Free plan basic sections deta hai; Pro plan access karta hai:
    - Flash Sale Countdown Timers
    - Video Reels Carousel
    - Bento Image Gallery Grid with Lightbox
    - Custom HTML/CSS Code Injection
    - WhatsApp Quick Checkout

---

## 3. Flowers Premium Theme — Nayi Luxury Features & Enhancements

Flowers Premium theme ko luxury floral boutique standard ke mutabiq enhance kiya gaya hai:

### A. "Order on WhatsApp" (اطلب عبر واتساب) Primary CTA
- Tamam product cards aur single product page par primary action **"اطلب عبر واتساب"** hai.
- Click karne par direct WhatsApp chat open hoti hai with pre-formatted Saudi order message:
  ```
  مرحباً، أود طلب هذا المنتج من متجر الزهور:
  📌 المنتج: [Product Title]
  💰 السعر: [Price] ر.س
  🔖 الكود (SKU): [SKU]
  📍 التوصيل: مكة المكرمة وضواحيها
  ```
- Secondary button bag/cart me add karne ke liye bhi available hai.

### B. Full-Screen Image Lightbox Modal
- Bento Grid aur Product Gallery images par click karne se **Lightbox Modal** open hota hai.
- Features:
  - Zoom in / Zoom out controls
  - Keyboard navigation (Right Arrow, Left Arrow, Escape key)
  - Image title and caption
  - Direct WhatsApp order button modal ke andar

### C. Light & Dark Mode High-Contrast Readability
- Pehle Tailwind v4 dark-theme cascade ki wajah se light background par white text show ho raha tha.
- Humne semantic dynamic CSS variables (`var(--sf-text)`, `var(--sf-muted)`, `var(--sf-surface)`, `var(--sf-border)`) introduce kiye hain.
- Ab chahe Merchant dark mode use kare ya light mode, storefront text hamesha 100% crisp, readable aur aesthetic rehta hai.

### D. Countdown Flash Sale & Luxury Badges
- Hero slider ke foran baad Flash Sale timer chal raha hai (Hours, Minutes, Seconds).
- Badges: `الأكثر مبيعاً` (Best Seller), `فاخر` (Luxury), `جديد` (New Arrival).

---

## 4. All Storefront Pages Status

| Page | File Location | Status | Key Features |
|---|---|---|---|
| **Home Page** | `src/themes/flowersPremium/` & `src/components/storefront/` | ✅ Complete | Hero slider, Circle Categories, Flash sale timer, Bento grid, Featured tabs, Customer reviews, Footer |
| **Single Product Page** | `src/components/storefront/SfProductDetailPage.tsx` | ✅ Complete | High-res gallery zoom, WhatsApp order CTA, Quantity stepper, Stock status, SKU, Specs, Related products |
| **Archive / Shop Page** | `src/components/storefront/SfArchiveCategoryPage.tsx` | ✅ Complete | Category filter, Price range slider, Sort by price/rating, Grid/List view toggle |
| **Cart Drawer** | `src/components/storefront/CartDrawer.tsx` | ✅ Complete | Slide-out cart, Promo coupon code, Free shipping progress bar, Checkout CTA |
| **Checkout Page** | `src/components/storefront/SfCheckoutPage.tsx` | ✅ Complete | Makkah / Saudi shipping zones selector, Cash on Delivery (COD) payment, WhatsApp order option, Customer info validation |
| **Thank You Page** | `src/components/storefront/SfThankYouPage.tsx` | ✅ Complete | Order summary, Order number, WhatsApp status alert, Printable invoice trigger, Tracking step indicator |
| **Order Tracking** | `src/components/storefront/SfOrderTrackingModal.tsx` | ✅ Complete | Live timeline steps: Confirmed -> Preparing -> Out for Delivery -> Delivered |
| **District Delivery Selector** | `src/components/storefront/StoreFrontPreview.tsx` | ✅ Complete | Makkah districts (Al-Awali, Al-Shuqaiq, Al-Aziziyah, Al-Nuzha, Al-Rusaifah, etc.) with real-time delivery fee calculation |

---

## 5. Next Steps & Implementation Roadmap

1. **Saudi Payment Gateways (Mada, Urpay, Tabby, Tamara, Apple Pay)**:
   - Filhal Cash on Delivery (COD) aur WhatsApp order active hain.
   - Next step: Moyasar / Tap Payments API integration for online debit/credit cards.
2. **ZATCA Phase 2 E-Invoicing**:
   - Saudi tax authority compliant QR code aur printable PDF invoice generator.
3. **Automated WhatsApp / SMS Notification Gateway**:
   - Wasapi ya UltraMsg webhook se order confirm hone par customer ko automated WhatsApp tracking link bhejna.
4. **Live Shipping Carrier APIs**:
   - SMSA Express, Torod, aur Saudi Post (SPL) label printing and tracking number sync.
