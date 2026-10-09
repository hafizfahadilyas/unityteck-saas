# Unityteck SaaS — 100% Pixel-Perfect UI/UX Execution Roadmap

**Date:** 2026-09-30  
**Status:** Active Execution  
**Standard:** 100% Pixel-Perfect to Mockups (`designs/`) · Holst Tokens · Zero Invention  

---

## 🔒 Golden Rules for Every Single Page

1. **Pixel-Perfect Alignment:** Every card, spacing, font weight, table row, icon, and button exactly matches the corresponding mockup in `designs/`.
2. **Dual Theme (Dark + Light):** Built strictly with CSS variables (`data-theme="dark"` / `data-theme="light"`). Never hardcode ad-hoc colors.
3. **Dual Language (Arabic RTL + English LTR):** Full directional mirroring (`dir="rtl"`), Arabic fonts (`Cairo` / `Tajawal`), and no missing `t()` translation keys.
4. **Single-Page Isolation & Review Gate:** We work on **one screen at a time**. After each screen is done, Fahad reviews and approves on localhost before the next page unlocks.
5. **Master & Store Parity:** Unified Holst chrome across both portals with clean role isolation.
6. **Master & Store Paired Design & Strict Data Isolation:** Master Admin and Store Admin share the exact same UI/UX design language and components, executed together. Data is strictly isolated: Store Dashboard only sees its own store's data (`activeStore.id`), while Master Dashboard sees platform-wide aggregated data with store filtering.
7. **Clean Realistic Data (2 to 4 items max):** Across products, orders, customers, and sales, dummy data is kept clean, high-fidelity, and strictly between 2 to 4 items per store. Data is wired to state/database reactively without full page reloads.

---

## 📋 Execution Phases & Page-by-Page Checklist

### Phase 1: Foundation Chrome (Header & Sidebar) — [COMPLETED & STABILIZED]
- [x] **M1 / S1:** Master & Store Top Bar (Search, Quick actions, Lang toggle, Theme switcher, Profile, Logout)
- [x] **M1b / S1b:** Unified Saudi E-Commerce Footer card in sidebar (EN + AR)
- [x] **M2 / S2:** Master & Store Navigation Rail (Active teal highlights, badge counts, RBAC permissions)

---

### Phase 2: Overview Dashboards (The Anchor Foundation)
*Recommended to start here because all cards, charts, and table patterns originate here.*

- [x] **Step M3 — Master Admin Overview Dashboard [Done - Approved]**
  - **Mockup Ref:** `designs/Master_Admin_UIUX/01_Overview/01_refs_unityteck/01_master_dashboard_ref.png`
  - **Component:** `src/components/master/MasterDashboard.tsx`
  - **Features:** KPI Metric Cards, Revenue & Orders Analytic Tabs (Daily/Weekly/Monthly/Yearly), Cylinder/Area Charts, Store Performance Table with Live Filter & Search, Right Rail Quick Actions.
- [x] **Step S3 — Store Admin Overview Dashboard [Done - Approved]**
  - **Mockup Ref:** Paired Holst Overview Pattern + Tenant Scoped Data
  - **Component:** `src/components/store/StoreDashboard.tsx`
  - **Features:** 10 Store KPI Metric Cards, Store Analytics Tabs (Daily/Weekly/Monthly/Yearly/Custom), Product Categories Donut, Channel Distribution Cylinders, Sales Trend with peak tooltip, Recent Orders table with search/filters/pagination, Right Rail Live Storefront launch & Store timeline.

---

### Phase 3: Core Operations (Page-by-Page)

