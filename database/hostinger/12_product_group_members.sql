-- HiBrew coffee-only: parent grouped product → independent child products
-- Safe to re-run: creates table only when missing.

CREATE TABLE IF NOT EXISTS `product_group_members` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `parent_product_id` VARCHAR(64) NOT NULL,
  `child_product_id` VARCHAR(64) NOT NULL,
  `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `selector_image_url` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pgm_store_parent_child_uq` (`store_id`, `parent_product_id`, `child_product_id`),
  UNIQUE KEY `pgm_store_child_uq` (`store_id`, `child_product_id`),
  KEY `pgm_store_parent_sort_idx` (`store_id`, `parent_product_id`, `sort_order`),
  CONSTRAINT `pgm_store_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pgm_parent_fk` FOREIGN KEY (`parent_product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pgm_child_fk` FOREIGN KEY (`child_product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
