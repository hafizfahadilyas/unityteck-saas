# UnityTeck Multi-Store E-Commerce SaaS — AI & Developer Master Handbook (Roman Urdu)
> **Document Code:** `docs/27-ai-and-developer-master-handbook-roman.md`  
> **Status:** Active & Authoritative Reference Guide  
> **Target Audience:** Developers, System Architects, aur Tamam AI Agents (Cursor, Antigravity, VS Code Copilot, ChatGPT, Claude)  
> **Purpose:** Project ka ab tak ka complete status, technical architecture, multi-store ecosystem, code overlap se bachne ke rules, Saudi market requirements, SEO, aur future update roadmap — sab ek jagah Roman Urdu me.

---

## 1. Project Overview & Ab Tak Ka Kaam (Current Status)

UnityTeck ek multi-tenant e-commerce SaaS platform hai jo khaas tor par **Saudi Arabia (KSA)**, Pakistan, aur Global markets ke liye design kiya gaya hai. Isme ek hi platform ke zariye hazaron mukhtalif online stores chalaye ja sakte hain.

### Ab Tak Kya Kya Ban Chuka Hai:
1. **Master Admin Portal (`/master`):**
   * **Multi-Store Management (`MasterStores.tsx`):** Naye client stores banana, unka status (Active, Inactive, Suspended), aur plan tiers (Free vs Pro).
   * **Client Onboarding System (`MasterOnboarding.tsx`):** Naye clients ke liye registration invite links aur secret token generator (Currency, Timezone, Plan limit ke sath).
   * **Custom Domains Hub (`MasterDomains.tsx`):** Har store ka apna custom domain (e.g. `store.com`) aur subdomains manage karne ka engine.
   * **Cross-Store Catalog & Taxonomy (`MasterProducts.tsx`, `MasterCategories.tsx`):** Platform level par saare stores ke products aur categories dekhne ka control.
   * **Platform Intelligence & Metrics (`MasterDashboard.tsx`, `MasterHealthAlertsHub.tsx`):** Total GMV, platform ad spend, server health alerts, cross-store shoppers.
   * **App Store & Theme Marketplace (`MasterMarketplace.tsx`, `MasterThemes.tsx`):** Plugins aur pre-built store themes ka central hub.

2. **Store Admin Portal (`/store`):**
   * **Product Catalog (`StoreProducts.tsx`, `ProductVariationsPanel.tsx`, `BulkProductUploadModal.tsx`):** Single, Variable, Digital products, stock control, SKU, weight, image gallery, aur Excel bulk import.
   * **Order Management & Invoicing (`StoreOrders.tsx`, `CreateStoreOrderModal.tsx`, `invoices/`):** Live order pipeline (Pending, Processing, Shipped, Delivered), manual order entry, aur Saudi ZATCA 15% VAT compliant QR-code invoices.
   * **Payments Hub (`StorePayments.tsx`):** Saudi gateways: Mada, STC Pay, Apple Pay, Tabby, Tamara, COD, aur multi-currency bank settlements.
   * **Shipping & Logistics (`StoreShipping.tsx`):** Courier integrations: SMSA Express, SPL (Subul), Aramex, DHL, Jahez local express, flat rate, aur city-wise delivery zones.
   * **Marketing & Promotions (`StoreMarketingHub.tsx`, `UtmCampaignBuilder.tsx`, `StoreCoupons.tsx`):** Coupon codes, flash sales, customer journey funnels (CRO), WhatsApp marketing links, aur UTM campaign tracker.
   * **SEO Suite (`StoreSEO.tsx`):** Title, meta descriptions, sitemap.xml, robots.txt, Google Search Console & Analytics verification tags.
   * **Media Library (`StoreMediaLibrary.tsx`):** Cloud media files, folders, CDN URLs, image compressions.
   * **Theme Customizer & Visual Builder (`StoreThemes.tsx`, `visualBuilder/`):** Luxury theme customizer, color schemes, font pairing, header/footer layout.
   * **Backup & Restore Center (`StoreBackupRestoreCenter.tsx`):** Store data, products, orders ka JSON/ZIP backup aur restore.