#### 1. Orders Management — [COMPLETED 100% PIXEL PERFECT]
- [x] **M4.04 — Master Orders List:** `designs/Master_Admin_UIUX/04_Orders_List/mockup_consistent/04_orders_list.png`
  - 4 KPI metric cards (Total, Completed, Pending, In Delivery) with trends and percentages
  - + New Order primary CTA button + interactive modal
  - Global search by order number, customer name, phone
  - Platform store filter dropdown + More filters expandable drawer
  - Status tabs with mockup badge counts (All, Awaiting Payment, Processing, Shipped, Out for Delivery, Delivered, Cancelled, Returned)
  - Full table with thumbnails, customer phone, payment brand badge, status chip, order source icon, date/time, quick view, and action popover.
- [x] **M4.05 — Master Order Details View:** `designs/Master_Admin_UIUX/05_Order_Details/mockup_consistent/05_order_details.png`
  - Breadcrumbs `< Orders < #10284` with soft navigation back to list
  - Header actions: Print Invoice, Delete Order with confirmation, Quick Status updater
  - 4 meta cards: Order Number, Order Date & Time, Order Status, Order Source
  - 3 info cards: Customer Information (avatar, phone, email, address, total orders, customer since), Shipping Information (SMSA Express, tracking number with copy button, shipping address), Payment Information (method, paid chip, transaction ID with copy button, date, 3D Secure verification)
  - 3-column middle section: Order Items table (thumbnails, SKU, unit price, qty, total), Order Summary (Subtotal, Discount, Shipping, Tax 15%, Grand Total highlight), Order History vertical timeline stepper with timestamps and status nodes
  - 2 bottom note cards: Customer Notes & Internal Notes (with live edit & save)
- [x] **S4.orders — Store Orders View:**
  - Paired 100% pixel-perfect implementation scoped strictly to `activeStore.id`
  - Store-scoped order list, order creation, fulfillment, notes, and details with zero full-page reload.
  - Retail Tax Invoice Printing: ZATCA tax QR, isolated print output, runtime AR/EN toggle, and live edit mode.
  - Clean "Edit Order" popup modal replacing unstyled select dropdowns.
  - Fixed 3+1 KPI card wrapping bug via dedicated `grid-cols-2 lg:grid-cols-4` grid.

#### 2. Products & Catalog — [COMPLETED 100% PIXEL PERFECT]
- [x] **M4.06 — Master Products Directory:** `designs/Master_Admin_UIUX/06_Products_List/mockup_consistent/06_products_list.png`
  - 4 KPI metric cards (Total Products, Active, Out of Stock, Draft) in dedicated `grid-cols-2 lg:grid-cols-4` container (no 3+1 wrap).
  - Search, Store filter dropdown, Category filter, and pagination (10/20/50 per page).
  - Cross-store table with thumbnails, multi-select checkboxes, Store badge chips, SKU, Category, Price, Stock, Sales, Status chip, and action popovers (Edit, Duplicate, Delete).
- [x] **M4.07 — Master Product Editor:** `designs/Master_Admin_UIUX/07_Product_Edit/mockup_consistent/07_product_edit.png`
  - Breadcrumbs `< Products / Edit Product` with soft navigation back to list.
  - Header actions: View Product, Delete Product with confirmation modal, Save Changes with reactive state updates.
  - 3-Column Layout:
    - Col 1: Product Images (main preview, delete, thumbnail strip, drag-and-drop upload zone).
    - Col 2: Basic Information (Product Name, Subtitle, Description with toolbar, Product Type, Brand, Category) & Inventory / Shipping (Quantity, SKU, Weight, Country of Origin, Shipping & Track checkboxes).
    - Col 3: Pricing (Price, Discounted Price, Cost Price, Tax 15%, Profit calculation callout) & SEO Settings (Title preview, Custom URL with slug prefix, Meta description counter).
- [x] **S4.products — Store Product Management:** `src/components/store/StoreProducts.tsx`
  - 100% identical design to Mockups 06 & 07, strictly scoped to `activeStore.id`.
  - Plan gating checks (`canAddProduct` / `planInfoForStore`) with upgrade alerts when limit reached.
  - Reactive updates without page reloads.
