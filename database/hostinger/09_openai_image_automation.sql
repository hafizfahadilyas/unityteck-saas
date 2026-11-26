-- OpenAI Image + Automation (Master org model). Does NOT alter Gemini tables.

CREATE TABLE IF NOT EXISTS store_openai_image_configs (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  default_model VARCHAR(80) NOT NULL DEFAULT 'gpt-image-2.6-flare',
  default_quality VARCHAR(16) NOT NULL DEFAULT 'medium',
  monthly_image_quota INT UNSIGNED NOT NULL DEFAULT 50,
  monthly_budget_usd DECIMAL(12,4) NOT NULL DEFAULT 25,
  max_cost_per_image_usd DECIMAL(12,4) NOT NULL DEFAULT 1,
  warning_threshold_pct TINYINT UNSIGNED NOT NULL DEFAULT 80,
  auto_stop_at_quota TINYINT(1) NOT NULL DEFAULT 1,
  payment_required_for_usage TINYINT(1) NOT NULL DEFAULT 1,
  usage_unlocked TINYINT(1) NOT NULL DEFAULT 0,
  payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid',
  usage_unlocked_until TIMESTAMP NULL,
  config_status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY store_openai_image_configs_store_unique (store_id),
  CONSTRAINT store_openai_image_configs_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_openai_image_usage (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  period_key VARCHAR(16) NOT NULL,
  images_success INT UNSIGNED NOT NULL DEFAULT 0,
  images_failed INT UNSIGNED NOT NULL DEFAULT 0,
  cost_usd DECIMAL(12,6) NOT NULL DEFAULT 0,
  warning_sent TINYINT(1) NOT NULL DEFAULT 0,
  hard_stopped TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY store_openai_image_usage_unique (store_id, period_key),
  CONSTRAINT store_openai_image_usage_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_openai_image_events (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NULL,
  request_id VARCHAR(64) NULL,
  model VARCHAR(80) NULL,
  quality VARCHAR(16) NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  actual_cost_usd DECIMAL(12,6) NOT NULL DEFAULT 0,
  media_id VARCHAR(64) NULL,
  error_code VARCHAR(64) NULL,
  error_message TEXT NULL,
  meta JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY store_openai_image_events_store_created (store_id, created_at),
  CONSTRAINT store_openai_image_events_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_openai_automation_configs (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  intelligence_level VARCHAR(16) NOT NULL DEFAULT 'medium',
  text_model VARCHAR(80) NULL,
  monthly_question_quota INT UNSIGNED NOT NULL DEFAULT 100,
  daily_question_quota INT UNSIGNED NOT NULL DEFAULT 20,
  max_output_tokens INT UNSIGNED NOT NULL DEFAULT 1024,
  own_store_data_only TINYINT(1) NOT NULL DEFAULT 1,
  block_cross_store TINYINT(1) NOT NULL DEFAULT 1,
  block_sql_and_secrets TINYINT(1) NOT NULL DEFAULT 1,
  payment_required_for_usage TINYINT(1) NOT NULL DEFAULT 1,
  usage_unlocked TINYINT(1) NOT NULL DEFAULT 0,
  payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid',
  usage_unlocked_until TIMESTAMP NULL,
  config_status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY store_openai_auto_configs_store_unique (store_id),
  CONSTRAINT store_openai_auto_configs_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_openai_automation_usage (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  period_type VARCHAR(8) NOT NULL,
  period_key VARCHAR(16) NOT NULL,
  questions_used INT UNSIGNED NOT NULL DEFAULT 0,
  tokens_used INT UNSIGNED NOT NULL DEFAULT 0,
  cost_usd DECIMAL(12,6) NOT NULL DEFAULT 0,
  hard_stopped TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY openai_auto_usage_unique (store_id, period_type, period_key),
  CONSTRAINT store_openai_auto_usage_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
