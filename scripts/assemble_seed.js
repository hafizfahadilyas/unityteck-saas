import fs from 'fs';

const catAndProdSql = fs.readFileSync('database/hostinger/generated_catalog_seed.sql', 'utf8');

const seedHeader = `-- ====================================================================
-- UNITYTECK HOSTINGER MYSQL SEED (matches DatabaseSeeder)
-- Plans free/paid/pro/custom · store-1 · 19 Categories · 39 Products
-- Idempotent: INSERT ... ON DUPLICATE KEY UPDATE
-- Run AFTER 01_schema.sql
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET time_zone = "+00:00";

-- Plans
INSERT INTO \`plans\` (\`id\`,\`code\`,\`name\`,\`product_limit\`,\`storage_mb\`,\`team_seats\`,\`features\`,\`is_active\`,\`created_at\`,\`updated_at\`) VALUES
  ('plan-free','free','Free',50,512,1,'["catalog","orders","basic_seo"]',1,NOW(),NOW()),
  ('plan-paid','paid','Paid',500,5120,5,'["catalog","orders","seo","coupons","shipping","analytics"]',1,NOW(),NOW()),
  ('plan-pro','pro','Pro',5000,51200,20,'["catalog","orders","seo","coupons","shipping","themes","backups","zatca","analytics","ai"]',1,NOW(),NOW()),
  ('plan-custom','custom','Custom',NULL,NULL,NULL,'["all"]',1,NOW(),NOW())
ON DUPLICATE KEY UPDATE
  \`name\`=VALUES(\`name\`),
  \`product_limit\`=VALUES(\`product_limit\`),
  \`storage_mb\`=VALUES(\`storage_mb\`),
  \`team_seats\`=VALUES(\`team_seats\`),
  \`features\`=VALUES(\`features\`),
  \`is_active\`=VALUES(\`is_active\`),
  \`updated_at\`=VALUES(\`updated_at\`);

-- Theme catalog
INSERT INTO \`themes_catalog\` (\`id\`,\`name\`,\`category\`,\`preview_color\`,\`is_default\`,\`created_at\`,\`updated_at\`) VALUES
  ('theme-flora-luxe','هدايا مكة — ثيم الزهور الفاخرة (Mecca Gifts — Luxury Flowers Theme)','Flowers & Luxury','#102a1c',1,NOW(),NOW()),
  ('theme-makkah-royal','Makkah Royal Rose','Luxury','#064e3b',0,NOW(),NOW()),
  ('theme-blossom-cream','Blossom Cream & Blush','Minimal','#f43f5e',0,NOW(),NOW()),
  ('theme-umrah-spiritual','Spiritual Umrah & Eid','Ramadan','#1e1b4b',0,NOW(),NOW()),
  ('theme-bridal-elegance','Bridal Elegance','Luxury','#c084fc',0,NOW(),NOW())
ON DUPLICATE KEY UPDATE
  \`name\`=VALUES(\`name\`),
  \`category\`=VALUES(\`category\`),
  \`preview_color\`=VALUES(\`preview_color\`),
  \`is_default\`=VALUES(\`is_default\`),
  \`updated_at\`=VALUES(\`updated_at\`);

-- Master admin (password = UnityMaster@2026!Secure) — Phase 2.3 role = super_admin
INSERT INTO \`users\` (\`id\`,\`name\`,\`email\`,\`password\`,\`role\`,\`created_at\`,\`updated_at\`) VALUES
  ('user-master-1','Unityteck Master','master@unityteck.com','$2y$10$wCSbvf2RMp5uLgWu4Fuov.sVPgvgpAyXdSkclJBKrvS/VdyZ0hypO','super_admin',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  \`name\`=VALUES(\`name\`),
  \`password\`=VALUES(\`password\`),
  \`role\`=VALUES(\`role\`),
  \`updated_at\`=VALUES(\`updated_at\`);

-- Store owner (password = MakkahStore@2026!Secure) — Phase 2.3 role = manager
INSERT INTO \`users\` (\`id\`,\`name\`,\`email\`,\`password\`,\`role\`,\`created_at\`,\`updated_at\`) VALUES
  ('user-store-1','Tariq Al-Makki','tariq@wardalmakkah.sa','$2y$10$314.51pLFzmzWX.lZf1PKexYD2PDdF21bSFX4h7eyf/7490E7/k3y','manager',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  \`name\`=VALUES(\`name\`),
  \`password\`=VALUES(\`password\`),
  \`role\`=VALUES(\`role\`),
  \`updated_at\`=VALUES(\`updated_at\`);

-- Support seat (password = WardSupport@2026!Secure) — cannot products.write
INSERT INTO \`users\` (\`id\`,\`name\`,\`email\`,\`password\`,\`role\`,\`created_at\`,\`updated_at\`) VALUES
  ('user-store-support-1','Ward Support','support@wardalmakkah.sa','$2y$10$KGrJ129nEy.PUUDA3Tti4uNc86StNhnHmJQYvPqPqG.9.VsakEbM6','support',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  \`name\`=VALUES(\`name\`),
  \`password\`=VALUES(\`password\`),
  \`role\`=VALUES(\`role\`),
  \`updated_at\`=VALUES(\`updated_at\`);

-- Store-1 (Makkah Fresh Flowers — 1st client)
INSERT INTO \`stores\` (
  \`id\`,\`name\`,\`slug\`,\`domain\`,\`status\`,\`plan\`,\`master_granted_pro\`,\`currency\`,
  \`locale\`,\`text_direction\`,\`timezone\`,
  \`phone\`,\`email\`,\`owner_name\`,\`city\`,\`country\`,\`category\`,\`logo\`,\`accent_color\`,
  \`hosting_mode\`,\`db_isolation\`,\`products_count\`,\`orders_count\`,\`revenue\`,\`visitors_count\`,
  \`created_at\`,\`updated_at\`
) VALUES (
  'store-1','Makkah Fresh Flowers','makkah-fresh-flowers','giftshop-sa.com','active','pro',1,'SAR',
  'ar','rtl','Asia/Riyadh',
  '+966500000001','tariq@wardalmakkah.sa','Tariq Al-Makki','Makkah','Saudi Arabia',
  'Real Fresh Flowers & Luxury Gifts','flower','#059669',
  'dedicated','dedicated_mysql',39,3,1610.00,1420,
  NOW(),NOW()
)
ON DUPLICATE KEY UPDATE
  \`name\`=VALUES(\`name\`),
  \`slug\`=VALUES(\`slug\`),
  \`domain\`=VALUES(\`domain\`),
  \`locale\`=VALUES(\`locale\`),
  \`text_direction\`=VALUES(\`text_direction\`),
  \`timezone\`=VALUES(\`timezone\`),
  \`status\`=VALUES(\`status\`),
  \`plan\`=VALUES(\`plan\`),
  \`master_granted_pro\`=VALUES(\`master_granted_pro\`),
  \`products_count\`=VALUES(\`products_count\`),
  \`orders_count\`=VALUES(\`orders_count\`),
  \`revenue\`=VALUES(\`revenue\`),
  \`visitors_count\`=VALUES(\`visitors_count\`),
  \`updated_at\`=VALUES(\`updated_at\`);

-- Store membership (Phase 2.3 roles)
INSERT INTO \`store_users\` (\`id\`,\`store_id\`,\`user_id\`,\`role\`,\`created_at\`,\`updated_at\`) VALUES
  ('su-store-1-owner','store-1','user-store-1','manager',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  \`role\`=VALUES(\`role\`),
  \`updated_at\`=VALUES(\`updated_at\`);

INSERT INTO \`store_users\` (\`id\`,\`store_id\`,\`user_id\`,\`role\`,\`created_at\`,\`updated_at\`) VALUES
  ('su-store-1-support','store-1','user-store-support-1','support',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  \`role\`=VALUES(\`role\`),
  \`updated_at\`=VALUES(\`updated_at\`);

INSERT INTO \`subscriptions\` (\`id\`,\`store_id\`,\`plan_id\`,\`status\`,\`billing_interval\`,\`starts_at\`,\`ends_at\`,\`grace_ends_at\`,\`renewed_at\`,\`created_at\`,\`updated_at\`) VALUES
  ('sub-store-1','store-1','plan-pro','active','yearly',DATE_SUB(NOW(), INTERVAL 6 MONTH),DATE_ADD(NOW(), INTERVAL 1 YEAR),NULL,DATE_SUB(NOW(), INTERVAL 6 MONTH),NOW(),NOW())
ON DUPLICATE KEY UPDATE
  \`plan_id\`=VALUES(\`plan_id\`),
  \`status\`=VALUES(\`status\`),
  \`billing_interval\`=VALUES(\`billing_interval\`),
  \`starts_at\`=VALUES(\`starts_at\`),
  \`ends_at\`=VALUES(\`ends_at\`),
  \`renewed_at\`=VALUES(\`renewed_at\`),
  \`updated_at\`=VALUES(\`updated_at\`);
`;

