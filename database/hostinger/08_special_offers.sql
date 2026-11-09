-- Special / promotional offers with customer banner (per store_id).
-- Safe to re-run: creates only if missing.

CREATE TABLE IF NOT EXISTS `special_offers` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `title_ar` VARCHAR(255) NULL,
  `title_en` VARCHAR(255) NULL,
  `offer_type` VARCHAR(32) NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `min_order_value` DECIMAL(12,2) NULL,
  `max_discount` DECIMAL(12,2) NULL,
  `start_date` TIMESTAMP NULL DEFAULT NULL,
  `end_date` TIMESTAMP NULL DEFAULT NULL,
  `message` VARCHAR(500) NULL,
  `status` ENUM('active','inactive','draft') NOT NULL DEFAULT 'draft',
  `product_scope` VARCHAR(16) NOT NULL DEFAULT 'specific',
  `product_ids` JSON NULL,
  `banner_bg_color` VARCHAR(32) NULL,
  `banner_image_url` VARCHAR(2048) NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `so_store_status` (`store_id`,`status`),
  CONSTRAINT `special_offers_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
