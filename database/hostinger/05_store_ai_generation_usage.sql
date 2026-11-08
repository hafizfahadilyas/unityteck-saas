-- Per-store AI image/video monthly meters (Asia/Riyadh period_key = YYYY-MM)
CREATE TABLE IF NOT EXISTS `store_ai_generation_usage` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `period_key` VARCHAR(16) NOT NULL,
  `images_used` INT UNSIGNED NOT NULL DEFAULT 0,
  `videos_used` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_ai_generation_usage_store_period_unique` (`store_id`, `period_key`),
  KEY `store_ai_generation_usage_store_period_index` (`store_id`, `period_key`),
  CONSTRAINT `store_ai_generation_usage_store_id_foreign`
    FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
