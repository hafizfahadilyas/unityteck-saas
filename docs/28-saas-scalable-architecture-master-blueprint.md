# UnityTeck SaaS — 100+ Store Scalable Multi-Tenant Architecture & Monetization Blueprint
> **Document Code:** `docs/28-saas-scalable-architecture-master-blueprint.md`  
> **Target Audience:** Master Admin, Developers, Cursor AI / Vibe Coding Assistants  
> **Hosting Target:** Hostinger Shared Hosting (cPanel / LiteSpeed / MySQL / PHP 8.2+ / React SPA)  
> **Primary Market:** Saudi Arabia (KSA) E-Commerce Standard (Mada, Tabby, Tamara, ZATCA, SMSA, Apple Pay)  
> **Core Objective:** Zero disturbance to existing running project, ultra-low API overhead, 50–100+ stores scale, full self-service visual theme builder, centralized Master update control, aur modular AI subscription monetization.

---

## 1. Executive Summary & Golden Rules (Khulaasa aur Assool)

Is document ka maqsad project ko **100+ active stores** tak scale karne ka mukammal, actionable aur safe tareeqa bayan karna hai, jise **Cursor AI / Vibe Coding** ke zariye baghair existing code ko disturb kiye step-by-step implement kiya ja sake.

### 🛡️ 5 Golden Rules (Project Ko Mehfooz Rakhne Ke Liye):
1. **Existing Database & UI Ko Break Na Karein:** Jo components (`src/components/master/`, `src/components/store/`, `src/components/storefront/`) chal rahe hain unke schema ya layouts ko overwrite nahi karna. Har naya feature **Modular Feature Flags** (`store.plan.features[...]`) ke zariye activate hoga.
2. **Minimal API & Low CPU Overhead (Hostinger Shared Friendly):** Har action par live heavy backend calls nahi hongi. Client-side caching (SWR / React Query / LocalStorage) aur static JSON configuration use hogi.
3. **No Dev Involvement for Store Themes:** Hamara kaam har client ko alag se theme bana kar dena nahi hai. Merchants Shopify/WordPress Elementor ki tarah drag-and-drop visual builder se khud apna store design karenge.
4. **Master-Controlled Updates:** Naye updates ya bug fixes Master Admin se 1 click me tamam stores me chale jayenge, ya jin stores ne monthly payment ki hui hai unko "New Version Update Available" ka opt-in button milega.
5. **Initial 5 Pilot Stores Policy:** Abhi jo 5 pilot stores chal rahe hain wo **100% Free Trial** par hain ta k testing aur demonstration mukammal ho sake. Baad me inko bhi monthly paid subscription (SAR 300/mo) me convert kiya jayega. In 5 ke baad aane wala har naya store 15-day trial ke baad direct SAR 300/mo model par chalega.

---

## 2. Multi-Store Architecture (50 se 100+ Stores on Hostinger Shared Hosting)

Hostinger shared hosting par resource limits (RAM 1-2GB, CPU limits, concurrent MySQL connections) hoti hain. Isliye architecture ko ultra-lightweight banana zaroori hai.

```
                           ┌──────────────────────────────────────────────┐
                           │      Master Admin Portal (/master)           │
                           │  - Tenant Billing & Plans (Free/Pro/VIP)    │
                           │  - AI Add-ons & Credits Ledger               │
                           │  - Master Version Release & Update Manager   │
                           │  - Cross-Store Analytics & Server Health     │
                           └──────────────────────┬───────────────────────┘
                                                  │ Central Engine & Config
                ┌─────────────────────────────────┴─────────────────────────────────┐
                ▼                                                                   ▼
┌─────────────────────────────────────────┐               ┌─────────────────────────────────────────┐
│     Store Admin Dashboard (/store)      │               │     Store Admin Dashboard (/store)      │
│               [STORE #1]                │      ...      │              [STORE #100]               │
│ - Unique Login & Password               │               │ - Unique Login & Password               │
│ - Visual Elementor-style Builder        │               │ - Visual Elementor-style Builder        │
│ - Products, Orders, Courier & Tracking  │               │ - Products, Orders, Courier & Tracking  │
│ - Add-ons: AI Tools, Mobile App, etc.   │               │ - Add-ons: AI Tools, Mobile App, etc.   │
└───────────────────┬─────────────────────┘               └───────────────────┬─────────────────────┘
                    │                                                                 │
                    ▼                                                                 ▼
      [STORE #1 CUSTOMER FRONT]                                         [STORE #100 CUSTOMER FRONT]
      (e.g., flowers.store1.com)                                        (e.g., perfume.store100.com)
```

