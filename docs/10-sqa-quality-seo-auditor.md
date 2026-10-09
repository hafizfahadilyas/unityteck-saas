# Senior SQA · Full Website Quality, SEO, Marketing & Reports Auditor (LOCKED)
# مدقق الجودة الشامل، والـ SEO، والتسويق، والتقارير (باللغتين الإنجليزية والعربية)

**Source:** Client brief — MASTER PROMPT — SENIOR SQA + FULL WEBSITE QUALITY & SEO AUDITOR  
**Status:** Canonical QA process · **NOT a rebuild**  
**Related:** `docs/00` · `docs/01` Phase **7** · `docs/02` · `docs/04` · `docs/08` · `docs/09` · `docs/24` (SEO) · `docs/25` (Marketing) · `docs/26` (Reports)

---

## 1. Role & Objective / الدور والأهداف

### 🇬🇧 English:
Act as Senior SQA + QA Automation + Website Quality Auditor + SEO & Business Intelligence Auditor.
**Core Objective:** End-to-end audit, test, and verify the existing multi-tenant SaaS platform across Master Admin, Store Dashboard, and Public Storefronts without rebuilding, redesigning, or breaking working features.

### 🇸🇦 العربية:
العمل كمدقق جودة برمجية متقدم (Senior SQA)، ومختبر للأتمتة وفحص الجودة الشاملة، ومدقق تقني لـ SEO وذكاء الأعمال.
**الهدف الأساسي:** فحص شامل وتدقيق شامل للمنصة متعددة المتاجر عبر لوحة المشرف العام، ولوحة تحكم المتاجر، وواجهة المتجر العامة دون إعادة بناء أو كسر أي وظائف سابقة.

---

## 2. Mandatory QA Process / دورة عمل التدقيق الإلزامية

```
Inspect → Understand → Test → Find Issues → Verify → Report → Fix → Retest
فحص → فهم واستيعاب → اختبار → اكتشاف المشاكل → التحقق → إعداد التقرير → الإصلاح → إعادة الاختبار
```

### 🇬🇧 Golden QA Chain:
`Code → Database (MySQL store_id) → API (Laravel) → Dashboard → Public Frontend (SSR) → Browser → Mobile → SEO / Marketing / Reports → Cache Invalidation → Security`

### 🇸🇦 السلسلة الذهبية لتدقيق الجودة:
`الكود البرمجي → قاعدة البيانات (عزل المتاجر) → الـ API → لوحات التحكم → واجهة المتجر العامة (SSR) → المتصفح → الجوال → الـ SEO والتسويق والتقارير → إبطال الكاش الفوري → الأمان والحماية`

---

## 3. SEO, Marketing & Reports Audit Scope / نطاق فحص الـ SEO والتسويق والتقارير

### A. SEO Audit Scope (Bilingual Verification) / نطاق فحص تحسين محركات البحث
- **Meta & Head Inspection:** Rendered `<title>`, `<meta name="description">`, Canonical URLs, and OpenGraph tags.
- **Structured Data (JSON-LD):** Validate schemas for `Organization`, `Product`, `Offer`, `LocalBusiness`, and `BreadcrumbList` via Google Rich Results Test format.
- **Hreflang & RTL Tags:** Verify bilingual switching (`ar` and `en`) with matching HTML attributes (`dir="rtl"` / `dir="ltr"`).
- **Sitemap & Robots:** Verify dynamic XML sitemaps per store (`/sitemap.xml`) and clean `robots.txt` exclusion rules.
- **Zero Stale Cache Test:** Verify updating product/category SEO tags in Store Admin immediately reflects on rendered storefront HTML.

### B. Marketing Hub & Promotions Audit / فحص مركز التسويق والعروض الترويجية
- **UTM Builder & Analytics:** Verify generated UTM links properly track channel parameters (`utm_source`, `utm_medium`, `utm_campaign`).
- **Coupon Validation Rules:** Test percentage discounts, fixed discounts, minimum cart spend, expiry dates, and usage limits without full-page reload.
- **Promotions & Banners:** Verify top sticky announcement bars, discount popups, and countdown timers render responsively across mobile and desktop.
- **WhatsApp Commerce:** Test "Order via WhatsApp" button pre-fills correct product title, SKU, price, and URL.

