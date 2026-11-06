-- ====================================================================
-- PB-01 theme pages, revisions, global styles
-- Twin of apps/api/database/migrations/2026_11_05_031400_create_theme_pages_revisions_and_global_styles.php
-- Run on Hostinger AFTER a backup. Does not change commerce tables.
-- Global styles live only in theme_global_styles (one row per store_id).
-- ====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `theme_pages` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  `title_en` VARCHAR(255) NULL DEFAULT NULL,
  `title_ar` VARCHAR(255) NULL DEFAULT NULL,
  `draft_layout` JSON NULL,
  `published_layout` JSON NULL,
  `seo` JSON NULL,
  `header_mode` VARCHAR(16) NOT NULL DEFAULT 'global',
  `footer_mode` VARCHAR(16) NOT NULL DEFAULT 'global',
  `status` VARCHAR(16) NOT NULL DEFAULT 'draft',
  `published_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_by` VARCHAR(64) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `theme_pages_store_id_slug_unique` (`store_id`, `slug`),
  KEY `theme_pages_store_id_status_index` (`store_id`, `status`),
  CONSTRAINT `theme_pages_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `theme_revisions` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `page_id` VARCHAR(64) NULL DEFAULT NULL,
  `snapshot` JSON NULL,
  `created_by` VARCHAR(64) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `theme_revisions_store_id_created_at_index` (`store_id`, `created_at`),
  CONSTRAINT `theme_revisions_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `theme_revisions_page_id_foreign` FOREIGN KEY (`page_id`) REFERENCES `theme_pages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `theme_global_styles` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `styles` JSON NULL,
  `updated_by` VARCHAR(64) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `theme_global_styles_store_id_unique` (`store_id`),
  CONSTRAINT `theme_global_styles_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

SET @pb01_migration := '2026_11_05_031400_create_theme_pages_revisions_and_global_styles';
SET @pb01_exists := (SELECT COUNT(*) FROM `migrations` WHERE `migration` = @pb01_migration);
SET @pb01_batch := (SELECT IFNULL(MAX(`batch`), 0) + 1 FROM `migrations`);

INSERT INTO `migrations` (`migration`, `batch`)
SELECT @pb01_migration, @pb01_batch
WHERE @pb01_exists = 0;