### A. Database Isolation (Shared DB with Tenant Partitioning)
* **Single Database Pattern:** Shared hosting par 100 alag alag MySQL databases banane ke bajaye **Single Master Database with Indexed `store_id` (UUID)** use hoga.
* **Indexed Primary Key:** Har query `WHERE store_id = ?` ke sath chalti hai aur MySQL me `(store_id, id)` compound index hota hai. Is se 100 stores ka data aapas me kabhi mix nahi hota aur query execution time < 5ms rehta hai.
* **Credentials Isolation:** Har store admin ka apna separate email, hashed password (bcrypt/Argon2), aur session token hota hai jo sirf usi ke `store_id` ko access karne ka ikhtiyar deta hai.

### B. Dynamic Domain / Subdomain Routing
* **Subdomains (Automated):** `store1.unityteck.com`, `store2.unityteck.com` (Wildcard DNS `*.unityteck.com` -> Single Vite build).
* **Custom Domains (CNAME):** Client apna domain (e.g. `azhar-makkah.com`) point karta hai via CNAME. React Router client hostname check karke store config JSON load karta hai.
* **LiteSpeed Web Server Caching:** Hostinger par `.htaccess` ke zariye browser static caching aur Brotli compression enable hoti hai ta k server par zero load paray.

---

## 3. Update & Version Control Engine (Master Se Sab Me Update)

Jab ham software me koi bug fix karein ya naya feature add karein, to 100 stores ko update kaise milega?

### 2-Tier Update Model:
1. **Global Core Push (Automatic):**
   * Shared frontend UI framework, security patches, aur performance improvements automatically sabhi stores me update ho jate hain kyun k codebase single repository par mabni hai.
   * Tenant ka personal content (products, themes, logos, orders) database me JSON configuration ke tor par save hota hai, isliye core update se unka visual design kabhi disturb nahi hota.
2. **Feature Opt-In & Subscription Paywall (Paid Clients Only):**
   * Master Admin har feature ko version tag karta hai (e.g., `v2.4 - Advanced AI Marketing Agent`).
   * Store Admin dashboard me header par notification ata hai:
     > **"New System Version v2.4 Available!"**  
     > - Agar store ki monthly subscription active hai: **[Click to Upgrade Store Engine]** (1-click activation).
     > - Agar store unpaid ya free tier par hai: **[Upgrade Plan to Unlock v2.4 Features]**.

---

## 4. Elementor / Shopify Style Visual Theme Page Builder (Zero Dev Workload)

Hamare paas har client ke liye alag alag theme code karne ka waqt nahi hota. Merchants khud apna store design karenge.

### A. Modular Block Builder System
Har theme blocks/widgets ka majmua (collection) hai:
* **Header & Topbar:** Announcement ticker, logo upload, language switcher (Arabic/English/Urdu), currency switcher, search bar, cart drawer icon.
* **Hero Slider & Video Banner:** Drag-and-drop slides, button link, background overlay opacity, Arabic calligraphy fonts.
* **Featured Collections & Product Grids:** Tabs (Best Sellers, New Arrivals, On Sale), grid columns (2, 3, 4, 6), badge ribbons.
* **Visual Styling Panel:**
  * Background colors & gradients (Pick color visually)
  * Font families (Cairo, Amiri, Tajawal, Poppins, Inter)
  * Text sizing & alignment
  * Lucide SVG icon selector (No emojis)
* **Conversion Boosters:**
  * FAQ Accordion widget
  * Dynamic Coupon & Countdown Timer banner
  * Customer Loyalty Card & Points counter
  * WhatsApp Floating Commerce button with automated greeting text
  * Customer Review & Rating slider

