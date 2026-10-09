/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hostinger MySQL Database Schema & Architecture Helper
 *
 * Phase 1 source of truth:
 *   - Laravel migrations: apps/api/database/migrations/
 *   - Hostinger phpMyAdmin SQL: database/hostinger/*.sql
 *
 * This module mirrors that DDL for Master Database UI export.
 * Prefer importing database/hostinger/01_schema.sql + 02_seed.sql on Hostinger.
 */

import { Store, Product, Order, Customer, PlanType } from '../types';

export interface HostingerDbConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  charset: string;
  collation: string;
}

export const DEFAULT_HOSTINGER_CONFIG: HostingerDbConfig = {
  host: 'srv1422.hstgr.io',
  port: 3306,
  database: 'u920689430_giftshop',
  username: 'u920689430_giftshop',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
};

function normalizePlan(plan: PlanType | string | undefined): PlanType {
  const p = String(plan || 'free').toLowerCase();
  if (p === 'paid' || p === 'pro' || p === 'custom' || p === 'free') return p;
  if (p === 'starter' || p === 'enterprise') return p === 'enterprise' ? 'pro' : 'free';
  return 'free';
}

/**
 * Generates MySQL 8 DDL aligned with Phase 1 Laravel migrations
 * (stores plan free/paid/pro/custom, categories, variations, media, plans, …).
 * Canonical import file: database/hostinger/01_schema.sql
 */
