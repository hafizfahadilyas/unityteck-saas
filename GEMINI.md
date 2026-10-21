# UnityTeck SaaS — Strict AI Execution Rules (LOCKED)

## 1. Zero Dummy / Mock / Hardcoded Data Policy (Strictly Enforced)
- **NO FAKE OR MOCK DATA**: Never inject static mock objects, fake arrays, or fake demo placeholders.
- **NO HARDCODED STORE CONTENT**: Never hardcode store-specific text (such as flowers, bouquets, ceramic vases on coffee or fashion stores). All titles, messages, templates, and links must dynamically adapt to `activeStore.name`, `activeStore.slug`, and the store's real catalog products.
- **NO FAKE LOCAL STORAGE / CACHE**: Do not use local dummy state tricks. Every screen must fetch from real backend APIs, React TenantContext state, and Hostinger MySQL (`srv1422.hstgr.io` / `u920689430_giftshop`).
- **GENUINE EMPTY STATES**: Real empty states (`No records found`, `0`, genuine loaders) must be shown if data is not yet in the database. Never fabricate fake numbers (e.g. 1,248 abandoned carts, SAR 85,400) when actual database count is 0.

## 2. 100% Pixel-Perfect UI/UX Matching
- Reference folder: `C:\Users\fahad\Downloads\مجلد جديد (8)\مجلد جديد (8)`
- Must match layout, spacing, typography, colors, borders, cards, and design hierarchy 100% same-to-same with the provided images and docx specifications.
- Clean Lucide SVG icons only (Zero cartoon emojis policy).

## 3. Responsive, Overlap-Free & Fast UI
- **Zero Layout Overlaps**: Strict container boundary control, flex/grid wrapping, and overflow prevention on all screens.
- **Full Responsiveness**: 100% adaptive across Mobile (<640px), Tablet (640px-1024px), Laptop (1024px-1440px), and Ultra-wide Desktop (>1440px).
- **Speed & Optimization**: Minimal re-renders, lightweight CSS/Tailwind, debounced inputs, fast load times.

## 4. Pure English in English Mode & Pure Arabic in Arabic Mode (Strict Bilingual Isolation)
- **English Mode (`en` / LTR)**: 100% of labels, placeholders, buttons, table headers, numbers formatting, tooltips, toasts, and default templates must be in proper, professional English. Zero Arabic text or strings allowed in English view.
- **Arabic Mode (`ar` / RTL)**: 100% of labels, placeholders, buttons, table headers, tooltips, toasts, and default templates must be in proper, native Arabic (`dir="rtl"`). Zero English text or strings allowed in Arabic view.
- **No Directional Inversions**: Icons (arrows, chevrons) must be properly flipped in RTL (`rtl:rotate-180`).
- **Dual Theme Support**: High-contrast Dark Mode (deep clean surfaces, bright readable text) and Light Mode (crisp borders, sharp typography).

## 5. Navigation & Routing Integrity (Zero Duplication)
- **Zero Duplicate Renders**: Router and tab switchers (`App.tsx`, admin routers) must never duplicate conditional tab renders. Every tab must render exactly once.
- **Active Navigation Actions**: All tool cards, hubs, and links must connect to their real working subviews or routes rather than inert dummy toasts.

## 6. Database & Multi-Tenant Architecture Protection
- Multi-tenant tenant boundary (`store_id`) is strictly isolated and locked.
- Existing migrations (`apps/api/database/migrations/`) and SQL schemas (`database/hostinger/`) must remain untouched and intact.
- Do not break existing API contracts or backend routes.

## 7. Mandatory Module Testing & Production Build Validation
- Every module must be thoroughly verified, tested, and validated with `npm run build` with zero TypeScript or bundling errors before moving to the next.
- Clean code ready for GitHub tracking and Hostinger deployment.

## 8. User Communication Language Preference (LOCKED)
- **Always respond and guide the user in Roman Urdu** (short, clear, and direct).
- Never reply in pure Arabic for conversation/guidance. (Arabic UI text within code/i18n is unaffected).