### B. AI Prompt-to-Widget & Vibe Coding Page Builder (Exclusive Premium Add-on)
* **Prompt-to-Widget Engine:** Merchant ko coding aane ki zaroorat nahi. Page Builder ke andar merchant prompt likhega (e.g. *"Create a luxury gold Ramadan countdown banner with 3 offer columns and WhatsApp order button"*).
* **Native Component Synthesis:** AI hamare page builder ke pre-tested JSON schema aur components ke mutabiq valid widget generate karega jo foran live preview me render ho jayega.
* **Credit & Paywall Protected:** Har prompt-to-widget execution ke liye limited credits ya monthly add-on fee hogi.

### C. Theme Management & Master Admin Central Repository
* **Automatic Default General E-Commerce Theme:** Jab bhi naya client store register karega, system use foran ek modern, conversion-optimized **General Default E-Commerce Theme** assign kar dega jo seedha uske Store Dashboard aur Page Builder se fully connected hoga (Logo, Hero Sliders, Products, Cart, Checkout). Client ko khali ya broken store kabhi nahi milega.
* **Master Admin Central Theme Repository (`/master/themes`):**
  * Master Admin kisi bhi waqt naye seasonal ya niche themes (e.g. Ramadan, Perfumes, Abayas, Electronics) platform me add kar sakta hai.
  * Master Admin ke paas har theme ka full data hoga: kis store ne kaun sa theme install kiya hua hai, active adoption numbers, aur visibility controls (Show/Hide, Free vs Pro).
* **Merchant Custom Theme Upload:** User custom theme ki configuration ko JSON file me **Export** kar sakta hai aur doosre store me **Import** kar sakta hai.
* **Live Visual Preview:** Desktop, Tablet, aur Mobile responsive preview toggle.

---

## 5. Monetization, Subscriptions & Paid AI Add-ons (Exact Pricing & Rules)

Har store se recurring monthly income hasil karne ka mukammal framework:

### A. Core Website Store Subscription (15 Days Free → SAR 300 / Month)
* **15-Day Free Trial:** Naya client jab bhi apna online store create karega, use pehle **15 din ka full-access free trial** milega (Storefront, Admin dashboard, Products, Orders, ZATCA invoices).
* **Monthly Fee:** 15 din trial khatam hone ke baad **SAR 300 / Month** subscription fee lazmi hogi.
* **Auto-Lock Protocol:** Agar 15 din baad payment nahi aati, to storefront par *"Subscription Renewal Due"* ka screen show hoga aur admin dashboard me checkout paywall open hoga; store ka data (products/orders) mehfooz rahega magar sales pause ho jayegi jab tak payment na ho.

### B. Mobile App Engine (15 Days Free → SAR 300 / Month)
* **Technology:** Store ki running website ko automatically branded iOS aur Android Mobile App me convert kiya jata hai (Capacitor / PWA / Native Shell).
* **15-Day Free Trial:** Mobile app ka bhi alag se **15 din ka free trial** milega.
* **Monthly Fee:** 15 din baad **SAR 300 / Month** subscription fee hogi.
* **Payment Failure Protocol:** Agar client mobile app ki payment nahi karega to app disable ho jayegi, jab k website normal chalti rahegi (agar website ka plan active hai).
* **Combo Bundle Offer:** Website (SAR 300) + Mobile App (SAR 300) = Total SAR 600, ya Master Admin se Special Bundle discount SAR 500 / Month me offer kiya ja sakta hai.

### C. Zero-Loss AI Token & Credit Metering Strategy (Protection Rule)
* **Client Quota Limit:** Har plan me AI ke fixed credits honge (e.g., 50 product images, 100 descriptions, 20 social posts).
* **Loss-Prevention Barrier:** Jab client apne monthly credits khatam karega to AI tool lock ho jayega aur use *"Buy More AI Credits"* ka option aayega (e.g. SAR 50 = 100 extra credits).
* **Zero Cost Leakage:** Is se hamari company ko API bills me **0% loss** hoga aur 90%+ profit margin guarantee rahega.

