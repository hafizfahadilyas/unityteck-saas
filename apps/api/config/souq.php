<?php

/**
 * Souq Platform on Hostinger Cloud.
 * Central git stays https://github.com/hafizfahadilyas/unityteck-saas
 * Flowers (store-1) uses its own Hostinger. Coffee, car, and later stores use the central Hostinger.
 */
return [
    'name_en' => 'Souq Platform',
    'name_ar' => 'منصة سوق',
    'tagline_en' => 'Complete e-commerce',
    'tagline_ar' => 'التجارة الإلكترونية الشاملة',
    'central_repo' => 'https://github.com/hafizfahadilyas/unityteck-saas',
    'package' => 'hostinger_cloud',
    'coffee_store_id' => 'store-coffee',
    'coffee_domain' => env('COFFEE_DOMAIN', 'mieraf-ksa.com'),
    'coffee_login_email' => env('COFFEE_LOGIN_EMAIL', 'mieraf.sa8@gmail.com'),
    'flowers_store_id' => 'store-1',
    'central_docroot' => env('FTP_CENTRAL_DIR', '/domains/mieraf-ksa.com/public_html'),
    'flowers_docroot' => env('FTP_FLOWERS_DIR', '/public_html'),
    'pro_price_sar' => 300,
    'premium_price_sar' => 500,
];