const seedFooter = `
-- Customers
INSERT INTO \`customers\` (
  \`id\`,\`store_id\`,\`name\`,\`phone\`,\`email\`,\`status\`,\`city\`,\`country\`,\`gender\`,\`group\`,
  \`acquisition_source\`,\`total_orders\`,\`total_spend\`,\`avg_order_value\`,\`last_order_date\`,\`created_at\`,\`updated_at\`
) VALUES
  ('cust-1','store-1','Abdulrahman Al-Thaqafi (عبدالرحمن الثقفي)','+966 50 442 8819','a.thaqafi@makkah.sa','VIP','Makkah (فنادق الحرم)','Saudi Arabia','Male','VIP','WhatsApp',3,1850.00,616.00,NOW(),NOW(),NOW()),
  ('cust-2','store-1','Sarah Al-Otaibi (سارة العتيبي)','+966 55 981 2234','sarah.otaibi@gmail.com','Active','Makkah (العوالي)','Saudi Arabia','Female','Regular','Instagram',2,760.00,380.00,NOW(),NOW(),NOW()),
  ('cust-3','store-1','Eng. Mohammed Al-Harbi (م. محمد الحربي)','+966 54 112 7765','m.harbi@aramco.com','New','Makkah (جبل عمر)','Saudi Arabia','Male','VIP','Google Ads',1,580.00,580.00,NOW(),NOW(),NOW())
ON DUPLICATE KEY UPDATE
  \`name\`=VALUES(\`name\`),
  \`phone\`=VALUES(\`phone\`),
  \`status\`=VALUES(\`status\`),
  \`total_orders\`=VALUES(\`total_orders\`),
  \`total_spend\`=VALUES(\`total_spend\`),
  \`avg_order_value\`=VALUES(\`avg_order_value\`),
  \`last_order_date\`=VALUES(\`last_order_date\`),
  \`updated_at\`=VALUES(\`updated_at\`);

-- Orders
INSERT INTO \`orders\` (
  \`id\`,\`store_id\`,\`order_number\`,\`customer_id\`,\`customer_name\`,\`customer_phone\`,\`customer_email\`,
  \`items_count\`,\`items_summary\`,\`total_amount\`,\`currency\`,\`source\`,\`source_details\`,
  \`delivery_location\`,\`status\`,\`payment_method\`,\`order_date\`,\`created_at\`,\`updated_at\`
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
  \`status\`=VALUES(\`status\`),
  \`total_amount\`=VALUES(\`total_amount\`),
  \`source\`=VALUES(\`source\`),
  \`order_date\`=VALUES(\`order_date\`),
  \`updated_at\`=VALUES(\`updated_at\`);

-- Order items (no natural unique key — replace for seed orders)
DELETE FROM \`order_items\` WHERE \`order_id\` IN ('ord-101','ord-102','ord-103');
INSERT INTO \`order_items\` (\`order_id\`,\`store_id\`,\`product_id\`,\`product_name\`,\`quantity\`,\`unit_price\`,\`subtotal\`,\`created_at\`,\`updated_at\`) VALUES
  ('ord-101','store-1','wm-vip-03','Makkah Haram VIP Gift Hamper (هدية الحرم الفاخرة مع ماء زمزم)',1,650.00,650.00,NOW(),NOW()),
  ('ord-102','store-1','wm-rose-01','Royal Dutch Red Roses Velvet Box (بوكس الجوري الأحمر الملكي)',1,380.00,380.00,NOW(),NOW()),
  ('ord-103','store-1','wm-bride-04','Luxury Wedding Bridal Bouquet (مسكة عروس راقية من الجوري الطبيعي)',1,580.00,580.00,NOW(),NOW());

-- Coupons
INSERT INTO \`coupons\` (
  \`id\`,\`store_id\`,\`code\`,\`discount_type\`,\`discount_value\`,\`min_order_amount\`,\`usage_count\`,\`max_uses\`,\`status\`,\`is_active\`,\`expires_at\`,\`created_at\`,\`updated_at\`
) VALUES
  ('coup-1','store-1','MAKKAH10','percentage',10.00,200.00,148,500,'active',1,'2026-12-31 23:59:59',NOW(),NOW()),
  ('coup-2','store-1','HARAM_VIP','fixed',50.00,400.00,84,250,'active',1,'2026-12-31 23:59:59',NOW(),NOW())
ON DUPLICATE KEY UPDATE
  \`discount_type\`=VALUES(\`discount_type\`),
  \`discount_value\`=VALUES(\`discount_value\`),
  \`usage_count\`=VALUES(\`usage_count\`),
  \`is_active\`=VALUES(\`is_active\`),
  \`updated_at\`=VALUES(\`updated_at\`);

-- Shipping zones
INSERT INTO \`shipping_zones\` (
  \`id\`,\`store_id\`,\`name\`,\`region\`,\`rate\`,\`free_above\`,\`estimated_delivery\`,\`status\`,\`is_active\`,\`min_delivery_days\`,\`max_delivery_days\`,\`created_at\`,\`updated_at\`
) VALUES
  ('ship-1','store-1','Makkah - Al Haram & Clock Tower Hotels','Makkah Region',0.00,0.00,'1-2 Hours Express','active',1,0,1,NOW(),NOW()),
  ('ship-2','store-1','Makkah - Al-Aziziyah & Mahbas Al-Jinn','Makkah Region',20.00,250.00,'2 Hours Same Day','active',1,0,1,NOW(),NOW()),
  ('ship-3','store-1','Makkah - Al-Shawqiyyah & Al-Kaakiyyah','Makkah Region',25.00,300.00,'2-3 Hours Same Day','active',1,0,1,NOW(),NOW())
ON DUPLICATE KEY UPDATE
  \`name\`=VALUES(\`name\`),
  \`rate\`=VALUES(\`rate\`),
  \`free_above\`=VALUES(\`free_above\`),
  \`estimated_delivery\`=VALUES(\`estimated_delivery\`),
  \`is_active\`=VALUES(\`is_active\`),
  \`updated_at\`=VALUES(\`updated_at\`);

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- SEED COMPLETE — master@unityteck.com / UnityMaster@2026!Secure · tariq@wardalmakkah.sa / MakkahStore@2026!Secure · store-1
-- ====================================================================
`;

fs.writeFileSync('database/hostinger/02_seed.sql', seedHeader + '\n' + catAndProdSql + '\n' + seedFooter, 'utf8');
console.log('Successfully wrote 02_seed.sql!');
