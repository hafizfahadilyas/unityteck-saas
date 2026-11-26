-- Isolated OpenAI AI Management (does NOT alter Gemini store_ai_* tables)
-- Run on Hostinger MySQL after Laravel migration or as standalone DDL.

CREATE TABLE IF NOT EXISTS openai_global_configs (
  id VARCHAR(64) PRIMARY KEY,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  emergency_disabled TINYINT(1) NOT NULL DEFAULT 0,
  default_text_model VARCHAR(80) NOT NULL DEFAULT 'gpt-5.4-mini',
  prompt_caching_enabled TINYINT(1) NOT NULL DEFAULT 0,
  platform_daily_request_cap INT UNSIGNED NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS openai_model_pricings (
  id VARCHAR(64) PRIMARY KEY,
  model VARCHAR(80) NOT NULL,
  modality VARCHAR(20) NOT NULL DEFAULT 'text',
  input_per_1m_usd DECIMAL(12,6) NOT NULL DEFAULT 0,
  output_per_1m_usd DECIMAL(12,6) NOT NULL DEFAULT 0,
  cached_input_per_1m_usd DECIMAL(12,6) NULL,
  image_per_unit_usd DECIMAL(12,6) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY openai_model_modality_unique (model, modality),
  KEY openai_pricing_active_model (active, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_openai_configs (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  intelligence_level VARCHAR(16) NOT NULL DEFAULT 'medium',
  text_model VARCHAR(80) NULL,
  reasoning_effort VARCHAR(16) NULL,
  prompt_caching_enabled TINYINT(1) NULL,
  daily_token_limit INT UNSIGNED NOT NULL DEFAULT 50000,
  monthly_token_limit INT UNSIGNED NOT NULL DEFAULT 500000,
  max_input_tokens INT UNSIGNED NOT NULL DEFAULT 4000,
  max_output_tokens INT UNSIGNED NOT NULL DEFAULT 2048,
  daily_request_limit INT UNSIGNED NOT NULL DEFAULT 100,
  monthly_request_limit INT UNSIGNED NOT NULL DEFAULT 2000,
  daily_budget_usd DECIMAL(12,4) NOT NULL DEFAULT 5,
  monthly_budget_usd DECIMAL(12,4) NOT NULL DEFAULT 50,
  max_cost_per_request_usd DECIMAL(12,4) NOT NULL DEFAULT 1,
  warning_threshold_pct TINYINT UNSIGNED NOT NULL DEFAULT 80,
  auto_stop_at_budget TINYINT(1) NOT NULL DEFAULT 1,
  allow_admin_override TINYINT(1) NOT NULL DEFAULT 1,
  payment_required_for_usage TINYINT(1) NOT NULL DEFAULT 1,
  usage_unlocked TINYINT(1) NOT NULL DEFAULT 0,
  payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid',
  usage_unlocked_until TIMESTAMP NULL,
  store_isolation_enforced TINYINT(1) NOT NULL DEFAULT 1,
  audit_logging_enabled TINYINT(1) NOT NULL DEFAULT 1,
  rate_limit_per_minute INT UNSIGNED NOT NULL DEFAULT 20,
  config_status VARCHAR(32) NOT NULL DEFAULT 'draft',
  level_overrides JSON NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY store_openai_configs_store_id_unique (store_id),
  KEY store_openai_configs_enabled_store (enabled, store_id),
  CONSTRAINT store_openai_configs_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_openai_usage_logs (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NULL,
  request_id VARCHAR(64) NULL,
  model VARCHAR(80) NULL,
  intelligence_level VARCHAR(16) NULL,
  input_tokens INT UNSIGNED NOT NULL DEFAULT 0,
  output_tokens INT UNSIGNED NOT NULL DEFAULT 0,
  cached_tokens INT UNSIGNED NOT NULL DEFAULT 0,
  total_tokens INT UNSIGNED NOT NULL DEFAULT 0,
  estimated_cost_usd DECIMAL(12,6) NOT NULL DEFAULT 0,
  actual_cost_usd DECIMAL(12,6) NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  error_code VARCHAR(64) NULL,
  error_message TEXT NULL,
  meta JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY store_openai_usage_store_created (store_id, created_at),
  KEY store_openai_usage_store_status (store_id, status),
  KEY store_openai_usage_model_created (model, created_at),
  CONSTRAINT store_openai_usage_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_openai_budget_periods (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  period_type VARCHAR(8) NOT NULL,
  period_key VARCHAR(16) NOT NULL,
  tokens_used INT UNSIGNED NOT NULL DEFAULT 0,
  requests_used INT UNSIGNED NOT NULL DEFAULT 0,
  cost_usd DECIMAL(12,6) NOT NULL DEFAULT 0,
  warning_sent TINYINT(1) NOT NULL DEFAULT 0,
  hard_stopped TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY openai_budget_period_unique (store_id, period_type, period_key),
  CONSTRAINT store_openai_budget_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_openai_config_histories (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  actor_user_id VARCHAR(64) NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  action VARCHAR(40) NOT NULL DEFAULT 'update',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY store_openai_cfg_hist_store_created (store_id, created_at),
  CONSTRAINT store_openai_cfg_hist_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_openai_audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NULL,
  actor_user_id VARCHAR(64) NULL,
  action VARCHAR(64) NOT NULL,
  severity VARCHAR(24) NOT NULL DEFAULT 'info',
  message TEXT NULL,
  meta JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY store_openai_audit_store_created (store_id, created_at),
  KEY store_openai_audit_action_created (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