export function generateHostingerSchemaSql(): string {
  return `-- ====================================================================
-- UNITYTECK MULTI-TENANT E-COMMERCE PLATFORM
-- TARGET: HOSTINGER CLOUD / SHARED MYSQL 8.0+
-- CHARSET: utf8mb4 · ISOLATION: store_id FKs
-- SoT: apps/api/database/migrations + database/hostinger/01_schema.sql
-- Prefer importing database/hostinger/01_schema.sql in phpMyAdmin.
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL,
  \`email_verified_at\` TIMESTAMP NULL DEFAULT NULL,
  \`password\` VARCHAR(255) NOT NULL,
  \`role\` VARCHAR(64) NOT NULL DEFAULT 'support',
  \`remember_token\` VARCHAR(100) NULL DEFAULT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`users_email_unique\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`stores\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`slug\` VARCHAR(255) NOT NULL,
  \`domain\` VARCHAR(255) NULL DEFAULT NULL,
  \`status\` ENUM('active','inactive','pending','suspended') NOT NULL DEFAULT 'pending',
  \`plan\` ENUM('free','paid','pro','custom') NOT NULL DEFAULT 'free',
  \`master_granted_pro\` TINYINT(1) NOT NULL DEFAULT 0,
  \`currency\` VARCHAR(10) NOT NULL DEFAULT 'SAR',
  \`locale\` VARCHAR(8) NOT NULL DEFAULT 'en',
  \`text_direction\` VARCHAR(8) NOT NULL DEFAULT 'ltr',
  \`timezone\` VARCHAR(64) NOT NULL DEFAULT 'Asia/Riyadh',
  \`phone\` VARCHAR(32) NULL DEFAULT NULL,
  \`email\` VARCHAR(255) NULL DEFAULT NULL,
  \`owner_name\` VARCHAR(255) NULL DEFAULT NULL,
  \`city\` VARCHAR(100) NULL DEFAULT NULL,
  \`country\` VARCHAR(100) NULL DEFAULT NULL,
  \`category\` VARCHAR(255) NULL DEFAULT NULL,
  \`logo\` VARCHAR(255) NULL DEFAULT NULL,
  \`accent_color\` VARCHAR(32) NULL DEFAULT NULL,
  \`hosting_mode\` ENUM('shared','dedicated','client') NOT NULL DEFAULT 'shared',
  \`db_isolation\` ENUM('shared_store_id','dedicated_mysql') NOT NULL DEFAULT 'shared_store_id',
  \`zatca_vat_number\` VARCHAR(32) NULL DEFAULT NULL,
  \`products_count\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`orders_count\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`revenue\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`visitors_count\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`stores_slug_unique\` (\`slug\`),
  KEY \`stores_status_index\` (\`status\`),
  KEY \`stores_plan_index\` (\`plan\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`plans\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`code\` VARCHAR(32) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`product_limit\` INT UNSIGNED NULL DEFAULT NULL,
  \`storage_mb\` INT UNSIGNED NULL DEFAULT NULL,
  \`team_seats\` INT UNSIGNED NULL DEFAULT NULL,
  \`features\` JSON NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`plans_code_unique\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`subscriptions\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`plan_id\` VARCHAR(64) NOT NULL,
  \`status\` ENUM('trial','active','grace','expired','suspended') NOT NULL DEFAULT 'trial',
  \`billing_interval\` VARCHAR(16) NOT NULL DEFAULT 'monthly',
  \`starts_at\` TIMESTAMP NULL DEFAULT NULL,
  \`ends_at\` TIMESTAMP NULL DEFAULT NULL,
  \`grace_ends_at\` TIMESTAMP NULL DEFAULT NULL,
  \`renewed_at\` TIMESTAMP NULL DEFAULT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`subscriptions_store_id_index\` (\`store_id\`),
  CONSTRAINT \`subscriptions_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`subscriptions_plan_id_foreign\` FOREIGN KEY (\`plan_id\`) REFERENCES \`plans\` (\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`store_users\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`role\` VARCHAR(64) NOT NULL DEFAULT 'store_staff',
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`store_users_store_id_user_id_unique\` (\`store_id\`,\`user_id\`),
  CONSTRAINT \`store_users_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`store_users_user_id_foreign\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`categories\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`parent_id\` VARCHAR(64) NULL DEFAULT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`name_ar\` VARCHAR(255) NULL DEFAULT NULL,
  \`slug\` VARCHAR(255) NOT NULL,
  \`image_url\` TEXT NULL,
  \`sort_order\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`meta_title\` VARCHAR(255) NULL DEFAULT NULL,
  \`meta_description\` TEXT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`categories_store_id_slug_unique\` (\`store_id\`,\`slug\`),
  KEY \`categories_store_id_is_active_index\` (\`store_id\`,\`is_active\`),
  CONSTRAINT \`categories_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`categories_parent_id_foreign\` FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`category_id\` VARCHAR(64) NULL DEFAULT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`name_ar\` VARCHAR(255) NULL DEFAULT NULL,
  \`slug\` VARCHAR(255) NULL DEFAULT NULL,
  \`description\` TEXT NULL,
  \`price\` DECIMAL(12,2) NOT NULL,
  \`original_price\` DECIMAL(12,2) NULL DEFAULT NULL,
  \`cost_price\` DECIMAL(12,2) NULL DEFAULT NULL,
  \`sku\` VARCHAR(100) NOT NULL,
  \`stock\` INT NOT NULL DEFAULT 0,
  \`category\` VARCHAR(100) NULL DEFAULT NULL,
  \`category_ar\` VARCHAR(100) NULL DEFAULT NULL,
  \`image_url\` TEXT NULL,
  \`image_version\` VARCHAR(64) NULL DEFAULT NULL,
  \`gallery_urls\` JSON NULL,
  \`video_url\` TEXT NULL,
  \`tags\` JSON NULL,
  \`badge\` VARCHAR(64) NULL DEFAULT NULL,
  \`seo_title\` VARCHAR(255) NULL DEFAULT NULL,
  \`seo_description\` TEXT NULL,
  \`seo_keywords\` VARCHAR(500) NULL DEFAULT NULL,
  \`status\` ENUM('published','draft','archived') NOT NULL DEFAULT 'draft',
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`products_store_id_sku_unique\` (\`store_id\`,\`sku\`),
  KEY \`products_store_id_status_index\` (\`store_id\`,\`status\`),
  KEY \`products_store_id_is_active_index\` (\`store_id\`,\`is_active\`),
  CONSTRAINT \`products_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`products_category_id_foreign\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`product_variations\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`product_id\` VARCHAR(64) NOT NULL,
  \`sku\` VARCHAR(100) NOT NULL,
  \`options\` JSON NULL,
  \`price\` DECIMAL(12,2) NULL DEFAULT NULL,
  \`stock\` INT NOT NULL DEFAULT 0,
  \`image_url\` TEXT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`product_variations_store_id_sku_unique\` (\`store_id\`,\`sku\`),
  KEY \`product_variations_store_id_product_id_index\` (\`store_id\`,\`product_id\`),
  CONSTRAINT \`product_variations_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`product_variations_product_id_foreign\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`media\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`path\` VARCHAR(255) NOT NULL,
  \`url\` TEXT NOT NULL,
  \`mime\` VARCHAR(128) NULL DEFAULT NULL,
  \`size_bytes\` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  \`alt\` VARCHAR(255) NULL DEFAULT NULL,
  \`version\` VARCHAR(64) NULL DEFAULT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`media_store_id_index\` (\`store_id\`),
  CONSTRAINT \`media_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`media_usage\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`media_id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`entity_type\` VARCHAR(64) NOT NULL,
  \`entity_id\` VARCHAR(64) NOT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`media_usage_store_entity_index\` (\`store_id\`,\`entity_type\`,\`entity_id\`),
  CONSTRAINT \`media_usage_media_id_foreign\` FOREIGN KEY (\`media_id\`) REFERENCES \`media\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`media_usage_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`customers\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(32) NOT NULL,
  \`city\` VARCHAR(100) NOT NULL DEFAULT 'Makkah',
  \`country\` VARCHAR(100) NULL DEFAULT NULL,
  \`gender\` ENUM('Male','Female','Other') NULL DEFAULT NULL,
  \`group\` VARCHAR(64) NULL DEFAULT NULL,
  \`total_orders\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`total_spend\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`avg_order_value\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`acquisition_source\` VARCHAR(64) NOT NULL DEFAULT 'Direct',
  \`status\` ENUM('Active','VIP','New','Inactive','Cancelled') NOT NULL DEFAULT 'New',
  \`last_order_date\` DATETIME NULL DEFAULT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`customers_store_id_email_unique\` (\`store_id\`,\`email\`),
  KEY \`customers_store_id_status_index\` (\`store_id\`,\`status\`),
  CONSTRAINT \`customers_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`orders\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`order_number\` VARCHAR(64) NOT NULL,
  \`customer_id\` VARCHAR(64) NULL DEFAULT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`customer_email\` VARCHAR(255) NULL DEFAULT NULL,
  \`customer_phone\` VARCHAR(32) NOT NULL,
  \`items_count\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`items_summary\` VARCHAR(255) NULL DEFAULT NULL,
  \`total_amount\` DECIMAL(12,2) NOT NULL,
  \`currency\` VARCHAR(10) NOT NULL DEFAULT 'SAR',
  \`source\` ENUM('WhatsApp','Instagram','Google Ads','Facebook','Snapchat','Direct') NOT NULL DEFAULT 'Direct',
  \`source_details\` VARCHAR(255) NULL DEFAULT NULL,
  \`delivery_location\` VARCHAR(255) NOT NULL,
  \`status\` ENUM('pending','processing','completed','cancelled') NOT NULL DEFAULT 'pending',
  \`payment_method\` ENUM('Mada','Visa/MC','Apple Pay','COD') NOT NULL DEFAULT 'Mada',
  \`order_date\` DATETIME NOT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`orders_store_id_order_number_unique\` (\`store_id\`,\`order_number\`),
  KEY \`orders_store_id_status_index\` (\`store_id\`,\`status\`),
  KEY \`orders_store_id_source_index\` (\`store_id\`,\`source\`),
  KEY \`orders_store_id_order_date_index\` (\`store_id\`,\`order_date\`),
  CONSTRAINT \`orders_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`orders_customer_id_foreign\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`order_items\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`order_id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`product_id\` VARCHAR(64) NULL DEFAULT NULL,
  \`product_name\` VARCHAR(255) NOT NULL,
  \`quantity\` INT UNSIGNED NOT NULL DEFAULT 1,
  \`unit_price\` DECIMAL(12,2) NOT NULL,
  \`subtotal\` DECIMAL(12,2) NOT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`order_items_order_id_index\` (\`order_id\`),
  KEY \`order_items_store_id_index\` (\`store_id\`),
  CONSTRAINT \`order_items_order_id_foreign\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`order_items_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`coupons\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`code\` VARCHAR(64) NOT NULL,
  \`discount_type\` ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
  \`discount_value\` DECIMAL(10,2) NOT NULL,
  \`min_order_amount\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`usage_count\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`max_uses\` INT UNSIGNED NULL DEFAULT NULL,
  \`status\` ENUM('active','expired','scheduled') NOT NULL DEFAULT 'active',
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`expires_at\` DATETIME NULL DEFAULT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`coupons_store_id_code_unique\` (\`store_id\`,\`code\`),
  KEY \`coupons_store_id_index\` (\`store_id\`),
  CONSTRAINT \`coupons_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`shipping_zones\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`region\` VARCHAR(100) NOT NULL,
  \`rate\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`min_delivery_days\` INT UNSIGNED NOT NULL DEFAULT 1,
  \`max_delivery_days\` INT UNSIGNED NOT NULL DEFAULT 2,
  \`estimated_delivery\` VARCHAR(255) NULL DEFAULT NULL,
  \`free_above\` DECIMAL(10,2) NULL DEFAULT NULL,
  \`status\` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`shipping_zones_store_id_index\` (\`store_id\`),
  CONSTRAINT \`shipping_zones_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`seo_configs\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`brand_name\` VARCHAR(255) NULL DEFAULT NULL,
  \`city\` VARCHAR(100) NULL DEFAULT NULL,
  \`country\` VARCHAR(100) NOT NULL DEFAULT 'Saudi Arabia',
  \`meta_title\` VARCHAR(255) NULL DEFAULT NULL,
  \`meta_description\` TEXT NULL,
  \`keywords\` TEXT NULL,
  \`canonical_url\` VARCHAR(255) NULL DEFAULT NULL,
  \`search_console_tag\` VARCHAR(255) NULL DEFAULT NULL,
  \`ga4_measurement_id\` VARCHAR(64) NULL DEFAULT NULL,
  \`gtm_container_id\` VARCHAR(64) NULL DEFAULT NULL,
  \`sitemap_enabled\` TINYINT(1) NOT NULL DEFAULT 1,
  \`robots_txt\` TEXT NULL,
  \`google_connected\` TINYINT(1) NOT NULL DEFAULT 0,
  \`google_account_email\` VARCHAR(255) NULL DEFAULT NULL,
  \`google_connected_at\` TIMESTAMP NULL DEFAULT NULL,
  \`search_console_connected\` TINYINT(1) NOT NULL DEFAULT 0,
  \`indexing_api_enabled\` TINYINT(1) NOT NULL DEFAULT 0,
  \`sitemap_url\` VARCHAR(255) NULL DEFAULT NULL,
  \`extra\` JSON NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`seo_configs_store_id_unique\` (\`store_id\`),
  CONSTRAINT \`seo_configs_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`domains\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`domain_name\` VARCHAR(255) NOT NULL,
  \`is_primary\` TINYINT(1) NOT NULL DEFAULT 0,
  \`ssl_status\` ENUM('active','issuing','provisioning','expired','failed') NOT NULL DEFAULT 'active',
  \`dns_configured\` TINYINT(1) NOT NULL DEFAULT 0,
  \`dns_verified\` TINYINT(1) NOT NULL DEFAULT 0,
  \`hosting_tier\` VARCHAR(255) NULL DEFAULT NULL,
  \`monthly_fee\` DECIMAL(10,2) NULL DEFAULT NULL,
  \`payment_received\` TINYINT(1) NOT NULL DEFAULT 0,
  \`status\` ENUM('active','pending_payment','dns_propagation','suspended') NOT NULL DEFAULT 'active',
  \`nameservers\` JSON NULL,
  \`registered_date\` DATE NULL DEFAULT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`domains_domain_name_unique\` (\`domain_name\`),
  KEY \`domains_store_id_index\` (\`store_id\`),
  CONSTRAINT \`domains_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`acquisition_channels\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(100) NOT NULL,
  \`channel_type\` VARCHAR(64) NULL DEFAULT NULL,
  \`traffic_share\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`visits\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`add_to_cart\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`orders_count\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`conversion_rate\` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  \`revenue\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`roas\` DECIMAL(8,2) NULL DEFAULT NULL,
  \`roi\` VARCHAR(32) NOT NULL DEFAULT '0%',
  \`cac\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`icon\` VARCHAR(64) NOT NULL DEFAULT 'Globe',
  \`trend_sparkline\` JSON NULL,
  \`trend_change\` DECIMAL(8,2) NULL DEFAULT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`acquisition_channels_store_id_index\` (\`store_id\`),
  CONSTRAINT \`acquisition_channels_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`zatca_invoices\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`order_id\` VARCHAR(64) NOT NULL,
  \`invoice_number\` VARCHAR(64) NOT NULL,
  \`qr_code_payload\` TEXT NOT NULL,
  \`cryptographic_stamp\` VARCHAR(255) NOT NULL,
  \`xml_hash\` VARCHAR(128) NOT NULL,
  \`status\` ENUM('REPORTED','CLEARED','REJECTED') NOT NULL DEFAULT 'REPORTED',
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`zatca_invoices_order_id_unique\` (\`order_id\`),
  KEY \`zatca_invoices_store_id_index\` (\`store_id\`),
  CONSTRAINT \`zatca_invoices_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`zatca_invoices_order_id_foreign\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`store_settings\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`settings\` JSON NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`store_settings_store_id_unique\` (\`store_id\`),
  CONSTRAINT \`store_settings_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`themes_catalog\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`category\` VARCHAR(64) NULL DEFAULT NULL,
  \`preview_color\` VARCHAR(32) NULL DEFAULT NULL,
  \`is_default\` TINYINT(1) NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`store_themes\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`theme_id\` VARCHAR(64) NOT NULL,
  \`homepage_style\` VARCHAR(255) NULL DEFAULT NULL,
  \`settings\` JSON NULL,
  \`updated_at\` TIMESTAMP NULL DEFAULT NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`store_themes_store_id_unique\` (\`store_id\`),
  CONSTRAINT \`store_themes_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`store_themes_theme_id_foreign\` FOREIGN KEY (\`theme_id\`) REFERENCES \`themes_catalog\` (\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NULL DEFAULT NULL,
  \`user_id\` VARCHAR(64) NULL DEFAULT NULL,
  \`action\` VARCHAR(255) NOT NULL,
  \`entity_type\` VARCHAR(64) NULL DEFAULT NULL,
  \`entity_id\` VARCHAR(64) NULL DEFAULT NULL,
  \`meta\` JSON NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`audit_logs_store_id_created_at_index\` (\`store_id\`,\`created_at\`),
  KEY \`audit_logs_entity_type_entity_id_index\` (\`entity_type\`,\`entity_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`backups\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`status\` VARCHAR(64) NOT NULL DEFAULT 'pending',
  \`path\` VARCHAR(255) NULL DEFAULT NULL,
  \`size_bytes\` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`backups_store_id_created_at_index\` (\`store_id\`,\`created_at\`),
  CONSTRAINT \`backups_store_id_foreign\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- SUCCESS: Phase 1 multi-tenant schema (store_id isolation)
-- Full Hostinger pack: database/hostinger/01_schema.sql + 02_seed.sql
-- ====================================================================
`;
}