3. **Customer Storefront (`/storefront`):**
   * **Luxury Theme Engine (`StoreFrontPreview.tsx`, `DynamicProductRow.tsx`):** Multi-theme customer interface with responsive design.
   * **RTL & Multilingual:** Arabic (`ar`), English (`en`), aur Urdu (`ur`) ka instant switch.
   * **Checkout & Cart:** Drawer cart, instant quick buy, coupon apply, address selector, payment gateway selection.
   * **Under Construction Mode (`UnderConstructionPage.tsx`):** Launch hone se pehle maintenance screen.

4. **Zero Emojis Policy Enforced:**
   * Poore project se cartoon emojis (`🌹`, `🔥`, `🚀`, `⚠️`) hata kar official crisp **Lucide React SVG icons** (`<Flower2 />`, `<Flame />`, `<AlertCircle />`) lagaye gaye hain.

5. **Demo Store 1 Real Data:**
   * Store 1 **"Makkah Fresh Flowers" (متجر أزهار مكة الفاخرة)** ko 100% real Saudi floral commerce data, Saudi Riyal (SAR) currency, real Makkah/Jeddah/Riyadh customers aur realistic prices ke sath configure kiya gaya hai.

---

## 2. Technical Architecture & Folder Structure

Project ek **Single-Codebase, Multi-Tenant Web Architecture** par mabni hai:

```
unityteck-_-multi-store-e-commerce-saas/
├── docs/                     # 27+ Technical manuals, SEO guides, architecture specs
├── src/
│   ├── api/                  # API client, REST endpoints, backend service connectors
│   ├── auth/                 # Authentication, JWT, store login states
│   ├── components/
│   │   ├── common/           # Buttons, Badges, Modals, StatCards, Tables (reusable)
│   │   ├── master/           # Superadmin / Master portal views & components
│   │   ├── store/            # Store Admin / Merchant dashboard views & tools
│   │   └── storefront/       # Public buyer storefront pages & dynamic blocks
│   ├── context/              # Global state (StoreContext, AuthContext, ThemeContext)
│   ├── data/                 # Seed data, mock database partitions (Store 1, Store 2...)
│   ├── hooks/                # Custom React hooks (useStore, useTheme, useI18n, etc.)
│   ├── i18n/                 # Translations (ar.json, en.json, ur.json)
│   ├── services/             # Core logic: OrderService, PaymentService, ZATCAService
│   ├── styles/               # CSS variables, tokens, Tailwind configuration
│   ├── types/                # Central TypeScript interfaces (Store, Product, Order, User)
│   ├── utils/                # Helper functions: currency formatters, date formatters, tax
│   ├── App.tsx               # Central route controller & portal switcher
│   └── main.tsx              # React DOM entry point
├── package.json              # React 19, TypeScript, Vite, Tailwind, Lucide React
└── vite.config.ts            # Fast build configuration & aliasing
```

### Core Architectural Concepts:
* **Tenant Isolation:** Har store ka data (`storeId`) ke sath bind hota hai. Store 1 ka product ya order Store 2 me kabhi mix nahi ho sakta.
* **Shared Engine:** UI components, payment drivers, invoice generators, aur theme templates ek hi shared library se run hote hain.
* **High Contrast Design Tokens (`portal-tokens.css`):** Light mode me text bilkul dark slate (`#0f172a`) aur borders solid hain; Dark mode me pure white text (`#ffffff`) aur black/slate surfaces hain taake kisi screen pe text dhundhla na ho.

---

## 3. Portals aur Stores ki Tafseel

| Role / Portal | URL Path | Kaam / Responsibility | Kis Ke Liye Hai? |
|---|---|---|---|
| **Master Admin (Superadmin)** | `/master` | Naye stores approve karna, plans aur subscription manage karna, platform ki kul kamai (GMV) dekhna, global security aur domains set karna. | Platform Owner / SaaS Team |
| **Store Admin (Merchant)** | `/store` | Dukan chalana: Products daalna, inventory update karna, orders ship karna, ZATCA tax invoice print karna, coupons banana. | Dukaandar / Store Owner |
| **Storefront (Customer)** | `/storefront` (ya client ka apna domain) | Products browse karna, cart me add karna, Saudi address daal kar Mada/Apple Pay se payment karna. | End Shopper / Customer |

### Demo Stores ki mojooda soorat-e-haal:
* **Store 1:** `Makkah Fresh Flowers` (`store_001`) — Active & Fully populated (SAR currency, floral products, Saudi logistics).
* **Future Stores:** Store 2 (`store_002` - Electronics), Store 3 (`store_003` - Perfumes/Abayas) — Master Admin ke Onboarding ya `CreateStoreModal` se seedha banaye ja sakte hain.