### D. Modular AI Add-ons & Exact Revenue Matrix

| Feature / Add-on | Monetization Model | Description & Capabilities |
|---|---|---|
| **Online Website Store** | **15 Days Free → SAR 300 / Mo** | Multi-theme store, catalog, cart, ZATCA invoices, Saudi couriers & payments. |
| **Mobile App (iOS & Android)** | **15 Days Free → SAR 300 / Mo** | Website-to-app conversion. Pay na karne par app automatically suspend. |
| **AI Studio Images & Video Generator** | Monthly Pack / Credits | Gemini/Imagen engine se HD product photoshoot aur promotional video reels. |
| **AI WhatsApp Sales & Support Agent** | SAR 99 / Month | Abandoned cart recovery, order confirmation, aur 24/7 AI customer chat. |
| **AI Bug Fixer & Store Doctor** | SAR 89 / Month | Store health scan, broken links, broken images, zero inventory, and 1-click auto-fix. |
| **AI Auto Social Media Designer & Scheduler** | SAR 149 / Month | Product images se social media posts design karna, auto-schedule, aur dashboard analytics. |
| **AI Sales Growth & CRO Advisor** | SAR 99 / Month | Store ka data analyze karke selling barhane ke personalized ideas, pricing & combo tips. |
| **AI Full Product Generator** | Credits (e.g. SAR 49 / 100 SKUs) | Single image ya prompt se product title, Arabic description, SKU, specs, aur SEO tags generate. |
| **AI Prompt-to-Widget (Vibe Coding Builder)** | SAR 79 / Mo (or Pay-per-prompt) | Page builder me prompt likh kar naye luxury widgets aur banners generate karna. |
| **Advanced UTM & Marketing Attribution** | SAR 59 / Month | Snapchat, TikTok, Google Ads ka real ROAS aur CAC source tracking reports. |
| **Customer Loyalty Points System** | SAR 49 / Month | Purchases par points reward karna aur checkout par discount wallet redeem karna. |

### E. Strict Multi-Tenant AI Isolation Guarantee (Ahem Tareen Assool)
* **Har Store Ka Apna Isolated AI:** AI agent har store ke apne private data (`store_id`) ke andar band (sandboxed) hota hai.
* **Zero Cross-Store Data Leakage:** Store A ka AI kisi doosre Store B ke products, orders, customers, revenue ya theme code ko **kisi bhi soorat na dekh sakta hai aur na hi touch/fix kar sakta hai**.
* **Individual Diagnostic Boundary:** Store Doctor sirf usi store ke bugs aur settings ko fix karega jis store ka user login hai.

---

## 6. Saudi Arabia (KSA) Localized Commerce Engine

