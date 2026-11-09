-- Loyalty points ledger + customer DOB (per store_id isolation)
-- Run once on Hostinger MySQL after backup. Skip a line if the column/table already exists.

ALTER TABLE `customers` ADD COLUMN `dob` DATE NULL DEFAULT NULL AFTER `gender`;

CREATE TABLE IF NOT EXISTS `loyalty_point_transactions` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `customer_id` VARCHAR(64) NOT NULL,
  `transaction_type` VARCHAR(32) NOT NULL,
  `points_delta` INT NOT NULL,
  `balance_after` INT UNSIGNED NOT NULL DEFAULT 0,
  `method` VARCHAR(64) NULL,
  `reason` VARCHAR(255) NULL,
  `source_event_id` VARCHAR(128) NOT NULL,
  `order_id` VARCHAR(64) NULL,
  `review_id` VARCHAR(64) NULL,
  `metadata` JSON NULL,
  `expires_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lpt_store_source_unique` (`store_id`, `source_event_id`),
  KEY `lpt_store_customer_created` (`store_id`, `customer_id`, `created_at`),
  KEY `lpt_store_method_created` (`store_id`, `method`, `created_at`),
  CONSTRAINT `lpt_store_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lpt_customer_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
