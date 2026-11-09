-- Cashback campaigns + credits (per store_id). Run on Hostinger MySQL if migrations not applied.
-- Safe to re-run: creates only if missing.

CREATE TABLE IF NOT EXISTS `cashback_campaigns` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(2048) NULL,
  `type` ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `value` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `min_cart_value` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `max_cashback_per_order` DECIMAL(12,2) NULL,
  `start_date` TIMESTAMP NULL DEFAULT NULL,
  `end_date` TIMESTAMP NULL DEFAULT NULL,
  `status` ENUM('active','draft','completed','paused') NOT NULL DEFAULT 'draft',
  `product_scope` VARCHAR(16) NOT NULL DEFAULT 'all',
  `product_ids` JSON NULL,
  `store_wallet_only` TINYINT(1) NOT NULL DEFAULT 1,
  `credit_expiry_days` INT UNSIGNED NULL,
  `hold_days` INT UNSIGNED NOT NULL DEFAULT 7,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cb_camp_store_status` (`store_id`,`status`),
  CONSTRAINT `cashback_campaigns_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cashback_credits` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `customer_id` VARCHAR(64) NOT NULL,
  `campaign_id` VARCHAR(64) NULL,
  `order_id` VARCHAR(64) NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `status` ENUM('pending','available','expired','reversed') NOT NULL DEFAULT 'pending',
  `available_at` TIMESTAMP NULL DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `source_event_id` VARCHAR(128) NOT NULL,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cb_credit_store_source_unique` (`store_id`,`source_event_id`),
  KEY `cb_credit_store_cust_status` (`store_id`,`customer_id`,`status`),
  KEY `cb_credit_mature` (`store_id`,`status`,`available_at`),
  KEY `cb_credit_expire` (`store_id`,`status`,`expires_at`),
  CONSTRAINT `cashback_credits_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cashback_credits_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
