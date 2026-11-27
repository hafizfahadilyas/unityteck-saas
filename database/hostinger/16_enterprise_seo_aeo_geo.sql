-- ==============================================================================
-- Enterprise Multi-Tenant AI SEO, AEO, GEO & Technical SEO Schema
-- Hostinger MySQL Production Patch (srv1422.hstgr.io / u393490678_ksa)
-- Safe to re-run: Uses CREATE TABLE IF NOT EXISTS.
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. SEO Settings
CREATE TABLE IF NOT EXISTS `seo_settings` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `primary_language` VARCHAR(8) NOT NULL DEFAULT 'ar',
  `secondary_language` VARCHAR(8) NOT NULL DEFAULT 'en',
  `automation_mode` VARCHAR(32) NOT NULL DEFAULT 'approval_required',
  `auto_generate_products` TINYINT(1) NOT NULL DEFAULT 0,
  `auto_generate_categories` TINYINT(1) NOT NULL DEFAULT 0,
  `auto_generate_images_alt` TINYINT(1) NOT NULL DEFAULT 0,
  `weekly_audit_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `broken_link_monitor_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `sitemap_auto_ping` TINYINT(1) NOT NULL DEFAULT 1,
  `target_region` VARCHAR(16) NOT NULL DEFAULT 'SA',
  `city` VARCHAR(64) NOT NULL DEFAULT 'Riyadh',
  `social_profiles` JSON NULL,
  `competitor_domains` JSON NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seo_settings_store_id_unique` (`store_id`),
  CONSTRAINT `seo_settings_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. SEO Audits
CREATE TABLE IF NOT EXISTS `seo_audits` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `target_domain` VARCHAR(255) NOT NULL,
  `audit_type` VARCHAR(32) NOT NULL DEFAULT 'full',
  `health_score` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `technical_score` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `product_seo_score` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `meta_completion_score` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `aeo_readiness_score` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `geo_readiness_score` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `speed_mobile_score` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `speed_desktop_score` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `pages_crawled` INT UNSIGNED NOT NULL DEFAULT 0,
  `indexed_pages_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `broken_links_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `backlinks_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `issues_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` VARCHAR(24) NOT NULL DEFAULT 'completed',
  `audit_summary` JSON NULL,
  `started_at` TIMESTAMP NULL DEFAULT NULL,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `seo_audits_store_id_created_at_idx` (`store_id`, `created_at`),
  CONSTRAINT `seo_audits_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. SEO Audit Issues