/**
 * Generates ready-to-run SQL INSERT statements matching live SPA data.
 * Plans use free / paid / pro / custom (not starter / enterprise).
 */
export function generateHostingerSeedSql(
  stores: Store[],
  products: Record<string, Product[]>,
  orders: Record<string, Order[]>,
  customers: Record<string, Customer[]>
): string {
  let sql = `-- ====================================================================\n`;
  sql += `-- UNITYTECK HOSTINGER MYSQL SEED (SPA export)\n`;
  sql += `-- Prefer database/hostinger/02_seed.sql for full DatabaseSeeder parity\n`;
  sql += `-- Plans: free | paid | pro | custom\n`;
  sql += `-- ====================================================================\n\n`;
  sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  sql += `-- Plans catalog\n`;
  sql += `INSERT INTO \`plans\` (\`id\`, \`code\`, \`name\`, \`product_limit\`, \`storage_mb\`, \`team_seats\`, \`features\`, \`is_active\`) VALUES\n`;
  sql += `  ('plan-free','free','Free',50,512,1,'[\"catalog\",\"orders\",\"basic_seo\"]',1),\n`;
  sql += `  ('plan-paid','paid','Paid',500,5120,5,'[\"catalog\",\"orders\",\"seo\",\"coupons\",\"shipping\",\"analytics\"]',1),\n`;
  sql += `  ('plan-pro','pro','Pro',5000,51200,20,'[\"catalog\",\"orders\",\"seo\",\"coupons\",\"shipping\",\"themes\",\"backups\",\"zatca\",\"analytics\",\"ai\"]',1),\n`;
  sql += `  ('plan-custom','custom','Custom',NULL,NULL,NULL,'[\"all\"]',1)\n`;
  sql += `ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`is_active\` = VALUES(\`is_active\`);\n\n`;

  sql += `-- Insert Stores\n`;
  stores.forEach((store) => {
    const plan = normalizePlan(store.plan);
    sql += `INSERT INTO \`stores\` (\`id\`, \`name\`, \`slug\`, \`domain\`, \`status\`, \`plan\`, \`master_granted_pro\`, \`currency\`, \`phone\`, \`email\`, \`owner_name\`, \`city\`, \`country\`, \`category\`, \`products_count\`, \`orders_count\`, \`revenue\`, \`visitors_count\`) VALUES (\n`;
    sql += `  '${escapeSql(store.id)}',\n`;
    sql += `  '${escapeSql(store.name)}',\n`;
    sql += `  '${escapeSql(store.slug)}',\n`;
    sql += `  '${escapeSql(store.slug + '.saudi-stores.com')}',\n`;
    sql += `  '${store.status === 'suspended' ? 'suspended' : store.status}',\n`;
    sql += `  '${plan}',\n`;
    sql += `  ${store.masterGrantedPro ? 1 : 0},\n`;
    sql += `  'SAR',\n`;
    sql += `  '+966 50 123 4567',\n`;
    sql += `  '${escapeSql(store.ownerEmail || 'info@' + store.slug + '.sa')}',\n`;
    sql += `  '${escapeSql(store.owner || '')}',\n`;
    sql += `  'Makkah Al-Mukarramah',\n`;
    sql += `  'Saudi Arabia',\n`;
    sql += `  '${escapeSql(store.category || '')}',\n`;
    sql += `  ${store.productsCount ?? 0},\n`;
    sql += `  ${store.ordersCount ?? 0},\n`;
    sql += `  ${store.revenue ?? 0},\n`;
    sql += `  ${store.visitorsCount ?? 0}\n`;
    sql += `) ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`plan\` = VALUES(\`plan\`), \`status\` = VALUES(\`status\`);\n\n`;
  });

  sql += `-- Insert Products\n`;
  Object.entries(products).forEach(([storeId, list]) => {
    list.forEach((p) => {
      sql += `INSERT INTO \`products\` (\`id\`, \`store_id\`, \`name\`, \`description\`, \`price\`, \`original_price\`, \`cost_price\`, \`sku\`, \`stock\`, \`category\`, \`image_url\`, \`badge\`, \`status\`, \`is_active\`, \`image_version\`) VALUES (\n`;
      sql += `  '${escapeSql(p.id)}',\n`;
      sql += `  '${escapeSql(storeId)}',\n`;
      sql += `  '${escapeSql(p.name)}',\n`;
      sql += `  '${escapeSql(p.name + ' - Luxury Fresh Blooms Handcrafted in Makkah')}',\n`;
      sql += `  ${p.price},\n`;
      sql += `  ${(p.price * 1.25).toFixed(2)},\n`;
      sql += `  ${(p.price * 0.45).toFixed(2)},\n`;
      sql += `  '${escapeSql(p.sku)}',\n`;
      sql += `  ${p.stock},\n`;
      sql += `  '${escapeSql(p.category)}',\n`;
      sql += `  '${escapeSql(p.image)}',\n`;
      sql += `  'Best Seller',\n`;
      sql += `  '${p.status === 'published' ? 'published' : 'draft'}',\n`;
      sql += `  ${p.status === 'published' ? 1 : 0},\n`;
      sql += `  '1'\n`;
      sql += `) ON DUPLICATE KEY UPDATE \`price\` = VALUES(\`price\`), \`stock\` = VALUES(\`stock\`);\n`;
    });
  });
  sql += `\n`;

  sql += `-- Insert Customers\n`;
  Object.entries(customers).forEach(([storeId, list]) => {
    list.forEach((c) => {
      sql += `INSERT INTO \`customers\` (\`id\`, \`store_id\`, \`name\`, \`email\`, \`phone\`, \`city\`, \`total_orders\`, \`total_spend\`, \`acquisition_source\`, \`status\`) VALUES (\n`;
      sql += `  '${escapeSql(c.id)}',\n`;
      sql += `  '${escapeSql(storeId)}',\n`;
      sql += `  '${escapeSql(c.name)}',\n`;
      sql += `  '${escapeSql(c.email)}',\n`;
      sql += `  '${escapeSql(c.phone)}',\n`;
      sql += `  '${escapeSql(c.city)}',\n`;
      sql += `  ${c.totalOrders},\n`;
      sql += `  ${c.totalSpending},\n`;
      sql += `  '${escapeSql(c.source)}',\n`;
      sql += `  '${escapeSql(c.status)}'\n`;
      sql += `) ON DUPLICATE KEY UPDATE \`total_orders\` = VALUES(\`total_orders\`), \`total_spend\` = VALUES(\`total_spend\`);\n`;
    });
  });
  sql += `\n`;

  sql += `-- Insert Orders\n`;
  Object.entries(orders).forEach(([storeId, list]) => {
    list.forEach((o) => {
      sql += `INSERT INTO \`orders\` (\`id\`, \`store_id\`, \`order_number\`, \`customer_name\`, \`customer_email\`, \`customer_phone\`, \`total_amount\`, \`currency\`, \`source\`, \`source_details\`, \`delivery_location\`, \`status\`, \`payment_method\`, \`order_date\`) VALUES (\n`;
      sql += `  '${escapeSql(o.id)}',\n`;
      sql += `  '${escapeSql(storeId)}',\n`;
      sql += `  '${escapeSql(o.orderNumber)}',\n`;
      sql += `  '${escapeSql(o.customerName)}',\n`;
      sql += `  'customer@makkah-client.sa',\n`;
      sql += `  '${escapeSql(o.customerPhone)}',\n`;
      sql += `  ${o.total},\n`;
      sql += `  'SAR',\n`;
      sql += `  '${escapeSql(o.source)}',\n`;
      sql += `  ${o.sourceDetails ? `'${escapeSql(o.sourceDetails)}'` : 'NULL'},\n`;
      sql += `  '${escapeSql(o.deliveryLocation)}',\n`;
      sql += `  '${escapeSql(o.status)}',\n`;
      sql += `  '${escapeSql(o.paymentMethod)}',\n`;
      sql += `  NOW()\n`;
      sql += `) ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);\n`;
    });
  });

  sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;
  sql += `-- ====================================================================\n`;
  sql += `-- SEED COMPLETE — also see database/hostinger/02_seed.sql\n`;
  sql += `-- ====================================================================\n`;

  return sql;
}

/**
 * Generates .env configuration block for Hostinger MySQL connection
 */
export function generateHostingerEnvConfig(config: HostingerDbConfig = DEFAULT_HOSTINGER_CONFIG): string {
  return `# ----------------------------------------------------
# HOSTINGER MYSQL 8 DATABASE CONFIGURATION
# Local API: APP_URL=http://127.0.0.1:8010
# Prefer schema from database/hostinger/01_schema.sql
# ----------------------------------------------------
DB_CONNECTION=mysql
DB_HOST=${config.host}
DB_PORT=${config.port}
DB_DATABASE=${config.database}
DB_USERNAME=${config.username}
DB_PASSWORD=${config.password || 'your_hostinger_db_password_here'}
DB_CHARSET=${config.charset}
DB_COLLATION=${config.collation}
DB_STRICT=true
DB_ENGINE=InnoDB
MYSQL_ATTR_SSL_CA=
`;
}

function escapeSql(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}
