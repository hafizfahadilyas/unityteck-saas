-- CT-4: Souq common theme catalog rows (safe upsert)
-- Requires 14_starter_theme_entitlements.sql columns on themes_catalog

INSERT INTO `themes_catalog` (`id`, `name`, `name_ar`, `category`, `tier`, `price_sar`, `included_in_tiers`, `preview_color`, `is_default`, `is_active`, `created_at`, `updated_at`)
VALUES
('theme-souq-common-retail', 'Souq Common Retail', 'سوق المشترك — تجزئة', 'General', 'basic', 0,
 JSON_ARRAY('starter','pro','premium','custom','free','paid'), '#0f766e', 1, 1, NOW(), NOW()),
('theme-souq-common-catalog', 'Souq Common Catalog', 'سوق المشترك — كتالوج', 'General', 'full', 79,
 JSON_ARRAY('pro','premium','custom'), '#1e3a5f', 0, 1, NOW(), NOW()),
('theme-souq-common-services', 'Souq Common Services', 'سوق المشترك — خدمات', 'Services', 'full', 79,
 JSON_ARRAY('pro','premium','custom'), '#7c2d12', 0, 1, NOW(), NOW()),
('theme-souq-common-boutique', 'Souq Common Boutique', 'سوق المشترك — بوتيك', 'Luxury', 'full', 149,
 JSON_ARRAY('premium','custom'), '#581c87', 0, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `name_ar` = VALUES(`name_ar`),
  `category` = VALUES(`category`),
  `tier` = VALUES(`tier`),
  `price_sar` = VALUES(`price_sar`),
  `included_in_tiers` = VALUES(`included_in_tiers`),
  `preview_color` = VALUES(`preview_color`),
  `is_active` = 1,
  `updated_at` = NOW();

UPDATE `themes_catalog` SET `is_default` = 0 WHERE `id` <> 'theme-souq-common-retail';
UPDATE `themes_catalog` SET `is_default` = 1 WHERE `id` = 'theme-souq-common-retail';
