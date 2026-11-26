<?php

/**
 * Souq Platform on Hostinger Cloud.
 * LOCKED hosting split (owner):
 * - Flowers (store-1 / giftshop-sa.com) = separate Hostinger account (stay as-is).
 * - Coffee, Bleco, and EVERY new store = central Hostinger + domain/subdomain on mieraf-ksa.com.
 * Do not force-migrate flowers to central.
 */
return [
    'name_en' => 'Souq Platform',
    'name_ar' => 'منصة سوق',
    'tagline_en' => 'Complete e-commerce',
    'tagline_ar' => 'التجارة الإلكترونية الشاملة',
    'central_repo' => 'https://github.com/hafizfahadilyas/unityteck-saas',
    'package' => 'hostinger_cloud',
    'central_host' => env('SOUQ_CENTRAL_HOST', 'mieraf-ksa.com'),
    'coffee_store_id' => 'store-coffee',
    'coffee_domain' => env('COFFEE_DOMAIN', 'mieraf-ksa.com'),
    'coffee_login_email' => env('COFFEE_LOGIN_EMAIL', 'mieraf.sa8@gmail.com'),
    'flowers_store_id' => 'store-1',
    'flowers_domain' => env('FLOWERS_DOMAIN', 'giftshop-sa.com'),
    'central_docroot' => env('FTP_CENTRAL_DIR', '/domains/mieraf-ksa.com/public_html'),
    'flowers_docroot' => env('FTP_FLOWERS_DIR', '/public_html'),
    'pro_price_sar' => 300,
    'premium_price_sar' => 500,
];
