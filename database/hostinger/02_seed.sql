-- ====================================================================
-- UNITYTECK HOSTINGER MYSQL SEED (matches DatabaseSeeder)
-- Multi-Store Enterprise Seed:
--   - store-1: Makkah Fresh Flowers (Hadaya Makkah)
--   - store-coffee: HiBrew KSA Official Coffee Store
--   - store-bleco: Al-Saeedi Car Services (Bleco Tanjeed)
-- Plans free/paid/pro/custom · 30 Categories · 66 Products
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
  ('theme-bridal-elegance','Bridal Elegance','Luxury','#c084fc',0,NOW(),NOW()),
  ('theme-coffee-artisan','HiBrew Specialty Coffee & Roasters','Artisan & Coffee','#7c2d12',0,NOW(),NOW()),
  ('theme-automotive-luxury','Al-Saeedi Modern Luxury Automotive','Automotive & Tech','#0b1120',0,NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `category`=VALUES(`category`),
  `preview_color`=VALUES(`preview_color`),
  `is_default`=VALUES(`is_default`),
  `updated_at`=VALUES(`updated_at`);

-- ====================================================================
-- USERS (Super Admin, Store Managers & Support)
-- Password for all: UnityMaster@2026!Secure (or store-specific defaults)
-- ====================================================================
INSERT INTO `users` (`id`,`name`,`email`,`password`,`role`,`created_at`,`updated_at`) VALUES
  ('user-master-1','Unityteck Master','master@unityteck.com','$2y$10$wCSbvf2RMp5uLgWu4Fuov.sVPgvgpAyXdSkclJBKrvS/VdyZ0hypO','super_admin',NOW(),NOW()),
  ('user-store-1','Tariq Al-Makki','tariq@wardalmakkah.sa','$2y$10$314.51pLFzmzWX.lZf1PKexYD2PDdF21bSFX4h7eyf/7490E7/k3y','manager',NOW(),NOW()),
  ('user-store-support-1','Ward Support','support@wardalmakkah.sa','$2y$10$KGrJ129nEy.PUUDA3Tti4uNc86StNhnHmJQYvPqPqG.9.VsakEbM6','support',NOW(),NOW()),
  ('user-store-coffee-1','Rayan Al-Sulaiman','rayan@specialtycoffee.sa','$2y$10$wCSbvf2RMp5uLgWu4Fuov.sVPgvgpAyXdSkclJBKrvS/VdyZ0hypO','manager',NOW(),NOW()),
  ('user-store-coffee-support','HiBrew Support','support@specialtycoffee.sa','$2y$10$wCSbvf2RMp5uLgWu4Fuov.sVPgvgpAyXdSkclJBKrvS/VdyZ0hypO','support',NOW(),NOW()),
  ('user-store-bleco-1','Al-Saeedi Manager','owner@tanjeedmakkah.com','$2y$10$wCSbvf2RMp5uLgWu4Fuov.sVPgvgpAyXdSkclJBKrvS/VdyZ0hypO','manager',NOW(),NOW()),
  ('user-store-bleco-support','Al-Saeedi Support','support@tanjeedmakkah.com','$2y$10$wCSbvf2RMp5uLgWu4Fuov.sVPgvgpAyXdSkclJBKrvS/VdyZ0hypO','support',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `password`=VALUES(`password`),
  `role`=VALUES(`role`),
  `updated_at`=VALUES(`updated_at`);

-- ====================================================================
-- STORES (3 Connected Tenancies)
-- ====================================================================
INSERT INTO `stores` (
  `id`,`name`,`slug`,`domain`,`status`,`plan`,`master_granted_pro`,`currency`,
  `locale`,`text_direction`,`timezone`,
  `phone`,`email`,`owner_name`,`city`,`country`,`category`,`logo`,`accent_color`,
  `hosting_mode`,`db_isolation`,`products_count`,`orders_count`,`revenue`,`visitors_count`,
  `created_at`,`updated_at`
) VALUES
  ('store-1','Makkah Fresh Flowers','makkah-fresh-flowers','giftshop-sa.com','active','pro',1,'SAR',
   'ar','rtl','Asia/Riyadh',
   '+966500000001','tariq@wardalmakkah.sa','Tariq Al-Makki','Makkah','Saudi Arabia',
   'Real Fresh Flowers & Luxury Gifts','flower','#059669',
   'dedicated','dedicated_mysql',39,3,1610.00,0,
   NOW(),NOW()),
  ('store-coffee','HiBrew KSA Coffee Store','coffee-store','specialtycoffee.sa','active','pro',1,'SAR',
   'ar','rtl','Asia/Riyadh',
   '+966549876543','rayan@specialtycoffee.sa','Rayan Al-Sulaiman','Riyadh','Saudi Arabia',
   'Coffee Machines, Precision Mills, Barista Tools & Luxury Stations','/images/coffee_hero_flagship_machine_1791218907782.jpg','#7c2d12',
   'shared','shared_store_id',15,8,5420.00,2680,
   NOW(),NOW()),
  ('store-bleco','Al-Saeedi Car Services','alsaeedi-cars','tanjeedmakkah.com','active','pro',1,'SAR',
   'ar','rtl','Asia/Riyadh',
   '+966597757086','support@tanjeedmakkah.com','Al-Saeedi Car Services','Makkah','Saudi Arabia',
   'Car Seat Covers, Precision Floor Mats & Accessories','https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/wYYVD/OZbzrkkW0icMZlcDNOiZnU4PSjwq6WxXgCkwT0PQ.png','#127bfe',
   'dedicated','dedicated_mysql',12,14,28450.00,80000,
   NOW(),NOW())
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

-- Store memberships
INSERT INTO `store_users` (`id`,`store_id`,`user_id`,`role`,`created_at`,`updated_at`) VALUES
  ('su-store-1-owner','store-1','user-store-1','manager',NOW(),NOW()),
  ('su-store-1-support','store-1','user-store-support-1','support',NOW(),NOW()),
  ('su-coffee-owner','store-coffee','user-store-coffee-1','manager',NOW(),NOW()),
  ('su-coffee-support','store-coffee','user-store-coffee-support','support',NOW(),NOW()),
  ('su-bleco-owner','store-bleco','user-store-bleco-1','manager',NOW(),NOW()),
  ('su-bleco-support','store-bleco','user-store-bleco-support','support',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `role`=VALUES(`role`),
  `updated_at`=VALUES(`updated_at`);

-- Subscriptions
INSERT INTO `subscriptions` (`id`,`store_id`,`plan_id`,`status`,`billing_interval`,`starts_at`,`ends_at`,`grace_ends_at`,`renewed_at`,`created_at`,`updated_at`) VALUES
  ('sub-store-1','store-1','plan-pro','active','yearly',DATE_SUB(NOW(), INTERVAL 6 MONTH),DATE_ADD(NOW(), INTERVAL 1 YEAR),NULL,DATE_SUB(NOW(), INTERVAL 6 MONTH),NOW(),NOW()),
  ('sub-store-coffee','store-coffee','plan-pro','active','yearly',DATE_SUB(NOW(), INTERVAL 4 MONTH),DATE_ADD(NOW(), INTERVAL 1 YEAR),NULL,DATE_SUB(NOW(), INTERVAL 4 MONTH),NOW(),NOW()),
  ('sub-store-bleco','store-bleco','plan-pro','active','yearly',DATE_SUB(NOW(), INTERVAL 3 MONTH),DATE_ADD(NOW(), INTERVAL 1 YEAR),NULL,DATE_SUB(NOW(), INTERVAL 3 MONTH),NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `plan_id`=VALUES(`plan_id`),
  `status`=VALUES(`status`),
  `billing_interval`=VALUES(`billing_interval`),
  `starts_at`=VALUES(`starts_at`),
  `ends_at`=VALUES(`ends_at`),
  `renewed_at`=VALUES(`renewed_at`),
  `updated_at`=VALUES(`updated_at`);

-- ====================================================================
-- CATEGORIES (19 Hadaya Makkah, 5 HiBrew Coffee, 6 Bleco Car)
-- ====================================================================
INSERT INTO `categories` (`id`,`store_id`,`name`,`name_ar`,`slug`,`image_url`,`sort_order`,`is_active`,`created_at`,`updated_at`) VALUES
  -- Store-1 Categories
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
  ('cat-men-gifts', 'store-1', 'Royal Men Luxury Gifts', 'هدايا رجالية ملكية', 'men-gifts', '/images/hadaya_men_luxury_gift_1791219799100.jpg', 18, 1, NOW(), NOW()),
  ('cat-women-gifts', 'store-1', 'Luxury Women Gifts & Perfumes', 'هدايا نسائية فاخرة', 'women-gifts', 'https://cdn.files.salla.network/homepage/246985580/67a93505-20fe-4f5e-ad46-0e0b1d2c4390.webp', 19, 1, NOW(), NOW()),

  -- Store-Coffee Categories
  ('cat-hb-machines', 'store-coffee', 'Coffee Machines & Espresso', 'مكائن القهوة والإسبريسو', 'machines', '/images/hibrew_h7a_flagship_machine.png', 1, 1, NOW(), NOW()),
  ('cat-hb-mills', 'store-coffee', 'Precision Coffee Mills', 'مطاحن القهوة الاحترافية', 'mills', '/images/coffee_grinder_mill_banner_1791218928342.jpg', 2, 1, NOW(), NOW()),
  ('cat-hb-cabinets', 'store-coffee', 'Luxury Coffee Cabinets & Stations', 'دواليب وأركان القهوة الفاخرة', 'cabinets', '/images/hero_coffee_corner_cabinet_1791217199146.jpg', 3, 1, NOW(), NOW()),
  ('cat-hb-accessories', 'store-coffee', 'Barista Accessories & Ceramic Cups', 'مستلزمات الباريستا والأكواب', 'accessories', '/images/coffee_accessories_tools_banner_1791218944111.jpg', 4, 1, NOW(), NOW()),
  ('cat-hb-offers', 'store-coffee', 'Exclusive Offers & Bundles', 'العروض والبكجات الحصرية', 'offers', '/images/coffee_hero_flagship_machine_1791218907782.jpg', 5, 1, NOW(), NOW()),

  -- Store-Bleco Categories
  ('cat-clothing', 'store-bleco', 'Car Seat Covers', 'تلابيس مقاعد السيارة', 'car-seat-covers', '/images/categories/vip-luxury-seat-covers.jpg', 1, 1, NOW(), NOW()),
  ('cat-floors', 'store-bleco', 'Diamond Car Mats', 'أرضيات السيارة الدايموند', 'diamond-car-mats', '/images/categories/diamond-floor-mats.jpg', 2, 1, NOW(), NOW()),
  ('cat-perfumes', 'store-bleco', 'Car Air Fresheners', 'معطرات وفواحات السيارة', 'car-air-fresheners', '/images/categories/car-air-fresheners.jpg', 3, 1, NOW(), NOW()),
  ('cat-care', 'store-bleco', 'Car Care & Detailing', 'منتجات العناية والتلميع', 'car-care-detailing', '/images/categories/car-care-bleco.jpg', 4, 1, NOW(), NOW()),
  ('cat-accessories', 'store-bleco', 'Accessories & Styling', 'زينة واكسسوارات السيارات', 'accessories-styling', '/images/categories/car-accessories.jpg', 5, 1, NOW(), NOW()),
  ('cat-tools', 'store-bleco', 'Upholstery Supplies', 'أدوات ومستلزمات التنجيد', 'upholstery-supplies', '/images/categories/upholstery-tools.jpg', 6, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `name_ar`=VALUES(`name_ar`),
  `slug`=VALUES(`slug`),
  `image_url`=VALUES(`image_url`),
  `sort_order`=VALUES(`sort_order`),
  `is_active`=VALUES(`is_active`),
  `updated_at`=VALUES(`updated_at`);

-- ====================================================================
-- PRODUCTS (All 3 Stores: Hadaya Makkah + HiBrew Coffee + Bleco Car)
-- ====================================================================
INSERT INTO `products` (
  `id`,`store_id`,`category_id`,`name`,`name_ar`,`slug`,`sku`,`category`,`category_ar`,
  `price`,`original_price`,`cost_price`,`stock`,`image_url`,`status`,`is_active`,`image_version`,
  `created_at`,`updated_at`
) VALUES
  ('wm-peony-05', 'store-1', 'cat-nat-bouquets', 'Dutch Peony Soft Blush Box', 'صندوق بيوني هولندي وردي ناعم', 'wm-peony-05', 'WM-PEONY-05', 'باقات الورود الطبيعية', 'باقات الورود الطبيعية', 380, 450, 210, 18, '/images/hadaya_pink_peonies_1791216156090.jpg', 'published', 1, '1', NOW(), NOW()),
  ('wm-val-06', 'store-1', 'cat-nat-bouquets', 'Valentine Rose Heart Arrangement', 'تنسيق قلب الورد الرومانسي (فالنتين)', 'wm-val-06', 'WM-VAL-06', 'هدايا عيد الحب والرومانسية', 'هدايا عيد الحب والرومانسية', 420, 520, 230, 25, '/images/hadaya_red_roses_bouquet_1791276749666.jpg', 'published', 1, '1', NOW(), NOW()),
  ('wm-rose-01', 'store-1', 'cat-nat-bouquets', 'Royal Dutch Red Roses Velvet Box', 'صندوق مخملي رويال جوري هولندي أحمر', 'wm-rose-01', 'WM-ROSE-01', 'باقات الورود الطبيعية', 'باقات الورود الطبيعية', 340, 420, 180, 45, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80', 'published', 1, '1', NOW(), NOW()),
  ('wm-lily-02', 'store-1', 'cat-flower-vases', 'Casablanca White Lilies & Orchids', 'فازة كازابلانكا زنابق وأوركيد بيضاء', 'wm-lily-02', 'WM-LILY-02', 'فازات ورد طبيعي', 'فازات ورد طبيعي', 290, 380, 150, 32, '/images/hadaya_white_roses_bouquet_1791276726730.jpg', 'published', 1, '1', NOW(), NOW()),
  ('wm-vip-03', 'store-1', 'cat-men-gifts', 'Makkah Haram VIP Gift Hamper', 'سلة هدايا الحرم المكي الملكية VIP', 'wm-vip-03', 'WM-VIP-03', 'هدايا رجالية ملكية', 'هدايا رجالية ملكية', 580, 750, 320, 14, '/images/hadaya_luxury_gift_set_1791216170853.jpg', 'published', 1, '1', NOW(), NOW()),
  ('wm-bride-04', 'store-1', 'cat-wedding', 'Luxury Wedding Bridal Floral Bouquet', 'مسكة عروس ملكية فاخرة لذكرى الزواج', 'wm-bride-04', 'WM-BRIDE-04', 'هدايا الزواج والعرائس', 'هدايا الزواج والعرائس', 490, 620, 260, 9, 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop&q=80', 'published', 1, '1', NOW(), NOW()),
  ('disc-1', 'store-1', 'cat-nat-bouquets', 'Velvet Rose Elegance Bouquet', 'باقة الورد المخملي الأنيقة', 'disc-1', 'HM-ROSE-01', 'باقات فاخرة', 'باقات فاخرة', 199, 280, 110, 50, '/images/hadaya_red_roses_bouquet_1791276749666.jpg', 'published', 1, '1', NOW(), NOW()),
  ('disc-2', 'store-1', 'cat-nat-bouquets', 'Pure White Charm Bouquet', 'سحر الأبيض النقي', 'disc-2', 'HM-ROSE-02', 'ورد أبيض', 'ورد أبيض', 220, 290, 120, 35, '/images/hadaya_white_roses_bouquet_1791276726730.jpg', 'published', 1, '1', NOW(), NOW()),
  ('disc-3', 'store-1', 'cat-nat-bouquets', 'Tulips & Roses Harmony', 'تناغم التوليب والورد', 'disc-3', 'HM-ROSE-03', 'باقات فاخرة', 'باقات فاخرة', 245, 320, 135, 28, '/images/hadaya_pink_peonies_1791216156090.jpg', 'published', 1, '1', NOW(), NOW()),
  ('disc-4', 'store-1', 'cat-nat-bouquets', 'Morning Joy Bright Bouquet', 'باقة الفرح الصباحية', 'disc-4', 'HM-ROSE-04', 'ورد أحمر', 'ورد أحمر', 185, 250, 95, 40, 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png', 'published', 1, '1', NOW(), NOW()),
  ('disc-5', 'store-1', 'cat-nat-bouquets', 'Discounted Patchi & Red Roses Special', 'باقة جوري وشوكولاتة باتشي المخفضة', 'disc-5', 'HM-ROSE-05', 'باقات فاخرة', 'باقات فاخرة', 210, 295, 120, 45, '/images/hadaya_luxury_gift_noir_1791218956267.jpg', 'published', 1, '1', NOW(), NOW()),
  ('nat-1', 'store-1', 'cat-nat-bouquets', 'The Royal Grandeur (50 Stems)', 'باقة الملكية الفاخرة (50 وردة جوري)', 'nat-1', 'HM-NAT-01', 'ورد أحمر', 'ورد أحمر', 499, 580, 280, 25, '/images/hadaya_red_roses_bouquet_1791276749666.jpg', 'published', 1, '1', NOW(), NOW()),
  ('nat-2', 'store-1', 'cat-nat-bouquets', 'Peonies & Spray Roses Garden', 'بستان الفاوانيا والبيبي روز', 'nat-2', 'HM-NAT-02', 'باقات فاخرة', 'باقات فاخرة', 380, 440, 210, 22, '/images/hadaya_pink_peonies_1791216156090.jpg', 'published', 1, '1', NOW(), NOW()),
  ('nat-3', 'store-1', 'cat-nat-bouquets', 'Ivory Purity Arrangement', 'باقة النقاء العاجي', 'nat-3', 'HM-NAT-03', 'ورد أبيض', 'ورد أبيض', 340, 395, 190, 30, '/images/hadaya_white_roses_bouquet_1791276726730.jpg', 'published', 1, '1', NOW(), NOW()),
  ('nat-4', 'store-1', 'cat-nat-bouquets', 'Hijazi Soul Lavender Edit', 'باقة لافندر الروح الحجازية', 'nat-4', 'HM-NAT-04', 'هدايا وخطوبة', 'هدايا وخطوبة', 310, 360, 170, 26, 'https://cdn.salla.sa/form-builder/Y0Yt8LLfhRt46ljjaZjTaANumrZvYodYnv5CGQ7o.png', 'published', 1, '1', NOW(), NOW()),
  ('choc-1', 'store-1', 'cat-nat-bouquets', 'Patchi Royal Chocolates & Roses Box', 'صندوق ورد وشوكولاتة باتشي الملكية', 'choc-1', 'HM-CHOC-01', 'هدايا رومانسية', 'هدايا رومانسية', 450, 520, 260, 20, 'https://cdn.salla.sa/form-builder/vXd8gFVPfRavCrvqEUF68BHdHHn8pqj3mMglFTIt.png', 'published', 1, '1', NOW(), NOW()),
  ('choc-2', 'store-1', 'cat-nat-bouquets', 'Bostani Signature Chocolates & Blooms', 'بوكس ورد وشوكوليت بستاني الفاخر', 'choc-2', 'HM-CHOC-02', 'ورد وشوكولاتة بلجيكية فاخرة', 'ورد وشوكولاتة بلجيكية فاخرة', 399, 460, 220, 18, 'https://cdn.salla.sa/form-builder/JEDxluyY7LbYdo5So7sLrPqqupntM3LUhIxV3gXD.png', 'published', 1, '1', NOW(), NOW()),
  ('choc-3', 'store-1', 'cat-roses-patchi', 'Prestige Gift Tray with Patchi', 'صينية إهداء التميز مع شوكولاتة باتشي', 'choc-3', 'HM-CHOC-03', 'ورد و شوكليت باتشي', 'ورد و شوكليت باتشي', 520, 600, 280, 15, 'https://cdn.salla.sa/form-builder/qk6gpVW76xoVeFb6kZrmFFGOFOXQ4q8JalQmKw0R.png', 'published', 1, '1', NOW(), NOW()),
  ('choc-4', 'store-1', 'cat-roses-bostani', 'Blush Heart Box with Belgian Truffles', 'بوكس القلب الوردي مع ترافل بلجيكي', 'choc-4', 'HM-CHOC-04', 'ورد وشوكوليت بستاني', 'ورد وشوكوليت بستاني', 360, 420, 180, 22, '/images/hadaya_luxury_gift_set_1791216170853.jpg', 'published', 1, '1', NOW(), NOW()),
  ('cake-1', 'store-1', 'cat-nat-bouquets', 'Korean Bento Lunchbox Cake & Roses', 'تقديمة الكيك الكوري مع باقة الجوري', 'cake-1', 'HM-CAKE-01', 'عيد ميلاد', 'عيد ميلاد', 280, 340, 150, 35, 'https://cdn.salla.sa/form-builder/iN2hGSe4EYU7Jl2Jt6U5uk9swZaHsPbJnnqpNpac.png', 'published', 1, '1', NOW(), NOW()),
  ('cake-2', 'store-1', 'cat-nat-bouquets', 'Royal Red Velvet Cake & Red Roses', 'كعكة الريد فيلفيت الملكية مع الورد الأحمر', 'cake-2', 'HM-CAKE-02', 'عيد ميلاد', 'عيد ميلاد', 390, 460, 210, 20, 'https://cdn.salla.sa/form-builder/JnIWUYX47T9XyXPQlFx76ihWwhqD2N3xXKcYBMbh.png', 'published', 1, '1', NOW(), NOW()),
  ('cake-3', 'store-1', 'cat-roses-cake', 'Pastel Blooms & Cupcakes Box', 'بوكس الكب كيك الفاخر مع ورود الباستيل', 'cake-3', 'HM-CAKE-03', 'ورد مع كيك', 'ورد مع كيك', 310, 370, 160, 25, '/images/hadaya_luxury_velvet_cake_1791218716453.jpg', 'published', 1, '1', NOW(), NOW()),
  ('cake-4', 'store-1', 'cat-roses-cake', 'Ultimate Celebration Cake & Blooms Combo', 'صندوق احتفال التخرج والميلاد المتكامل', 'cake-4', 'HM-CAKE-04', 'ورد مع كيك', 'ورد مع كيك', 450, 530, 230, 18, 'https://cdn.files.salla.network/other/246985580/526058e5-3543-4d24-b93f-1ced5ca0d974-original.webp', 'published', 1, '1', NOW(), NOW()),
  ('cof-1', 'store-1', 'cat-nat-bouquets', 'Arabic Coffee, Stuffed Dates & Roses', 'تقديمة الورد مع القهوة العربية والتمور المحشوة', 'cof-1', 'HM-COF-01', 'هدايا رجالية', 'هدايا رجالية', 360, 420, 190, 18, 'https://cdn.salla.sa/form-builder/2fomvXwpTYOOx8h3JMZGP3r5dnXelUxxIUDuzepj.png', 'published', 1, '1', NOW(), NOW()),
  ('cof-2', 'store-1', 'cat-nat-bouquets', 'Royal Hospitality: Coffee, Sweets & Vase', 'صينية الضيافة الملكية: قهوة وحلا وفازة ورد', 'cof-2', 'HM-COF-02', 'هدايا رجالية', 'هدايا رجالية', 480, 560, 260, 15, '/images/hadaya_luxury_gift_noir_1791218956267.jpg', 'published', 1, '1', NOW(), NOW()),
  ('cof-3', 'store-1', 'cat-roses-coffee-sweets', 'Sweet Moments: Latte, Donuts & Blooms', 'صندوق السعادة: قهوة لاتيه، دوناتس وزهور', 'cof-3', 'HM-COF-03', 'تقديمة ورد مع قهوة وحلا', 'تقديمة ورد مع قهوة وحلا', 270, 320, 130, 24, 'https://cdn.files.salla.network/other/246985580/1b671cbc-3ffd-423d-97b8-f51660a118a4-original.webp', 'published', 1, '1', NOW(), NOW()),
  ('cof-4', 'store-1', 'cat-roses-coffee-sweets', 'Royal Hospitality: Coffee, Sweets & Vase', 'صينية الضيافة الملكية: قهوة وحلا وفازة ورد', 'cof-4', 'HM-COF-04', 'تقديمة ورد مع قهوة وحلا', 'تقديمة ورد مع قهوة وحلا', 480, 560, 250, 12, '/images/hadaya_luxury_gift_noir_1791218956267.jpg', 'published', 1, '1', NOW(), NOW()),
  ('vase-1', 'store-1', 'cat-nat-bouquets', 'Crystal Orchid & Royal Rose Vase', 'فازة كريستال أوركيد وجوري ملكي', 'vase-1', 'HM-VASE-01', 'ورد أبيض', 'ورد أبيض', 490, 580, 270, 16, 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png', 'published', 1, '1', NOW(), NOW()),
  ('vase-2', 'store-1', 'cat-nat-bouquets', 'Fluted Ceramic Designer Vase', 'فازة السيراميك المضلعة العصرية', 'vase-2', 'HM-VASE-02', 'باقات فاخرة', 'باقات فاخرة', 360, 420, 195, 20, '/images/hadaya_white_orchid_penthouse_1791218732789.jpg', 'published', 1, '1', NOW(), NOW()),
  ('vase-3', 'store-1', 'cat-flower-vases', 'Blue Hydrangea & White Roses Vase', 'فازة الهايدرنجا الزرقاء والجوري الملكي', 'vase-3', 'HM-VASE-03', 'فازات ورد طبيعي', 'فازات ورد طبيعي', 420, 490, 220, 15, '/images/hadaya_white_orchid_penthouse_1791218732789.jpg', 'published', 1, '1', NOW(), NOW()),
  ('vase-4', 'store-1', 'cat-flower-vases', 'Multicolor Spray Rose Desk Vase', 'فازة بيبي روز متعددة الألوان للمكاتب', 'vase-4', 'HM-VASE-04', 'فازات ورد طبيعي', 'فازات ورد طبيعي', 290, 340, 140, 28, '/images/hadaya_pink_peonies_1791216156090.jpg', 'published', 1, '1', NOW(), NOW()),
  ('maw-1', 'store-1', 'cat-nat-bouquets', 'Mawajeeb Wooden Heritage Plaque & Red Roses', 'لوحة مواجيب خشبية مذهبة مع جوري أحمر', 'maw-1', 'HM-MAW-01', 'لوحات مواجيب', 'لوحات مواجيب', 390, 450, 200, 25, 'https://cdn.files.salla.network/products/246985580/539625c7-703f-4c13-aa4c-24d982e20865-original.webp', 'published', 1, '1', NOW(), NOW()),
  ('maw-2', 'store-1', 'cat-nat-bouquets', 'Silver Mawajeeb Box with Maroki Oud & Blooms', 'صندوق مواجيب الفضي الفاخر مع بخور مروكي وورد', 'maw-2', 'HM-MAW-02', 'لوحات مواجيب', 'لوحات مواجيب', 460, 530, 240, 16, '/images/hadaya_luxury_gift_noir_1791218956267.jpg', 'published', 1, '1', NOW(), NOW()),
  ('new-1', 'store-1', 'cat-newborn', 'Welcome Baby Boy Floral Ceramic & Teddy', 'باقة أهلاً بالمولود (ورد وسيراميك ودبدوب ناعم)', 'new-1', 'HM-NEW-01', 'هدايا المواليد', 'هدايا المواليد', 280, 340, 140, 30, 'https://cdn.salla.sa/form-builder/h7hTylc4cMiriSfxe2sGsX0mL5Sc7akjxHAAUqHp.png', 'published', 1, '1', NOW(), NOW()),
  ('new-2', 'store-1', 'cat-newborn', 'Royal Baby Girl Reception Floral Stand', 'ستاند ورد استقبال المولودة الأميرة (بيبي روز وردي)', 'new-2', 'HM-NEW-02', 'هدايا المواليد', 'هدايا المواليد', 340, 410, 170, 20, '/images/hadaya_pink_peonies_1791216156090.jpg', 'published', 1, '1', NOW(), NOW()),
  ('grad-1', 'store-1', 'cat-graduation', 'Royal Graduation Bouquet with Gold Cap', 'باقة التخرج الملكية مع وشاح وقبعة مذهبة', 'grad-1', 'HM-GRAD-01', 'هدايا التخرج', 'هدايا التخرج', 320, 390, 160, 28, 'https://cdn.salla.sa/form-builder/unEMJIoOHLnWigTn0DpvQZbQMxNjU4QgVOT2BdUM.png', 'published', 1, '1', NOW(), NOW()),
  ('grad-2', 'store-1', 'cat-graduation', 'Congratulations Graduate Chocolate & Blooms Box', 'صندوق مبارك التخرج مع شوكولاتة وورد طبيعي', 'grad-2', 'HM-GRAD-02', 'هدايا التخرج', 'هدايا التخرج', 375, 440, 190, 24, '/images/hadaya_luxury_gift_set_1791216170853.jpg', 'published', 1, '1', NOW(), NOW()),
  ('men-gift-1', 'store-1', 'cat-nat-bouquets', 'Royal Men Luxury Gift Box: Perfume, Watch, Wallet & Blooms', 'طقم هدايا رجالية ملكي: عطر، محفظة وساعة فاخرة وباقة ورد', 'men-gift-1', 'HM-MEN-01', 'هدايا رجالية', 'هدايا رجالية', 540, 620, 310, 15, '/images/hadaya_men_luxury_gift_1791219799100.jpg', 'published', 1, '1', NOW(), NOW()),
  ('women-gift-1', 'store-1', 'cat-nat-bouquets', 'Royal Women Luxury Gift Box: Perfume, Jewelry Set & Peonies', 'صندوق هدايا نسائية فاخر: عطر، طقم مجوهرات وباقة بيوني وردي', 'women-gift-1', 'HM-WOMEN-01', 'هدايا نسائية', 'هدايا نسائية', 580, 690, 330, 14, '/images/hadaya_women_luxury_gift_1791219815272.jpg', 'published', 1, '1', NOW(), NOW()),
  ('hb-h10a-dualboiler', 'store-coffee', 'cat-hb-machines', 'HiBrew Barista Pro H7A Dual-Boiler 20-Bar', 'ماكينة قهوة بارستا برو هايبرو H7A دبل بويلر 20 بار', 'hb-h10a-dualboiler', 'HB-HB-H10A-DUALBOIL', 'مكائن القهوة والإسبريسو', 'مكائن القهوة والإسبريسو', 1899, 2299, 1177, 35, '/images/hibrew_h7a_flagship_machine.png', 'published', 1, '1', NOW(), NOW()),
  ('hb-barista-silver-pro', 'store-coffee', 'cat-hb-machines', 'HiBrew Barista Classic Pro 20-Bar', 'ماكينة هايبرو بارستا كلاسيك 20 بار', 'hb-barista-silver-pro', 'HB-HB-BARISTA-SILVE', 'مكائن القهوة والإسبريسو', 'مكائن القهوة والإسبريسو', 1499, 1899, 929, 35, '/images/product_machine_silver_pro.png', 'published', 1, '1', NOW(), NOW()),
  ('hb-smart-capsule-compact', 'store-coffee', 'cat-hb-machines', 'HiBrew Compact Smart Capsule & Espresso', 'ماكينة هايبرو سمارت المدمجة للكبسولات والإسبريسو', 'hb-smart-capsule-compact', 'HB-HB-SMART-CAPSULE', 'مكائن القهوة والإسبريسو', 'مكائن القهوة والإسبريسو', 399, 549, 247, 35, '/images/product_machine_compact_black.png', 'published', 1, '1', NOW(), NOW()),
  ('hb-thermal-drip-brewer', 'store-coffee', 'cat-hb-machines', 'HiBrew Digital Thermal Drip Brewer', 'ماكينة هايبرو الرقمية لتقطير القهوة مع إبريق زجاجي', 'hb-thermal-drip-brewer', 'HB-HB-THERMAL-DRIP-', 'مكائن القهوة والإسبريسو', 'مكائن القهوة والإسبريسو', 299, 420, 185, 35, '/images/product_machine_drip_carafe.png', 'published', 1, '1', NOW(), NOW()),
  ('hb-classic-duo-espresso', 'store-coffee', 'cat-hb-machines', 'HiBrew Classic Duo 15-Bar Espresso Maker', 'ماكينة هايبرو كلاسيك ديو 15 بار بمخرجين', 'hb-classic-duo-espresso', 'HB-HB-CLASSIC-DUO-E', 'مكائن القهوة والإسبريسو', 'مكائن القهوة والإسبريسو', 649, 850, 402, 35, '/images/product_machine_delonghi_black.png', 'published', 1, '1', NOW(), NOW()),
  ('hb-mill-g5-pro', 'store-coffee', 'cat-hb-mills', 'HiBrew Conical Burr Coffee Mill G5', 'مطحنة القهوة الكهربائية بتروس مخروطية هايبرو G5', 'hb-mill-g5-pro', 'HB-HB-MILL-G5-PRO', 'مطاحن القهوة الاحترافية', 'مطاحن القهوة الاحترافية', 489, 650, 303, 60, '/images/hibrew_grinder_isolated.jpg', 'published', 1, '1', NOW(), NOW()),
  ('hb-boltfilter-58-naked', 'store-coffee', 'cat-hb-accessories', '58mm Naked Walnut Boltfilter', 'بورتافلتر مكشوف مقاس 58 ملم مع مقبض خشب الجوز', 'hb-boltfilter-58-naked', 'HB-HB-BOLTFILTER-58', 'مستلزمات الباريستا والأكواب', 'مستلزمات الباريستا والأكواب', 159, 220, 99, 60, '/images/hibrew_portafilter_isolated.jpg', 'published', 1, '1', NOW(), NOW()),
  ('hb-nordic-cabinet', 'store-coffee', 'cat-hb-cabinets', 'Artisan Fluted Oak Coffee Corner Station', 'دولاب وركن القهوة الفاخر من خشب البلوط المضلع مع إضاءة ليد مخفية', 'hb-nordic-cabinet', 'HB-HB-NORDIC-CABINE', 'دواليب وأركان القهوة الفاخرة', 'دواليب وأركان القهوة الفاخرة', 1490, 1890, 924, 8, '/images/hero_coffee_corner_cabinet_1791217199146.jpg', 'published', 1, '1', NOW(), NOW()),
  ('hb-ceramic-artisan-cups', 'store-coffee', 'cat-hb-accessories', 'Artisan Stoneware Ceramic Cup Set (4 Pcs)', 'طقم أكواب فلات وايت ولاتيه سيراميك حجري مع صحون (4 قطع)', 'hb-ceramic-artisan-cups', 'HB-HB-CERAMIC-ARTIS', 'مستلزمات الباريستا والأكواب', 'مستلزمات الباريستا والأكواب', 169, 210, 105, 60, '/images/hibrew_ceramic_cup_isolated.jpg', 'published', 1, '1', NOW(), NOW()),
  ('hb-doublewall-paper-cups', 'store-coffee', 'cat-hb-accessories', 'Double-Wall Kraft Paper Coffee Cups (500 Pcs)', 'كرتون أكواب ورقية دبل جدار عازلة مع أغطية محكمة (500 كوب)', 'hb-doublewall-paper-cups', 'HB-HB-DOUBLEWALL-PA', 'مستلزمات الباريستا والأكواب', 'مستلزمات الباريستا والأكواب', 185, 240, 115, 60, '/images/coffee_paper_cups_bulk_1791218958527.jpg', 'published', 1, '1', NOW(), NOW()),
  ('hb-luxury-corner-station', 'store-coffee', 'cat-hb-cabinets', 'Master Barista Home Coffee Corner Station', 'ركن القهوة المتكامل الفاخر مع رفوف زجاجية وإضاءة محيطية', 'hb-luxury-corner-station', 'HB-HB-LUXURY-CORNER', 'دواليب وأركان القهوة الفاخرة', 'دواليب وأركان القهوة الفاخرة', 2890, 3490, 1792, 8, '/images/coffee_corner_luxury_station_1791219182840.jpg', 'published', 1, '1', NOW(), NOW()),
  ('hb-barista-accessories-kit', 'store-coffee', 'cat-hb-accessories', 'Master Barista 58mm Precision Tool Kit', 'طقم إكسسوارات ومستلزمات الباريستا الاحترافي مقاس 58 ملم', 'hb-barista-accessories-kit', 'HB-HB-BARISTA-ACCES', 'مستلزمات الباريستا والأكواب', 'مستلزمات الباريستا والأكواب', 299, 420, 185, 60, '/images/coffee_barista_accessories_set_1791219198302.jpg', 'published', 1, '1', NOW(), NOW()),
  ('hb-h4a-portable-travel', 'store-coffee', 'cat-hb-offers', 'HiBrew H4A 4-in-1 Portable Espresso Maker', 'ماكينة القهوة المحمولة 4 في 1 هاي برو H4A (عرض خاص)', 'hb-h4a-portable-travel', 'HB-HB-H4A-PORTABLE-', 'العروض والبكجات الحصرية', 'العروض والبكجات الحصرية', 329, 450, 204, 60, '/images/hibrew_h4a_portable_isolated.jpg', 'published', 1, '1', NOW(), NOW()),
  ('hb-smart-scale-timer', 'store-coffee', 'cat-hb-accessories', 'Precision Barista Smart Scale with Flow Timer', 'ميزان القهوة الذكي مع مؤقت تلقائي وحساس دقة 0.1 جرام', 'hb-smart-scale-timer', 'HB-HB-SMART-SCALE-T', 'مستلزمات الباريستا والأكواب', 'مستلزمات الباريستا والأكواب', 145, 195, 90, 60, '/images/hibrew_scale_isolated.jpg', 'published', 1, '1', NOW(), NOW()),
  ('hb-v60-complete-kit', 'store-coffee', 'cat-hb-offers', 'Royal Saudi 96 V60 Pour-Over & Kettle Master Set', 'بكج التقطير الملكي V60 وغلاية التحكم الرقمي (إصدار اليوم الوطني 96)', 'hb-v60-complete-kit', 'HB-HB-V60-COMPLETE-', 'العروض والبكجات الحصرية', 'العروض والبكجات الحصرية', 599, 890, 371, 60, '/images/saudi_national_day_coffee_hero_1791364192381.jpg', 'published', 1, '1', NOW(), NOW()),
  ('prod-mat-triangle', 'store-bleco', 'cat-floors', 'Triangle floors', 'أرضيات المثلثات (Triangle floors)', 'prod-mat-triangle', 'MAT-TRIANGLE-ECO', 'أرضيات', 'أرضيات السيارة', 340, 399, 204, 30, '/images/floor-mats/triangle-floors.jpg', 'published', 1, '1', NOW(), NOW()),
  ('prod-mat-luxury', 'store-bleco', 'cat-floors', 'Luxury flooring', 'أرضيات الفاخر (Luxury flooring)', 'prod-mat-luxury', 'MAT-LUXURY-ECO', 'أرضيات', 'أرضيات السيارة', 490, 580, 294, 25, '/images/floor-mats/luxury-flooring.jpg', 'published', 1, '1', NOW(), NOW()),
  ('prod-mat-diamond', 'store-bleco', 'cat-floors', 'Diamond floors', 'أرضيات الدايموند (Diamond floors)', 'prod-mat-diamond', 'MAT-DIAMOND-ECO', 'أرضيات', 'أرضيات السيارة', 380, 450, 228, 45, '/images/floor-mats/diamond-floors.jpg', 'published', 1, '1', NOW(), NOW()),
  ('prod-mat-laser', 'store-bleco', 'cat-floors', 'Laser flooring', 'أرضيات الليزر (Laser flooring)', 'prod-mat-laser', 'MAT-LASER-ECO', 'أرضيات', 'أرضيات السيارة', 420, 490, 252, 35, '/images/floor-mats/laser-flooring.jpg', 'published', 1, '1', NOW(), NOW()),
  ('prod-seat-camry-2025-leather', 'store-bleco', 'cat-clothing', 'Car seat covers made of (leather) compatible with Toyota Camry 2025', 'طقم تلابيس جلد ألماني فاخر تفصيل وكالة — تويوتا كامري 2025', 'prod-seat-camry-2025-leather', 'SEAT-CAMRY-2025-BEI', 'تلابيس', 'تلابيس مقاعد السيارة', 509, 580, 305, 25, '/images/seat-covers/camry-beige.jpg', 'published', 1, '1', NOW(), NOW()),
  ('prod-seat-accord-2018-leather', 'store-bleco', 'cat-clothing', 'Car seat covers made of (leather) compatible with Honda Accord 2018-2024', 'طقم تلابيس مقاعد جلد ألماني ملكي — هوندا أكورد 2018-2024', 'prod-seat-accord-2018-leather', 'SEAT-ACCORD-18-24-BEI', 'تلابيس', 'تلابيس مقاعد السيارة', 495, 575, 297, 22, '/images/seat-covers/accord-beige.jpg', 'published', 1, '1', NOW(), NOW()),
  ('prod-seat-landcruiser-2022', 'store-bleco', 'cat-clothing', 'Luxury Nappa Leather Seat Covers compatible with Toyota Land Cruiser LC300 2022-2025', 'طقم تلابيس مقاعد ملكية ليزرية جلد نابا — تويوتا لاندكروزر LC300 2022-2025', 'prod-seat-landcruiser-2022', 'SEAT-TOY-LC300-VIP', 'تلابيس', 'تلابيس مقاعد السيارة', 650, 750, 390, 18, '/images/seat-covers/landcruiser-camel.jpg', 'published', 1, '1', NOW(), NOW()),
  ('prod-seat-yukon-2015-gray', 'store-bleco', 'cat-clothing', 'Car seat covers made of (leather) compatible with GMC Yukon & Tahoe 2015-2020', 'طقم تلابيس مقاعد جلد ألماني VIP — جمس يوكن وشفروليه تاهو 2015-2020', 'prod-seat-yukon-2015-gray', 'SEAT-YUKON-15-20-GRY', 'تلابيس', 'تلابيس مقاعد السيارة', 616, 700, 370, 19, '/images/seat-covers/yukon-grey.jpg', 'published', 1, '1', NOW(), NOW()),
  ('prod-seat-nissan-patrol', 'store-bleco', 'cat-clothing', 'Hero of All Terrain VIP Leather Seat Covers compatible with Nissan Patrol 2020-2025', 'تلبيسة مقاعد السيارة VIP بطل الدروب متوافق مع نيسان باترول 2020-2025', 'prod-seat-nissan-patrol', 'SEAT-NIS-PATROL-2025', 'تلابيس', 'تلابيس مقاعد السيارة', 650, 750, 390, 16, '/images/seat-covers/camry-black.jpg', 'published', 1, '1', NOW(), NOW()),
  ('prod-seat-lexus-es', 'store-bleco', 'cat-clothing', 'Executive Nappa Leather Seat Covers compatible with Lexus ES 350 2019-2024', 'تلبيسة مقاعد جاهزة من جلد نابا تنفيذي متوافق مع لكزس ES 350 2019-2024', 'prod-seat-lexus-es', 'SEAT-LEXUS-ES-1924', 'تلابيس', 'تلابيس مقاعد السيارة', 560, 650, 336, 15, '/images/seat-covers/accord-camel.jpg', 'published', 1, '1', NOW(), NOW()),
  ('prod-seat-yukon-denali', 'store-bleco', 'cat-clothing', 'Captain Chair VIP Leather Seat Covers for GMC Yukon Denali & Tahoe 2021-2025', 'طقم تلابيس مقاعد كابتن VIP جلد ألماني — جمس يوكن دينالي وتاهو 2021-2025', 'prod-seat-yukon-denali', 'SEAT-YUKON-DENALI-2125', 'تلابيس', 'تلابيس مقاعد السيارة', 680, 780, 408, 14, '/images/seat-covers/yukon-beige.jpg', 'published', 1, '1', NOW(), NOW()),
  ('prod-seat-ford-taurus', 'store-bleco', 'cat-clothing', 'Laser-Tailored German Leather Seat Covers for Ford Taurus & Explorer 2020-2024', 'طقم تلابيس مقاعد جلد ألماني ليزري — فورد تورس وإكسبلورر 2020-2024', 'prod-seat-ford-taurus', 'SEAT-FORD-TAU-2024', 'تلابيس', 'تلابيس مقاعد السيارة', 490, 560, 294, 20, '/images/seat-covers/accord-grey.jpg', 'published', 1, '1', NOW(), NOW())
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

-- ====================================================================
-- CUSTOMERS (store-1, store-coffee, store-bleco)
-- ====================================================================
INSERT INTO `customers` (
  `id`,`store_id`,`name`,`phone`,`email`,`status`,`city`,`country`,`gender`,`group`,
  `acquisition_source`,`total_orders`,`total_spend`,`avg_order_value`,`last_order_date`,`created_at`,`updated_at`
) VALUES
  ('cust-mkk-1', 'store-1', 'سارة عبد العزيز الشريف', '+966501234567', 'sara.sharif@gmail.com', 'Active', 'مكة المكرمة', 'SA', 'Female', 'VIP', 'Direct', 3, 1290, 430, NOW(), NOW(), NOW()),
  ('cust-mkk-2', 'store-1', 'محمد أنس القحطاني', '+966549876543', 'm.anas@outlook.sa', 'Active', 'مكة المكرمة', 'SA', 'Male', 'Regular', 'Instagram', 2, 980, 490, NOW(), NOW(), NOW()),
  ('cust-mkk-3', 'store-1', 'فاطمة الشهري', '+966567891234', 'fatima.shehri@outlook.com', 'Active', 'مكة المكرمة', 'SA', 'Female', 'Regular', 'Google Ads', 1, 360, 360, NOW(), NOW(), NOW()),
  ('cust-mkk-4', 'store-1', 'عبد الله السعيد', '+966551239876', 'abdullah.saeed@gmail.com', 'Active', 'مكة المكرمة', 'SA', 'Male', 'VIP', 'Snapchat', 4, 1850, 462.5, NOW(), NOW(), NOW()),
  ('cust-cof-1', 'store-coffee', 'ريان بن عبد الله السليمان', '+966549876543', 'rayan.sulaiman@gmail.com', 'Active', 'الرياض', 'SA', 'Male', 'VIP', 'Direct', 3, 1420, 473.3, NOW(), NOW(), NOW()),
  ('cust-cof-2', 'store-coffee', 'نورة بنت سعد القحطاني', '+966551122334', 'noura.qahtani@saudimail.com', 'Active', 'الرياض', 'SA', 'Female', 'Regular', 'Instagram', 2, 860, 430, NOW(), NOW(), NOW()),
  ('cust-cof-3', 'store-coffee', 'سلطان فهد الغامدي', '+966509988112', 'sultan.ghamdi@outlook.sa', 'Active', 'الخبر', 'SA', 'Male', 'VIP', 'Google Ads', 4, 1650, 412.5, NOW(), NOW(), NOW()),
  ('cust-cof-4', 'store-coffee', 'بدر بن خالد العتيبي', '+966567788990', 'bader.otaibi@aramco.com', 'Active', 'الظهران', 'SA', 'Male', 'Regular', 'WhatsApp', 1, 840, 840, NOW(), NOW(), NOW()),
  ('cust-cof-5', 'store-coffee', 'عبد الرحمن الشمري', '+966531144778', 'a.shammari@gmail.com', 'Active', 'جدة', 'SA', 'Male', 'Regular', 'Direct', 2, 780, 390, NOW(), NOW(), NOW()),
  ('cust-cof-6', 'store-coffee', 'هند بنت ماجد التميمي', '+966548899112', 'hind.tamimi@yahoo.com', 'Active', 'الرياض', 'SA', 'Female', 'Regular', 'Instagram', 3, 690, 230, NOW(), NOW(), NOW()),
  ('cust-cof-7', 'store-coffee', 'مشعل بن ناصر الدوسري', '+966504455667', 'meshal.dossary@gmail.com', 'Active', 'الدمام', 'SA', 'Male', 'VIP', 'Google Ads', 5, 2450, 490, NOW(), NOW(), NOW()),
  ('cust-cof-8', 'store-coffee', 'أحمد بن طارق الزهراني', '+966552233445', 'ahmed.zahrani@hotmail.com', 'Active', 'مكة المكرمة', 'SA', 'Male', 'Regular', 'Direct', 2, 1120, 560, NOW(), NOW(), NOW()),
  ('cust-blc-1', 'store-bleco', 'الأمير فيصل بن خالد آل سعود', '+966505566778', 'faisal.saud@vip.sa', 'Active', 'الرياض', 'SA', 'Male', 'VIP', 'Direct', 4, 6850, 1712.5, NOW(), NOW(), NOW()),
  ('cust-blc-2', 'store-bleco', 'ماجد بن ناصر الحربي', '+966541122998', 'm.harbi@aramco.com', 'Active', 'الرياض', 'SA', 'Male', 'VIP', 'Instagram', 2, 2960, 1480, NOW(), NOW(), NOW()),
  ('cust-blc-3', 'store-bleco', 'خالد بن عبد الرحمن الدوسري', '+966563344556', 'khalid.dossary@gmail.com', 'Active', 'الدمام', 'SA', 'Male', 'Regular', 'TikTok', 2, 1450, 725, NOW(), NOW(), NOW()),
  ('cust-blc-4', 'store-bleco', 'بندر بن عبد الله السبيعي', '+966509911223', 'bandar.subaie@hotmail.com', 'Active', 'الرياض', 'SA', 'Male', 'VIP', 'Direct', 3, 3820, 1273.3, NOW(), NOW(), NOW()),
  ('cust-blc-5', 'store-bleco', 'تركي بن سعد العتيبي', '+966558877665', 'turki.otaibi@outlook.sa', 'Active', 'الرياض', 'SA', 'Male', 'Regular', 'Snapchat', 1, 960, 960, NOW(), NOW(), NOW()),
  ('cust-blc-6', 'store-bleco', 'سعد بن فهد الغامدي', '+966547788112', 'saad.ghamdi@gmail.com', 'Active', 'جدة', 'SA', 'Male', 'Regular', 'Google Ads', 2, 768, 384, NOW(), NOW(), NOW()),
  ('cust-blc-7', 'store-bleco', 'عبد العزيز بن سعود المقرن', '+966501199887', 'a.muqrin@almuqrin.sa', 'Active', 'الرياض', 'SA', 'Male', 'VIP', 'Direct', 3, 4120, 1373.3, NOW(), NOW(), NOW()),
  ('cust-blc-8', 'store-bleco', 'محمد بن يحيى الشهري', '+966532211445', 'm.shehri@yahoo.com', 'Active', 'خميس مشيط', 'SA', 'Male', 'Wholesale', 'Direct', 2, 3100, 1550, NOW(), NOW(), NOW()),
  ('cust-blc-9', 'store-bleco', 'نواف بن فهد العنزي', '+966569988771', 'nawaf.enazi@gmail.com', 'Active', 'تبوك', 'SA', 'Male', 'Regular', 'TikTok', 2, 4500, 2250, NOW(), NOW(), NOW()),
  ('cust-blc-10', 'store-bleco', 'سلمان بن ظافر القحطاني', '+966554433221', 'salman.qahtani@saudimail.com', 'Active', 'الرياض', 'SA', 'Male', 'Regular', 'Instagram', 2, 2350, 1175, NOW(), NOW(), NOW()),
  ('cust-blc-11', 'store-bleco', 'فهد بن منصور المطيري', '+966508877112', 'fahad.mutairi@gmail.com', 'Active', 'بريدة', 'SA', 'Male', 'Regular', 'Snapchat', 1, 704, 704, NOW(), NOW(), NOW()),
  ('cust-blc-12', 'store-bleco', 'ياسر بن عبد الله الزهراني', '+966551100998', 'yasser.fleet@zahrani-corp.sa', 'Active', 'الرياض', 'SA', 'Male', 'Wholesale', 'Direct', 3, 12400, 4133.3, NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `phone`=VALUES(`phone`),
  `status`=VALUES(`status`),
  `city`=VALUES(`city`),
  `total_orders`=VALUES(`total_orders`),
  `total_spend`=VALUES(`total_spend`),
  `avg_order_value`=VALUES(`avg_order_value`),
  `last_order_date`=VALUES(`last_order_date`),
  `updated_at`=VALUES(`updated_at`);

-- ====================================================================
-- ORDERS & ORDER ITEMS (All 3 Stores)
-- ====================================================================
INSERT INTO `orders` (
  `id`,`store_id`,`order_number`,`customer_id`,`customer_name`,`customer_phone`,`customer_email`,
  `items_count`,`items_summary`,`total_amount`,`currency`,`source`,`source_details`,
  `delivery_location`,`status`,`payment_method`,`order_date`,`created_at`,`updated_at`
) VALUES
  ('ord-mkk-101', 'store-1', '#MKK-101', NULL, 'سارة عبد العزيز الشريف', '+966501234567', 'sara.sharif@gmail.com', 2, 'صندوق بيوني هولندي وردي ناعم', 430, 'SAR', 'Instagram', 'Direct Website Order', 'مكة المكرمة - برج الساعة', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-mkk-102', 'store-1', '#MKK-102', NULL, 'محمد أنس القحطاني', '+966549876543', 'm.anas@outlook.sa', 1, 'باقة جوري إكوادوري أحمر ملكي ٥٠ وردة', 520, 'SAR', 'Google Ads', 'Direct Website Order', 'مكة المكرمة - فندق شيراتون جبل الكعبة', 'processing', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-mkk-103', 'store-1', '#MKK-103', NULL, 'فاطمة الشهري', '+966567891234', 'fatima.shehri@outlook.com', 1, 'فازة أوركيد بيضاء ملكية مزدوجة الساق', 360, 'SAR', 'Direct', 'Direct Website Order', 'مكة المكرمة - العوالي', 'processing', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-mkk-104', 'store-1', '#MKK-104', NULL, 'عبد الله السعيد', '+966551239876', 'abdullah.saeed@gmail.com', 3, 'صندوق تخرج مبهج مع بالونات وقبعة تخرج مطرزة', 290, 'SAR', 'Direct', 'Direct Website Order', 'مكة المكرمة - العزيزية', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-mkk-105', 'store-1', '#MKK-105', NULL, 'نورة الدوسري', '+966532109876', 'noura.d@yahoo.com', 1, 'باقة VIP زهور هيدرانجيا مع شوكولاتة باتشي', 480, 'SAR', 'Snapchat', 'Direct Website Order', 'مكة المكرمة - الشوقية', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-mkk-106', 'store-1', '#MKK-106', NULL, 'خالد بن ناصر الغامدي', '+966509988776', 'khalid.ghamdi@saudimail.com', 2, 'توليب هولندي أبيض في فازة سيراميك إيطالية', 310, 'SAR', 'WhatsApp', 'Direct Website Order', 'مكة المكرمة - بطحاء قريش', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-cof-101', 'store-coffee', '#COF-101', NULL, 'ريان بن عبد الله السليمان', '+966549876543', 'rayan.sulaiman@gmail.com', 2, 'كولومبيا غيشا ريزيرف فاخرة ٢٠٠ جرام', 445, 'SAR', 'Direct', 'Direct Website Order', 'الرياض - حي العليا', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-cof-102', 'store-coffee', '#COF-102', NULL, 'نورة بنت سعد القحطاني', '+966551122334', 'noura.qahtani@saudimail.com', 1, 'غلاية فلو ستاغ EKG الكهربائية الذكية مع تحكم حراري رقمي', 620, 'SAR', 'Instagram', 'Direct Website Order', 'الرياض - حي النرجس', 'processing', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-cof-103', 'store-coffee', '#COF-103', NULL, 'سلطان فهد الغامدي', '+966509988112', 'sultan.ghamdi@outlook.sa', 3, 'إثيوبيا يرقاتشيفي - معالجة مجففة ٢٥٠ جرام', 439, 'SAR', 'Google Ads', 'Direct Website Order', 'الخبر - حي الحزام الذهبي', 'processing', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-cof-104', 'store-coffee', '#COF-104', NULL, 'بدر بن خالد العتيبي', '+966567788990', 'bader.otaibi@aramco.com', 1, 'ميزان أكايا لونار الذكي المقاوم للماء لإسبريسو احترافي', 840, 'SAR', 'WhatsApp', 'Direct Website Order', 'الظهران - حي الدوحة', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-cof-105', 'store-coffee', '#COF-105', NULL, 'عبد الرحمن الشمري', '+966531144778', 'a.shammari@gmail.com', 4, 'خلطة إسبريسو سيغنتشر - شوكولاتة داكنة وبندق ١ كجم', 513, 'SAR', 'Direct', 'Direct Website Order', 'جدة - حي الشاطئ', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-cof-106', 'store-coffee', '#COF-106', NULL, 'هند بنت ماجد التميمي', '+966548899112', 'hind.tamimi@yahoo.com', 2, 'يمن حراز - موكا بري عتيق ٢٠٠ جرام', 246, 'SAR', 'Instagram', 'Direct Website Order', 'الرياض - حي حطين', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-cof-107', 'store-coffee', '#COF-107', NULL, 'مشعل بن ناصر الدوسري', '+966504455667', 'meshal.dossary@gmail.com', 5, 'كولومبيا غيشا ريزيرف فاخرة ٢٠٠ جرام', 1478, 'SAR', 'Google Ads', 'Direct Website Order', 'الدمام - حي الشاطئ الشرقي', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-cof-108', 'store-coffee', '#COF-108', NULL, 'أحمد بن طارق الزهراني', '+966552233445', 'ahmed.zahrani@hotmail.com', 3, 'خلطة إسبريسو سيغنتشر - شوكولاتة داكنة وبندق ١ كجم', 839, 'SAR', 'Direct', 'Direct Website Order', 'مكة المكرمة - حي الشوقية', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-101', 'store-bleco', '#BLC-101', NULL, 'الأمير فيصل بن خالد آل سعود', '+966505566778', 'faisal.saud@vip.sa', 1, 'بكج اليوم الوطني الذهبي (تنجيد كراسي + أرضيات 7D + وسائد إهداء)', 1680, 'SAR', 'Direct', 'Direct Website Order', 'الرياض - حي حطين النموذجي', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-102', 'store-bleco', '#BLC-102', NULL, 'ماجد بن ناصر الحربي', '+966541122998', 'm.harbi@aramco.com', 1, 'طقم تنجيد كراسي ملكي كامل جلد نابا ألماني فاخر', 1480, 'SAR', 'Instagram', 'Direct Website Order', 'الرياض - حي الياسمين', 'processing', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-103', 'store-bleco', '#BLC-103', NULL, 'خالد بن عبد الرحمن الدوسري', '+966563344556', 'khalid.dossary@gmail.com', 2, 'أرضيات ودعاسات دايموند 7D تغطية شاملة مع دواسة معدنية', 696, 'SAR', 'Direct', 'Direct Website Order', 'الدمام - حي الشاطئ', 'processing', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-104', 'store-bleco', '#BLC-104', NULL, 'بندر بن عبد الله السبيعي', '+966509911223', 'bandar.subaie@hotmail.com', 2, 'بكج اليوم الوطني الذهبي (تنجيد كراسي + أرضيات 7D + وسائد إهداء)', 1880, 'SAR', 'Direct', 'Direct Website Order', 'الرياض - حي الصحافة', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-105', 'store-bleco', '#BLC-105', NULL, 'تركي بن سعد العتيبي', '+966558877665', 'turki.otaibi@outlook.sa', 1, 'تلبيس وتخشيب ديكورات الأبواب وسقف الكانتارا الرياضي', 960, 'SAR', 'Snapchat', 'Direct Website Order', 'الرياض - حي الملقا', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-106', 'store-bleco', '#BLC-106', NULL, 'سعد بن فهد الغامدي', '+966547788112', 'saad.ghamdi@gmail.com', 1, 'أرضيات ودعاسات دايموند 7D تغطية شاملة مع دواسة معدنية', 384, 'SAR', 'Google Ads', 'Direct Website Order', 'جدة - حي الروضة', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-107', 'store-bleco', '#BLC-107', NULL, 'عبد العزيز بن سعود المقرن', '+966501199887', 'a.muqrin@almuqrin.sa', 2, 'طقم تنجيد كراسي ملكي كامل جلد نابا ألماني فاخر', 1632, 'SAR', 'Direct', 'Direct Website Order', 'الرياض - حي النخيل الغربي', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-108', 'store-bleco', '#BLC-108', NULL, 'محمد بن يحيى الشهري', '+966532211445', 'm.shehri@yahoo.com', 6, 'أرضيات ودعاسات دايموند 7D تغطية شاملة مع دواسة معدنية', 2088, 'SAR', 'Direct', 'Direct Website Order', 'خميس مشيط - حي العزيزية', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-109', 'store-bleco', '#BLC-109', NULL, 'نواف بن فهد العنزي', '+966569988771', 'nawaf.enazi@gmail.com', 2, 'بكج اليوم الوطني الذهبي (تنجيد كراسي + أرضيات 7D + وسائد إهداء)', 3360, 'SAR', 'Direct', 'Direct Website Order', 'تبوك - حي المروج', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-110', 'store-bleco', '#BLC-110', NULL, 'سلمان بن ظافر القحطاني', '+966554433221', 'salman.qahtani@saudimail.com', 2, 'طقم تنجيد كراسي ملكي كامل جلد نابا ألماني فاخر', 1704, 'SAR', 'Instagram', 'Direct Website Order', 'الرياض - حي الغدير', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-111', 'store-bleco', '#BLC-111', NULL, 'فهد بن منصور المطيري', '+966508877112', 'fahad.mutairi@gmail.com', 3, 'أرضيات ودعاسات دايموند 7D تغطية شاملة مع دواسة معدنية', 704, 'SAR', 'Snapchat', 'Direct Website Order', 'بريدة - حي الصفراء', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-112', 'store-bleco', '#BLC-112', NULL, 'ياسر بن عبد الله الزهراني', '+966551100998', 'yasser.fleet@zahrani-corp.sa', 5, 'طقم تنجيد كراسي ملكي كامل جلد نابا ألماني فاخر', 7400, 'SAR', 'Direct', 'Direct Website Order', 'الرياض - طريق الملك عبد العزيز', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-113', 'store-bleco', '#BLC-113', NULL, 'عبد الله بن حمد الهاجري', '+966539988441', 'a.hajri@aramco.com', 2, 'تلبيس وتخشيب ديكورات الأبواب وسقف الكانتارا الرياضي', 1344, 'SAR', 'Instagram', 'Direct Website Order', 'الخبر - حي العقربية', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  ('ord-blc-114', 'store-bleco', '#BLC-114', NULL, 'حمد بن راشد المري', '+966503322119', 'hamad.marri@outlook.com', 2, 'بكج اليوم الوطني الذهبي (تنجيد كراسي + أرضيات 7D + وسائد إهداء)', 1904, 'SAR', 'Google Ads', 'Direct Website Order', 'الدمام - حي الفاخرية', 'completed', 'Mada', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `status`=VALUES(`status`),
  `total_amount`=VALUES(`total_amount`),
  `items_count`=VALUES(`items_count`),
  `items_summary`=VALUES(`items_summary`),
  `order_date`=VALUES(`order_date`),
  `updated_at`=VALUES(`updated_at`);

-- Order Items (Delete existing to avoid duplicates on re-seed)
DELETE FROM `order_items` WHERE `order_id` IN ('ord-mkk-101','ord-mkk-102','ord-mkk-103','ord-mkk-104','ord-mkk-105','ord-mkk-106','ord-cof-101','ord-cof-102','ord-cof-103','ord-cof-104','ord-cof-105','ord-cof-106','ord-cof-107','ord-cof-108','ord-blc-101','ord-blc-102','ord-blc-103','ord-blc-104','ord-blc-105','ord-blc-106','ord-blc-107','ord-blc-108','ord-blc-109','ord-blc-110','ord-blc-111','ord-blc-112','ord-blc-113','ord-blc-114');
INSERT INTO `order_items` (`order_id`,`store_id`,`product_id`,`product_name`,`quantity`,`unit_price`,`subtotal`,`created_at`,`updated_at`) VALUES
  ('ord-mkk-101', 'store-1', 'item-1', 'صندوق بيوني هولندي وردي ناعم', 1, 280, 280, NOW(), NOW()),
  ('ord-mkk-101', 'store-1', 'item-2', 'شوكولاتة باتشي فاخرة مع تغليف إهداء ملكي', 1, 150, 150, NOW(), NOW()),
  ('ord-mkk-102', 'store-1', 'item-3', 'باقة جوري إكوادوري أحمر ملكي ٥٠ وردة', 1, 520, 520, NOW(), NOW()),
  ('ord-mkk-103', 'store-1', 'item-4', 'فازة أوركيد بيضاء ملكية مزدوجة الساق', 1, 360, 360, NOW(), NOW()),
  ('ord-mkk-104', 'store-1', 'item-5', 'صندوق تخرج مبهج مع بالونات وقبعة تخرج مطرزة', 1, 290, 290, NOW(), NOW()),
  ('ord-mkk-105', 'store-1', 'item-6', 'باقة VIP زهور هيدرانجيا مع شوكولاتة باتشي', 1, 480, 480, NOW(), NOW()),
  ('ord-mkk-106', 'store-1', 'item-7', 'توليب هولندي أبيض في فازة سيراميك إيطالية', 1, 310, 310, NOW(), NOW()),
  ('ord-cof-101', 'store-coffee', 'it-c1', 'كولومبيا غيشا ريزيرف فاخرة ٢٠٠ جرام', 2, 135, 270, NOW(), NOW()),
  ('ord-cof-101', 'store-coffee', 'it-c2', 'طقم تقطير القهوة V60 المتكامل مع السيرفر والفلاتر', 1, 175, 175, NOW(), NOW()),
  ('ord-cof-102', 'store-coffee', 'it-c3', 'غلاية فلو ستاغ EKG الكهربائية الذكية مع تحكم حراري رقمي', 1, 620, 620, NOW(), NOW()),
  ('ord-cof-103', 'store-coffee', 'it-c4', 'إثيوبيا يرقاتشيفي - معالجة مجففة ٢٥٠ جرام', 2, 70, 140, NOW(), NOW()),
  ('ord-cof-103', 'store-coffee', 'it-c5', 'كوستاريكا تارازو - معالجة عسلية صفراء ٢٥٠ جرام', 1, 79, 79, NOW(), NOW()),
  ('ord-cof-103', 'store-coffee', 'it-c6', 'مطحنة قهوة يدوية بتروس فولاذية مخروطية دقيقة', 1, 220, 220, NOW(), NOW()),
  ('ord-cof-104', 'store-coffee', 'it-c7', 'ميزان أكايا لونار الذكي المقاوم للماء لإسبريسو احترافي', 1, 840, 840, NOW(), NOW()),
  ('ord-cof-105', 'store-coffee', 'it-c8', 'خلطة إسبريسو سيغنتشر - شوكولاتة داكنة وبندق ١ كجم', 2, 118, 236, NOW(), NOW()),
  ('ord-cof-105', 'store-coffee', 'it-c9', 'أداة تحضير كيمكس الزجاجية الكلاسيكية ٦ أكواب', 1, 195, 195, NOW(), NOW()),
  ('ord-cof-105', 'store-coffee', 'it-c10', 'بتشر تبخير الحليب ستانلس ستيل ٤٥٠ مل مع قلم رسم', 1, 82, 82, NOW(), NOW()),
  ('ord-cof-106', 'store-coffee', 'it-c11', 'يمن حراز - موكا بري عتيق ٢٠٠ جرام', 1, 150, 150, NOW(), NOW()),
  ('ord-cof-106', 'store-coffee', 'it-c12', 'زجاجة كولد برو منقوع بارد مركز ٥٠٠ مل', 3, 32, 96, NOW(), NOW()),
  ('ord-cof-107', 'store-coffee', 'it-c13', 'كولومبيا غيشا ريزيرف فاخرة ٢٠٠ جرام', 2, 135, 270, NOW(), NOW()),
  ('ord-cof-107', 'store-coffee', 'it-c14', 'إثيوبيا يرقاتشيفي - معالجة مجففة ٢٥٠ جرام', 3, 70, 210, NOW(), NOW()),
  ('ord-cof-107', 'store-coffee', 'it-c15', 'كوستاريكا تارازو - معالجة عسلية صفراء ٢٥٠ جرام', 2, 79, 158, NOW(), NOW()),
  ('ord-cof-107', 'store-coffee', 'it-c16', 'غلاية فلو ستاغ EKG الكهربائية الذكية', 1, 620, 620, NOW(), NOW()),
  ('ord-cof-107', 'store-coffee', 'it-c17', 'مطحنة قهوة يدوية بتروس فولاذية مخروطية', 1, 220, 220, NOW(), NOW()),
  ('ord-cof-108', 'store-coffee', 'it-c18', 'خلطة إسبريسو سيغنتشر - شوكولاتة داكنة وبندق ١ كجم', 3, 118, 354, NOW(), NOW()),
  ('ord-cof-108', 'store-coffee', 'it-c19', 'بتشر تبخير الحليب ستانلس ستيل ٤٥٠ مل', 1, 82, 82, NOW(), NOW()),
  ('ord-cof-108', 'store-coffee', 'it-c20', 'إثيوبيا يرقاتشيفي - معالجة مجففة ٢٥٠ جرام', 5, 70, 350, NOW(), NOW()),
  ('ord-cof-108', 'store-coffee', 'it-c21', 'زجاجة كولد برو منقوع بارد مركز ٥٠٠ مل', 1, 32, 32, NOW(), NOW()),
  ('ord-cof-108', 'store-coffee', 'it-c22', 'كوستاريكا تارازو - معالجة عسلية صفراء ٢٥٠ جرام', 0.25, 79, 21, NOW(), NOW()),
  ('ord-blc-101', 'store-bleco', 'it-b1', 'بكج اليوم الوطني الذهبي (تنجيد كراسي + أرضيات 7D + وسائد إهداء)', 1, 1680, 1680, NOW(), NOW()),
  ('ord-blc-102', 'store-bleco', 'it-b2', 'طقم تنجيد كراسي ملكي كامل جلد نابا ألماني فاخر', 1, 1480, 1480, NOW(), NOW()),
  ('ord-blc-103', 'store-bleco', 'it-b3', 'أرضيات ودعاسات دايموند 7D تغطية شاملة مع دواسة معدنية', 1, 384, 384, NOW(), NOW()),
  ('ord-blc-103', 'store-bleco', 'it-b4', 'بطانة وعازل الشنطة الخلفية ثلاثي الأبعاد مضاد للسوائل', 1, 312, 312, NOW(), NOW()),
  ('ord-blc-104', 'store-bleco', 'it-b5', 'بكج اليوم الوطني الذهبي (تنجيد كراسي + أرضيات 7D + وسائد إهداء)', 1, 1680, 1680, NOW(), NOW()),
  ('ord-blc-104', 'store-bleco', 'it-b6', 'خدمة الفحص والتركيب المنزلي السريع لكبار الشخصيات', 1, 200, 200, NOW(), NOW()),
  ('ord-blc-105', 'store-bleco', 'it-b7', 'تلبيس وتخشيب ديكورات الأبواب وسقف الكانتارا الرياضي', 1, 960, 960, NOW(), NOW()),
  ('ord-blc-106', 'store-bleco', 'it-b8', 'أرضيات ودعاسات دايموند 7D تغطية شاملة مع دواسة معدنية', 1, 384, 384, NOW(), NOW()),
  ('ord-blc-107', 'store-bleco', 'it-b9', 'طقم تنجيد كراسي ملكي كامل جلد نابا ألماني فاخر', 1, 1480, 1480, NOW(), NOW()),
  ('ord-blc-107', 'store-bleco', 'it-b10', 'غلاف وتلبيس مقود جلد مثقب مع خياطة يدوية دقيقة', 1, 152, 152, NOW(), NOW()),
  ('ord-blc-108', 'store-bleco', 'it-b11', 'أرضيات ودعاسات دايموند 7D تغطية شاملة مع دواسة معدنية', 3, 384, 1152, NOW(), NOW()),
  ('ord-blc-108', 'store-bleco', 'it-b12', 'بطانة وعازل الشنطة الخلفية ثلاثي الأبعاد مضاد للسوائل', 3, 312, 936, NOW(), NOW()),
  ('ord-blc-109', 'store-bleco', 'it-b13', 'بكج اليوم الوطني الذهبي (تنجيد كراسي + أرضيات 7D + وسائد إهداء)', 2, 1680, 3360, NOW(), NOW()),
  ('ord-blc-110', 'store-bleco', 'it-b14', 'طقم تنجيد كراسي ملكي كامل جلد نابا ألماني فاخر', 1, 1480, 1480, NOW(), NOW()),
  ('ord-blc-110', 'store-bleco', 'it-b15', 'مجموعة نانو سيراميك ألمانية لحماية وترطيب المقاعد الجلدية', 1, 224, 224, NOW(), NOW()),
  ('ord-blc-111', 'store-bleco', 'it-b16', 'أرضيات ودعاسات دايموند 7D تغطية شاملة مع دواسة معدنية', 1, 384, 384, NOW(), NOW()),
  ('ord-blc-111', 'store-bleco', 'it-b17', 'غطاء طبلون جلد ليزري مخصص حماية من حرارة شمس الخليج', 1, 128, 128, NOW(), NOW()),
  ('ord-blc-111', 'store-bleco', 'it-b18', 'طقم وسائد الرقبة والقطنية ميموري فوم جلد فاخر', 1, 192, 192, NOW(), NOW()),
  ('ord-blc-112', 'store-bleco', 'it-b19', 'طقم تنجيد كراسي ملكي كامل جلد نابا ألماني فاخر', 5, 1480, 7400, NOW(), NOW()),
  ('ord-blc-113', 'store-bleco', 'it-b20', 'تلبيس وتخشيب ديكورات الأبواب وسقف الكانتارا الرياضي', 1, 960, 960, NOW(), NOW()),
  ('ord-blc-113', 'store-bleco', 'it-b21', 'أرضيات ودعاسات دايموند 7D تغطية شاملة مع دواسة معدنية', 1, 384, 384, NOW(), NOW()),
  ('ord-blc-114', 'store-bleco', 'it-b22', 'بكج اليوم الوطني الذهبي (تنجيد كراسي + أرضيات 7D + وسائد إهداء)', 1, 1680, 1680, NOW(), NOW()),
  ('ord-blc-114', 'store-bleco', 'it-b23', 'مجموعة نانو سيراميك ألمانية لحماية وترطيب المقاعد الجلدية', 1, 224, 224, NOW(), NOW());

-- ====================================================================
-- COUPONS (store-1, store-coffee, store-bleco)
-- ====================================================================
INSERT INTO `coupons` (
  `id`,`store_id`,`code`,`discount_type`,`discount_value`,`min_order_amount`,`usage_count`,`max_uses`,`status`,`is_active`,`expires_at`,`created_at`,`updated_at`
) VALUES
  ('coup-1', 'store-1', 'MAKKAH10', 'percentage', 10, 200, 148, 500, 'active', 1, '2026-12-31 23:59:59', NOW(), NOW()),
  ('coup-makkah15', 'store-1', 'MAKKAH15', 'percentage', 15, 150, 12, 1000, 'active', 1, '2026-12-31 23:59:59', NOW(), NOW()),
  ('coup-2', 'store-1', 'HARAM_VIP', 'fixed', 50, 400, 84, 250, 'active', 1, '2026-12-31 23:59:59', NOW(), NOW()),
  ('coup-cof-1', 'store-coffee', 'BARISTA15', 'percentage', 15, 150, 84, 500, 'active', 1, '2026-12-31 23:59:59', NOW(), NOW()),
  ('coup-cof-2', 'store-coffee', 'FREESHIP', 'fixed', 25, 180, 142, 1000, 'active', 1, '2026-12-31 23:59:59', NOW(), NOW()),
  ('coup-cof-3', 'store-coffee', 'COFFEE10', 'percentage', 10, 100, 38, 500, 'active', 1, '2026-12-31 23:59:59', NOW(), NOW()),
  ('coup-blc-1', 'store-bleco', 'Saudi', 'percentage', 20, 0, 312, 5000, 'active', 1, '2026-12-31 23:59:59', NOW(), NOW()),
  ('coup-blc-2', 'store-bleco', 'BLACKO10', 'percentage', 10, 200, 54, 1000, 'active', 1, '2026-12-31 23:59:59', NOW(), NOW()),
  ('coup-blc-3', 'store-bleco', 'FLEETVIP', 'percentage', 15, 2500, 18, 100, 'active', 1, '2026-12-31 23:59:59', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `discount_type`=VALUES(`discount_type`),
  `discount_value`=VALUES(`discount_value`),
  `usage_count`=VALUES(`usage_count`),
  `is_active`=VALUES(`is_active`),
  `updated_at`=VALUES(`updated_at`);

-- ====================================================================
-- SHIPPING ZONES (store-1, store-coffee, store-bleco)
-- ====================================================================
INSERT INTO `shipping_zones` (
  `id`,`store_id`,`name`,`region`,`rate`,`free_above`,`estimated_delivery`,`status`,`is_active`,`min_delivery_days`,`max_delivery_days`,`created_at`,`updated_at`
) VALUES
  ('ship-1', 'store-1', 'Makkah - Al Haram & Clock Tower Hotels', 'Makkah Region', 0, 300, '1-2 Hours Express', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-2', 'store-1', 'Makkah - Al-Aziziyah & Mahbas Al-Jinn', 'Makkah Region', 20, 250, '2 Hours Same Day', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-3', 'store-1', 'Makkah - Al-Shawqiyyah & Al-Kaakiyyah', 'Makkah Region', 25, 300, '2-3 Hours Same Day', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-4', 'store-1', 'Jeddah - Corniche & Obhur', 'Makkah Region', 45, 500, 'Same Day / Next Day', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-5', 'store-1', 'Riyadh - North & Olaya', 'Riyadh Region', 55, 600, '1 - 2 Business Days', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-6', 'store-1', 'Madinah - Central Hotels', 'Madinah Region', 50, 550, '1 - 2 Business Days', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-7', 'store-1', 'Dammam - Corniche', 'Eastern Province', 65, 700, '2 - 3 Business Days', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-cof-1', 'store-coffee', 'الرياض - وسط الرياض والعليا', 'منطقة الرياض', 15, 180, 'ساعتان - توصيل محمص طازج', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-cof-2', 'store-coffee', 'الرياض - شمال الرياض والحي الدبلوماسي', 'منطقة الرياض', 20, 180, 'نفس اليوم (خلال الفترة المسائية)', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-cof-3', 'store-coffee', 'المنطقة الشرقية - الخبر، الدمام، الظهران', 'المنطقة الشرقية', 25, 220, '١ - ٢ يوم عمل عبر سمسا', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-cof-4', 'store-coffee', 'جدة ومكة المكرمة والمدينة المنورة', 'منطقة مكة المكرمة', 28, 250, '١ - ٢ يوم عمل express', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-cof-5', 'store-coffee', 'باقي مدن المملكة (القصيم، حائل، تبوك، أبها)', 'كافة المناطق', 32, 300, '٢ - ٣ أيام عمل عبر SPL/SMSA', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-blc-1', 'store-bleco', 'الرياض - فريق التركيب الفوري المتنقل عند المنزل (VIP)', 'منطقة الرياض', 0, 500, 'نفس اليوم / حجز موعد فوري VIP', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-blc-2', 'store-bleco', 'الرياض - استلام وتركيب بالمعرض الرئيسي (طريق الملك فهد)', 'منطقة الرياض', 0, 300, 'استلام فوري مع فحص الجودة', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-blc-3', 'store-bleco', 'المنطقة الغربية - جدة ومكة المكرمة والطائف', 'منطقة مكة المكرمة', 35, 800, '٢ - ٣ أيام عمل شحن مؤمن', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-blc-4', 'store-bleco', 'المنطقة الشرقية - الدمام، الخبر، الجبيل، الأحساء', 'المنطقة الشرقية', 35, 800, '٢ - ٣ أيام عمل سمسا إكسبريس', 'active', 1, 0, 3, NOW(), NOW()),
  ('ship-blc-5', 'store-bleco', 'كافة محافظات ومدن المملكة (عسير، تبوك، القصيم، نجران)', 'كافة مناطق المملكة', 45, 1000, '٣ - ٤ أيام عمل شحن آمن مع تتبع', 'active', 1, 0, 3, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `region`=VALUES(`region`),
  `rate`=VALUES(`rate`),
  `free_above`=VALUES(`free_above`),
  `estimated_delivery`=VALUES(`estimated_delivery`),
  `is_active`=VALUES(`is_active`),
  `updated_at`=VALUES(`updated_at`);

-- ====================================================================
-- DOMAINS (Store Domain Bindings)
-- ====================================================================
INSERT INTO `domains` (
  `id`,`store_id`,`domain_name`,`is_primary`,`ssl_status`,`dns_configured`,`dns_verified`,`hosting_tier`,`monthly_fee`,`payment_received`,`status`,`nameservers`,`registered_date`,`created_at`,`updated_at`
) VALUES
  ('dom-1','store-1','giftshop-sa.com',1,'active',1,1,'Hostinger Shared Premium',49.00,1,'active','["ns1.dns-parking.com","ns2.dns-parking.com"]','2024-01-10',NOW(),NOW()),
  ('dom-coffee','store-coffee','specialtycoffee.sa',1,'active',1,1,'Hostinger Shared Business',59.00,1,'active','["ns1.dns-parking.com","ns2.dns-parking.com"]','2024-02-15',NOW(),NOW()),
  ('dom-bleco','store-bleco','tanjeedmakkah.com',1,'active',1,1,'Hostinger Shared Business',69.00,1,'active','["ns1.dns-parking.com","ns2.dns-parking.com"]','2024-03-01',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `domain_name`=VALUES(`domain_name`),
  `ssl_status`=VALUES(`ssl_status`),
  `dns_verified`=VALUES(`dns_verified`),
  `updated_at`=VALUES(`updated_at`);

-- ====================================================================
-- PAYMENT GATEWAYS (Moyasar, Tabby, Tamara, COD)
-- ====================================================================
INSERT INTO `payment_gateways` (
  `id`,`store_id`,`provider`,`title`,`title_ar`,`is_enabled`,`is_sandbox`,`public_key`,`secret_key`,`supported_methods`,`transaction_fee_percent`,`transaction_fee_fixed`,`status`,`last_tested_at`,`created_at`,`updated_at`
) VALUES
  ('gw-moy-mkk','store-1','moyasar','Moyasar Payment Gateway','بوابة دفع ميسر (مدى، آبل باي، فيزا)',1,1,'pk_test_moyasar_mkk','sk_test_moyasar_mkk','["mada","apple_pay","visa","mastercard"]',1.75,1.00,'connected',NOW(),NOW(),NOW()),
  ('gw-tab-mkk','store-1','tabby','Tabby Installments','تابي - قسّمها على 4 دفعات بدون فوائد',1,1,'pk_test_tabby_mkk','sk_test_tabby_mkk','["tabby_installments"]',4.50,0.00,'connected',NOW(),NOW(),NOW()),
  ('gw-tam-mkk','store-1','tamara','Tamara BNPL','تمارا - قسّم فاتورتك على 4 دفعات',1,1,'pk_test_tamara_mkk','sk_test_tamara_mkk','["tamara_pay_in_4"]',4.50,0.00,'connected',NOW(),NOW(),NOW()),
  ('gw-cod-mkk','store-1','cod','Cash on Delivery','الدفع نقداً عند الاستلام',1,0,NULL,NULL,'["cod"]',0.00,0.00,'connected',NOW(),NOW(),NOW()),

  ('gw-moy-cof','store-coffee','moyasar','Moyasar Payment Gateway','بوابة دفع ميسر (مدى، آبل باي، فيزا)',1,1,'pk_test_moyasar_cof','sk_test_moyasar_cof','["mada","apple_pay","visa","mastercard"]',1.75,1.00,'connected',NOW(),NOW(),NOW()),
  ('gw-tab-cof','store-coffee','tabby','Tabby Installments','تابي - قسّمها على 4 دفعات بدون فوائد',1,1,'pk_test_tabby_cof','sk_test_tabby_cof','["tabby_installments"]',4.50,0.00,'connected',NOW(),NOW(),NOW()),
  ('gw-tam-cof','store-coffee','tamara','Tamara BNPL','تمارا - قسّم فاتورتك على 4 دفعات',1,1,'pk_test_tamara_cof','sk_test_tamara_cof','["tamara_pay_in_4"]',4.50,0.00,'connected',NOW(),NOW(),NOW()),
  ('gw-cod-cof','store-coffee','cod','Cash on Delivery','الدفع نقداً عند الاستلام',1,0,NULL,NULL,'["cod"]',0.00,0.00,'connected',NOW(),NOW(),NOW()),

  ('gw-moy-blc','store-bleco','moyasar','Moyasar Payment Gateway','بوابة دفع ميسر (مدى، آبل باي، فيزا)',1,1,'pk_test_moyasar_blc','sk_test_moyasar_blc','["mada","apple_pay","visa","mastercard"]',1.75,1.00,'connected',NOW(),NOW(),NOW()),
  ('gw-tab-blc','store-bleco','tabby','Tabby Installments','تابي - قسّمها على 4 دفعات بدون فوائد',1,1,'pk_test_tabby_blc','sk_test_tabby_blc','["tabby_installments"]',4.50,0.00,'connected',NOW(),NOW(),NOW()),
  ('gw-tam-blc','store-bleco','tamara','Tamara BNPL','تمارا - قسّم فاتورتك على 4 دفعات',1,1,'pk_test_tamara_blc','sk_test_tamara_blc','["tamara_pay_in_4"]',4.50,0.00,'connected',NOW(),NOW(),NOW()),
  ('gw-cod-blc','store-bleco','cod','Cash on Delivery','الدفع نقداً عند الاستلام',1,0,NULL,NULL,'["cod"]',0.00,0.00,'connected',NOW(),NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `title`=VALUES(`title`),
  `title_ar`=VALUES(`title_ar`),
  `is_enabled`=VALUES(`is_enabled`),
  `supported_methods`=VALUES(`supported_methods`),
  `status`=VALUES(`status`),
  `updated_at`=VALUES(`updated_at`);

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- SEED COMPLETE — All 3 Stores (store-1, store-coffee, store-bleco)
-- SuperAdmin: master@unityteck.com / UnityMaster@2026!Secure
-- ====================================================================
