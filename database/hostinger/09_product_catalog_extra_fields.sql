-- Product list catalog extras: brand, type, Google taxonomy, sales channels, discount window
-- Safe to re-run: adds columns only when missing.

SET @db := DATABASE();

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='products' AND COLUMN_NAME='brand'),
    'SELECT 1',
    'ALTER TABLE `products` ADD COLUMN `brand` VARCHAR(191) NULL DEFAULT NULL AFTER `category_ar`'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='products' AND COLUMN_NAME='product_type'),
    'SELECT 1',
    'ALTER TABLE `products` ADD COLUMN `product_type` VARCHAR(100) NULL DEFAULT NULL AFTER `brand`'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='products' AND COLUMN_NAME='google_taxonomy'),
    'SELECT 1',
    'ALTER TABLE `products` ADD COLUMN `google_taxonomy` VARCHAR(500) NULL DEFAULT NULL AFTER `product_type`'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='products' AND COLUMN_NAME='sales_channels'),
    'SELECT 1',
    'ALTER TABLE `products` ADD COLUMN `sales_channels` JSON NULL AFTER `google_taxonomy`'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='products' AND COLUMN_NAME='discount_start_at'),
    'SELECT 1',
    'ALTER TABLE `products` ADD COLUMN `discount_start_at` DATE NULL DEFAULT NULL AFTER `original_price`'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='products' AND COLUMN_NAME='discount_end_at'),
    'SELECT 1',
    'ALTER TABLE `products` ADD COLUMN `discount_end_at` DATE NULL DEFAULT NULL AFTER `discount_start_at`'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coffee catalog backfill (real store attributes only; discount dates stay NULL until merchant sets them)
UPDATE `products`
SET
  `brand` = COALESCE(NULLIF(`brand`, ''), 'HiBrew'),
  `product_type` = COALESCE(NULLIF(`product_type`, ''), 'Physical Product'),
  `sales_channels` = COALESCE(`sales_channels`, JSON_ARRAY('Online Store')),
  `google_taxonomy` = COALESCE(
    NULLIF(`google_taxonomy`, ''),
    CASE
      WHEN `category` LIKE '%مطح%' OR `category` LIKE '%Mill%' THEN
        'Home & Garden > Kitchen & Dining > Kitchen Appliance Accessories > Coffee Maker & Espresso Machine Accessories > Coffee Grinders'
      WHEN `category` LIKE '%دولاب%' OR `category` LIKE '%ركن%' OR `category` LIKE '%Cabinet%' THEN
        'Furniture > Tables > Accent Tables > Coffee Tables'
      WHEN `category` LIKE '%مستلزم%' OR `category` LIKE '%أكواب%' OR `category` LIKE '%Accessories%' THEN
        'Home & Garden > Kitchen & Dining > Kitchen Appliance Accessories > Coffee Maker & Espresso Machine Accessories'
      ELSE
        'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines'
    END
  )
WHERE `store_id` = 'store-coffee';
