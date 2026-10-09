# Flowers 1st-client premium dummy theme

**Store:** Makkah Fresh Flowers (`store-1`)  
**Theme:** `theme-makkah-royal` · pack `flowers_premium_v1`

## Multi homepage (client-selectable)
- **Eid Home**
- **Ramadan Home**
- **Valentine Home**

## Catalog
- **6** real-flower products (bouquets, vases, Haram gifts, bridal, seasonal peony, Valentine heart)
- Product **variations** (stems / vase / size / color) on selected SKUs

## Premium pages & features (storefront preview)
Advanced slider · circle categories · Theme-15 product cards · FAQ · customer reviews · add to cart · WhatsApp order · chat FAB · single product (quick view) · shop/archive · cart · checkout (**login gate**) · thank-you · customer profile CRM · COD + online (Mada / Apple Pay / Tabby) · offer popup · banners · about · contact · privacy · return · store location · coupon (`MAKKAH15`) · dark/light + multi-currency via Prefs

## Theme Settings (Phase 5.1)
- **01 Store Identity** form in Store → Themes (`StoreIdentityForm`) — name, logo, taglines EN/AR, phone, WhatsApp, email, address, CR, VAT — per `store_id`, versioned logo URL

## Code
- Pack: `src/themes/flowersPremium/`
- Preview: `src/components/storefront/StoreFrontPreview.tsx`
- SPA Themes tab: homepage styles on Makkah Royal + Theme Settings 01

## Unityteck App Store / Theme Store

| Surface | Path |
|---------|------|
| Master | Sidebar **App Store** (`marketplace`) — Theme Store + Apps tabs |
| Store | Sidebar **App Store** (`appstore`) — install themes/apps on own store |

Shared grid: `src/components/common/ThemeStoreGrid.tsx`  
Plan gate: Free = Commerce Starter; Pro = full theme catalog.
