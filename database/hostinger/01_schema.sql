-- ====================================================================
-- UNITYTECK MULTI-TENANT E-COMMERCE — HOSTINGER MYSQL 8 DDL
-- Source of truth: apps/api/database/migrations (Phase 1)
-- Charset: utf8mb4 / utf8mb4_unicode_ci · Engine: InnoDB
-- Isolation: store_id FKs on tenant-scoped tables
-- Import order: 01_schema.sql → 02_seed.sql (see README.md)
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;
SET time_zone = "+00:00";

-- --------------------------------------------------------------------
-- Laravel bookkeeping (so migrate can be skipped after phpMyAdmin import)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` VARCHAR(255) NOT NULL,
  `batch` INT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Auth / framework
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(64) NOT NULL DEFAULT 'support',
  `remember_token` VARCHAR(100) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phase 2.2 — OTP stubs (hashed codes; delivery via email/SMS later)
CREATE TABLE IF NOT EXISTS `auth_otps` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `portal` VARCHAR(16) NOT NULL,
  `purpose` VARCHAR(32) NOT NULL,
  `code_hash` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `consumed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `auth_otps_email_portal_purpose_index` (`email`, `portal`, `purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(64) NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `user_agent` TEXT NULL,
  `payload` LONGTEXT NOT NULL,
  `last_activity` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cache` (
  `key` VARCHAR(255) NOT NULL,
  `value` MEDIUMTEXT NOT NULL,
  `expiration` INT NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` VARCHAR(255) NOT NULL,
  `owner` VARCHAR(255) NOT NULL,
  `expiration` INT NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `queue` VARCHAR(255) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `attempts` TINYINT UNSIGNED NOT NULL,
  `reserved_at` INT UNSIGNED NULL DEFAULT NULL,
  `available_at` INT UNSIGNED NOT NULL,
  `created_at` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `job_batches` (
  `id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `total_jobs` INT NOT NULL,
  `pending_jobs` INT NOT NULL,
  `failed_jobs` INT NOT NULL,
  `failed_job_ids` LONGTEXT NOT NULL,
  `options` MEDIUMTEXT NULL,
  `cancelled_at` INT NULL DEFAULT NULL,
  `created_at` INT NOT NULL,
  `finished_at` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(255) NOT NULL,
  `connection` TEXT NOT NULL,
  `queue` TEXT NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `exception` LONGTEXT NOT NULL,
  `failed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` VARCHAR(255) NOT NULL,
  `tokenable_id` VARCHAR(64) NOT NULL,
  `name` TEXT NOT NULL,
  `token` VARCHAR(64) NOT NULL,
  `abilities` TEXT NULL,
  `last_used_at` TIMESTAMP NULL DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Tenancy core
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stores` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `domain` VARCHAR(255) NULL DEFAULT NULL,
  `status` ENUM('active','inactive','pending','suspended') NOT NULL DEFAULT 'pending',
  `plan` ENUM('free','paid','pro','custom') NOT NULL DEFAULT 'free',
  `master_granted_pro` TINYINT(1) NOT NULL DEFAULT 0,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'SAR',
  `locale` VARCHAR(8) NOT NULL DEFAULT 'en',
  `text_direction` VARCHAR(8) NOT NULL DEFAULT 'ltr',
  `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Riyadh',
  `phone` VARCHAR(32) NULL DEFAULT NULL,
  `email` VARCHAR(255) NULL DEFAULT NULL,
  `owner_name` VARCHAR(255) NULL DEFAULT NULL,
  `city` VARCHAR(100) NULL DEFAULT NULL,
  `country` VARCHAR(100) NULL DEFAULT NULL,
  `category` VARCHAR(255) NULL DEFAULT NULL,
  `logo` VARCHAR(255) NULL DEFAULT NULL,
  `accent_color` VARCHAR(32) NULL DEFAULT NULL,
  `hosting_mode` ENUM('shared','dedicated','client') NOT NULL DEFAULT 'shared',
  `db_isolation` ENUM('shared_store_id','dedicated_mysql') NOT NULL DEFAULT 'shared_store_id',
  `zatca_vat_number` VARCHAR(32) NULL DEFAULT NULL,
  `products_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `orders_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `revenue` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `visitors_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stores_slug_unique` (`slug`),
  KEY `stores_status_index` (`status`),
  KEY `stores_plan_index` (`plan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `plans` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `product_limit` INT UNSIGNED NULL DEFAULT NULL,
  `storage_mb` INT UNSIGNED NULL DEFAULT NULL,
  `team_seats` INT UNSIGNED NULL DEFAULT NULL,
  `features` JSON NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `plans_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `plan_id` VARCHAR(64) NOT NULL,
  `status` ENUM('trial','active','grace','expired','suspended') NOT NULL DEFAULT 'trial',
  `billing_interval` VARCHAR(16) NOT NULL DEFAULT 'monthly',
  `starts_at` TIMESTAMP NULL DEFAULT NULL,
  `ends_at` TIMESTAMP NULL DEFAULT NULL,
  `grace_ends_at` TIMESTAMP NULL DEFAULT NULL,
  `renewed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `subscriptions_store_id_index` (`store_id`),
  CONSTRAINT `subscriptions_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscriptions_plan_id_foreign` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `store_users` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `role` VARCHAR(64) NOT NULL DEFAULT 'store_staff',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_users_store_id_user_id_unique` (`store_id`,`user_id`),
  CONSTRAINT `store_users_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_users_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Catalog
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `parent_id` VARCHAR(64) NULL DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) NULL DEFAULT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `image_url` TEXT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `meta_title` VARCHAR(255) NULL DEFAULT NULL,
  `meta_description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_store_id_slug_unique` (`store_id`,`slug`),
  KEY `categories_store_id_is_active_index` (`store_id`,`is_active`),
  CONSTRAINT `categories_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `category_id` VARCHAR(64) NULL DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) NULL DEFAULT NULL,
  `slug` VARCHAR(255) NULL DEFAULT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(12,2) NOT NULL,
  `original_price` DECIMAL(12,2) NULL DEFAULT NULL,
  `cost_price` DECIMAL(12,2) NULL DEFAULT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `category` VARCHAR(100) NULL DEFAULT NULL,
  `category_ar` VARCHAR(100) NULL DEFAULT NULL,
  `image_url` TEXT NULL,
  `image_version` VARCHAR(64) NULL DEFAULT NULL,
  `badge` VARCHAR(64) NULL DEFAULT NULL,
  `status` ENUM('published','draft','archived') NOT NULL DEFAULT 'draft',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_store_id_sku_unique` (`store_id`,`sku`),
  KEY `products_store_id_status_index` (`store_id`,`status`),
  KEY `products_store_id_is_active_index` (`store_id`,`is_active`),
  KEY `products_store_id_category_id_index` (`store_id`,`category_id`),
  KEY `products_store_id_status_created_at_index` (`store_id`,`status`,`created_at`),
  KEY `products_store_id_created_at_index` (`store_id`,`created_at`),
  CONSTRAINT `products_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_variations` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) NOT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `attributes` JSON NULL,
  `price` DECIMAL(12,2) NULL DEFAULT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `image_url` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_variations_store_id_sku_unique` (`store_id`,`sku`),
  KEY `product_variations_store_id_product_id_index` (`store_id`,`product_id`),
  CONSTRAINT `product_variations_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_variations_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `path` VARCHAR(255) NOT NULL,
  `url` TEXT NOT NULL,
  `mime` VARCHAR(128) NULL DEFAULT NULL,
  `size_bytes` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `alt` VARCHAR(255) NULL DEFAULT NULL,
  `version` VARCHAR(64) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `media_store_id_index` (`store_id`),
  CONSTRAINT `media_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_usage` (
  `id` VARCHAR(64) NOT NULL,
  `media_id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `entity_type` VARCHAR(64) NOT NULL,
  `entity_id` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `media_usage_store_id_entity_type_entity_id_index` (`store_id`,`entity_type`,`entity_id`),
  CONSTRAINT `media_usage_media_id_foreign` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE CASCADE,
  CONSTRAINT `media_usage_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- CRM / commerce
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `city` VARCHAR(100) NOT NULL DEFAULT 'Makkah',
  `country` VARCHAR(100) NULL DEFAULT NULL,
  `gender` ENUM('Male','Female','Other') NULL DEFAULT NULL,
  `group` VARCHAR(64) NULL DEFAULT NULL,
  `total_orders` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_spend` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `avg_order_value` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `acquisition_source` VARCHAR(64) NOT NULL DEFAULT 'Direct',
  `status` ENUM('Active','VIP','New','Inactive','Cancelled') NOT NULL DEFAULT 'New',
  `last_order_date` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_store_id_email_unique` (`store_id`,`email`),
  KEY `customers_store_id_status_index` (`store_id`,`status`),
  CONSTRAINT `customers_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `order_number` VARCHAR(64) NOT NULL,
  `customer_id` VARCHAR(64) NULL DEFAULT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NULL DEFAULT NULL,
  `customer_phone` VARCHAR(32) NOT NULL,
  `items_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `items_summary` VARCHAR(255) NULL DEFAULT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'SAR',
  `source` ENUM('WhatsApp','Instagram','Google Ads','Facebook','Snapchat','Direct') NOT NULL DEFAULT 'Direct',
  `source_details` VARCHAR(255) NULL DEFAULT NULL,
  `delivery_location` VARCHAR(255) NOT NULL,
  `status` VARCHAR(64) NOT NULL DEFAULT 'pending',
  `payment_method` VARCHAR(64) NOT NULL DEFAULT 'Mada',
  `payment_status` VARCHAR(64) NOT NULL DEFAULT 'pending',
  `cod_status` VARCHAR(64) NOT NULL DEFAULT 'not_cod',
  `cod_collected_at` DATETIME NULL DEFAULT NULL,
  `cod_remitted_at` DATETIME NULL DEFAULT NULL,
  `cod_notes` VARCHAR(255) NULL DEFAULT NULL,
  `refund_status` VARCHAR(64) NOT NULL DEFAULT 'none',
  `refund_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `return_reason` VARCHAR(255) NULL DEFAULT NULL,
  `return_notes` TEXT NULL DEFAULT NULL,
  `returned_at` DATETIME NULL DEFAULT NULL,
  `restocked_at` DATETIME NULL DEFAULT NULL,
  `order_date` DATETIME NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_store_id_order_number_unique` (`store_id`,`order_number`),
  KEY `orders_store_id_status_index` (`store_id`,`status`),
  KEY `orders_store_id_source_index` (`store_id`,`source`),
  KEY `orders_store_id_order_date_index` (`store_id`,`order_date`),
  KEY `orders_store_id_status_created_at_index` (`store_id`,`status`,`created_at`),
  KEY `orders_store_id_created_at_index` (`store_id`,`created_at`),
  KEY `orders_store_id_cod_status_index` (`store_id`,`cod_status`),
  CONSTRAINT `orders_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_returns` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `order_id` VARCHAR(64) NOT NULL,
  `return_number` VARCHAR(64) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `reason` VARCHAR(100) NOT NULL,
  `reason_details` TEXT NULL DEFAULT NULL,
  `status` VARCHAR(64) NOT NULL DEFAULT 'requested',
  `refund_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `restock_inventory` TINYINT(1) NOT NULL DEFAULT 1,
  `items` JSON NULL DEFAULT NULL,
  `admin_notes` TEXT NULL DEFAULT NULL,
  `requested_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_returns_store_id_status_index` (`store_id`,`status`),
  KEY `order_returns_store_id_order_id_index` (`store_id`,`order_id`),
  CONSTRAINT `order_returns_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_returns_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) NULL DEFAULT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_index` (`order_id`),
  KEY `order_items_store_id_index` (`store_id`),
  CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `coupons` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `discount_type` ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(10,2) NOT NULL,
  `min_order_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `usage_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `max_uses` INT UNSIGNED NULL DEFAULT NULL,
  `status` ENUM('active','expired','scheduled') NOT NULL DEFAULT 'active',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `expires_at` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupons_store_id_code_unique` (`store_id`,`code`),
  KEY `coupons_store_id_index` (`store_id`),
  CONSTRAINT `coupons_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `shipping_zones` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `region` VARCHAR(100) NOT NULL,
  `rate` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `min_delivery_days` INT UNSIGNED NOT NULL DEFAULT 1,
  `max_delivery_days` INT UNSIGNED NOT NULL DEFAULT 2,
  `estimated_delivery` VARCHAR(255) NULL DEFAULT NULL,
  `free_above` DECIMAL(10,2) NULL DEFAULT NULL,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `shipping_zones_store_id_index` (`store_id`),
  CONSTRAINT `shipping_zones_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `seo_configs` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `brand_name` VARCHAR(255) NULL DEFAULT NULL,
  `city` VARCHAR(100) NULL DEFAULT NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'Saudi Arabia',
  `meta_title` VARCHAR(255) NULL DEFAULT NULL,
  `meta_description` TEXT NULL,
  `keywords` TEXT NULL,
  `canonical_url` VARCHAR(255) NULL DEFAULT NULL,
  `search_console_tag` VARCHAR(255) NULL DEFAULT NULL,
  `ga4_measurement_id` VARCHAR(64) NULL DEFAULT NULL,
  `gtm_container_id` VARCHAR(64) NULL DEFAULT NULL,
  `sitemap_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `robots_txt` TEXT NULL,
  `google_connected` TINYINT(1) NOT NULL DEFAULT 0,
  `google_account_email` VARCHAR(255) NULL DEFAULT NULL,
  `google_connected_at` TIMESTAMP NULL DEFAULT NULL,
  `search_console_connected` TINYINT(1) NOT NULL DEFAULT 0,
  `indexing_api_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `sitemap_url` VARCHAR(255) NULL DEFAULT NULL,
  `extra` JSON NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seo_configs_store_id_unique` (`store_id`),
  CONSTRAINT `seo_configs_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `domains` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `domain_name` VARCHAR(255) NOT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `ssl_status` ENUM('active','issuing','provisioning','expired','failed') NOT NULL DEFAULT 'active',
  `dns_configured` TINYINT(1) NOT NULL DEFAULT 0,
  `dns_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `hosting_tier` VARCHAR(255) NULL DEFAULT NULL,
  `monthly_fee` DECIMAL(10,2) NULL DEFAULT NULL,
  `payment_received` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('active','pending_payment','dns_propagation','suspended') NOT NULL DEFAULT 'active',
  `nameservers` JSON NULL,
  `registered_date` DATE NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `domains_domain_name_unique` (`domain_name`),
  KEY `domains_store_id_index` (`store_id`),
  CONSTRAINT `domains_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `acquisition_channels` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `channel_type` VARCHAR(64) NULL DEFAULT NULL,
  `traffic_share` INT UNSIGNED NOT NULL DEFAULT 0,
  `visits` INT UNSIGNED NOT NULL DEFAULT 0,
  `add_to_cart` INT UNSIGNED NOT NULL DEFAULT 0,
  `orders_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `conversion_rate` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `revenue` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `roas` DECIMAL(8,2) NULL DEFAULT NULL,
  `roi` VARCHAR(32) NOT NULL DEFAULT '0%',
  `cac` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `icon` VARCHAR(64) NOT NULL DEFAULT 'Globe',
  `trend_sparkline` JSON NULL,
  `trend_change` DECIMAL(8,2) NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `acquisition_channels_store_id_index` (`store_id`),
  CONSTRAINT `acquisition_channels_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `zatca_invoices` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `order_id` VARCHAR(64) NOT NULL,
  `invoice_number` VARCHAR(64) NOT NULL,
  `qr_code_payload` TEXT NOT NULL,
  `cryptographic_stamp` VARCHAR(255) NOT NULL,
  `xml_hash` VARCHAR(128) NOT NULL,
  `status` ENUM('REPORTED','CLEARED','REJECTED') NOT NULL DEFAULT 'REPORTED',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `zatca_invoices_order_id_unique` (`order_id`),
  KEY `zatca_invoices_store_id_index` (`store_id`),
  CONSTRAINT `zatca_invoices_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `zatca_invoices_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_gateways` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `provider` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `title_ar` VARCHAR(191) NULL DEFAULT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `is_sandbox` TINYINT(1) NOT NULL DEFAULT 1,
  `api_key` TEXT NULL DEFAULT NULL,
  `secret_key` TEXT NULL DEFAULT NULL,
  `public_key` TEXT NULL DEFAULT NULL,
  `webhook_secret` TEXT NULL DEFAULT NULL,
  `supported_methods` JSON NULL DEFAULT NULL,
  `transaction_fee_percent` DECIMAL(5,2) NOT NULL DEFAULT 1.50,
  `transaction_fee_fixed` DECIMAL(8,2) NOT NULL DEFAULT 1.00,
  `status` ENUM('connected','disconnected','error') NOT NULL DEFAULT 'connected',
  `last_tested_at` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_gateways_store_id_provider_index` (`store_id`, `provider`),
  CONSTRAINT `payment_gateways_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_transactions` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `order_id` VARCHAR(64) NULL DEFAULT NULL,
  `gateway_provider` VARCHAR(64) NOT NULL,
  `payment_method` VARCHAR(64) NOT NULL,
  `transaction_reference` VARCHAR(100) NOT NULL,
  `gateway_transaction_id` VARCHAR(191) NULL DEFAULT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'SAR',
  `fee_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `net_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending','authorized','paid','failed','cancelled','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
  `card_brand` VARCHAR(50) NULL DEFAULT NULL,
  `card_last_four` VARCHAR(10) NULL DEFAULT NULL,
  `payer_email` VARCHAR(191) NULL DEFAULT NULL,
  `payer_name` VARCHAR(191) NULL DEFAULT NULL,
  `raw_response` JSON NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_transactions_transaction_reference_unique` (`transaction_reference`),
  KEY `payment_transactions_store_id_status_index` (`store_id`, `status`),
  KEY `payment_transactions_store_id_payment_method_index` (`store_id`, `payment_method`),
  CONSTRAINT `payment_transactions_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Settings / themes / audit / backups
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `store_settings` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `settings` JSON NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_settings_store_id_unique` (`store_id`),
  CONSTRAINT `store_settings_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `themes_catalog` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(64) NULL DEFAULT NULL,
  `preview_color` VARCHAR(32) NULL DEFAULT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `store_themes` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `theme_id` VARCHAR(64) NOT NULL,
  `homepage_style` VARCHAR(255) NULL DEFAULT NULL,
  `settings` JSON NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_themes_store_id_unique` (`store_id`),
  CONSTRAINT `store_themes_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_themes_theme_id_foreign` FOREIGN KEY (`theme_id`) REFERENCES `themes_catalog` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NULL DEFAULT NULL,
  `user_id` VARCHAR(64) NULL DEFAULT NULL,
  `action` VARCHAR(255) NOT NULL,
  `entity_type` VARCHAR(64) NULL DEFAULT NULL,
  `entity_id` VARCHAR(64) NULL DEFAULT NULL,
  `meta` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `audit_logs_store_id_created_at_index` (`store_id`,`created_at`),
  KEY `audit_logs_entity_type_entity_id_index` (`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `backups` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `status` VARCHAR(64) NOT NULL DEFAULT 'pending',
  `path` VARCHAR(255) NULL DEFAULT NULL,
  `size_bytes` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `backups_store_id_created_at_index` (`store_id`,`created_at`),
  CONSTRAINT `backups_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mark Phase 1 migrations as applied (skip migrate after import)
DELETE FROM `migrations` WHERE `migration` IN (
  '0001_01_01_000000_create_users_table',
  '0001_01_01_000001_create_cache_table',
  '0001_01_01_000002_create_jobs_table',
  '2026_09_29_091249_create_personal_access_tokens_table',
  '2026_09_29_100000_create_stores_table',
  '2026_09_29_100010_create_plans_and_subscriptions_tables',
  '2026_09_29_100020_create_store_users_table',
  '2026_09_29_100030_create_categories_table',
  '2026_09_29_100040_create_products_tables',
  '2026_09_29_100050_create_media_tables',
  '2026_09_29_100060_create_customers_table',
  '2026_09_29_100070_create_orders_tables',
  '2026_09_29_100080_create_commerce_support_tables',
  '2026_09_29_100090_create_settings_themes_audit_backups_tables',
  '2026_09_29_220000_create_auth_otps_table',
  '2026_09_29_230000_expand_user_roles',
  '2026_09_29_240000_add_store_locale_timezone',
  '2026_09_29_250000_extend_subscriptions_lifecycle'
);
INSERT INTO `migrations` (`migration`, `batch`) VALUES
  ('0001_01_01_000000_create_users_table', 1),
  ('0001_01_01_000001_create_cache_table', 1),
  ('0001_01_01_000002_create_jobs_table', 1),
  ('2026_09_29_091249_create_personal_access_tokens_table', 1),
  ('2026_09_29_100000_create_stores_table', 1),
  ('2026_09_29_100010_create_plans_and_subscriptions_tables', 1),
  ('2026_09_29_100020_create_store_users_table', 1),
  ('2026_09_29_100030_create_categories_table', 1),
  ('2026_09_29_100040_create_products_tables', 1),
  ('2026_09_29_100050_create_media_tables', 1),
  ('2026_09_29_100060_create_customers_table', 1),
  ('2026_09_29_100070_create_orders_tables', 1),
  ('2026_09_29_100080_create_commerce_support_tables', 1),
  ('2026_09_29_100090_create_settings_themes_audit_backups_tables', 1),
  ('2026_09_29_220000_create_auth_otps_table', 1),
  ('2026_09_29_230000_expand_user_roles', 1),
  ('2026_09_29_240000_add_store_locale_timezone', 1),
  ('2026_09_29_250000_extend_subscriptions_lifecycle', 1);

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- SUCCESS: Phase 1–2.7 schema ready for Hostinger
-- ====================================================================
