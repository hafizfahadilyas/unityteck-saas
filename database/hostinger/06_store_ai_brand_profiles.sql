-- Per-store AI brand identity (brand-consistent image generation). Isolated by store_id.
CREATE TABLE IF NOT EXISTS `store_ai_brand_profiles` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `palette_hex` JSON NULL,
  `persona` VARCHAR(40) NOT NULL DEFAULT 'modern',
  `brand_lock_default` TINYINT(1) NOT NULL DEFAULT 1,
  `logo_overlay_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `logo_overlay_position` VARCHAR(20) NOT NULL DEFAULT 'bottom_end',
  `logo_url` VARCHAR(500) NULL,
  `style_reference_urls` JSON NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_ai_brand_profiles_store_id_unique` (`store_id`),
  KEY `store_ai_brand_profiles_store_id_index` (`store_id`),
  CONSTRAINT `store_ai_brand_profiles_store_id_foreign`
    FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
