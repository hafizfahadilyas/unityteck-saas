-- Soft-archive for store Orders (archive/delete stays after API refresh).
-- Run once on Hostinger MySQL. If a column/index already exists, skip that line.

ALTER TABLE `orders` ADD COLUMN `is_archived` TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE `orders` ADD COLUMN `archived_at` DATETIME NULL DEFAULT NULL;
ALTER TABLE `orders` ADD INDEX `orders_store_id_is_archived_index` (`store_id`, `is_archived`);