Saudi market ke tamam qawaneen aur customer expectations ko default architecture ka hissa banaya gaya hai:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SAUDI ARABIA E-COMMERCE SUITE                         │
├──────────────────────────────┬──────────────────────────────┬───────────────┤
│ 💳 Payments & Wallets        │ 🚚 Couriers & Fulfillment    │ 📜 Compliance │
├──────────────────────────────┼──────────────────────────────┼───────────────┤
│ • Mada (Debit - Crucial)     │ • SMSA Express API           │ • ZATCA Ph. 2 │
│ • Apple Pay (Instant Safari) │ • Aramex Express             │ • 15% VAT Tax │
│ • Tabby & Tamara (4x BNPL)   │ • SPL (Saudi Post / Subul)   │ • Return KSA  │
│ • STC Pay & Urpay            │ • Torod / Oto Aggregator     │ • Arabic RTL  │
│ • COD with OTP SMS Guard     │ • Live Waybill & Tracking    │ • Hijri/Greg  │
└──────────────────────────────┴──────────────────────────────┴───────────────┘
```

1. **Payments & Anti-Fraud COD:**
   * **Mada & Apple Pay:** Local payment processor integration (Geidea, PayTabs, Moyasar, or Tap).
   * **Buy Now Pay Later (BNPL):** Tabby aur Tamara ki 4 monthly split payments.
   * **Cash on Delivery (COD) Protection:** Fake orders rokne ke liye order submit hote hi customer ko WhatsApp/SMS par 4-digit OTP bheja jata hai. OTP verify hone par order confirm hota hai.
2. **ZATCA Phase 2 E-Invoicing:**
   * Har invoice par 15% VAT breakdown (Taxable amount, Tax amount, Grand total).
   * ZATCA compliant Base64 TLV Encrypted QR Code jo Saudi Tax Authority app se scan hota hai.
3. **Logistics & Automated Return Policy:**
   * Automated courier shipping label generation (Waybill AWB PDF).
   * Real-time tracking link customer ko WhatsApp aur SMS par automatically send hoti hai.
   * Customer portal se 7-day or 14-day return request generate hoti hai; merchant approval ke baad automated reverse courier pickup schedule hota hai.

---

## 7. Security, Protection & Data Isolation (Hifazat, Privacy & Strict AI Directive)

### A. Strict Directive for All AI Agents (Cursor, Claude, Antigravity, Gemini)
* ⚠️ **HAR STORE KA DATA 100% ISOLATED HAI:** Kisi bhi store (Store A) ka koi bhi data (Customer phone/emails, products, prices, orders, revenue, coupons, settings) doosre store (Store B) ko na show kiya ja sakta hai aur na hi AI prompts/memory me share kiya ja sakta hai.
* 🚫 **DATA DELETE KARNA SAKHT MANA HAI (ZERO DELETION RULE):**
  * AI agent ko **kisi bhi store ka data delete, drop, truncate, ya overwrite** karne ki ijazat nahi hai.
  * AI sirf aur sirf usi store ke context me **read/generate** karega jis store ke login session se call aayi hai (`WHERE store_id = current_store_id`).
* 🔒 **Store Doctor & Bug Fixer Boundaries:**
  * AI Store Doctor sirf usi store ke specific bug ko inspect karega jis store ke dashboard se request aayi hai.
  * AI kisi doosre store ki database rows, configurations, ya files ko touch tak nahi kar sakta.

### B. Platform Security & Hardening
* **Multi-Tenant Data Leak Protection:** Database queries me global query scopes lage hain. Koi bhi merchant kisi doosre merchant ka data API ya SQL injection ke zariye kisi soorat nahi dekh sakta.
* **Rate Limiting & Anti-DDoS:** Hostinger LiteSpeed + Cloudflare integration se brute-force login attempts aur heavy scraping blocks.
* **Sensitive Credentials Encryption:** Har merchant ke payment gateway secret keys, courier API tokens, aur bank account details database me AES-256 encrypted store hoti hain.
* **Automated Daily Backups:** JSON/SQL export engine har store ka data rozana automated tarike se backup karta hai.

---

## 8. Implementation Roadmap for Cursor / Vibe Coding (Bite-Sized Phases)

Baghair running project ko disturb kiye, is blueprint ko 4 simple stages me activate karein:

* **Phase 1: Feature Flag & License Gating in Master Admin**
  * Master Admin me `StoreSubscriptionPlan` model me add-on toggles (`has_ai_tools`, `has_mobile_app`, `has_whatsapp_agent`, `has_utm_tracker`) add karein.
* **Phase 2: Visual Page Builder Enhancement**
  * Existing `visualBuilder/` ko expand karke modular JSON block schema (`hero_slider`, `categories_grid`, `faq_block`, `loyalty_card`) allow karein.
* **Phase 3: AI Add-ons & Credit Ledger Integration**
  * Gemini API service ko token-metered endpoint se connect karein ta k merchant apne AI balance ke mutabiq images/SEO generate kar sake.
* **Phase 4: Saudi Payment & Courier Webhook Finalization**
  * Moyasar/PayTabs aur SMSA/Aramex webhooks ko `store_id` routing ke sath connect karein.

---
> **Verdict:** Is architecture se aapka system 100+ stores ko Hostinger shared hosting par nihayat tezi aur kam kharch me run karega, client khud apna store design karega, aur Master Admin se har naye feature aur AI tool ka monthly revenue generate hoga.
