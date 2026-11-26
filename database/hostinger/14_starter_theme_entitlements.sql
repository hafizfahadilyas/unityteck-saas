-- Souq CT-2 / CT-3: Starter plan (100 SAR) + theme marketplace entitlements
-- Safe to re-run. docs/36-souq-common-theme-subscription-marketplace.md

-- stores.plan ENUM: add starter
ALTER TABLE `stores`
  MODIFY COLUMN `plan` ENUM('free','paid','starter','pro','premium','custom') NOT NULL DEFAULT 'free';

-- plans row
INSERT INTO `plans` (`id`, `code`, `name`, `price_sar`, `product_limit`, `storage_mb`, `team_seats`, `features`, `is_active`, `created_at`, `updated_at`)
VALUES (
  'plan-starter',
  'starter',
  'Starter',
  100,
  250,
  2048,
  2,
  '["catalog","orders","basic_seo","seo","coupons","shipping","themes_basic","media_studio","whatsapp"]',
  1,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `price_sar` = VALUES(`price_sar`),
  `product_limit` = VALUES(`product_limit`),
  `storage_mb` = VALUES(`storage_mb`),
  `team_seats` = VALUES(`team_seats`),
  `features` = VALUES(`features`),
  `is_active` = 1,
  `updated_at` = NOW();

-- themes_catalog marketplace columns
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'themes_catalog' AND COLUMN_NAME = 'name_ar'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `themes_catalog` ADD COLUMN `name_ar` varchar(255) NULL DEFAULT NULL AFTER `name`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'themes_catalog' AND COLUMN_NAME = 'price_sar'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `themes_catalog` ADD COLUMN `price_sar` int unsigned NULL DEFAULT NULL AFTER `tier`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'themes_catalog' AND COLUMN_NAME = 'included_in_tiers'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `themes_catalog` ADD COLUMN `included_in_tiers` json NULL AFTER `price_sar`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'themes_catalog' AND COLUMN_NAME = 'is_active'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `themes_catalog` ADD COLUMN `is_active` tinyint(1) NOT NULL DEFAULT 1 AFTER `is_default`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE `themes_catalog`
SET
  `name_ar` = COALESCE(`name_ar`, 'بداية التجارة'),
  `price_sar` = COALESCE(`price_sar`, 0),
  `included_in_tiers` = COALESCE(`included_in_tiers`, JSON_ARRAY('starter','pro','premium','custom','free','paid')),
  `is_active` = 1
WHERE `id` = 'theme-commerce-starter';

CREATE TABLE IF NOT EXISTS `store_theme_entitlements` (
  `id` varchar(64) NOT NULL,
  `store_id` varchar(64) NOT NULL,
  `theme_id` varchar(64) NOT NULL,
  `source` varchar(32) NOT NULL DEFAULT 'purchase',
  `price_sar` int unsigned DEFAULT NULL,
  `granted_at` timestamp NULL DEFAULT NULL,
  `granted_by` varchar(64) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ste_store_theme_uq` (`store_id`,`theme_id`),
  KEY `store_theme_entitlements_store_id_source_index` (`store_id`,`source`),
  CONSTRAINT `store_theme_entitlements_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_theme_entitlements_theme_id_foreign` FOREIGN KEY (`theme_id`) REFERENCES `themes_catalog` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
