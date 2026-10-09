-- ====================================================================
-- UNITYTECK HOSTINGER MYSQL SEED (matches DatabaseSeeder)
-- Plans free/paid/pro/custom · store-1 · 19 Categories · 39 Products
-- Idempotent: INSERT ... ON DUPLICATE KEY UPDATE
-- Run AFTER 01_schema.sql
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET time_zone = "+00:00";

-- Plans
INSERT INTO `plans` (`id`,`code`,`name`,`product_limit`,`storage_mb`,`team_seats`,`features`,`is_active`,`created_at`,`updated_at`) VALUES
  ('plan-free','free','Free',50,512,1,'["catalog","orders","basic_seo"]',1,NOW(),NOW()),
  ('plan-paid','paid','Paid',500,5120,5,'["catalog","orders","seo","coupons","shipping","analytics"]',1,NOW(),NOW()),
  ('plan-pro','pro','Pro',5000,51200,20,'["catalog","orders","seo","coupons","shipping","themes","backups","zatca","analytics","ai"]',1,NOW(),NOW()),
  ('plan-custom','custom','Custom',NULL,NULL,NULL,'["all"]',1,NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `product_limit`=VALUES(`product_limit`),
  `storage_mb`=VALUES(`storage_mb`),
  `team_seats`=VALUES(`team_seats`),
  `features`=VALUES(`features`),
  `is_active`=VALUES(`is_active`),
  `updated_at`=VALUES(`updated_at`);

-- Theme catalog
INSERT INTO `themes_catalog` (`id`,`name`,`category`,`preview_color`,`is_default`,`created_at`,`updated_at`) VALUES
  ('theme-flora-luxe','هدايا مكة — ثيم الزهور الفاخرة (Mecca Gifts — Luxury Flowers Theme)','Flowers & Luxury','#102a1c',1,NOW(),NOW()),
  ('theme-makkah-royal','Makkah Royal Rose','Luxury','#064e3b',0,NOW(),NOW()),
  ('theme-blossom-cream','Blossom Cream & Blush','Minimal','#f43f5e',0,NOW(),NOW()),
  ('theme-umrah-spiritual','Spiritual Umrah & Eid','Ramadan','#1e1b4b',0,NOW(),NOW()),
  ('theme-bridal-elegance','Bridal Elegance','Luxury','#c084fc',0,NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `category`=VALUES(`category`),
  `preview_color`=VALUES(`preview_color`),
  `is_default`=VALUES(`is_default`),
  `updated_at`=VALUES(`updated_at`);

-- Master admin (password = UnityMaster@2026!Secure) — Phase 2.3 role = super_admin
INSERT INTO `users` (`id`,`name`,`email`,`password`,`role`,`created_at`,`updated_at`) VALUES
  ('user-master-1','Unityteck Master','master@unityteck.com','$2y$10$wCSbvf2RMp5uLgWu4Fuov.sVPgvgpAyXdSkclJBKrvS/VdyZ0hypO','super_admin',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `password`=VALUES(`password`),
  `role`=VALUES(`role`),
  `updated_at`=VALUES(`updated_at`);

-- Store owner (password = MakkahStore@2026!Secure) — Phase 2.3 role = manager
INSERT INTO `users` (`id`,`name`,`email`,`password`,`role`,`created_at`,`updated_at`) VALUES
  ('user-store-1','Tariq Al-Makki','tariq@wardalmakkah.sa','$2y$10$314.51pLFzmzWX.lZf1PKexYD2PDdF21bSFX4h7eyf/7490E7/k3y','manager',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `password`=VALUES(`password`),
  `role`=VALUES(`role`),
  `updated_at`=VALUES(`updated_at`);

-- Support seat (password = WardSupport@2026!Secure) — cannot products.write
INSERT INTO `users` (`id`,`name`,`email`,`password`,`role`,`created_at`,`updated_at`) VALUES
  ('user-store-support-1','Ward Support','support@wardalmakkah.sa','$2y$10$KGrJ129nEy.PUUDA3Tti4uNc86StNhnHmJQYvPqPqG.9.VsakEbM6','support',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `password`=VALUES(`password`),
  `role`=VALUES(`role`),
  `updated_at`=VALUES(`updated_at`);

-- Store-1 (Makkah Fresh Flowers — 1st client)
INSERT INTO `stores` (
  `id`,`name`,`slug`,`domain`,`status`,`plan`,`master_granted_pro`,`currency`,
  `locale`,`text_direction`,`timezone`,
  `phone`,`email`,`owner_name`,`city`,`country`,`category`,`logo`,`accent_color`,
  `hosting_mode`,`db_isolation`,`products_count`,`orders_count`,`revenue`,`visitors_count`,
  `created_at`,`updated_at`
) VALUES (
  'store-1','Makkah Fresh Flowers','makkah-fresh-flowers','giftshop-sa.com','active','pro',1,'SAR',
  'ar','rtl','Asia/Riyadh',
  '+966500000001','tariq@wardalmakkah.sa','Tariq Al-Makki','Makkah','Saudi Arabia',
  'Real Fresh Flowers & Luxury Gifts','flower','#059669',
  'dedicated','dedicated_mysql',39,3,1610.00,1420,
  NOW(),NOW()
)
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `slug`=VALUES(`slug`),
  `domain`=VALUES(`domain`),
  `locale`=VALUES(`locale`),
  `text_direction`=VALUES(`text_direction`),
  `timezone`=VALUES(`timezone`),
  `status`=VALUES(`status`),
  `plan`=VALUES(`plan`),
  `master_granted_pro`=VALUES(`master_granted_pro`),
  `products_count`=VALUES(`products_count`),
  `orders_count`=VALUES(`orders_count`),
  `revenue`=VALUES(`revenue`),
  `visitors_count`=VALUES(`visitors_count`),
  `updated_at`=VALUES(`updated_at`);

-- Store membership (Phase 2.3 roles)
INSERT INTO `store_users` (`id`,`store_id`,`user_id`,`role`,`created_at`,`updated_at`) VALUES
  ('su-store-1-owner','store-1','user-store-1','manager',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `role`=VALUES(`role`),
  `updated_at`=VALUES(`updated_at`);

INSERT INTO `store_users` (`id`,`store_id`,`user_id`,`role`,`created_at`,`updated_at`) VALUES
  ('su-store-1-support','store-1','user-store-support-1','support',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `role`=VALUES(`role`),
  `updated_at`=VALUES(`updated_at`);

INSERT INTO `subscriptions` (`id`,`store_id`,`plan_id`,`status`,`billing_interval`,`starts_at`,`ends_at`,`grace_ends_at`,`renewed_at`,`created_at`,`updated_at`) VALUES
  ('sub-store-1','store-1','plan-pro','active','yearly',DATE_SUB(NOW(), INTERVAL 6 MONTH),DATE_ADD(NOW(), INTERVAL 1 YEAR),NULL,DATE_SUB(NOW(), INTERVAL 6 MONTH),NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `plan_id`=VALUES(`plan_id`),
  `status`=VALUES(`status`),
  `billing_interval`=VALUES(`billing_interval`),
  `starts_at`=VALUES(`starts_at`),
  `ends_at`=VALUES(`ends_at`),
  `renewed_at`=VALUES(`renewed_at`),
  `updated_at`=VALUES(`updated_at`);

-- Categories (19 Real Makkah Flowers Categories)
INSERT INTO `categories` (`id`,`store_id`,`name`,`name_ar`,`slug`,`image_url`,`sort_order`,`is_active`,`created_at`,`updated_at`) VALUES
  ('cat-nat-bouquets', 'store-1', 'Natural Flower Bouquets', 'باقات الورود الطبيعية', 'natural-bouquets', 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png', 1, 1, NOW(), NOW()),
  ('cat-roses-patchi', 'store-1', 'Roses & Patchi Chocolate', 'ورد و شوكليت باتشي', 'roses-patchi', 'https://cdn.salla.sa/form-builder/vXd8gFVPfRavCrvqEUF68BHdHHn8pqj3mMglFTIt.png', 2, 1, NOW(), NOW()),
  ('cat-roses-bostani', 'store-1', 'Roses & Bostani Chocolate', 'ورد وشوكوليت بستاني', 'roses-bostani', 'https://cdn.salla.sa/form-builder/JEDxluyY7LbYdo5So7sLrPqqupntM3LUhIxV3gXD.png', 3, 1, NOW(), NOW()),
  ('cat-flower-vases', 'store-1', 'Natural Flower Vases', 'فازات ورد طبيعي', 'flower-vases', 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png', 4, 1, NOW(), NOW()),
  ('cat-vases-chocolate', 'store-1', 'Flower Vases with Chocolate', 'فازات الورود مع شوكليت', 'vases-chocolate', 'https://cdn.salla.sa/form-builder/qk6gpVW76xoVeFb6kZrmFFGOFOXQ4q8JalQmKw0R.png', 5, 1, NOW(), NOW()),
  ('cat-roses-fish', 'store-1', 'Roses with Aquarium Fish', 'ورود مع أسماك زينة', 'roses-fish', 'https://cdn.salla.sa/form-builder/ykMusuoNPFuZdMPHsJcYHJb6fejLSpaoSZxKGAwh.png', 6, 1, NOW(), NOW()),
  ('cat-roses-lovebirds', 'store-1', 'Roses with Lovebirds', 'ورود مع عصافير الحب', 'roses-lovebirds', 'https://cdn.salla.sa/form-builder/dZpSzihLrTks3koUrmlpfNV0AcHVSx3bE1KNFQTQ.png', 7, 1, NOW(), NOW()),
  ('cat-roses-coffee', 'store-1', 'Roses & Coffee Presentation', 'تقديمة ورد وقهوة', 'roses-coffee', 'https://cdn.salla.sa/form-builder/2fomvXwpTYOOx8h3JMZGP3r5dnXelUxxIUDuzepj.png', 8, 1, NOW(), NOW()),
  ('cat-roses-coffee-sweets', 'store-1', 'Roses with Coffee & Sweets', 'تقديمة ورد مع قهوة وحلا', 'roses-coffee-sweets', 'https://cdn.salla.sa/form-builder/zf3HeZ6jT4wON2ZEbeJfdMTc4bMLWQLkFvCndepr.png', 9, 1, NOW(), NOW()),
  ('cat-roses-cake', 'store-1', 'Roses with Gourmet Cake', 'ورد مع كيك', 'roses-cake', 'https://cdn.salla.sa/form-builder/JnIWUYX47T9XyXPQlFx76ihWwhqD2N3xXKcYBMbh.png', 10, 1, NOW(), NOW()),
  ('cat-korean-cake', 'store-1', 'Korean Lunchbox Bento Cake', 'تقديمة كيك الكوري', 'korean-cake', 'https://cdn.salla.sa/form-builder/iN2hGSe4EYU7Jl2Jt6U5uk9swZaHsPbJnnqpNpac.png', 11, 1, NOW(), NOW()),
  ('cat-mawajeeb', 'store-1', 'Mawajeeb Wooden Plaques & Heritage', 'لوحات مواجيب وتراث حجازي', 'mawajeeb', 'https://cdn.files.salla.network/products/246985580/539625c7-703f-4c13-aa4c-24d982e20865-original.webp', 12, 1, NOW(), NOW()),
  ('cat-newborn', 'store-1', 'Newborn Welcome Gifts', 'هدايا المواليد', 'newborn', 'https://cdn.salla.sa/form-builder/h7hTylc4cMiriSfxe2sGsX0mL5Sc7akjxHAAUqHp.png', 13, 1, NOW(), NOW()),
  ('cat-graduation', 'store-1', 'Graduation Milestones', 'هدايا التخرج', 'graduation', 'https://cdn.salla.sa/form-builder/unEMJIoOHLnWigTn0DpvQZbQMxNjU4QgVOT2BdUM.png', 14, 1, NOW(), NOW()),
  ('cat-valentine', 'store-1', 'Valentine & Love Blooms', 'هدايا عيد الحب', 'valentine', 'https://cdn.salla.sa/form-builder/Y0Yt8LLfhRt46ljjaZjTaANumrZvYodYnv5CGQ7o.png', 15, 1, NOW(), NOW()),
  ('cat-wedding', 'store-1', 'Wedding & Bridal Keepsakes', 'هدايا الزواج والعرائس', 'wedding', 'https://cdn.salla.sa/form-builder/Z8aMbQ8cDkf9OnQakCZwnH4GvpnqLlXsCqBk70ik.png', 16, 1, NOW(), NOW()),
  ('cat-birthday', 'store-1', 'Birthday Celebrations', 'هدايا عيد ميلاد', 'birthday', 'https://cdn.salla.sa/form-builder/nm5BDgkXRslZvqTetu5wTrCTTTTLTrsBhWwjHMyI.png', 17, 1, NOW(), NOW()),
  ('cat-men-gifts', 'store-1', 'Royal Men Luxury Gifts', 'هدايا رجالية ملكية', 'men-gifts', '/src/assets/images/hadaya_men_luxury_gift_1791219799100.jpg', 18, 1, NOW(), NOW()),
  ('cat-women-gifts', 'store-1', 'Luxury Women Gifts & Perfumes', 'هدايا نسائية فاخرة', 'women-gifts', 'https://cdn.files.salla.network/homepage/246985580/67a93505-20fe-4f5e-ad46-0e0b1d2c4390.webp', 19, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `name_ar`=VALUES(`name_ar`),
  `slug`=VALUES(`slug`),
  `image_url`=VALUES(`image_url`),
  `sort_order`=VALUES(`sort_order`),
  `is_active`=VALUES(`is_active`),
  `updated_at`=VALUES(`updated_at`);


-- Products (39 Real Makkah Flowers & Luxury Gifts Products)
INSERT INTO `products` (
  `id`,`store_id`,`category_id`,`name`,`name_ar`,`slug`,`sku`,`category`,`category_ar`,`price`,`original_price`,`cost_price`,`stock`,`image_url`,`status`,`is_active`,`image_version`,`created_at`,`updated_at`
) VALUES
  ('wm-peony-05', 'store-1', 'cat-nat-bouquets', 'Dutch Peony Soft Blush Box', 'صندوق بيوني هولندي وردي ناعم', 'wm-peony-05', 'WM-PEONY-05', 'Natural Flower Bouquets', 'باقات الورود الطبيعية', 380.00, 450.00, 210.00, 18, '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg', 'published', 1, '1', NOW(), NOW()),
  ('wm-val-06', 'store-1', 'cat-valentine', 'Valentine Rose Heart Arrangement', 'تنسيق قلب الورد الرومانسي (فالنتين)', 'wm-val-06', 'WM-VAL-06', 'Valentine & Love Blooms', 'هدايا عيد الحب', 420.00, 520.00, 230.00, 25, '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg', 'published', 1, '1', NOW(), NOW()),
  ('wm-rose-01', 'store-1', 'cat-nat-bouquets', 'Royal Dutch Red Roses Velvet Box', 'صندوق مخملي رويال جوري هولندي أحمر', 'wm-rose-01', 'WM-ROSE-01', 'Natural Flower Bouquets', 'باقات الورود الطبيعية', 340.00, 420.00, 180.00, 45, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80', 'published', 1, '1', NOW(), NOW()),
  ('wm-lily-02', 'store-1', 'cat-flower-vases', 'Casablanca White Lilies & Orchids', 'فازة كازابلانكا زنابق وأوركيد بيضاء', 'wm-lily-02', 'WM-LILY-02', 'Natural Flower Vases', 'فازات ورد طبيعي', 290.00, 380.00, 150.00, 32, '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg', 'published', 1, '1', NOW(), NOW()),
  ('wm-vip-03', 'store-1', 'cat-men-gifts', 'Makkah Haram VIP Gift Hamper', 'سلة هدايا الحرم المكي الملكية VIP', 'wm-vip-03', 'WM-VIP-03', 'Royal Men Luxury Gifts', 'هدايا رجالية ملكية', 580.00, 750.00, 320.00, 14, '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg', 'published', 1, '1', NOW(), NOW()),
  ('wm-bride-04', 'store-1', 'cat-wedding', 'Luxury Wedding Bridal Floral Bouquet', 'مسكة عروس ملكية فاخرة لذكرى الزواج', 'wm-bride-04', 'WM-BRIDE-04', 'Wedding & Bridal Keepsakes', 'هدايا الزواج والعرائس', 490.00, 620.00, 260.00, 9, 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop&q=80', 'published', 1, '1', NOW(), NOW()),
  ('disc-1', 'store-1', 'cat-nat-bouquets', 'Velvet Rose Elegance Bouquet', 'باقة الورد المخملي الأنيقة', 'disc-1', 'HM-ROSE-01', 'Natural Flower Bouquets', 'باقات الورود الطبيعية', 199.00, 280.00, 110.00, 50, '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg', 'published', 1, '1', NOW(), NOW()),
  ('disc-2', 'store-1', 'cat-nat-bouquets', 'Pure White Charm Bouquet', 'سحر الأبيض النقي', 'disc-2', 'HM-ROSE-02', 'Natural Flower Bouquets', 'باقات الورود الطبيعية', 220.00, 290.00, 120.00, 35, '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg', 'published', 1, '1', NOW(), NOW()),
  ('disc-3', 'store-1', 'cat-nat-bouquets', 'Tulips & Roses Harmony', 'تناغم التوليب والورد', 'disc-3', 'HM-ROSE-03', 'Natural Flower Bouquets', 'باقات الورود الطبيعية', 245.00, 320.00, 135.00, 28, '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg', 'published', 1, '1', NOW(), NOW()),
  ('disc-4', 'store-1', 'cat-nat-bouquets', 'Morning Joy Bright Bouquet', 'باقة الفرح الصباحية', 'disc-4', 'HM-ROSE-04', 'Natural Flower Bouquets', 'باقات الورود الطبيعية', 185.00, 250.00, 95.00, 40, 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png', 'published', 1, '1', NOW(), NOW()),
  ('disc-5', 'store-1', 'cat-roses-patchi', 'Discounted Patchi & Red Roses Special', 'باقة جوري وشوكولاتة باتشي المخفضة', 'disc-5', 'HM-ROSE-05', 'Roses & Patchi Chocolate', 'ورد و شوكليت باتشي', 210.00, 295.00, 120.00, 45, '/src/assets/images/hadaya_luxury_gift_noir_1791218956267.jpg', 'published', 1, '1', NOW(), NOW()),
  ('nat-1', 'store-1', 'cat-nat-bouquets', 'The Royal Grandeur (50 Stems)', 'باقة الملكية الفاخرة (50 وردة جوري)', 'nat-1', 'HM-NAT-01', 'Natural Flower Bouquets', 'باقات الورود الطبيعية', 499.00, 580.00, 280.00, 25, '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg', 'published', 1, '1', NOW(), NOW()),
  ('nat-2', 'store-1', 'cat-nat-bouquets', 'Peonies & Spray Roses Garden', 'بستان الفاوانيا والبيبي روز', 'nat-2', 'HM-NAT-02', 'Natural Flower Bouquets', 'باقات الورود الطبيعية', 380.00, 440.00, 210.00, 22, '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg', 'published', 1, '1', NOW(), NOW()),
  ('nat-3', 'store-1', 'cat-men-gifts', 'Ivory Purity Arrangement', 'باقة النقاء العاجي', 'nat-3', 'HM-NAT-03', 'Royal Men Luxury Gifts', 'هدايا رجالية ملكية', 340.00, 395.00, 190.00, 30, '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg', 'published', 1, '1', NOW(), NOW()),
  ('nat-4', 'store-1', 'cat-nat-bouquets', 'Hijazi Soul Lavender Edit', 'باقة لافندر الروح الحجازية', 'nat-4', 'HM-NAT-04', 'Natural Flower Bouquets', 'باقات الورود الطبيعية', 310.00, 360.00, 170.00, 26, 'https://cdn.salla.sa/form-builder/Y0Yt8LLfhRt46ljjaZjTaANumrZvYodYnv5CGQ7o.png', 'published', 1, '1', NOW(), NOW()),
  ('choc-1', 'store-1', 'cat-roses-patchi', 'Patchi Royal Chocolates & Roses Box', 'صندوق ورد وشوكولاتة باتشي الملكية', 'choc-1', 'HM-CHOC-01', 'Roses & Patchi Chocolate', 'ورد و شوكليت باتشي', 450.00, 520.00, 260.00, 20, '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg', 'published', 1, '1', NOW(), NOW()),
  ('choc-2', 'store-1', 'cat-roses-bostani', 'Bostani Signature Chocolates & Blooms', 'بوكس ورد وشوكوليت بستاني الفاخر', 'choc-2', 'HM-CHOC-02', 'Roses & Bostani Chocolate', 'ورد وشوكوليت بستاني', 399.00, 460.00, 220.00, 18, 'https://cdn.salla.sa/form-builder/JEDxluyY7LbYdo5So7sLrPqqupntM3LUhIxV3gXD.png', 'published', 1, '1', NOW(), NOW()),
  ('choc-3', 'store-1', 'cat-roses-patchi', 'Prestige Gift Tray with Patchi', 'صينية إهداء التميز مع شوكولاتة باتشي', 'choc-3', 'HM-CHOC-03', 'Roses & Patchi Chocolate', 'ورد و شوكليت باتشي', 520.00, 600.00, 280.00, 15, 'https://cdn.salla.sa/form-builder/qk6gpVW76xoVeFb6kZrmFFGOFOXQ4q8JalQmKw0R.png', 'published', 1, '1', NOW(), NOW()),
  ('choc-4', 'store-1', 'cat-roses-bostani', 'Blush Heart Box with Belgian Truffles', 'بوكس القلب الوردي مع ترافل بلجيكي', 'choc-4', 'HM-CHOC-04', 'Roses & Bostani Chocolate', 'ورد وشوكوليت بستاني', 360.00, 420.00, 180.00, 22, '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg', 'published', 1, '1', NOW(), NOW()),
  ('cake-1', 'store-1', 'cat-korean-cake', 'Korean Bento Lunchbox Cake & Roses', 'تقديمة الكيك الكوري مع باقة الجوري', 'cake-1', 'HM-CAKE-01', 'Korean Lunchbox Bento Cake', 'تقديمة كيك الكوري', 280.00, 340.00, 150.00, 35, 'https://cdn.salla.sa/form-builder/iN2hGSe4EYU7Jl2Jt6U5uk9swZaHsPbJnnqpNpac.png', 'published', 1, '1', NOW(), NOW()),
  ('cake-2', 'store-1', 'cat-roses-cake', 'Royal Red Velvet Cake & Red Roses', 'كعكة الريد فيلفيت الملكية مع الورد الأحمر', 'cake-2', 'HM-CAKE-02', 'Roses with Gourmet Cake', 'ورد مع كيك', 390.00, 460.00, 210.00, 20, 'https://cdn.salla.sa/form-builder/JnIWUYX47T9XyXPQlFx76ihWwhqD2N3xXKcYBMbh.png', 'published', 1, '1', NOW(), NOW()),
  ('cake-3', 'store-1', 'cat-roses-cake', 'Pastel Blooms & Cupcakes Box', 'بوكس الكب كيك الفاخر مع ورود الباستيل', 'cake-3', 'HM-CAKE-03', 'Roses with Gourmet Cake', 'ورد مع كيك', 310.00, 370.00, 160.00, 25, '/src/assets/images/hadaya_luxury_velvet_cake_1791218716453.jpg', 'published', 1, '1', NOW(), NOW()),
  ('cake-4', 'store-1', 'cat-roses-cake', 'Ultimate Celebration Cake & Blooms Combo', 'صندوق احتفال التخرج والميلاد المتكامل', 'cake-4', 'HM-CAKE-04', 'Roses with Gourmet Cake', 'ورد مع كيك', 450.00, 530.00, 230.00, 18, 'https://cdn.files.salla.network/other/246985580/526058e5-3543-4d24-b93f-1ced5ca0d974-original.webp', 'published', 1, '1', NOW(), NOW()),
  ('cof-1', 'store-1', 'cat-roses-coffee', 'Arabic Coffee, Stuffed Dates & Roses', 'تقديمة الورد مع القهوة العربية والتمور المحشوة', 'cof-1', 'HM-COF-01', 'Roses & Coffee Presentation', 'تقديمة ورد وقهوة', 360.00, 420.00, 190.00, 18, 'https://cdn.salla.sa/form-builder/2fomvXwpTYOOx8h3JMZGP3r5dnXelUxxIUDuzepj.png', 'published', 1, '1', NOW(), NOW()),
  ('cof-2', 'store-1', 'cat-roses-coffee-sweets', 'Royal Hospitality: Coffee, Sweets & Vase', 'صينية الضيافة الملكية: قهوة وحلا وفازة ورد', 'cof-2', 'HM-COF-02', 'Roses with Coffee & Sweets', 'تقديمة ورد مع قهوة وحلا', 480.00, 560.00, 260.00, 15, '/src/assets/images/hadaya_luxury_gift_noir_1791218956267.jpg', 'published', 1, '1', NOW(), NOW()),
  ('cof-3', 'store-1', 'cat-roses-coffee-sweets', 'Sweet Moments: Latte, Donuts & Blooms', 'صندوق السعادة: قهوة لاتيه، دوناتس وزهور', 'cof-3', 'HM-COF-03', 'Roses with Coffee & Sweets', 'تقديمة ورد مع قهوة وحلا', 270.00, 320.00, 130.00, 24, 'https://cdn.files.salla.network/other/246985580/1b671cbc-3ffd-423d-97b8-f51660a118a4-original.webp', 'published', 1, '1', NOW(), NOW()),
  ('cof-4', 'store-1', 'cat-roses-coffee-sweets', 'Royal Hospitality: Coffee, Sweets & Vase', 'صينية الضيافة الملكية: قهوة وحلا وفازة ورد', 'cof-4', 'HM-COF-04', 'Roses with Coffee & Sweets', 'تقديمة ورد مع قهوة وحلا', 480.00, 560.00, 250.00, 12, '/src/assets/images/hadaya_luxury_gift_noir_1791218956267.jpg', 'published', 1, '1', NOW(), NOW()),
  ('vase-1', 'store-1', 'cat-flower-vases', 'Crystal Orchid & Royal Rose Vase', 'فازة كريستال أوركيد وجوري ملكي', 'vase-1', 'HM-VASE-01', 'Natural Flower Vases', 'فازات ورد طبيعي', 490.00, 580.00, 270.00, 16, 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png', 'published', 1, '1', NOW(), NOW()),
  ('vase-2', 'store-1', 'cat-flower-vases', 'Fluted Ceramic Designer Vase', 'فازة السيراميك المضلعة العصرية', 'vase-2', 'HM-VASE-02', 'Natural Flower Vases', 'فازات ورد طبيعي', 360.00, 420.00, 195.00, 20, '/src/assets/images/hadaya_white_orchid_penthouse_1791218732789.jpg', 'published', 1, '1', NOW(), NOW()),
  ('vase-3', 'store-1', 'cat-flower-vases', 'Blue Hydrangea & White Roses Vase', 'فازة الهايدرنجا الزرقاء والجوري الملكي', 'vase-3', 'HM-VASE-03', 'Natural Flower Vases', 'فازات ورد طبيعي', 420.00, 490.00, 220.00, 15, '/src/assets/images/hadaya_white_orchid_penthouse_1791218732789.jpg', 'published', 1, '1', NOW(), NOW()),
  ('vase-4', 'store-1', 'cat-flower-vases', 'Multicolor Spray Rose Desk Vase', 'فازة بيبي روز متعددة الألوان للمكاتب', 'vase-4', 'HM-VASE-04', 'Natural Flower Vases', 'فازات ورد طبيعي', 290.00, 340.00, 140.00, 28, '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg', 'published', 1, '1', NOW(), NOW()),
  ('maw-1', 'store-1', 'cat-mawajeeb', 'Mawajeeb Wooden Heritage Plaque & Red Roses', 'لوحة مواجيب خشبية مذهبة مع جوري أحمر', 'maw-1', 'HM-MAW-01', 'Mawajeeb Wooden Plaques & Heritage', 'لوحات مواجيب وتراث حجازي', 390.00, 450.00, 200.00, 25, 'https://cdn.files.salla.network/products/246985580/539625c7-703f-4c13-aa4c-24d982e20865-original.webp', 'published', 1, '1', NOW(), NOW()),
  ('maw-2', 'store-1', 'cat-mawajeeb', 'Silver Mawajeeb Box with Maroki Oud & Blooms', 'صندوق مواجيب الفضي الفاخر مع بخور مروكي وورد', 'maw-2', 'HM-MAW-02', 'Mawajeeb Wooden Plaques & Heritage', 'لوحات مواجيب وتراث حجازي', 460.00, 530.00, 240.00, 16, '/src/assets/images/hadaya_luxury_gift_noir_1791218956267.jpg', 'published', 1, '1', NOW(), NOW()),
  ('new-1', 'store-1', 'cat-newborn', 'Welcome Baby Boy Floral Ceramic & Teddy', 'باقة أهلاً بالمولود (ورد وسيراميك ودبدوب ناعم)', 'new-1', 'HM-NEW-01', 'Newborn Welcome Gifts', 'هدايا المواليد', 280.00, 340.00, 140.00, 30, 'https://cdn.salla.sa/form-builder/h7hTylc4cMiriSfxe2sGsX0mL5Sc7akjxHAAUqHp.png', 'published', 1, '1', NOW(), NOW()),
  ('new-2', 'store-1', 'cat-newborn', 'Royal Baby Girl Reception Floral Stand', 'ستاند ورد استقبال المولودة الأميرة (بيبي روز وردي)', 'new-2', 'HM-NEW-02', 'Newborn Welcome Gifts', 'هدايا المواليد', 340.00, 410.00, 170.00, 20, '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg', 'published', 1, '1', NOW(), NOW()),
  ('grad-1', 'store-1', 'cat-graduation', 'Royal Graduation Bouquet with Gold Cap', 'باقة التخرج الملكية مع وشاح وقبعة مذهبة', 'grad-1', 'HM-GRAD-01', 'Graduation Milestones', 'هدايا التخرج', 320.00, 390.00, 160.00, 28, 'https://cdn.salla.sa/form-builder/unEMJIoOHLnWigTn0DpvQZbQMxNjU4QgVOT2BdUM.png', 'published', 1, '1', NOW(), NOW()),
  ('grad-2', 'store-1', 'cat-graduation', 'Congratulations Graduate Chocolate & Blooms Box', 'صندوق مبارك التخرج مع شوكولاتة وورد طبيعي', 'grad-2', 'HM-GRAD-02', 'Graduation Milestones', 'هدايا التخرج', 375.00, 440.00, 190.00, 24, '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg', 'published', 1, '1', NOW(), NOW()),
  ('men-gift-1', 'store-1', 'cat-men-gifts', 'Royal Men Luxury Gift Box: Perfume, Watch, Wallet & Blooms', 'طقم هدايا رجالية ملكي: عطر، محفظة وساعة فاخرة وباقة ورد', 'men-gift-1', 'HM-MEN-01', 'Royal Men Luxury Gifts', 'هدايا رجالية ملكية', 540.00, 620.00, 310.00, 15, '/src/assets/images/hadaya_men_luxury_gift_1791219799100.jpg', 'published', 1, '1', NOW(), NOW()),
  ('women-gift-1', 'store-1', 'cat-women-gifts', 'Royal Women Luxury Gift Box: Perfume, Jewelry Set & Peonies', 'صندوق هدايا نسائية فاخر: عطر، طقم مجوهرات وباقة بيوني وردي', 'women-gift-1', 'HM-WOMEN-01', 'Luxury Women Gifts & Perfumes', 'هدايا نسائية فاخرة', 580.00, 690.00, 330.00, 14, '/src/assets/images/hadaya_women_luxury_gift_1791219815272.jpg', 'published', 1, '1', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `category_id`=VALUES(`category_id`),
  `name`=VALUES(`name`),
  `name_ar`=VALUES(`name_ar`),
  `slug`=VALUES(`slug`),
  `sku`=VALUES(`sku`),
  `category`=VALUES(`category`),
  `category_ar`=VALUES(`category_ar`),
  `price`=VALUES(`price`),
  `original_price`=VALUES(`original_price`),
  `cost_price`=VALUES(`cost_price`),
  `stock`=VALUES(`stock`),
  `image_url`=VALUES(`image_url`),
  `status`=VALUES(`status`),
  `is_active`=VALUES(`is_active`),
  `updated_at`=VALUES(`updated_at`);


-- Customers
INSERT INTO `customers` (
  `id`,`store_id`,`name`,`phone`,`email`,`status`,`city`,`country`,`gender`,`group`,
  `acquisition_source`,`total_orders`,`total_spend`,`avg_order_value`,`last_order_date`,`created_at`,`updated_at`
) VALUES
  ('cust-1','store-1','Abdulrahman Al-Thaqafi (عبدالرحمن الثقفي)','+966 50 442 8819','a.thaqafi@makkah.sa','VIP','Makkah (فنادق الحرم)','Saudi Arabia','Male','VIP','WhatsApp',3,1850.00,616.00,NOW(),NOW(),NOW()),
  ('cust-2','store-1','Sarah Al-Otaibi (سارة العتيبي)','+966 55 981 2234','sarah.otaibi@gmail.com','Active','Makkah (العوالي)','Saudi Arabia','Female','Regular','Instagram',2,760.00,380.00,NOW(),NOW(),NOW()),
  ('cust-3','store-1','Eng. Mohammed Al-Harbi (م. محمد الحربي)','+966 54 112 7765','m.harbi@aramco.com','New','Makkah (جبل عمر)','Saudi Arabia','Male','VIP','Google Ads',1,580.00,580.00,NOW(),NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `phone`=VALUES(`phone`),
  `status`=VALUES(`status`),
  `total_orders`=VALUES(`total_orders`),
  `total_spend`=VALUES(`total_spend`),
  `avg_order_value`=VALUES(`avg_order_value`),
  `last_order_date`=VALUES(`last_order_date`),
  `updated_at`=VALUES(`updated_at`);

-- Orders
INSERT INTO `orders` (
  `id`,`store_id`,`order_number`,`customer_id`,`customer_name`,`customer_phone`,`customer_email`,
  `items_count`,`items_summary`,`total_amount`,`currency`,`source`,`source_details`,
  `delivery_location`,`status`,`payment_method`,`order_date`,`created_at`,`updated_at`
) VALUES
  ('ord-101','store-1','WM-MK-9421','cust-1','Abdulrahman Al-Thaqafi (عبدالرحمن الثقفي)','+966 50 442 8819','a.thaqafi@makkah.sa',
   1,'Makkah Haram VIP Gift Hamper (هدية الحرم الفاخرة مع ماء زمزم)',650.00,'SAR','WhatsApp','WhatsApp Business (+966 Saudi) · Direct VIP Concierge Chat #WA-8819',
   'فندق فيرمونت برج الساعة - الحرم، مكة','completed','Apple Pay',DATE_SUB(NOW(), INTERVAL 12 MINUTE),NOW(),NOW()),
  ('ord-102','store-1','WM-MK-9422','cust-2','Sarah Al-Otaibi (سارة العتيبي)','+966 55 981 2234','sarah.otaibi@gmail.com',
   1,'Royal Dutch Red Roses Velvet Box (بوكس الجوري الأحمر الملكي)',380.00,'SAR','Instagram','Instagram Story Ad (Saudi Arabia / Makkah Region)',
   'حي العوالي، بالقرب من جامعة أم القرى، مكة','processing','Mada',DATE_SUB(NOW(), INTERVAL 45 MINUTE),NOW(),NOW()),
  ('ord-103','store-1','WM-MK-9423','cust-3','Eng. Mohammed Al-Harbi (م. محمد الحربي)','+966 54 112 7765','m.harbi@aramco.com',
   1,'Luxury Wedding Bridal Bouquet (مسكة عروس راقية من الجوري الطبيعي)',580.00,'SAR','Google Ads','Google Search Ads KSA · Target: Makkah',
   'فندق هيلتون جبل عمر، مكة المكرمة','pending','Mada',DATE_SUB(NOW(), INTERVAL 120 MINUTE),NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `status`=VALUES(`status`),
  `total_amount`=VALUES(`total_amount`),
  `source`=VALUES(`source`),
  `order_date`=VALUES(`order_date`),
  `updated_at`=VALUES(`updated_at`);

-- Order items (no natural unique key — replace for seed orders)
DELETE FROM `order_items` WHERE `order_id` IN ('ord-101','ord-102','ord-103');
INSERT INTO `order_items` (`order_id`,`store_id`,`product_id`,`product_name`,`quantity`,`unit_price`,`subtotal`,`created_at`,`updated_at`) VALUES
  ('ord-101','store-1','wm-vip-03','Makkah Haram VIP Gift Hamper (هدية الحرم الفاخرة مع ماء زمزم)',1,650.00,650.00,NOW(),NOW()),
  ('ord-102','store-1','wm-rose-01','Royal Dutch Red Roses Velvet Box (بوكس الجوري الأحمر الملكي)',1,380.00,380.00,NOW(),NOW()),
  ('ord-103','store-1','wm-bride-04','Luxury Wedding Bridal Bouquet (مسكة عروس راقية من الجوري الطبيعي)',1,580.00,580.00,NOW(),NOW());

-- Coupons
INSERT INTO `coupons` (
  `id`,`store_id`,`code`,`discount_type`,`discount_value`,`min_order_amount`,`usage_count`,`max_uses`,`status`,`is_active`,`expires_at`,`created_at`,`updated_at`
) VALUES
  ('coup-1','store-1','MAKKAH10','percentage',10.00,200.00,148,500,'active',1,'2026-12-31 23:59:59',NOW(),NOW()),
  ('coup-2','store-1','HARAM_VIP','fixed',50.00,400.00,84,250,'active',1,'2026-12-31 23:59:59',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `discount_type`=VALUES(`discount_type`),
  `discount_value`=VALUES(`discount_value`),
  `usage_count`=VALUES(`usage_count`),
  `is_active`=VALUES(`is_active`),
  `updated_at`=VALUES(`updated_at`);

-- Shipping zones
INSERT INTO `shipping_zones` (
  `id`,`store_id`,`name`,`region`,`rate`,`free_above`,`estimated_delivery`,`status`,`is_active`,`min_delivery_days`,`max_delivery_days`,`created_at`,`updated_at`
) VALUES
  ('ship-1','store-1','Makkah - Al Haram & Clock Tower Hotels','Makkah Region',0.00,0.00,'1-2 Hours Express','active',1,0,1,NOW(),NOW()),
  ('ship-2','store-1','Makkah - Al-Aziziyah & Mahbas Al-Jinn','Makkah Region',20.00,250.00,'2 Hours Same Day','active',1,0,1,NOW(),NOW()),
  ('ship-3','store-1','Makkah - Al-Shawqiyyah & Al-Kaakiyyah','Makkah Region',25.00,300.00,'2-3 Hours Same Day','active',1,0,1,NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `rate`=VALUES(`rate`),
  `free_above`=VALUES(`free_above`),
  `estimated_delivery`=VALUES(`estimated_delivery`),
  `is_active`=VALUES(`is_active`),
  `updated_at`=VALUES(`updated_at`);

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- SEED COMPLETE — master@unityteck.com / UnityMaster@2026!Secure · tariq@wardalmakkah.sa / MakkahStore@2026!Secure · store-1
-- ====================================================================
