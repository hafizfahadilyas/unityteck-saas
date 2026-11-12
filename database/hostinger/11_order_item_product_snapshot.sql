-- Snapshot product brand/category/sku/image onto order_items (per store_id lines)
SET @db = DATABASE();

SET @sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order_items' AND COLUMN_NAME='sku'),
    'SELECT 1',
    'ALTER TABLE `order_items` ADD COLUMN `sku` VARCHAR(100) NULL DEFAULT NULL AFTER `product_name`'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order_items' AND COLUMN_NAME='brand'),
    'SELECT 1',
    'ALTER TABLE `order_items` ADD COLUMN `brand` VARCHAR(191) NULL DEFAULT NULL AFTER `sku`'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order_items' AND COLUMN_NAME='category'),
    'SELECT 1',
    'ALTER TABLE `order_items` ADD COLUMN `category` VARCHAR(191) NULL DEFAULT NULL AFTER `brand`'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='order_items' AND COLUMN_NAME='image_url'),
    'SELECT 1',
    'ALTER TABLE `order_items` ADD COLUMN `image_url` TEXT NULL DEFAULT NULL AFTER `category`'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
