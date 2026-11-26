# 40 — SOUQ PLATFORM: GLOBAL SKELETON LOADING SYSTEM
## All Stores · All Merchant Dashboards · Super Admin · Storefront · Future Modules

---

### 1. Executive Summary & Core Objective

The **Global Skeleton Loading System** is a foundational, platform-wide core UI standard across the entire Souq multi-store e-commerce ecosystem. It eliminates blank screens, jarring layout shifts, and full-page spinners by displaying content-accurate, GPU-accelerated animated placeholders whenever asynchronous data is requested.

**Coverage Scope:**
1. **Super Admin Dashboard (Master):** Stores, metrics, subscriptions, payments, AI engines, SEO, and reports.
2. **Merchant Dashboard (Store):** Overview KPIs, sales charts, products, orders, customers, categories, AI suite, media, settings, and shipping.
3. **Storefront Surfaces:** Coffee Roasters, Flowers Premium, Mecca Gifts, Saudia Transport (Alsaeedi), and Souq Common themes.
4. **Commerce Funnels:** Category catalogs, product details, cart drawers, checkout flow, customer profiles, and order tracking.
5. **Future Modules:** Standardized primitives that all new features and third-party plugins must inherit.

---

### 2. Component Library Catalog (`src/components/common/skeleton/`)

All skeleton components are centralized under `src/components/common/skeleton/` and exported via barrel `index.ts`:

```typescript
import {
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonAvatar,
  SkeletonImage,
  SkeletonButton,
  SkeletonCard,
  SkeletonProductCard,
  SkeletonProductGrid,
  SkeletonTable,
  SkeletonTableRow,
  SkeletonSidebar,
  SkeletonNavbar,
  SkeletonDashboard,
  SkeletonChart,
  SkeletonForm,
  SkeletonModal,
  SkeletonPage,
  SkeletonCheckout,
  SkeletonOrderList,
  SkeletonSettingsCard,
  useSkeletonConfig,
  SkeletonProvider,
} from '@/components/common/skeleton';
```

#### Primitives Reference:
| Component | Key Props | Description |
| :--- | :--- | :--- |
| `Skeleton` | `variant`, `width`, `height`, `animation`, `speed` | Atomic block with GPU shimmer or pulse |
| `SkeletonText` | `lines`, `lastLineWidth`, `gap`, `size` | Staggered text line placeholders |
| `SkeletonTitle` | `withSubtitle`, `withBadge`, `size` | Page and section heading placeholder |
| `SkeletonAvatar` | `size`, `shape` ('circle', 'rounded', 'square') | User and store profile picture placeholder |
| `SkeletonImage` | `aspectRatio`, `rounded`, `showIcon` | Responsive media placeholder with icon watermark |
| `SkeletonButton` | `size`, `width`, `fullWidth`, `rounded` | Action button placeholder |
| `SkeletonCard` | `hasHeader`, `hasFooter`, `hasMedia`, `lines` | Universal panel/card container |

#### Composition Reference:
| Component | Key Props | Description |
| :--- | :--- | :--- |
| `SkeletonProductCard` | `variant` ('grid', 'horizontal', 'compact', 'luxury') | Product card with image, title, price, badges |
| `SkeletonProductGrid` | `count`, `columns` (1..6, auto), `variant` | Responsive product grid matching theme breakpoints |
| `SkeletonTable` | `columns`, `rows`, `columnWidths`, `hasPagination` | Complete data table with search, headers, rows |
| `SkeletonTableRow` | `columns`, `columnWidths`, `alignments` | Column-aligned row plugged into `AdvancedDataTable` |
| `SkeletonSidebar` | `itemCount`, `collapsed`, `hasLogo`, `hasUser` | Complete sidebar navigation skeleton |
| `SkeletonNavbar` | `hasSearch`, `hasStoreSwitcher`, `hasAvatar` | Top navigation bar with controls |
| `SkeletonChart` | `type` ('area', 'bar', 'donut', 'cylinder'), `height` | Visual chart with header, axes, bars, and legend |
| `SkeletonDashboard` | `statCardsCount`, `hasCharts`, `hasRecentOrders` | Complete dashboard with KPIs, charts, orders |
| `SkeletonForm` | `fieldsCount`, `columns`, `hasActions` | Form with inputs, textareas, submit buttons |
| `SkeletonModal` | `size`, `hasHeader`, `hasFooter`, `lines` | Modal dialog backdrop and window |
| `SkeletonPage` | `layout` ('dashboard', 'table', 'cards', 'form', 'storefront') | Full page layout for route and tab transitions |
| `SkeletonCheckout` | `hasSidebar` | Multi-step storefront checkout with order summary |
| `SkeletonOrderList` | `count` | Order history list with tracking badges |

---

### 3. Design Tokens & Styling Architecture (`src/styles/skeleton.css`)

The skeleton system relies strictly on CSS variables and color-mixing with existing platform tokens:
- **Light Theme Background:** `color-mix(in srgb, var(--border, #cbd5e1) 45%, var(--surface, #ffffff))`
- **Dark Theme Background:** `color-mix(in srgb, var(--surface, #0f172a) 60%, rgba(255, 255, 255, 0.08))`
- **Directional Shimmer:**
  - In LTR (`dir="ltr"`): Shimmer sweeps from left to right (`translateX(-100%)` to `translateX(100%)`).
  - In RTL (`dir="rtl"`, `lang="ar"`): Shimmer automatically reverses right to left (`translateX(100%)` to `translateX(-100%)`).
- **Reduced Motion Support:**
  When `@media (prefers-reduced-motion: reduce)` is detected, the shimmer animation is instantly disabled, providing a quiet, static, accessible neutral block.

---

### 4. Implementation Guidelines for Future Modules

When developing new features or modules, follow these rules:

#### Rule 1: Never Show Blank Screens or Full-Page Spinners
Always wrap asynchronous components in `<Suspense fallback={<Skeleton... />}>` or conditional loading checks:
```tsx
// Good:
{loading ? (
  <SkeletonProductGrid count={8} columns={4} />
) : products.length === 0 ? (
  <EmptyState />
) : (
  <ProductList products={products} />
)}

// Bad:
{loading ? <div className="spinner" /> : ...}
```

#### Rule 2: Distinguish Initial Loading vs. Background Refresh
- **Initial Load (no data in cache):** Render the full skeleton layout.
- **Background Refresh (data already on screen):** Keep existing content visible and display a subtle indicator (e.g. `<RefreshCw className="animate-spin" />` in toolbar). Never wipe existing cards with a full skeleton flash.

#### Rule 3: Zero Fake Data Policy
Never insert invented product titles, mock prices, fake visitor counters, or dummy sales metrics inside skeleton blocks. Skeletons must be pure structural geometry.

#### Rule 4: Match Real Component Breakpoints
Ensure the skeleton container uses the same responsive grid classes as the real component (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`).

---

### 5. Central Configuration & Administration

Master Admin can configure loading preferences from:
**Super Admin → Settings → Appearance → Central Skeleton Loading System**

Configurable parameters:
1. **Enabled:** Globally toggle skeletons (essential fallbacks remain safe).
2. **Animation Style:** Smooth Shimmer (1.6s default), Gentle Pulse, or Static Neutral.
3. **Animation Speed:** Fast (1.1s), Normal (1.6s), Slow (2.2s).
4. **Live Preview:** Instant interactive preview showing the selected style in real time.
