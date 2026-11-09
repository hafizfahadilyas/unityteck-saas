-- Add image_url to cashback_campaigns if missing (Hostinger safe re-run).
SET @db := DATABASE();
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'cashback_campaigns' AND COLUMN_NAME = 'image_url'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `cashback_campaigns` ADD COLUMN `image_url` VARCHAR(2048) NULL AFTER `name`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