---

## 4. Next Updates Guide: Code Overlap & Re-Build Se Bachne Ke Rules (Golden Rules for AI & Developers)

Aksar jab mukhtalif AI tools (Cursor, Antigravity, VS Code, ChatGPT) ya developers project par kaam karte hain, to wo purana code dobara likh dete hain ya components tod dete hain. **In rules par sakhti se amal karein:**

### Rule 1: "Never Re-invent the Wheel" (Pehle Existing Component Dekhein)
* Naya code likhne se pehle `src/components/common/`, `src/components/store/`, aur `src/components/master/` check karein.
* Maslan, order create karne ka modal pehle se bana hua hai (`CreateStoreOrderModal.tsx`), bulk upload ke liye `BulkProductUploadModal.tsx` mojood hai, UTM link banane ke liye `UtmCampaignBuilder.tsx` mojood hai. Naya modal banane ke bajaye mojooda ko use ya extend karein.

### Rule 2: Single Source of Truth for Types (`src/types/`)
* Inline `interface` ya `type` kisi component file me mat banayein agar wo multi-place use ho rahi ho. Hamesha `src/types/` me add ya check karein (e.g. `Product`, `Order`, `Store`, `Customer`).

### Rule 3: Zero Emoji Rule (Hamesha Lucide Icons Use Karein)
* UI ke kisi bhi code me emojis (`🌹`, `🛒`, `📦`, `✅`, `⚠️`) paste **HARGIZ** na karein.
* Hamesha Lucide React SVG icon import karein:
  ```tsx
  import { ShoppingBag, Package, CheckCircle2, AlertTriangle, Flower2 } from 'lucide-react';
  ```

### Rule 4: Atomic Changes & No Wholesale File Overwrite
* Puri ki puri 1000 lines ki file ko replace karne ke bajaye sirf mutalliqah function ya JSX block ko edit karein taake doosre features erase na hon.

### Rule 5: State & Tenant Context Preserve Karein
* Kabhi bhi `storeId` ko hardcode na karein. Hamesha `useStore()` hook ya context se active store ki ID lein taake multi-store partition kharab na ho.

---

## 5. Saudi Arabia (KSA) Market Specialization Requirements

Saudi market me kamyab e-commerce ke liye yeh 5 cheezein lazmi hain aur project me already wired hain:

### A. Local Payment Gateways
1. **Mada (مدى):** Saudi Arabia ka qaumi debit card network. Saudi me 75%+ e-commerce transactions Mada se hoti hain. Iska gateway driver `StorePayments.tsx` me priority #1 hai.
2. **Apple Pay:** Saudi iPhone users ka primary payment method (Safari aur mobile storefront par one-tap checkout).
3. **STC Pay:** KSA ka sab se bara digital wallet.
4. **BNPL (Tabby & Tamara):** "Buy Now, Pay Later" (4 qiston me adaigi). Saudi shoppers me high-ticket orders ke liye intehai maqbool.
5. **Cash on Delivery (COD):** COD ke liye OTP phone verification zaroori hai taake fake orders na hon.

### B. Saudi National Address (العنوان الوطني - SPL)
Saudi address street name aur house number ki tarah simple nahi hota. Storefront checkout me yeh fields standard hain:
* **Short Address Code (4 letters + 4 digits):** Maslan `RRRD2929`
* **Building Number (رقم المبنى):** 4 digits
* **Street (الشارع) & District / Hai (الحي):** Maslan Al-Olaya, Al-Malqa, Al-Aziziyah
* **City (المدينة):** Riyadh, Jeddah, Makkah, Madinah, Dammam, Khobar
* **Postal Code (الرمز البريدي):** 5 digits

### C. Logistics & Courier Partners
* **SMSA Express (سمسا):** KSA wide fast express parcel delivery.
* **SPL / Subul (سبل - البريد السعودي):** National postal delivery network.
* **Aramex (أرامكس):** Domestic aur GCC cross-border shipping.
* **Jahez / Local Fleet:** Same-day instant perishable delivery (e.g. Fresh Flowers & Cakes).