- [x] **S4.categories — Store Categories & Taxonomies:** `src/components/store/StoreCategories.tsx`
  - Store-scoped category taxonomy with subcategories, image previews, sort order, and SEO fields.
  - 100% Arabic & English language isolation and dark mode token compatibility.
- [ ] **S4.inventory — Store Inventory & Stock Tracking:** Stock alerts, variant matrices, warehouse tracking.

#### 3. Customers & CRM
- [ ] **M4.08 — Master Customers Directory:** `designs/Master_Admin_UIUX/08_Customers/mockup_consistent/`
- [ ] **S4.customers — Store Customer List & History:** LTV metrics, order history, customer notes.

#### 4. Channels, Marketing & Promotions
- [ ] **M4.02 — Master Performance & Channels:** `designs/Master_Admin_UIUX/02_Performance_Channels/mockup_consistent/`
- [ ] **M4.09 — Master Marketing Hub:** `designs/Master_Admin_UIUX/09_Marketing/mockup_consistent/`
- [ ] **S4.coupons — Store Coupons & Discount Codes:** Discount rules, expiration, usage limits.
- [ ] **S4.marketing — Store Channel Performance:** Traffic attribution, conversion tracking.

#### 5. Payments, Shipping & System Operations
- [ ] **M4.13 / S4.shipping — Shipping Configuration:** Methods, regional zones, rates.
- [ ] **M4.14 / S4.payments — Payment Gateways:** Mada, Apple Pay, Tabby, Tamara, Stripe, Cash.
- [ ] **M4.10 / M4.11 — Analytics & Deep Reports:** Financial reconciliation, exportable sheets.
- [ ] **M4.12 / S4.seo — Advanced SEO Engine:** Meta tags, sitemaps, OpenGraph, JSON-LD previews.
- [ ] **M4.15 / S4.settings — System & Store Settings:** Modular settings layout.

#### 6. Multi-Tenant Master Modules
- [ ] **Master Stores Management (`MasterStores.tsx`):** Tenant provisioning, plan assignments, tenant lock/unlock.
- [ ] **Master Onboarding (`MasterOnboarding.tsx`):** Tenant setup wizard.
- [ ] **Master Custom Domains (`MasterDomains.tsx`):** DNS verification, SSL status.
- [ ] **Master Database & Backups (`MasterDatabase.tsx`):** Sync status, health monitors.

---

### Phase 4: Theme Engine & Storefront Settings (01–18)
*Located in `designs/Theme_Settings_UIUX/`*

- [ ] **T01 — Store Identity:** Logo, favicon, brand name, slogan.
- [ ] **T02 — General Options:** Layout widths, back-to-top, breadcrumbs.
- [ ] **T03 — Store Colors:** Primary, secondary, surface color palettes.
- [ ] **T04 — Category, Cart & Customer:** Checkout styling, cart drawer.
- [ ] **T05 — Advanced Slider:** Hero carousel customization.
- [ ] **T06 — Product Videos:** Video banners & embed settings.
- [ ] **T07 — Product Tabs:** Description, specs, reviews layouts.
- [ ] **T08 — Detailed Products:** Image gallery zoom, thumbnail placements.
- [ ] **T09 — Image Grid:** Grid layouts, banner promos.
- [ ] **T10 — Custom Links:** Header/footer navigation links.
- [ ] **T11 — Banners:** Marketing banner bars.
- [ ] **T12 — Blog:** Store articles & content feed.
- [ ] **T13 — Announcement Bar:** Top urgency notice bar.
- [ ] **T14 — Enhanced Features:** Badges, trust seals, guarantees.
- [ ] **T15 — Product Cards:** Card styles, hover effects, quick-add buttons.
- [ ] **T16 — Custom Products:** Featured product curations.
- [ ] **T17 — Special Offer Countdown:** Flash sale timers & promotional tickers.
- [ ] **T18 — Store Statistics:** Social proof & metrics counter widgets.
