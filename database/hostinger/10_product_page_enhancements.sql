-- Product page enhancements: multi-category list, scheduled publish, discount datetimes
SET @db = DATABASE();

SET @sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='products' AND COLUMN_NAME='category_list'),
    'SELECT 1',
    'ALTER TABLE `products` ADD COLUMN `category_list` JSON NULL DEFAULT NULL AFTER `category_ar`'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='products' AND COLUMN_NAME='published_at'),
    'SELECT 1',
    'ALTER TABLE `products` ADD COLUMN `published_at` TIMESTAMP NULL DEFAULT NULL AFTER `status`'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='products' AND COLUMN_NAME='discount_start_at'),
    'ALTER TABLE `products` MODIFY COLUMN `discount_start_at` DATETIME NULL DEFAULT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='products' AND COLUMN_NAME='discount_end_at'),
    'ALTER TABLE `products` MODIFY COLUMN `discount_end_at` DATETIME NULL DEFAULT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
