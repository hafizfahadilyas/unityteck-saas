-- SOUQ PLUS Phase 1 — onboarding_invites + platform_settings
-- Apply after 01_schema.sql on Hostinger MySQL

CREATE TABLE IF NOT EXISTS `onboarding_invites` (
  `id` VARCHAR(64) NOT NULL,
  `token` VARCHAR(128) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `plan` VARCHAR(32) NOT NULL DEFAULT 'pro',
  `label` VARCHAR(191) NOT NULL DEFAULT '',
  `locale` VARCHAR(8) NOT NULL DEFAULT 'en',
  `text_dir` VARCHAR(8) NOT NULL DEFAULT 'ltr',
  `currency` VARCHAR(8) NOT NULL DEFAULT 'SAR',
  `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Riyadh',
  `expires_at` TIMESTAMP NOT NULL,
  `used_at` TIMESTAMP NULL DEFAULT NULL,
  `redeemed_store_id` VARCHAR(64) NULL DEFAULT NULL,
  `created_by_user_id` VARCHAR(64) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `onboarding_invites_token_unique` (`token`),
  UNIQUE KEY `onboarding_invites_store_id_unique` (`store_id`),
  KEY `onboarding_invites_expires_at_used_at_index` (`expires_at`,`used_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(32) NOT NULL,
  `settings` JSON NULL,
  `updated_by_user_id` VARCHAR(64) NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