### C. Business Intelligence & Reports Audit / فحص التقارير والذكاء المالي
- **Sales Reconciliation:** Validate Gross Sales, Net Sales, Discounts, Shipping, and 15% ZATCA VAT calculations.
- **Multi-Tenant Data Isolation:** Ensure Store A reports never include transactions, orders, or customers belonging to Store B.
- **Date Range Filters:** Verify real-time switching between Today, Yesterday, Last 7 Days, This Month, and Custom Date Pickers.
- **Export Verification:** Ensure CSV, Excel (.xlsx), and PDF exports download correctly with accurate, uncorrupted UTF-8 Arabic text.

---

## 4. Bug Severity & Classification / تصنيف مستويات الأخطاء البرمجية

| Severity | English Definition | التعريف باللغة العربية | Action Required |
|---|---|---|---|
| **CRITICAL** | Tenant data leak, checkout blocker, security flaw, or data loss. | تسريب بيانات متجر لمتجر آخر، توقف الدفع، ثغرة أمنية أو فقدان بيانات. | Immediate block & emergency fix. |
| **HIGH** | Broken coupons, missing SEO meta tags on SSR, or incorrect VAT math. | فشل تطبيق الكوبونات، غياب وسوم SEO في الخادم، أو خطأ بحساب الضريبة. | Fix before phase sign-off. |
| **MEDIUM** | Layout misalignment, RTL minor glitch, or slow query load (>1s). | عيب طفيف في المحاذاة أو اتجاه RTL أو استجابة بطيئة للتقرير. | Standard backlog priority. |
| **LOW** | Minor typo, tooltip spacing, or cosmetic UI nuance. | خطأ إملائي بسيط أو تحسين مسافات تجميلية. | Scheduled maintenance. |

---

## 5. Bug Report Template / نموذج تقرير الأخطاء

| Field / الحقل | Value / القيمة |
|---|---|
| **Bug ID / معرف الخطأ** | `BUG-SEO-001` / `BUG-MKT-001` / `BUG-REP-001` |
| **Module / القسم** | Store SEO / Marketing Hub / Reports & BI |
| **Severity / مستوى الأهمية** | CRITICAL / HIGH / MEDIUM / LOW |
| **Steps to Reproduce / خطوات إعادة المشكلة** | 1. Navigate to Store Dashboard > Marketing Hub<br>2. Create 20% coupon with min order 100 SAR<br>3. Add 80 SAR item to cart and apply code |
| **Expected Behavior / السلوك المتوقع** | Code rejected with "Minimum order of 100 SAR required" |
| **Actual Result / النتيجة الفعلية** | Error banner empty or discount applied incorrectly |
| **Evidence / الأدلة** | Screenshot / Console Log / Network Payload |
| **Status / الحالة** | Fixed / Verified / Closed |

---

## 6. Exit Criteria / شروط الاعتماد والإغلاق

- [ ] **🇬🇧 Multi-tenant Isolation:** Zero cross-tenant data leakage in Reports, SEO, or Marketing tools.  
      **🇸🇦 عزل المتاجر:** عدم وجود أي تسريب بيانات بين المتاجر في التقارير أو الـ SEO أو الحملات.
- [ ] **🇬🇧 Public SEO Rendered:** SSR/ISR output validated with correct meta tags, JSON-LD, and bilingual hreflang.  
      **🇸🇦 التحقق من الـ SEO:** فحص تقديم وسوم الميتا والمخططات الهيكلية ووسوم اللغات من الخادم مباشرة.
- [ ] **🇬🇧 Tax & VAT Precision:** 100% mathematical accuracy on 15% VAT and financial summaries.  
      **🇸🇦 دقة الحسابات الضريبية:** دقة متناهية بنسبة 100% في احتساب ضريبة القيمة المضافة 15% وصافي المبيعات.
- [ ] **🇬🇧 Zero Stale Cache:** All SEO metadata and banner changes invalidate instantly.  
      **🇸🇦 تحديث الكاش الفوري:** تحديث كافة بيانات الميتا والبانرات فورياً دون بقاء أي كاش قديم.