CREATE TABLE IF NOT EXISTS `seo_audit_issues` (
  `id` VARCHAR(64) NOT NULL,
  `audit_id` VARCHAR(64) NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `category` VARCHAR(32) NOT NULL,
  `severity` VARCHAR(16) NOT NULL,
  `affected_url` VARCHAR(500) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `title_ar` VARCHAR(255) NOT NULL,
  `issue_description_en` TEXT NOT NULL,
  `issue_description_ar` TEXT NOT NULL,
  `why_it_matters_en` TEXT NOT NULL,
  `why_it_matters_ar` TEXT NOT NULL,
  `suggested_solution_en` TEXT NOT NULL,
  `suggested_solution_ar` TEXT NOT NULL,
  `ai_credits_cost` INT UNSIGNED NOT NULL DEFAULT 1,
  `auto_fixable` TINYINT(1) NOT NULL DEFAULT 1,
  `status` VARCHAR(24) NOT NULL DEFAULT 'open',
  `proposed_payload` JSON NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `seo_audit_issues_store_status_idx` (`store_id`, `status`),
  KEY `seo_audit_issues_store_severity_idx` (`store_id`, `severity`),
  CONSTRAINT `seo_audit_issues_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SEO Metadata
CREATE TABLE IF NOT EXISTS `seo_metadata` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `entity_type` VARCHAR(32) NOT NULL,
  `entity_id` VARCHAR(64) NOT NULL,
  `url_path` VARCHAR(255) NOT NULL,
  `title_ar` VARCHAR(255) NULL,
  `title_en` VARCHAR(255) NULL,
  `meta_description_ar` TEXT NULL,
  `meta_description_en` TEXT NULL,
  `canonical_url` VARCHAR(255) NULL,
  `robots_meta` VARCHAR(64) NOT NULL DEFAULT 'index, follow',
  `og_title_ar` VARCHAR(255) NULL,
  `og_title_en` VARCHAR(255) NULL,
  `og_description_ar` TEXT NULL,
  `og_description_en` TEXT NULL,
  `og_image_url` VARCHAR(500) NULL,
  `twitter_card` VARCHAR(32) NOT NULL DEFAULT 'summary_large_image',
  `focus_keyword` VARCHAR(100) NULL,
  `secondary_keywords` JSON NULL,
  `search_intent` VARCHAR(64) NULL,
  `schema_jsonld` JSON NULL,
  `faq_items` JSON NULL,
  `status` VARCHAR(24) NOT NULL DEFAULT 'published',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seo_metadata_store_entity_unique` (`store_id`, `entity_type`, `entity_id`),
  KEY `seo_metadata_store_path_idx` (`store_id`, `url_path`),
  CONSTRAINT `seo_metadata_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SEO Keywords
CREATE TABLE IF NOT EXISTS `seo_keywords` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `keyword` VARCHAR(191) NOT NULL,
  `language` VARCHAR(8) NOT NULL DEFAULT 'ar',
  `keyword_type` VARCHAR(32) NOT NULL DEFAULT 'primary',
  `search_intent` VARCHAR(32) NOT NULL DEFAULT 'commercial',
  `search_volume` INT UNSIGNED NULL,
  `difficulty_score` TINYINT UNSIGNED NULL,
  `cpc_sar` DECIMAL(8,2) NULL,
  `ranking_position` INT UNSIGNED NULL,
  `target_url` VARCHAR(500) NULL,
  `source` VARCHAR(64) NOT NULL DEFAULT 'manual',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `seo_keywords_store_lang_idx` (`store_id`, `language`),
  KEY `seo_keywords_store_kw_idx` (`store_id`, `keyword`),
  CONSTRAINT `seo_keywords_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SEO Recommendations
CREATE TABLE IF NOT EXISTS `seo_recommendations` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `issue_id` VARCHAR(64) NULL,
  `type` VARCHAR(32) NOT NULL,
  `target_url` VARCHAR(500) NOT NULL,
  `title_ar` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `explanation_ar` TEXT NOT NULL,
  `explanation_en` TEXT NOT NULL,
  `proposed_payload` JSON NOT NULL,
  `estimated_credits` INT UNSIGNED NOT NULL DEFAULT 1,
  `status` VARCHAR(24) NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `seo_recommendations_store_status_idx` (`store_id`, `status`),
  CONSTRAINT `seo_recommendations_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. SEO Implementations
CREATE TABLE IF NOT EXISTS `seo_implementations` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `recommendation_id` VARCHAR(64) NULL,
  `target_url` VARCHAR(500) NOT NULL,
  `action_type` VARCHAR(32) NOT NULL,
  `executed_by_user_id` VARCHAR(64) NULL,
  `credits_consumed` INT UNSIGNED NOT NULL DEFAULT 1,
  `before_state` JSON NOT NULL,
  `after_state` JSON NOT NULL,
  `live_validation_status` VARCHAR(32) NOT NULL DEFAULT 'verified_live',
  `rolled_back_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `seo_implementations_store_created_idx` (`store_id`, `created_at`),
  CONSTRAINT `seo_implementations_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. SEO Backlinks
CREATE TABLE IF NOT EXISTS `seo_backlinks` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `source_url` VARCHAR(500) NOT NULL,
  `target_url` VARCHAR(500) NOT NULL,
  `anchor_text` VARCHAR(255) NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `link_type` VARCHAR(32) NOT NULL DEFAULT 'editorial',
  `outreach_status` VARCHAR(32) NOT NULL DEFAULT 'not_contacted',
  `outreach_notes` TEXT NULL,
  `outreach_template` TEXT NULL,
  `first_detected_at` TIMESTAMP NULL DEFAULT NULL,
  `last_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `seo_backlinks_store_verified_idx` (`store_id`, `is_verified`),
  CONSTRAINT `seo_backlinks_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. SEO Content History
CREATE TABLE IF NOT EXISTS `seo_content_history` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `entity_type` VARCHAR(32) NOT NULL,
  `entity_id` VARCHAR(64) NOT NULL,
  `field_name` VARCHAR(64) NOT NULL,
  `old_value` MEDIUMTEXT NULL,
  `new_value` MEDIUMTEXT NOT NULL,
  `changed_by` VARCHAR(64) NOT NULL DEFAULT 'merchant_manual',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `seo_content_history_store_entity_idx` (`store_id`, `entity_type`, `entity_id`),
  CONSTRAINT `seo_content_history_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. SEO Integrations
CREATE TABLE IF NOT EXISTS `seo_integrations` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `provider` VARCHAR(32) NOT NULL,
  `is_connected` TINYINT(1) NOT NULL DEFAULT 0,
  `credentials_encrypted` TEXT NULL,
  `property_url` VARCHAR(255) NULL,
  `api_key_masked` VARCHAR(64) NULL,
  `indexnow_key` VARCHAR(64) NULL,
  `last_sync_at` TIMESTAMP NULL DEFAULT NULL,
  `last_status` VARCHAR(64) NULL,
  `error_details` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seo_integrations_store_provider_unique` (`store_id`, `provider`),
  CONSTRAINT `seo_integrations_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. SEO Search Performance
CREATE TABLE IF NOT EXISTS `seo_search_performance` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `date` DATE NOT NULL,
  `source` VARCHAR(32) NOT NULL DEFAULT 'google_search_console',
  `clicks` INT UNSIGNED NOT NULL DEFAULT 0,
  `impressions` INT UNSIGNED NOT NULL DEFAULT 0,
  `ctr` DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
  `avg_position` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `top_queries` JSON NULL,
  `top_pages` JSON NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seo_search_perf_unique` (`store_id`, `source`, `date`),
  CONSTRAINT `seo_search_perf_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. SEO Reports
CREATE TABLE IF NOT EXISTS `seo_reports` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `report_type` VARCHAR(32) NOT NULL,
  `period_start` DATE NOT NULL,
  `period_end` DATE NOT NULL,
  `metrics_comparison` JSON NOT NULL,
  `pdf_path` VARCHAR(255) NULL,
  `csv_path` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `seo_reports_store_type_idx` (`store_id`, `report_type`, `period_end`),
  CONSTRAINT `seo_reports_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. SEO Automation Rules
CREATE TABLE IF NOT EXISTS `seo_automation_rules` (
  `id` VARCHAR(64) NOT NULL,
  `store_id` VARCHAR(64) NOT NULL,
  `rule_code` VARCHAR(64) NOT NULL,
  `action_type` VARCHAR(64) NOT NULL,
  `mode` VARCHAR(32) NOT NULL DEFAULT 'approval_required',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_triggered_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seo_automation_rules_store_code_unique` (`store_id`, `rule_code`),
  CONSTRAINT `seo_automation_rules_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