### D. ZATCA (Fatoora) 15% VAT E-Invoicing
* Saudi ZATCA kanoon ke mutabiq har order invoice par **15% VAT** alag se mention hona zaroori hai.
* Tax Invoice par **Base64 TLV Encoded QR Code** hona lazmi hai jisme:
  1. Seller Name (اسم المنشأة)
  2. VAT Registration Number (الرقم الضريبي - 15 digits)
  3. Timestamp (تاريخ ووقت الفاتورة)
  4. Invoice Total with VAT (إجمالي الفاتورة مع الضريبة)
  5. VAT Total (مبلغ ضريبة القيمة المضافة)

---

## 6. SEO (Search Engine Optimization) Strategy

Multi-store SaaS me SEO do levels par hoti hai:

### A. Platform / Multi-Store Technical SEO:
* **Canonical URLs:** Har store ke apne custom domain ya subdomain ke liye canonical link header set hota hai taake Google duplicate content ka penalty na lagaye.
* **hreflang Tags:** Multilingual indexing ke liye:
  * `<link rel="alternate" hreflang="ar-sa" href="https://store.com/ar" />`
  * `<link rel="alternate" hreflang="en-sa" href="https://store.com/en" />`
  * `<link rel="alternate" hreflang="ur-pk" href="https://store.com/ur" />`
* **Schema.org / JSON-LD Structured Data:**
  * Har product page par dynamic `Product`, `Offers`, `priceCurrency: "SAR"`, `availability: "InStock"` tags inject hote hain taake Google Shopping aur Rich Snippets me real price aur review stars dikhein.
  * Store homepage par `LocalBusiness` / `Store` schema with Saudi coordinates.

### B. Merchant SEO Suite (`StoreSEO.tsx`):
* Merchant dashboard se apna Meta Title, Meta Description, Social Share Image (OG:Image), robots.txt aur auto-generated `sitemap.xml` manage karta hai.
* Google Search Console aur Google Analytics 4 (GA4) ki Verification Measurement ID (`G-XXXXXXXXXX`) ek click me connect hoti hai.

---

## 7. Marketing & Growth Engine (Saudi Audience Focused)

Saudi Arabia me marketing baki dunya se mukhtalif channels par chalti hai:

1. **Snapchat Ads (Primary Channel in KSA):**
   * Saudi Arab Snapchat ka dunya ka sab se bara consumer market hai.
   * `StoreMarketingHub.tsx` me Snap Pixel integration aur Snap Story campaign links generate hote hain.
2. **TikTok Ads & Live Commerce:**
   * Short video format products ki sales ke liye TikTok pixel tracking aur catalog feed.
3. **WhatsApp Direct Commerce:**
   * Saudi shoppers order confirm karne ya special custom bouquet order karne ke liye WhatsApp sab se zyada use karte hain.
   * Storefront me floating **"Order via WhatsApp"** button mojood hai jo product details aur direct cart link message me pre-fill kar deta hai.
4. **UTM Link Builder (`UtmCampaignBuilder.tsx`):**
   * Influencers aur social ads ke liye tracking links (e.g. `?utm_source=snapchat&utm_medium=influencer&utm_campaign=national_day_sale`).
5. **Saudi National Occasions Marketing:**
   * Saudi National Day (اليوم الوطني - 23 September), Saudi Founding Day (يوم التأسيس - 22 February), Ramadan, aur Eid campaigns ke liye pre-built promo banner templates.

---

## 8. Summary Checklist for Any AI Agent Working on This Codebase

Jab bhi koi AI (Cursor, Antigravity, ChatGPT, Claude) is project me naya feature add kare, to yeh quick verification checklist zaroor follow kare:

- [ ] **Check 1:** Kya code me koi cartoon emoji reh gaya? (Agar haan, to Lucide icon se replace karein).
- [ ] **Check 2:** Kya light aur dark mode dono me text saaf nazar aa raha hai? (High contrast slate text in light mode, pure white in dark mode).
- [ ] **Check 3:** Kya naya feature tenant-isolated hai? (`storeId` ke sath linked hai, hardcoded nahi).
- [ ] **Check 4:** Kya Saudi Riyal (SAR) aur Arabic RTL layout theek render ho raha hai?
- [ ] **Check 5:** Kya koi existing component bina wajah delete ya double create to nahi hua?
- [ ] **Check 6:** Kya `npm run build` ya `npx tsc` clean pass ho raha hai baghair kisi type error ke?

---
*Is handbook ko safe rakhein aur har agle update se pehle context ke tor par review karein.*
