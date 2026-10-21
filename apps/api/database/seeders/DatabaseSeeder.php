<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Domain;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\ShippingMethod;
use App\Models\ShippingZone;
use App\Models\CourierConnection;
use App\Models\Shipment;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\Subscription;
use App\Models\ThemeCatalog;
use App\Models\User;
use App\Support\DefaultTheme;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedPlans();
        $this->seedThemes();
        $this->seedMasterUser();
        $this->seedStoreOne();
        $this->seedStoreCoffee();
        $this->seedStoreBleco();
    }

    protected function seedPlans(): void
    {
        $plans = [
            [
                'id' => 'plan-free',
                'code' => 'free',
                'name' => 'Free',
                'product_limit' => 50,
                'storage_mb' => 512,
                'team_seats' => 1,
                'features' => ['catalog', 'orders', 'basic_seo', 'themes_basic'],
            ],
            [
                'id' => 'plan-paid',
                'code' => 'paid',
                'name' => 'Paid',
                'product_limit' => 500,
                'storage_mb' => 5120,
                'team_seats' => 5,
                'features' => ['catalog', 'orders', 'seo', 'coupons', 'shipping', 'analytics', 'themes_basic'],
            ],
            [
                'id' => 'plan-pro',
                'code' => 'pro',
                'name' => 'Pro',
                'product_limit' => 5000,
                'storage_mb' => 51200,
                'team_seats' => 20,
                'features' => ['catalog', 'orders', 'seo', 'coupons', 'shipping', 'themes_basic', 'themes', 'backups', 'zatca', 'analytics', 'ai'],
            ],
            [
                'id' => 'plan-custom',
                'code' => 'custom',
                'name' => 'Custom',
                'product_limit' => null,
                'storage_mb' => null,
                'team_seats' => null,
                'features' => ['all'],
            ],
        ];

        foreach ($plans as $plan) {
            Plan::query()->updateOrCreate(['id' => $plan['id']], array_merge($plan, ['is_active' => true]));
        }
    }

    protected function seedThemes(): void
    {
        // Universal default dummy e-commerce theme for every new client
        DefaultTheme::ensureCatalogRow();

        // Demo boutique theme (store-1 can keep / switch — not the platform default)
        ThemeCatalog::query()->updateOrCreate(
            ['id' => 'theme-makkah-royal'],
            [
                'name' => 'Makkah Royal Rose',
                'category' => 'Luxury',
                'tier' => 'full',
                'preview_color' => '#064e3b',
                'is_default' => false,
            ]
        );

        ThemeCatalog::query()->updateOrCreate(
            ['id' => 'theme-blossom-cream'],
            [
                'name' => 'Blossom Cream & Blush',
                'category' => 'Minimal',
                'tier' => 'full',
                'preview_color' => '#f43f5e',
                'is_default' => false,
            ]
        );

        ThemeCatalog::query()->updateOrCreate(
            ['id' => 'theme-umrah-spiritual'],
            [
                'name' => 'Spiritual Umrah & Eid',
                'category' => 'Ramadan',
                'tier' => 'full',
                'preview_color' => '#1e1b4b',
                'is_default' => false,
            ]
        );

        ThemeCatalog::query()->updateOrCreate(
            ['id' => 'theme-bridal-elegance'],
            [
                'name' => 'Bridal Elegance',
                'category' => 'Luxury',
                'tier' => 'full',
                'preview_color' => '#c084fc',
                'is_default' => false,
            ]
        );
    
        ThemeCatalog::query()->updateOrCreate(
            ['id' => 'theme-coffee-artisan'],
            [
                'name' => 'HiBrew Specialty Coffee & Roasters',
                'category' => 'Artisan & Coffee',
                'tier' => 'full',
                'preview_color' => '#7c2d12',
                'is_default' => false,
            ]
        );

        ThemeCatalog::query()->updateOrCreate(
            ['id' => 'theme-automotive-luxury'],
            [
                'name' => 'Al-Saeedi Modern Luxury Automotive',
                'category' => 'Automotive & Tech',
                'tier' => 'full',
                'preview_color' => '#0b1120',
                'is_default' => false,
            ]
        );
    }

    protected function seedMasterUser(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'master@unityteck.com'],
            [
                'id' => 'user-master-1',
                'name' => 'Unityteck Master',
                'password' => Hash::make(env('ADMIN_MASTER_PASSWORD', 'UnityMaster@2026!Secure')),
                'role' => 'super_admin',
            ]
        );
    }

    protected function seedStoreOne(): void
    {
        $store = Store::query()->updateOrCreate(
            ['id' => 'store-1'],
            [
                'name' => 'Makkah Fresh Flowers',
                'slug' => 'makkah-fresh-flowers',
                'domain' => 'giftshop-sa.com',
                'custom_domain' => 'giftshop-sa.com',
                'demo_domain' => 'giftshop-sa.com',
                'status' => 'active',
                'plan' => 'pro',
                'master_granted_pro' => true,
                'currency' => 'SAR',
                'locale' => 'ar',
                'text_direction' => 'rtl',
                'timezone' => 'Asia/Riyadh',
                'phone' => '+966 50 442 8819',
                'email' => 'giftshop2030m@gmail.com',
                'owner_name' => 'متجر هدايا',
                'city' => 'Makkah',
                'country' => 'Saudi Arabia',
                'category' => 'Real Fresh Flowers & Luxury Gifts',
                'logo' => 'flower',
                'accent_color' => '#059669',
                'hosting_mode' => 'dedicated',
                'db_isolation' => 'dedicated_mysql',
                'products_count' => 6,
                'orders_count' => 3,
                'revenue' => 1610,
                'visitors_count' => 1420,
            ]
        );

        Domain::query()->updateOrCreate(
            ['id' => 'dom-1'],
            [
                'store_id' => $store->id,
                'domain_name' => 'giftshop-sa.com',
                'is_primary' => true,
                'ssl_status' => 'active',
                'dns_configured' => true,
                'dns_verified' => true,
                'hosting_tier' => 'Hostinger Shared Premium',
                'monthly_fee' => 49.00,
                'payment_received' => true,
                'status' => 'active',
                'nameservers' => json_encode(['ns1.dns-parking.com', 'ns2.dns-parking.com']),
                'registered_date' => '2024-01-10',
                'hostinger_plan' => 'Premium Shared Hosting',
                'server_ip' => '145.79.26.23',
            ]
        );

        Subscription::query()->updateOrCreate(
            ['id' => 'sub-store-1'],
            [
                'store_id' => $store->id,
                'plan_id' => 'plan-pro',
                'status' => 'active',
                'billing_interval' => 'yearly',
                'starts_at' => now()->subMonths(6),
                'ends_at' => now()->addYear(),
                'grace_ends_at' => null,
                'renewed_at' => now()->subMonths(6),
            ]
        );

        $storeOwner = User::query()->updateOrCreate(
            ['email' => 'giftshop2030m@gmail.com'],
            [
                'id' => 'user-store-1',
                'name' => 'متجر هدايا',
                'password' => Hash::make(env('ADMIN_STORE_PASSWORD', 'MakkahStore@2026!Secure')),
                'role' => 'manager',
            ]
        );

        StoreUser::query()->updateOrCreate(
            [
                'store_id' => $store->id,
                'user_id' => $storeOwner->id,
            ],
            [
                'id' => 'su-store-1-owner',
                'role' => 'manager',
            ]
        );

        // Phase 2.3 — support seat (can orders/customers, cannot products.write)
        $support = User::query()->updateOrCreate(
            ['email' => 'support@wardalmakkah.sa'],
            [
                'id' => 'user-store-support-1',
                'name' => 'Ward Support',
                'password' => Hash::make(env('ADMIN_SUPPORT_PASSWORD', 'WardSupport@2026!Secure')),
                'role' => 'support',
            ]
        );

        StoreUser::query()->updateOrCreate(
            [
                'store_id' => $store->id,
                'user_id' => $support->id,
            ],
            [
                'id' => 'su-store-1-support',
                'role' => 'support',
            ]
        );

        $products = require __DIR__.'/makkah_products.php';

        foreach ($products as $p) {
            Product::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $p['id']],
                array_merge($p, [
                    'store_id' => 'store-1',
                    'slug' => strtolower($p['sku'] ?? $p['id']),
                    'status' => 'published',
                    'is_active' => true,
                    'image_version' => '1',
                ])
            );
        }

        // Variations on key signature products
        $variations = [
            [
                'id' => 'var-wm-rose-01-s',
                'product_id' => 'wm-rose-01',
                'sku' => 'WM-ROSE-01-S-RED',
                'options' => ['size' => 'S (20 وردة)', 'color' => 'Red'],
                'price' => 280,
                'stock' => 15,
            ],
            [
                'id' => 'var-wm-rose-01-m',
                'product_id' => 'wm-rose-01',
                'sku' => 'WM-ROSE-01-M-RED',
                'options' => ['size' => 'M (40 وردة)', 'color' => 'Red'],
                'price' => 340,
                'stock' => 20,
            ],
            [
                'id' => 'var-wm-rose-01-l',
                'product_id' => 'wm-rose-01',
                'sku' => 'WM-ROSE-01-L-VELVET',
                'options' => ['size' => 'L (60 وردة ملكية)', 'color' => 'Deep Crimson', 'material' => 'Velvet box'],
                'price' => 450,
                'stock' => 10,
            ],
        ];
        foreach ($variations as $v) {
            ProductVariation::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $v['id']],
                array_merge($v, [
                    'store_id' => 'store-1',
                    'image_url' => 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
                    'is_active' => true,
                ])
            );
        }

        $categorySeeds = [
            [
                'id' => 'c-1',
                'name' => 'Natural Flower Bouquets',
                'name_ar' => 'باقات الورود الطبيعية',
                'slug' => 'natural-bouquets',
                'parent_id' => null,
                'sort_order' => 10,
                'meta_title' => 'باقات الورود الطبيعية | هدايا مكة',
                'meta_description' => 'أجود باقات الورد الطبيعي الهولندي والإكوادوري في مكة المكرمة.',
                'image_url' => 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png',
            ],
            [
                'id' => 'c-2',
                'name' => 'Roses & Patchi Chocolate',
                'name_ar' => 'ورد و شوكليت باتشي',
                'slug' => 'roses-patchi',
                'parent_id' => null,
                'sort_order' => 20,
                'meta_title' => 'ورد وشوكولاتة باتشي | هدايا مكة',
                'meta_description' => 'تناغم شوكولاتة باتشي الفاخرة وباقات الجوري الملكية.',
                'image_url' => 'https://cdn.salla.sa/form-builder/vXd8gFVPfRavCrvqEUF68BHdHHn8pqj3mMglFTIt.png',
            ],
            [
                'id' => 'c-3',
                'name' => 'Roses & Bostani Chocolate',
                'name_ar' => 'ورد وشوكوليت بستاني',
                'slug' => 'roses-bostani',
                'parent_id' => null,
                'sort_order' => 30,
                'meta_title' => 'ورد وشوكوليت بستاني الفاخر | هدايا مكة',
                'meta_description' => 'شوكولاتة بستاني البلجيكية الراقية مع تنسيق الجوري الزهري.',
                'image_url' => 'https://cdn.salla.sa/form-builder/JEDxluyY7LbYdo5So7sLrPqqupntM3LUhIxV3gXD.png',
            ],
            [
                'id' => 'c-4',
                'name' => 'Natural Flower Vases',
                'name_ar' => 'فازات ورد طبيعي',
                'slug' => 'flower-vases',
                'parent_id' => null,
                'sort_order' => 40,
                'meta_title' => 'فازات ورد طبيعي كريستال | هدايا مكة',
                'meta_description' => 'فازات كريستالية وسيراميك راقية لتزيين المجالس وطاولات القهوة.',
                'image_url' => 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png',
            ],
            [
                'id' => 'c-5',
                'name' => 'Flower Vases with Chocolate',
                'name_ar' => 'فازات الورود مع شوكليت',
                'slug' => 'vases-chocolate',
                'parent_id' => null,
                'sort_order' => 50,
                'meta_title' => 'فازات الورود مع الشوكولاتة | هدايا مكة',
                'meta_description' => 'توليفة فخمة تجمع بين الفازات الكريستالية والشوكولاتة السويسرية.',
                'image_url' => 'https://cdn.salla.sa/form-builder/qk6gpVW76xoVeFb6kZrmFFGOFOXQ4q8JalQmKw0R.png',
            ],
            [
                'id' => 'c-6',
                'name' => 'Roses with Aquarium Fish',
                'name_ar' => 'ورود مع أسماك زينة',
                'slug' => 'roses-fish',
                'parent_id' => null,
                'sort_order' => 60,
                'meta_title' => 'ورود مع أسماك زينة هدايا مبتكرة | هدايا مكة',
                'meta_description' => 'ابتكار حجازي فريد يجمع بين حوض أسماك الزينة وتنسيق الزهور الطبيعية.',
                'image_url' => 'https://cdn.salla.sa/form-builder/ykMusuoNPFuZdMPHsJcYHJb6fejLSpaoSZxKGAwh.png',
            ],
            [
                'id' => 'c-7',
                'name' => 'Roses with Lovebirds',
                'name_ar' => 'ورود مع عصافير الحب',
                'slug' => 'roses-lovebirds',
                'parent_id' => null,
                'sort_order' => 70,
                'meta_title' => 'ورود مع عصافير الحب | هدايا مكة',
                'meta_description' => 'هدية رومانسية حية مع قفص عصافير الحب وباقة الجوري الفاتنة.',
                'image_url' => 'https://cdn.salla.sa/form-builder/dZpSzihLrTks3koUrmlpfNV0AcHVSx3bE1KNFQTQ.png',
            ],
            [
                'id' => 'c-8',
                'name' => 'Roses & Coffee Presentation',
                'name_ar' => 'تقديمة ورد وقهوة',
                'slug' => 'roses-coffee',
                'parent_id' => null,
                'sort_order' => 80,
                'meta_title' => 'تقديمة ورد وقهوة سعودية أصيلة | هدايا مكة',
                'meta_description' => 'أصالة الضيافة الحجازية مع القهوة المختصة والزهور الطبيعية.',
                'image_url' => 'https://cdn.salla.sa/form-builder/2fomvXwpTYOOx8h3JMZGP3r5dnXelUxxIUDuzepj.png',
            ],
            [
                'id' => 'c-9',
                'name' => 'Roses with Coffee & Sweets',
                'name_ar' => 'تقديمة ورد مع قهوة وحلا',
                'slug' => 'roses-coffee-sweets',
                'parent_id' => null,
                'sort_order' => 90,
                'meta_title' => 'تقديمة ورد مع قهوة وحلا | هدايا مكة',
                'meta_description' => 'صينية الضيافة الملكية بالقهوة والحلويات الفاخرة وباقة الورد.',
                'image_url' => 'https://cdn.salla.sa/form-builder/zf3HeZ6jT4wON2ZEbeJfdMTc4bMLWQLkFvCndepr.png',
            ],
            [
                'id' => 'c-10',
                'name' => 'Roses with Gourmet Cake',
                'name_ar' => 'ورد مع كيك',
                'slug' => 'roses-cake',
                'parent_id' => null,
                'sort_order' => 100,
                'meta_title' => 'ورد وكيك احتفال | هدايا مكة',
                'meta_description' => 'كعكات الريد فيلفت والميلاد مع باقات الورد الجوري الملكي.',
                'image_url' => 'https://cdn.salla.sa/form-builder/JnIWUYX47T9XyXPQlFx76ihWwhqD2N3xXKcYBMbh.png',
            ],
            [
                'id' => 'c-11',
                'name' => 'Korean Lunchbox Bento Cake',
                'name_ar' => 'تقديمة كيك الكوري',
                'slug' => 'korean-cake',
                'parent_id' => null,
                'sort_order' => 110,
                'meta_title' => 'تقديمة كيك الكوري اللطيف | هدايا مكة',
                'meta_description' => 'بينتو كيك كوري لعبارات الحب والمفاجآت مع باقة ورد يد صغيرة.',
                'image_url' => 'https://cdn.salla.sa/form-builder/iN2hGSe4EYU7Jl2Jt6U5uk9swZaHsPbJnnqpNpac.png',
            ],
            [
                'id' => 'occ-1',
                'name' => 'Mawajeeb Wooden Plaques',
                'name_ar' => 'لوحات مواجيب وتراث حجازي',
                'slug' => 'mawajeeb',
                'parent_id' => null,
                'sort_order' => 120,
                'meta_title' => 'لوحات مواجيب | هدايا مكة',
                'meta_description' => 'لوحات تذكارية وتراث حجازي عريق مع ورد وبخور مروكي.',
                'image_url' => 'https://cdn.files.salla.network/products/246985580/539625c7-703f-4c13-aa4c-24d982e20865-original.webp',
            ],
            [
                'id' => 'occ-2',
                'name' => 'Newborn Welcome Gifts',
                'name_ar' => 'هدايا المواليد',
                'slug' => 'newborn',
                'parent_id' => null,
                'sort_order' => 130,
                'meta_title' => 'هدايا استقبال المواليد | هدايا مكة',
                'meta_description' => 'باقات ودببة ناعمة وستاندات استقبال المواليد الجدد في المشافي والمنازل.',
                'image_url' => 'https://cdn.salla.sa/form-builder/h7hTylc4cMiriSfxe2sGsX0mL5Sc7akjxHAAUqHp.png',
            ],
            [
                'id' => 'occ-3',
                'name' => 'Graduation Milestones',
                'name_ar' => 'هدايا التخرج',
                'slug' => 'graduation',
                'parent_id' => null,
                'sort_order' => 140,
                'meta_title' => 'هدايا التخرج الملكية | هدايا مكة',
                'meta_description' => 'باقات تخرج مذهبة مع قبعة ووشاح وبوكسات شوكولاتة باتشي.',
                'image_url' => 'https://cdn.salla.sa/form-builder/unEMJIoOHLnWigTn0DpvQZbQMxNjU4QgVOT2BdUM.png',
            ],
            [
                'id' => 'occ-4',
                'name' => 'Valentine & Romantic Gifts',
                'name_ar' => 'هدايا عيد الحب والرومانسية',
                'slug' => 'valentine',
                'parent_id' => null,
                'sort_order' => 150,
                'meta_title' => 'هدايا عيد الحب والرومانسية | هدايا مكة',
                'meta_description' => 'أجمل بوكسات الورد الأحمر المخملي والشوكولاتة البلجيكية الفاخرة.',
                'image_url' => 'https://cdn.salla.sa/form-builder/Y0Yt8LLfhRt46ljjaZjTaANumrZvYodYnv5CGQ7o.png',
            ],
            [
                'id' => 'occ-5',
                'name' => 'Wedding & Bridal Keepsakes',
                'name_ar' => 'هدايا الزواج والعرائس',
                'slug' => 'wedding',
                'parent_id' => null,
                'sort_order' => 160,
                'meta_title' => 'مسكات وباقات عرائس الزواج | هدايا مكة',
                'meta_description' => 'مسكات العرائس الفاخرة باللؤلؤ والزهور الإكوادورية البيضاء المستوردة.',
                'image_url' => 'https://cdn.salla.sa/form-builder/Z8aMbQ8cDkf9OnQakCZwnH4GvpnqLlXsCqBk70ik.png',
            ],
            [
                'id' => 'occ-6',
                'name' => 'Birthday Celebrations',
                'name_ar' => 'هدايا عيد ميلاد',
                'slug' => 'birthday',
                'parent_id' => null,
                'sort_order' => 170,
                'meta_title' => 'هدايا عيد ميلاد مميزة | هدايا مكة',
                'meta_description' => 'مفاجآت أعياد الميلاد مع الكيك والبالونات الهيليوم وباقات الورد المبهجة.',
                'image_url' => 'https://cdn.salla.sa/form-builder/nm5BDgkXRslZvqTetu5wTrCTTTTLTrsBhWwjHMyI.png',
            ],
            [
                'id' => 'occ-7',
                'name' => 'Men Luxury Gifts',
                'name_ar' => 'هدايا رجالية ملكية',
                'slug' => 'men-gifts',
                'parent_id' => null,
                'sort_order' => 180,
                'meta_title' => 'أطقم هدايا رجالية فاخرة | هدايا مكة',
                'meta_description' => 'صناديق جلدية ملكية تضم عطور وساعات ومحافظ فاخرة مع ورد طبيعي.',
                'image_url' => '/src/assets/images/hadaya_men_luxury_gift_1791219799100.jpg',
            ],
            [
                'id' => 'occ-8',
                'name' => 'Women Luxury Gifts',
                'name_ar' => 'هدايا نسائية فاخرة',
                'slug' => 'women-gifts',
                'parent_id' => null,
                'sort_order' => 190,
                'meta_title' => 'أطقم هدايا نسائية راقية | هدايا مكة',
                'meta_description' => 'صناديق مخملية تضم عطور ومجوهرات زركون مع زهور البيوني الفاتنة.',
                'image_url' => '/src/assets/images/hadaya_women_luxury_gift_1791219815272.jpg',
            ],
        ];
        foreach ($categorySeeds as $c) {
            Category::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $c['id']],
                array_merge($c, [
                    'store_id' => 'store-1',
                    'is_active' => true,
                ])
            );
        }

        $customers = [
            [
                'id' => 'cust-1',
                'name' => 'Abdulrahman Al-Thaqafi (عبدالرحمن الثقفي)',
                'phone' => '+966 50 442 8819',
                'email' => 'a.thaqafi@makkah.sa',
                'status' => 'VIP',
                'city' => 'Makkah (فنادق الحرم)',
                'gender' => 'Male',
                'group' => 'VIP',
                'acquisition_source' => 'WhatsApp',
                'total_orders' => 3,
                'total_spend' => 1850,
                'avg_order_value' => 616,
            ],
            [
                'id' => 'cust-2',
                'name' => 'Sarah Al-Otaibi (سارة العتيبي)',
                'phone' => '+966 55 981 2234',
                'email' => 'sarah.otaibi@gmail.com',
                'status' => 'Active',
                'city' => 'Makkah (العوالي)',
                'gender' => 'Female',
                'group' => 'Regular',
                'acquisition_source' => 'Instagram',
                'total_orders' => 2,
                'total_spend' => 760,
                'avg_order_value' => 380,
            ],
            [
                'id' => 'cust-3',
                'name' => 'Eng. Mohammed Al-Harbi (م. محمد الحربي)',
                'phone' => '+966 54 112 7765',
                'email' => 'm.harbi@aramco.com',
                'status' => 'New',
                'city' => 'Makkah (جبل عمر)',
                'gender' => 'Male',
                'group' => 'VIP',
                'acquisition_source' => 'Google Ads',
                'total_orders' => 1,
                'total_spend' => 580,
                'avg_order_value' => 580,
            ],
        ];

        foreach ($customers as $c) {
            Customer::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $c['id']],
                array_merge($c, [
                    'store_id' => 'store-1',
                    'country' => 'Saudi Arabia',
                    'last_order_date' => now(),
                ])
            );
        }

        $orders = [
            [
                'id' => 'ord-101',
                'order_number' => 'WM-MK-9421',
                'customer_id' => 'cust-1',
                'customer_name' => 'Abdulrahman Al-Thaqafi (عبدالرحمن الثقفي)',
                'customer_phone' => '+966 50 442 8819',
                'customer_email' => 'a.thaqafi@makkah.sa',
                'items_count' => 1,
                'items_summary' => 'Makkah Haram VIP Gift Hamper (هدية الحرم الفاخرة مع ماء زمزم)',
                'total_amount' => 650,
                'source' => 'WhatsApp',
                'source_details' => 'WhatsApp Business (+966 Saudi) · Direct VIP Concierge Chat #WA-8819',
                'delivery_location' => 'فندق فيرمونت برج الساعة - الحرم، مكة',
                'status' => 'completed',
                'payment_method' => 'Apple Pay',
                'product_id' => 'wm-vip-03',
                'minutes_ago' => 12,
            ],
            [
                'id' => 'ord-102',
                'order_number' => 'WM-MK-9422',
                'customer_id' => 'cust-2',
                'customer_name' => 'Sarah Al-Otaibi (سارة العتيبي)',
                'customer_phone' => '+966 55 981 2234',
                'customer_email' => 'sarah.otaibi@gmail.com',
                'items_count' => 1,
                'items_summary' => 'Royal Dutch Red Roses Velvet Box (بوكس الجوري الأحمر الملكي)',
                'total_amount' => 380,
                'source' => 'Instagram',
                'source_details' => 'Instagram Story Ad (Saudi Arabia / Makkah Region)',
                'delivery_location' => 'حي العوالي، بالقرب من جامعة أم القرى، مكة',
                'status' => 'processing',
                'payment_method' => 'Mada',
                'product_id' => 'wm-rose-01',
                'minutes_ago' => 45,
            ],
            [
                'id' => 'ord-103',
                'order_number' => 'WM-MK-9423',
                'customer_id' => 'cust-3',
                'customer_name' => 'Eng. Mohammed Al-Harbi (م. محمد الحربي)',
                'customer_phone' => '+966 54 112 7765',
                'customer_email' => 'm.harbi@aramco.com',
                'items_count' => 1,
                'items_summary' => 'Luxury Wedding Bridal Bouquet (مسكة عروس راقية من الجوري الطبيعي)',
                'total_amount' => 580,
                'source' => 'Google Ads',
                'source_details' => 'Google Search Ads KSA · Target: Makkah',
                'delivery_location' => 'فندق هيلتون جبل عمر، مكة المكرمة',
                'status' => 'pending',
                'payment_method' => 'Mada',
                'product_id' => 'wm-bride-04',
                'minutes_ago' => 120,
            ],
        ];

        foreach ($orders as $o) {
            $productId = $o['product_id'];
            $minutesAgo = $o['minutes_ago'];
            unset($o['product_id'], $o['minutes_ago']);

            Order::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $o['id']],
                array_merge($o, [
                    'store_id' => 'store-1',
                    'currency' => 'SAR',
                    'order_date' => now()->subMinutes($minutesAgo),
                ])
            );

            OrderItem::withoutGlobalScope('store')->updateOrCreate(
                [
                    'order_id' => $o['id'],
                    'product_id' => $productId,
                ],
                [
                    'store_id' => 'store-1',
                    'product_name' => $o['items_summary'],
                    'quantity' => 1,
                    'unit_price' => $o['total_amount'],
                    'subtotal' => $o['total_amount'],
                ]
            );
        }

        Coupon::withoutGlobalScope('store')->updateOrCreate(
            ['id' => 'coup-1'],
            [
                'store_id' => 'store-1',
                'code' => 'MAKKAH10',
                'discount_type' => 'percentage',
                'discount_value' => 10,
                'min_order_amount' => 200,
                'usage_count' => 148,
                'max_uses' => 500,
                'status' => 'active',
                'is_active' => true,
                'expires_at' => '2026-12-31 23:59:59',
            ]
        );

        Coupon::withoutGlobalScope('store')->updateOrCreate(
            ['id' => 'coup-2'],
            [
                'store_id' => 'store-1',
                'code' => 'HARAM_VIP',
                'discount_type' => 'fixed',
                'discount_value' => 50,
                'min_order_amount' => 400,
                'usage_count' => 84,
                'max_uses' => 250,
                'status' => 'active',
                'is_active' => true,
                'expires_at' => '2026-12-31 23:59:59',
            ]
        );

        $shippingMethods = [
            [
                'id' => 'shipm-free',
                'name' => 'Free Shipping (توصيل مجاني)',
                'name_ar' => 'شحن مجاني للطلبات فوق 300 ريال',
                'type' => 'free',
                'base_rate' => 0,
                'min_order_amount' => 300,
                'free_shipping_threshold' => 300,
                'estimated_delivery' => '2-3 Days',
                'courier_code' => 'spl',
                'is_active' => true,
            ],
            [
                'id' => 'shipm-flat',
                'name' => 'Standard Flat Rate (شحن قياسي مخفض)',
                'name_ar' => 'شحن موحد لجميع مدن المملكة',
                'type' => 'flat_rate',
                'base_rate' => 25,
                'estimated_delivery' => '2-3 Days',
                'courier_code' => 'smsa',
                'is_active' => true,
            ],
            [
                'id' => 'shipm-same-day',
                'name' => 'Same-Day Makkah Express (توصيل نفس اليوم مكة)',
                'name_ar' => 'سيارات مبردة خاصة لتوصيل الورد في نفس اليوم',
                'type' => 'same_day',
                'base_rate' => 35,
                'estimated_delivery' => 'Same-Day (2-4 Hours)',
                'courier_code' => 'spl',
                'is_active' => true,
            ],
            [
                'id' => 'shipm-weight',
                'name' => 'Weight Based Express (شحن حسب الوزن)',
                'name_ar' => 'احتساب الرسوم حسب الوزن الإجمالي للطلب',
                'type' => 'weight_based',
                'base_rate' => 20,
                'per_kg_rate' => 5,
                'estimated_delivery' => '1-2 Days',
                'courier_code' => 'aramex',
                'is_active' => true,
            ],
            [
                'id' => 'shipm-cod',
                'name' => 'Cash on Delivery (الدفع عند الاستلام)',
                'name_ar' => 'تحصيل المبلغ نقداً عند استلام الشحنة',
                'type' => 'cod',
                'base_rate' => 25,
                'is_cod_allowed' => true,
                'cod_fee' => 15,
                'estimated_delivery' => '2-3 Days',
                'courier_code' => 'smsa',
                'is_active' => true,
            ],
        ];

        foreach ($shippingMethods as $sm) {
            ShippingMethod::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $sm['id']],
                array_merge($sm, ['store_id' => 'store-1'])
            );
        }

        $zones = [
            ['id' => 'ship-1', 'name' => 'Makkah - Al Haram & Clock Tower Hotels', 'region' => 'Makkah Region', 'rate' => 0, 'free_above' => 0, 'estimated_delivery' => '1-2 Hours Express', 'cod_available' => true],
            ['id' => 'ship-2', 'name' => 'Makkah - Al-Aziziyah & Mahbas Al-Jinn', 'region' => 'Makkah Region', 'rate' => 20, 'free_above' => 250, 'estimated_delivery' => '2 Hours Same Day', 'cod_available' => true],
            ['id' => 'ship-3', 'name' => 'Jeddah Metropolitan', 'region' => 'Makkah Region', 'rate' => 25, 'free_above' => 300, 'estimated_delivery' => 'Same Day / Next Day', 'cod_available' => true],
            ['id' => 'ship-4', 'name' => 'Riyadh Region', 'region' => 'Riyadh Region', 'rate' => 30, 'free_above' => 350, 'estimated_delivery' => '1-2 Days', 'cod_available' => true],
            ['id' => 'ship-5', 'name' => 'Madinah Region', 'region' => 'Madinah Region', 'rate' => 25, 'free_above' => 300, 'estimated_delivery' => '1-2 Days', 'cod_available' => true],
            ['id' => 'ship-6', 'name' => 'Eastern Province (Dammam / Khobar)', 'region' => 'Eastern Province', 'rate' => 35, 'free_above' => 400, 'estimated_delivery' => '2-3 Days', 'cod_available' => false],
            ['id' => 'ship-7', 'name' => 'Other Saudi Regions', 'region' => 'Other', 'rate' => 40, 'free_above' => 500, 'estimated_delivery' => '3-4 Days', 'cod_available' => false],
        ];

        foreach ($zones as $z) {
            ShippingZone::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $z['id']],
                array_merge($z, [
                    'store_id' => 'store-1',
                    'status' => 'active',
                    'is_active' => true,
                    'min_delivery_days' => 0,
                    'max_delivery_days' => 3,
                ])
            );
        }

        // Courier Connections for store-1
        $couriers = [
            [
                'id' => 'cour-spl-1',
                'provider' => 'spl',
                'account_name' => 'Saudi Post (SPL | سبل)',
                'account_number' => 'SPL-MK-99120',
                'api_key' => 'spl_live_key_9941829104820194',
                'is_sandbox' => true,
                'is_connected' => true,
                'status' => 'connected',
                'last_tested_at' => now()->subDay(),
            ],
            [
                'id' => 'cour-smsa-1',
                'provider' => 'smsa',
                'account_name' => 'SMSA Express',
                'account_number' => 'SMSA-SA-88190',
                'api_key' => 'smsa_passkey_290192837482',
                'is_sandbox' => true,
                'is_connected' => true,
                'status' => 'connected',
                'last_tested_at' => now()->subDay(),
            ],
            [
                'id' => 'cour-arx-1',
                'provider' => 'aramex',
                'account_name' => 'Aramex KSA',
                'account_number' => 'ARX-SA-55219',
                'api_key' => 'arx_secret_api_pass_2026',
                'is_sandbox' => true,
                'is_connected' => true,
                'status' => 'connected',
                'last_tested_at' => now()->subDay(),
            ],
        ];

        foreach ($couriers as $c) {
            CourierConnection::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $c['id']],
                array_merge($c, ['store_id' => 'store-1'])
            );
        }

        // Payment Gateways for store-1
        $gateways = [
            [
                'id' => 'gw-moyasar-1',
                'provider' => 'moyasar',
                'title' => 'Moyasar (Mada · Apple Pay · STC Pay · Credit Card)',
                'title_ar' => 'ميسر للمدفوعات الرقمية (مدى، أبل باي، إس تي سي باي، فيزا)',
                'is_enabled' => true,
                'is_sandbox' => true,
                'public_key' => 'pk_test_moyasar_makkah_flowers_8819',
                'secret_key' => 'sk_test_moyasar_secret_key_88192026',
                'webhook_secret' => 'whsec_moyasar_makkah_live_verify',
                'supported_methods' => ['mada', 'apple_pay', 'stc_pay', 'credit_card'],
                'transaction_fee_percent' => 1.50,
                'transaction_fee_fixed' => 1.00,
                'status' => 'connected',
                'last_tested_at' => now()->subDay(),
            ],
            [
                'id' => 'gw-cod-1',
                'provider' => 'cod',
                'title' => 'Cash on Delivery (الدفع عند الاستلام)',
                'title_ar' => 'الدفع عند الاستلام نقداً للمندوب',
                'is_enabled' => true,
                'is_sandbox' => false,
                'supported_methods' => ['cod'],
                'transaction_fee_percent' => 0.00,
                'transaction_fee_fixed' => 0.00,
                'status' => 'connected',
                'last_tested_at' => now(),
            ],
        ];

        foreach ($gateways as $gw) {
            PaymentGateway::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $gw['id']],
                array_merge($gw, ['store_id' => 'store-1'])
            );
        }

        // Real Shipments for existing orders
        $orderShipments = [
            [
                'id' => 'shp-101',
                'order_id' => 'ord-101',
                'courier_id' => 'cour-spl-1',
                'provider' => 'spl',
                'awb_number' => 'SPL-MK-882190',
                'tracking_number' => 'SPL991204881',
                'label_url' => 'https://api.splonline.com.sa/labels/SPL991204881.pdf',
                'status' => 'delivered',
                'shipping_cost' => 0.00,
                'delivered_at' => now()->subHours(2),
                'tracking_events' => [
                    ['time' => now()->subHours(4)->toIso8601String(), 'status' => 'Picked Up', 'description' => 'Collected from Makkah store'],
                    ['time' => now()->subHours(2)->toIso8601String(), 'status' => 'Delivered', 'description' => 'Delivered to Fairmont Clock Tower Concierge'],
                ],
            ],
            [
                'id' => 'shp-102',
                'order_id' => 'ord-102',
                'courier_id' => 'cour-smsa-1',
                'provider' => 'smsa',
                'awb_number' => 'SMSA-MK-58190',
                'tracking_number' => 'SMSA2901928374',
                'label_url' => 'https://track.smsaexpress.com/printAWB?awb=2901928374',
                'status' => 'in_transit',
                'shipping_cost' => 20.00,
                'tracking_events' => [
                    ['time' => now()->subHour()->toIso8601String(), 'status' => 'In Transit', 'description' => 'Out for delivery to Al-Awali'],
                ],
            ],
        ];

        foreach ($orderShipments as $os) {
            Shipment::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $os['id']],
                array_merge($os, ['store_id' => 'store-1'])
            );
        }

        // Real Payment Transactions for existing orders
        $transactions = [
            [
                'id' => 'tx-101',
                'order_id' => 'ord-101',
                'gateway_provider' => 'moyasar',
                'payment_method' => 'Apple Pay',
                'transaction_reference' => 'MOY-AP-991204',
                'gateway_transaction_id' => 'chg_apple_pay_881920',
                'amount' => 650.00,
                'currency' => 'SAR',
                'fee_amount' => 10.75,
                'net_amount' => 639.25,
                'status' => 'paid',
                'card_brand' => 'Apple Pay (Mada)',
                'card_last_four' => '8819',
                'payer_name' => 'Abdulrahman Al-Thaqafi',
                'payer_email' => 'a.thaqafi@makkah.sa',
            ],
            [
                'id' => 'tx-102',
                'order_id' => 'ord-102',
                'gateway_provider' => 'moyasar',
                'payment_method' => 'Mada',
                'transaction_reference' => 'MOY-MD-989211',
                'gateway_transaction_id' => 'chg_mada_581920',
                'amount' => 380.00,
                'currency' => 'SAR',
                'fee_amount' => 6.70,
                'net_amount' => 373.30,
                'status' => 'paid',
                'card_brand' => 'Mada',
                'card_last_four' => '2234',
                'payer_name' => 'Sarah Al-Otaibi',
                'payer_email' => 'sarah.otaibi@gmail.com',
            ],
            [
                'id' => 'tx-103',
                'order_id' => 'ord-103',
                'gateway_provider' => 'moyasar',
                'payment_method' => 'Mada',
                'transaction_reference' => 'MOY-MD-978110',
                'gateway_transaction_id' => 'chg_mada_331902',
                'amount' => 580.00,
                'currency' => 'SAR',
                'fee_amount' => 9.70,
                'net_amount' => 570.30,
                'status' => 'paid',
                'card_brand' => 'Mada',
                'card_last_four' => '7765',
                'payer_name' => 'Eng. Mohammed Al-Harbi',
                'payer_email' => 'm.harbi@aramco.com',
            ],
        ];

        foreach ($transactions as $tx) {
            PaymentTransaction::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $tx['id']],
                array_merge($tx, ['store_id' => 'store-1'])
            );
        }

        // Link orders to their shipments and payment transactions
        Order::withoutGlobalScope('store')->where('id', 'ord-101')->update([
            'courier_code' => 'spl',
            'awb_number' => 'SPL-MK-882190',
            'tracking_number' => 'SPL991204881',
            'shipping_status' => 'delivered',
            'payment_status' => 'paid',
            'payment_transaction_id' => 'tx-101',
        ]);

        Order::withoutGlobalScope('store')->where('id', 'ord-102')->update([
            'courier_code' => 'smsa',
            'awb_number' => 'SMSA-MK-58190',
            'tracking_number' => 'SMSA2901928374',
            'shipping_status' => 'in_transit',
            'payment_status' => 'paid',
            'payment_transaction_id' => 'tx-102',
        ]);

        Order::withoutGlobalScope('store')->where('id', 'ord-103')->update([
            'courier_code' => 'spl',
            'awb_number' => 'SPL-MK-991048',
            'tracking_number' => 'SPL991048221',
            'shipping_status' => 'pending',
            'payment_status' => 'paid',
            'payment_transaction_id' => 'tx-103',
        ]);

        // Default dummy theme row (Pro → full pack). Demo store keeps Luxury catalog pick.
        $themeRow = DefaultTheme::assignToStore($store, true);
        $themeRow->fill([
            'theme_id' => 'theme-makkah-royal',
            'homepage_style' => 'Eid Home',
            'settings' => array_merge(
                DefaultTheme::settingsForPlan('pro', $store),
                [
                    'mode' => 'full',
                    'homepage_style' => 'Eid Home',
                    'homepage_styles' => ['Eid Home', 'Ramadan Home', 'Valentine Home'],
                    'pack' => 'flowers_premium_v1',
                ]
            ),
        ])->save();
    }
    protected function seedStoreCoffee(): void
    {
        $store = Store::query()->updateOrCreate(
            ['id' => 'store-coffee'],
            [
                'name' => 'HiBrew KSA Coffee Store',
                'slug' => 'coffee-store',
                'domain' => 'specialtycoffee.sa',
                'status' => 'active',
                'plan' => 'pro',
                'master_granted_pro' => true,
                'currency' => 'SAR',
                'locale' => 'ar',
                'text_direction' => 'rtl',
                'timezone' => 'Asia/Riyadh',
                'phone' => '+966549876543',
                'email' => 'rayan@specialtycoffee.sa',
                'owner_name' => 'Rayan Al-Sulaiman',
                'city' => 'Riyadh',
                'country' => 'Saudi Arabia',
                'category' => 'Coffee Machines, Precision Mills, Barista Tools & Luxury Stations',
                'logo' => '/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg',
                'accent_color' => '#7c2d12',
                'hosting_mode' => 'shared',
                'db_isolation' => 'shared_store_id',
                'products_count' => 15,
                'orders_count' => 8,
                'revenue' => 5420,
                'visitors_count' => 2680,
            ]
        );

        Subscription::query()->updateOrCreate(
            ['id' => 'sub-store-coffee'],
            [
                'store_id' => $store->id,
                'plan_id' => 'plan-pro',
                'status' => 'active',
                'billing_interval' => 'yearly',
                'starts_at' => now()->subMonths(4),
                'ends_at' => now()->addYear(),
                'grace_ends_at' => null,
                'renewed_at' => now()->subMonths(4),
            ]
        );

        $storeOwner = User::query()->updateOrCreate(
            ['email' => 'rayan@specialtycoffee.sa'],
            [
                'id' => 'user-store-coffee-1',
                'name' => 'Rayan Al-Sulaiman',
                'password' => Hash::make(env('ADMIN_STORE_PASSWORD', 'CoffeeStore@2026!Secure')),
                'role' => 'manager',
            ]
        );

        StoreUser::query()->updateOrCreate(
            [
                'store_id' => $store->id,
                'user_id' => $storeOwner->id,
            ],
            [
                'id' => 'su-coffee-owner',
                'role' => 'manager',
            ]
        );

        $support = User::query()->updateOrCreate(
            ['email' => 'support@specialtycoffee.sa'],
            [
                'id' => 'user-store-coffee-support',
                'name' => 'HiBrew Support',
                'password' => Hash::make(env('ADMIN_SUPPORT_PASSWORD', 'CoffeeSupport@2026!Secure')),
                'role' => 'support',
            ]
        );

        StoreUser::query()->updateOrCreate(
            [
                'store_id' => $store->id,
                'user_id' => $support->id,
            ],
            [
                'id' => 'su-coffee-support',
                'role' => 'support',
            ]
        );

        // Categories for store-coffee
        $categories = [
            [
                'id' => 'cat-hb-machines',
                'name' => 'Coffee Machines & Espresso',
                'name_ar' => 'مكائن القهوة والإسبريسو',
                'slug' => 'machines',
                'parent_id' => null,
                'sort_order' => 10,
                'meta_title' => 'مكائن القهوة والإسبريسو | هاي برو السعودية',
                'meta_description' => 'مكائن قهوة دبل بويلر 20 بار ومكائن كبسولات ومحمولة بضمان الوكيل سنتين.',
                'image_url' => '/src/assets/images/hibrew_h7a_flagship_machine.png',
            ],
            [
                'id' => 'cat-hb-mills',
                'name' => 'Precision Coffee Mills',
                'name_ar' => 'مطاحن القهوة الاحترافية',
                'slug' => 'mills',
                'parent_id' => null,
                'sort_order' => 20,
                'meta_title' => 'مطاحن القهوة الاحترافية | هاي برو السعودية',
                'meta_description' => 'مطاحن بن مخروطية ومسطحة بدرجات طحن ميكرونية متقدمة.',
                'image_url' => '/src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg',
            ],
            [
                'id' => 'cat-hb-cabinets',
                'name' => 'Luxury Coffee Cabinets & Stations',
                'name_ar' => 'دواليب وأركان القهوة الفاخرة',
                'slug' => 'cabinets',
                'parent_id' => null,
                'sort_order' => 30,
                'meta_title' => 'دواليب وأركان القهوة الفاخرة | هاي برو السعودية',
                'meta_description' => 'دواليب خشب البلوط المضلع وأركان قهوة منزلية مخصصة مع إضاءة ليد مخفية.',
                'image_url' => '/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
            ],
            [
                'id' => 'cat-hb-accessories',
                'name' => 'Barista Accessories & Ceramic Cups',
                'name_ar' => 'مستلزمات الباريستا والأكواب',
                'slug' => 'accessories',
                'parent_id' => null,
                'sort_order' => 40,
                'meta_title' => 'مستلزمات الباريستا والأكواب | هاي برو السعودية',
                'meta_description' => 'مستلزمات باريستا احترافية مقاس 58 ملم وأكواب سيراميك صناعة يدوية.',
                'image_url' => '/src/assets/images/coffee_accessories_tools_banner_1791218944111.jpg',
            ],
            [
                'id' => 'cat-hb-offers',
                'name' => 'Exclusive Offers & Bundles',
                'name_ar' => 'العروض والبكجات الحصرية',
                'slug' => 'offers',
                'parent_id' => null,
                'sort_order' => 50,
                'meta_title' => 'العروض والبكجات الحصرية | هاي برو السعودية',
                'meta_description' => 'عروض متكاملة للمكائن والمطاحن وأدوات الترشيح بأفضل الأسعار في المملكة.',
                'image_url' => '/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg',
            ],
        ];

        foreach ($categories as $c) {
            Category::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $c['id']],
                array_merge($c, [
                    'store_id' => 'store-coffee',
                    'is_active' => true,
                ])
            );
        }

        // Products for store-coffee
        $coffeeCategoryMap = [
            'مكائن القهوة والإسبريسو' => 'cat-hb-machines',
            'مطاحن القهوة الاحترافية' => 'cat-hb-mills',
            'دواليب وأركان القهوة الفاخرة' => 'cat-hb-cabinets',
            'مستلزمات الباريستا والأكواب' => 'cat-hb-accessories',
            'العروض والبكجات الحصرية' => 'cat-hb-offers',
        ];

        $products = require __DIR__.'/coffee_products.php';
        foreach ($products as $p) {
            $catId = $coffeeCategoryMap[$p['category']] ?? 'cat-hb-machines';
            Product::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $p['id']],
                array_merge($p, [
                    'store_id' => 'store-coffee',
                    'category_id' => $catId,
                    'slug' => strtolower($p['sku'] ?? $p['id']),
                    'status' => 'published',
                    'is_active' => true,
                    'image_version' => '1',
                ])
            );
        }

        // Customers for store-coffee
        $customers = [
            ['id' => 'cust-cof-1', 'name' => 'ريان بن عبد الله السليمان', 'phone' => '+966549876543', 'email' => 'rayan.sulaiman@gmail.com', 'city' => 'الرياض', 'status' => 'VIP', 'total_orders' => 4, 'total_spend' => 2890, 'avg_order_value' => 722.5],
            ['id' => 'cust-cof-2', 'name' => 'نورة بنت سعد القحطاني', 'phone' => '+966551122334', 'email' => 'noura.qahtani@saudimail.com', 'city' => 'الرياض', 'status' => 'Active', 'total_orders' => 2, 'total_spend' => 620, 'avg_order_value' => 310],
            ['id' => 'cust-cof-3', 'name' => 'سلطان فهد الغامدي', 'phone' => '+966509988112', 'email' => 'sultan.ghamdi@outlook.sa', 'city' => 'جدة', 'status' => 'Active', 'total_orders' => 2, 'total_spend' => 880, 'avg_order_value' => 440],
            ['id' => 'cust-cof-4', 'name' => 'بدر بن خالد العتيبي', 'phone' => '+966567788990', 'email' => 'bader.otaibi@aramco.com', 'city' => 'الظهران', 'status' => 'VIP', 'total_orders' => 3, 'total_spend' => 1950, 'avg_order_value' => 650],
            ['id' => 'cust-cof-5', 'name' => 'عبد الرحمن الشمري', 'phone' => '+966531144778', 'email' => 'a.shammari@gmail.com', 'city' => 'حائل', 'status' => 'Active', 'total_orders' => 1, 'total_spend' => 513, 'avg_order_value' => 513],
            ['id' => 'cust-cof-6', 'name' => 'هند بنت ماجد التميمي', 'phone' => '+966548899112', 'email' => 'hind.tamimi@yahoo.com', 'city' => 'الرياض', 'status' => 'Active', 'total_orders' => 1, 'total_spend' => 246, 'avg_order_value' => 246],
            ['id' => 'cust-cof-7', 'name' => 'مشعل بن ناصر الدوسري', 'phone' => '+966504455667', 'email' => 'meshal.dossary@gmail.com', 'city' => 'الدمام', 'status' => 'VIP', 'total_orders' => 3, 'total_spend' => 2480, 'avg_order_value' => 826.6],
            ['id' => 'cust-cof-8', 'name' => 'أحمد بن طارق الزهراني', 'phone' => '+966552233445', 'email' => 'ahmed.zahrani@hotmail.com', 'city' => 'مكة المكرمة', 'status' => 'Active', 'total_orders' => 2, 'total_spend' => 990, 'avg_order_value' => 495],
        ];

        foreach ($customers as $c) {
            Customer::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $c['id']],
                array_merge($c, [
                    'store_id' => 'store-coffee',
                    'country' => 'Saudi Arabia',
                    'gender' => 'Male',
                    'group' => 'Regular',
                    'acquisition_source' => 'Direct',
                    'last_order_date' => now(),
                ])
            );
        }

        // Orders for store-coffee
        $orders = [
            ['id' => 'ord-cof-101', 'order_number' => '#COF-101', 'customer_id' => 'cust-cof-1', 'customer_name' => 'ريان بن عبد الله السليمان', 'customer_phone' => '+966549876543', 'customer_email' => 'rayan.sulaiman@gmail.com', 'items_count' => 2, 'items_summary' => 'HiBrew Barista Classic Pro & Walnut Portafilter', 'total_amount' => 445, 'status' => 'completed', 'product_id' => 'hb-barista-silver-pro', 'minutes_ago' => 60],
            ['id' => 'ord-cof-102', 'order_number' => '#COF-102', 'customer_id' => 'cust-cof-2', 'customer_name' => 'نورة بنت سعد القحطاني', 'customer_phone' => '+966551122334', 'customer_email' => 'noura.qahtani@saudimail.com', 'items_count' => 1, 'items_summary' => 'HiBrew Compact Smart Capsule & Espresso', 'total_amount' => 620, 'status' => 'processing', 'product_id' => 'hb-smart-capsule-compact', 'minutes_ago' => 120],
            ['id' => 'ord-cof-103', 'order_number' => '#COF-103', 'customer_id' => 'cust-cof-3', 'customer_name' => 'سلطان فهد الغامدي', 'customer_phone' => '+966509988112', 'customer_email' => 'sultan.ghamdi@outlook.sa', 'items_count' => 3, 'items_summary' => 'HiBrew Conical Burr Coffee Mill G5', 'total_amount' => 439, 'status' => 'processing', 'product_id' => 'hb-mill-g5-pro', 'minutes_ago' => 240],
            ['id' => 'ord-cof-104', 'order_number' => '#COF-104', 'customer_id' => 'cust-cof-4', 'customer_name' => 'بدر بن خالد العتيبي', 'customer_phone' => '+966567788990', 'customer_email' => 'bader.otaibi@aramco.com', 'items_count' => 1, 'items_summary' => 'Artisan Fluted Oak Coffee Corner Station', 'total_amount' => 840, 'status' => 'completed', 'product_id' => 'hb-nordic-cabinet', 'minutes_ago' => 360],
            ['id' => 'ord-cof-105', 'order_number' => '#COF-105', 'customer_id' => 'cust-cof-5', 'customer_name' => 'عبد الرحمن الشمري', 'customer_phone' => '+966531144778', 'customer_email' => 'a.shammari@gmail.com', 'items_count' => 3, 'items_summary' => 'HiBrew Barista Pro H7A Dual-Boiler 20-Bar', 'total_amount' => 513, 'status' => 'completed', 'product_id' => 'hb-h10a-dualboiler', 'minutes_ago' => 480],
            ['id' => 'ord-cof-106', 'order_number' => '#COF-106', 'customer_id' => 'cust-cof-6', 'customer_name' => 'هند بنت ماجد التميمي', 'customer_phone' => '+966548899112', 'customer_email' => 'hind.tamimi@yahoo.com', 'items_count' => 2, 'items_summary' => 'Artisan Stoneware Ceramic Cup Set (4 Pcs)', 'total_amount' => 246, 'status' => 'completed', 'product_id' => 'hb-ceramic-artisan-cups', 'minutes_ago' => 600],
            ['id' => 'ord-cof-107', 'order_number' => '#COF-107', 'customer_id' => 'cust-cof-7', 'customer_name' => 'مشعل بن ناصر الدوسري', 'customer_phone' => '+966504455667', 'customer_email' => 'meshal.dossary@gmail.com', 'items_count' => 5, 'items_summary' => 'Master Barista Home Coffee Corner Station', 'total_amount' => 1478, 'status' => 'completed', 'product_id' => 'hb-luxury-corner-station', 'minutes_ago' => 720],
            ['id' => 'ord-cof-108', 'order_number' => '#COF-108', 'customer_id' => 'cust-cof-8', 'customer_name' => 'أحمد بن طارق الزهراني', 'customer_phone' => '+966552233445', 'customer_email' => 'ahmed.zahrani@hotmail.com', 'items_count' => 5, 'items_summary' => 'Royal Saudi 96 V60 Pour-Over & Kettle Master Set', 'total_amount' => 839, 'status' => 'completed', 'product_id' => 'hb-v60-complete-kit', 'minutes_ago' => 840],
        ];

        foreach ($orders as $o) {
            $productId = $o['product_id'];
            $minutesAgo = $o['minutes_ago'];
            unset($o['product_id'], $o['minutes_ago']);

            Order::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $o['id']],
                array_merge($o, [
                    'store_id' => 'store-coffee',
                    'currency' => 'SAR',
                    'source' => 'Direct',
                    'source_details' => 'HiBrew Online Store',
                    'delivery_location' => 'Saudi Arabia',
                    'payment_method' => 'Mada',
                    'order_date' => now()->subMinutes($minutesAgo),
                ])
            );

            OrderItem::withoutGlobalScope('store')->updateOrCreate(
                [
                    'order_id' => $o['id'],
                    'product_id' => $productId,
                ],
                [
                    'store_id' => 'store-coffee',
                    'product_name' => $o['items_summary'],
                    'quantity' => 1,
                    'unit_price' => $o['total_amount'],
                    'subtotal' => $o['total_amount'],
                ]
            );
        }

        // Coupons for store-coffee
        $coupons = [
            ['id' => 'coup-cof-1', 'code' => 'BARISTA15', 'discount_type' => 'percentage', 'discount_value' => 15, 'min_order_amount' => 150, 'usage_count' => 84, 'max_uses' => 500],
            ['id' => 'coup-cof-2', 'code' => 'FREESHIP', 'discount_type' => 'fixed', 'discount_value' => 25, 'min_order_amount' => 180, 'usage_count' => 142, 'max_uses' => 1000],
            ['id' => 'coup-cof-3', 'code' => 'COFFEE10', 'discount_type' => 'percentage', 'discount_value' => 10, 'min_order_amount' => 100, 'usage_count' => 38, 'max_uses' => 500],
        ];

        foreach ($coupons as $cp) {
            Coupon::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $cp['id']],
                array_merge($cp, [
                    'store_id' => 'store-coffee',
                    'status' => 'active',
                    'is_active' => true,
                    'expires_at' => '2026-12-31 23:59:59',
                ])
            );
        }

        // Shipping zones for store-coffee
        $zones = [
            ['id' => 'ship-cof-1', 'name' => 'الرياض - وسط الرياض والعليا', 'region' => 'منطقة الرياض', 'rate' => 15, 'free_above' => 250, 'estimated_delivery' => 'نفس اليوم / خلال ساعات'],
            ['id' => 'ship-cof-2', 'name' => 'الرياض - شمال الرياض والحي الدبلوماسي', 'region' => 'منطقة الرياض', 'rate' => 20, 'free_above' => 250, 'estimated_delivery' => 'نفس اليوم'],
            ['id' => 'ship-cof-3', 'name' => 'المنطقة الشرقية - الخبر، الدمام، الظهران', 'region' => 'المنطقة الشرقية', 'rate' => 25, 'free_above' => 300, 'estimated_delivery' => '١ - ٢ يوم عمل'],
            ['id' => 'ship-cof-4', 'name' => 'جدة ومكة المكرمة والمدينة المنورة', 'region' => 'منطقة مكة المكرمة', 'rate' => 28, 'free_above' => 300, 'estimated_delivery' => '٢ - ٣ أيام عمل'],
            ['id' => 'ship-cof-5', 'name' => 'باقي مدن المملكة (القصيم، حائل، تبوك، أبها)', 'region' => 'كافة مناطق المملكة', 'rate' => 32, 'free_above' => 350, 'estimated_delivery' => '٣ - ٤ أيام عمل'],
        ];

        foreach ($zones as $z) {
            ShippingZone::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $z['id']],
                array_merge($z, [
                    'store_id' => 'store-coffee',
                    'status' => 'active',
                    'is_active' => true,
                    'min_delivery_days' => 0,
                    'max_delivery_days' => 4,
                ])
            );
        }

        // Theme assignment
        $themeRow = DefaultTheme::assignToStore($store, true);
        $themeRow->fill([
            'theme_id' => 'theme-coffee-artisan',
            'homepage_style' => 'Flagship Roastery',
            'settings' => array_merge(
                DefaultTheme::settingsForPlan('pro', $store),
                [
                    'mode' => 'full',
                    'homepage_style' => 'Flagship Roastery',
                    'pack' => 'coffee_artisan_v1',
                ]
            ),
        ])->save();
    }

    protected function seedStoreBleco(): void
    {
        $store = Store::query()->updateOrCreate(
            ['id' => 'store-bleco'],
            [
                'name' => 'Al-Saeedi Car Services',
                'slug' => 'alsaeedi-cars',
                'domain' => 'tanjeedmakkah.com',
                'status' => 'active',
                'plan' => 'pro',
                'master_granted_pro' => true,
                'currency' => 'SAR',
                'locale' => 'ar',
                'text_direction' => 'rtl',
                'timezone' => 'Asia/Riyadh',
                'phone' => '+966597757086',
                'email' => 'support@tanjeedmakkah.com',
                'owner_name' => 'Al-Saeedi Car Services',
                'city' => 'Makkah',
                'country' => 'Saudi Arabia',
                'category' => 'Car Seat Covers, Precision Floor Mats & Accessories',
                'logo' => 'https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/wYYVD/OZbzrkkW0icMZlcDNOiZnU4PSjwq6WxXgCkwT0PQ.png',
                'accent_color' => '#127bfe',
                'hosting_mode' => 'dedicated',
                'db_isolation' => 'dedicated_mysql',
                'products_count' => 12,
                'orders_count' => 14,
                'revenue' => 28450,
                'visitors_count' => 80000,
            ]
        );

        Subscription::query()->updateOrCreate(
            ['id' => 'sub-store-bleco'],
            [
                'store_id' => $store->id,
                'plan_id' => 'plan-pro',
                'status' => 'active',
                'billing_interval' => 'yearly',
                'starts_at' => now()->subMonths(3),
                'ends_at' => now()->addYear(),
                'grace_ends_at' => null,
                'renewed_at' => now()->subMonths(3),
            ]
        );

        $storeOwner = User::query()->updateOrCreate(
            ['email' => 'owner@tanjeedmakkah.com'],
            [
                'id' => 'user-store-bleco-1',
                'name' => 'Al-Saeedi Manager',
                'password' => Hash::make(env('ADMIN_STORE_PASSWORD', 'BlecoStore@2026!Secure')),
                'role' => 'manager',
            ]
        );

        StoreUser::query()->updateOrCreate(
            [
                'store_id' => $store->id,
                'user_id' => $storeOwner->id,
            ],
            [
                'id' => 'su-bleco-owner',
                'role' => 'manager',
            ]
        );

        $support = User::query()->updateOrCreate(
            ['email' => 'support@tanjeedmakkah.com'],
            [
                'id' => 'user-store-bleco-support',
                'name' => 'Al-Saeedi Support',
                'password' => Hash::make(env('ADMIN_SUPPORT_PASSWORD', 'BlecoSupport@2026!Secure')),
                'role' => 'support',
            ]
        );

        StoreUser::query()->updateOrCreate(
            [
                'store_id' => $store->id,
                'user_id' => $support->id,
            ],
            [
                'id' => 'su-bleco-support',
                'role' => 'support',
            ]
        );

        // Categories for store-bleco
        $categories = [
            [
                'id' => 'cat-clothing',
                'name' => 'Car Seat Covers',
                'name_ar' => 'تلابيس مقاعد السيارة',
                'slug' => 'car-seat-covers',
                'parent_id' => null,
                'sort_order' => 10,
                'meta_title' => 'تلابيس وتنجيد مقاعد السيارات | السعيدي مكة',
                'meta_description' => 'تلابيس وتنجيد مقاعد مفصلة وجاهزة لجميع ماركات السيارات بجلد ألماني ونابا فاخر.',
                'image_url' => '/images/categories/vip-luxury-seat-covers.jpg',
            ],
            [
                'id' => 'cat-floors',
                'name' => 'Diamond Car Mats',
                'name_ar' => 'أرضيات السيارة الدايموند',
                'slug' => 'diamond-car-mats',
                'parent_id' => null,
                'sort_order' => 20,
                'meta_title' => 'أرضيات دايموند 5D ليزرية للسيارات | السعيدي مكة',
                'meta_description' => 'أرضيات دايموند 5D ليزرية مقاومة للماء والأتربة وتغطية كاملة للأرضية.',
                'image_url' => '/images/categories/diamond-floor-mats.jpg',
            ],
            [
                'id' => 'cat-perfumes',
                'name' => 'Car Air Fresheners',
                'name_ar' => 'معطرات وفواحات السيارة',
                'slug' => 'car-air-fresheners',
                'parent_id' => null,
                'sort_order' => 30,
                'meta_title' => 'معطرات وفواحات فاخرة للسيارات | السعيدي مكة',
                'meta_description' => 'معطرات جو أصلية تدوم طويلاً بروائح العود واللافندر والفواكه المنعشة.',
                'image_url' => '/images/categories/car-air-fresheners.jpg',
            ],
            [
                'id' => 'cat-care',
                'name' => 'Car Care & Detailing',
                'name_ar' => 'منتجات العناية والتلميع',
                'slug' => 'car-care-detailing',
                'parent_id' => null,
                'sort_order' => 40,
                'meta_title' => 'منتجات العناية والتلميع بالسيارات | السعيدي مكة',
                'meta_description' => 'مجموعات تنظيف وحماية الجلد والأرضيات والمحركات من كبرى الشركات العالمية.',
                'image_url' => '/images/categories/car-care-bleco.jpg',
            ],
            [
                'id' => 'cat-accessories',
                'name' => 'Accessories & Styling',
                'name_ar' => 'زينة واكسسوارات السيارات',
                'slug' => 'accessories-styling',
                'parent_id' => null,
                'sort_order' => 50,
                'meta_title' => 'اكسسوارات وزينة السيارات | السعيدي مكة',
                'meta_description' => 'ستائر جانبية، أغطية مقود، شواحن ذكية ومستلزمات الراحة والأمان.',
                'image_url' => '/images/categories/car-accessories.jpg',
            ],
            [
                'id' => 'cat-tools',
                'name' => 'Upholstery Supplies',
                'name_ar' => 'أدوات ومستلزمات التنجيد',
                'slug' => 'upholstery-supplies',
                'parent_id' => null,
                'sort_order' => 60,
                'meta_title' => 'أدوات ومستلزمات تنجيد السيارات | السعيدي مكة',
                'meta_description' => 'كلبسات أصلية، أدوات فك وتركيب، وإسفنج مقوى لورش التنجيد وأصحاب الخبرة.',
                'image_url' => '/images/categories/upholstery-tools.jpg',
            ],
        ];

        foreach ($categories as $c) {
            Category::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $c['id']],
                array_merge($c, [
                    'store_id' => 'store-bleco',
                    'is_active' => true,
                ])
            );
        }

        // Products for store-bleco
        $blecoCategoryMap = [
            'أرضيات' => 'cat-floors',
            'تلابيس' => 'cat-clothing',
            'معطرات فواحة' => 'cat-perfumes',
            'عناية وتلميع' => 'cat-care',
            'زينة واكسسوارات' => 'cat-accessories',
            'أدوات تنجيد' => 'cat-tools',
        ];

        $products = require __DIR__.'/bleco_products.php';
        foreach ($products as $p) {
            $catId = $blecoCategoryMap[$p['category']] ?? 'cat-floors';
            Product::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $p['id']],
                array_merge($p, [
                    'store_id' => 'store-bleco',
                    'category_id' => $catId,
                    'slug' => strtolower($p['sku'] ?? $p['id']),
                    'status' => 'published',
                    'is_active' => true,
                    'image_version' => '1',
                ])
            );
        }

        // Customers for store-bleco
        $customers = [
            ['id' => 'cust-blc-1', 'name' => 'الأمير فيصل بن خالد آل سعود', 'phone' => '+966505544332', 'email' => 'faisal.khalid@royalnet.sa', 'city' => 'الرياض', 'status' => 'VIP', 'total_orders' => 4, 'total_spend' => 6800, 'avg_order_value' => 1700],
            ['id' => 'cust-blc-2', 'name' => 'ماجد بن ناصر الحربي', 'phone' => '+966551239876', 'email' => 'majed.harbi@gmail.com', 'city' => 'الرياض', 'status' => 'Active', 'total_orders' => 2, 'total_spend' => 2960, 'avg_order_value' => 1480],
            ['id' => 'cust-blc-3', 'name' => 'خالد بن عبد الرحمن الدوسري', 'phone' => '+966563344556', 'email' => 'khalid.dossary@gmail.com', 'city' => 'الدمام', 'status' => 'Active', 'total_orders' => 2, 'total_spend' => 1450, 'avg_order_value' => 725],
            ['id' => 'cust-blc-4', 'name' => 'بندر بن عبد الله السبيعي', 'phone' => '+966509911223', 'email' => 'bandar.subaie@hotmail.com', 'city' => 'الرياض', 'status' => 'VIP', 'total_orders' => 3, 'total_spend' => 3820, 'avg_order_value' => 1273.3],
            ['id' => 'cust-blc-5', 'name' => 'تركي بن سعد العتيبي', 'phone' => '+966558877665', 'email' => 'turki.otaibi@outlook.sa', 'city' => 'الرياض', 'status' => 'Active', 'total_orders' => 1, 'total_spend' => 960, 'avg_order_value' => 960],
            ['id' => 'cust-blc-6', 'name' => 'سعد بن فهد الغامدي', 'phone' => '+966547788112', 'email' => 'saad.ghamdi@gmail.com', 'city' => 'جدة', 'status' => 'Active', 'total_orders' => 2, 'total_spend' => 768, 'avg_order_value' => 384],
            ['id' => 'cust-blc-7', 'name' => 'عبد العزيز بن سعود المقرن', 'phone' => '+966501199887', 'email' => 'a.muqrin@almuqrin.sa', 'city' => 'الرياض', 'status' => 'VIP', 'total_orders' => 3, 'total_spend' => 4120, 'avg_order_value' => 1373.3],
            ['id' => 'cust-blc-8', 'name' => 'محمد بن يحيى الشهري', 'phone' => '+966532211445', 'email' => 'm.shehri@yahoo.com', 'city' => 'خميس مشيط', 'status' => 'Active', 'total_orders' => 2, 'total_spend' => 3100, 'avg_order_value' => 1550],
            ['id' => 'cust-blc-9', 'name' => 'نواف بن فهد العنزي', 'phone' => '+966569988771', 'email' => 'nawaf.enazi@gmail.com', 'city' => 'تبوك', 'status' => 'Active', 'total_orders' => 2, 'total_spend' => 4500, 'avg_order_value' => 2250],
            ['id' => 'cust-blc-10', 'name' => 'سلمان بن ظافر القحطاني', 'phone' => '+966554433221', 'email' => 'salman.qahtani@saudimail.com', 'city' => 'الرياض', 'status' => 'Active', 'total_orders' => 2, 'total_spend' => 2350, 'avg_order_value' => 1175],
            ['id' => 'cust-blc-11', 'name' => 'فهد بن منصور المطيري', 'phone' => '+966508877112', 'email' => 'fahad.mutairi@gmail.com', 'city' => 'بريدة', 'status' => 'Active', 'total_orders' => 1, 'total_spend' => 704, 'avg_order_value' => 704],
            ['id' => 'cust-blc-12', 'name' => 'ياسر بن عبد الله الزهراني', 'phone' => '+966551100998', 'email' => 'yasser.fleet@zahrani-corp.sa', 'city' => 'الرياض', 'status' => 'VIP', 'total_orders' => 3, 'total_spend' => 12400, 'avg_order_value' => 4133.3],
        ];

        foreach ($customers as $c) {
            Customer::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $c['id']],
                array_merge($c, [
                    'store_id' => 'store-bleco',
                    'country' => 'Saudi Arabia',
                    'gender' => 'Male',
                    'group' => 'Regular',
                    'acquisition_source' => 'Direct',
                    'last_order_date' => now(),
                ])
            );
        }

        // Orders for store-bleco
        $orders = [
            ['id' => 'ord-blc-101', 'order_number' => '#BLC-101', 'customer_id' => 'cust-blc-1', 'customer_name' => 'الأمير فيصل بن خالد آل سعود', 'customer_phone' => '+966505544332', 'customer_email' => 'faisal.khalid@royalnet.sa', 'items_count' => 1, 'items_summary' => 'طقم تلابيس جلد ألماني فاخر تفصيل وكالة — تويوتا كامري 2025', 'total_amount' => 1680, 'status' => 'completed', 'product_id' => 'prod-seat-camry-2025-leather', 'minutes_ago' => 50],
            ['id' => 'ord-blc-102', 'order_number' => '#BLC-102', 'customer_id' => 'cust-blc-2', 'customer_name' => 'ماجد بن ناصر الحربي', 'customer_phone' => '+966551239876', 'customer_email' => 'majed.harbi@gmail.com', 'items_count' => 1, 'items_summary' => 'أرضيات الدايموند (Diamond floors)', 'total_amount' => 1480, 'status' => 'processing', 'product_id' => 'prod-mat-diamond', 'minutes_ago' => 100],
            ['id' => 'ord-blc-103', 'order_number' => '#BLC-103', 'customer_id' => 'cust-blc-3', 'customer_name' => 'خالد بن عبد الرحمن الدوسري', 'customer_phone' => '+966563344556', 'customer_email' => 'khalid.dossary@gmail.com', 'items_count' => 2, 'items_summary' => 'أرضيات الليزر (Laser flooring)', 'total_amount' => 696, 'status' => 'processing', 'product_id' => 'prod-mat-laser', 'minutes_ago' => 200],
            ['id' => 'ord-blc-104', 'order_number' => '#BLC-104', 'customer_id' => 'cust-blc-4', 'customer_name' => 'بندر بن عبد الله السبيعي', 'customer_phone' => '+966509911223', 'customer_email' => 'bandar.subaie@hotmail.com', 'items_count' => 2, 'items_summary' => 'طقم تلابيس مقاعد جلد ألماني ملكي — هوندا أكورد 2018-2024', 'total_amount' => 1880, 'status' => 'completed', 'product_id' => 'prod-seat-accord-2018-leather', 'minutes_ago' => 300],
            ['id' => 'ord-blc-105', 'order_number' => '#BLC-105', 'customer_id' => 'cust-blc-5', 'customer_name' => 'تركي بن سعد العتيبي', 'customer_phone' => '+966558877665', 'customer_email' => 'turki.otaibi@outlook.sa', 'items_count' => 1, 'items_summary' => 'أرضيات الفاخر (Luxury flooring)', 'total_amount' => 960, 'status' => 'completed', 'product_id' => 'prod-mat-luxury', 'minutes_ago' => 400],
            ['id' => 'ord-blc-106', 'order_number' => '#BLC-106', 'customer_id' => 'cust-blc-6', 'customer_name' => 'سعد بن فهد الغامدي', 'customer_phone' => '+966547788112', 'customer_email' => 'saad.ghamdi@gmail.com', 'items_count' => 1, 'items_summary' => 'أرضيات المثلثات (Triangle floors)', 'total_amount' => 384, 'status' => 'completed', 'product_id' => 'prod-mat-triangle', 'minutes_ago' => 500],
            ['id' => 'ord-blc-107', 'order_number' => '#BLC-107', 'customer_id' => 'cust-blc-7', 'customer_name' => 'عبد العزيز بن سعود المقرن', 'customer_phone' => '+966501199887', 'customer_email' => 'a.muqrin@almuqrin.sa', 'items_count' => 2, 'items_summary' => 'طقم تلابيس مقاعد ملكية ليزرية جلد نابا — تويوتا لاندكروزر LC300', 'total_amount' => 1632, 'status' => 'completed', 'product_id' => 'prod-seat-landcruiser-2022', 'minutes_ago' => 600],
            ['id' => 'ord-blc-108', 'order_number' => '#BLC-108', 'customer_id' => 'cust-blc-8', 'customer_name' => 'محمد بن يحيى الشهري', 'customer_phone' => '+966532211445', 'customer_email' => 'm.shehri@yahoo.com', 'items_count' => 2, 'items_summary' => 'طقم تلابيس مقاعد جلد ألماني VIP — جمس يوكن وشفروليه تاهو', 'total_amount' => 2088, 'status' => 'completed', 'product_id' => 'prod-seat-yukon-2015-gray', 'minutes_ago' => 700],
            ['id' => 'ord-blc-109', 'order_number' => '#BLC-109', 'customer_id' => 'cust-blc-9', 'customer_name' => 'نواف بن فهد العنزي', 'customer_phone' => '+966569988771', 'customer_email' => 'nawaf.enazi@gmail.com', 'items_count' => 1, 'items_summary' => 'تلبيسة مقاعد السيارة VIP بطل الدروب متوافق مع نيسان باترول', 'total_amount' => 3360, 'status' => 'completed', 'product_id' => 'prod-seat-nissan-patrol', 'minutes_ago' => 800],
            ['id' => 'ord-blc-110', 'order_number' => '#BLC-110', 'customer_id' => 'cust-blc-10', 'customer_name' => 'سلمان بن ظافر القحطاني', 'customer_phone' => '+966554433221', 'customer_email' => 'salman.qahtani@saudimail.com', 'items_count' => 2, 'items_summary' => 'تلبيسة مقاعد جاهزة من جلد نابا تنفيذي متوافق مع لكزس ES 350', 'total_amount' => 1704, 'status' => 'completed', 'product_id' => 'prod-seat-lexus-es', 'minutes_ago' => 900],
            ['id' => 'ord-blc-111', 'order_number' => '#BLC-111', 'customer_id' => 'cust-blc-11', 'customer_name' => 'فهد بن منصور المطيري', 'customer_phone' => '+966508877112', 'customer_email' => 'fahad.mutairi@gmail.com', 'items_count' => 3, 'items_summary' => 'طقم تلابيس مقاعد جلد ألماني ليزري — فورد تورس وإكسبلورر', 'total_amount' => 704, 'status' => 'completed', 'product_id' => 'prod-seat-ford-taurus', 'minutes_ago' => 1000],
            ['id' => 'ord-blc-112', 'order_number' => '#BLC-112', 'customer_id' => 'cust-blc-12', 'customer_name' => 'ياسر بن عبد الله الزهراني', 'customer_phone' => '+966551100998', 'customer_email' => 'yasser.fleet@zahrani-corp.sa', 'items_count' => 1, 'items_summary' => 'طقم تلابيس مقاعد كابتن VIP جلد ألماني — جمس يوكن دينالي وتاهو', 'total_amount' => 7400, 'status' => 'completed', 'product_id' => 'prod-seat-yukon-denali', 'minutes_ago' => 1100],
            ['id' => 'ord-blc-113', 'order_number' => '#BLC-113', 'customer_id' => 'cust-blc-1', 'customer_name' => 'عبد الله بن حمد الهاجري', 'customer_phone' => '+966501122334', 'customer_email' => 'abdullah.hajri@aramco.com', 'items_count' => 2, 'items_summary' => 'طقم تلابيس تفصيل ملكي مع أرضيات دايموند 5D', 'total_amount' => 1344, 'status' => 'completed', 'product_id' => 'prod-seat-camry-2025-leather', 'minutes_ago' => 1200],
            ['id' => 'ord-blc-114', 'order_number' => '#BLC-114', 'customer_id' => 'cust-blc-2', 'customer_name' => 'حمد بن راشد المري', 'customer_phone' => '+966553344556', 'customer_email' => 'hamad.marri@gmail.com', 'items_count' => 2, 'items_summary' => 'طقم تلابيس ليزري لاندكروزر مع معطرات فواحة', 'total_amount' => 1904, 'status' => 'completed', 'product_id' => 'prod-seat-landcruiser-2022', 'minutes_ago' => 1300],
        ];

        foreach ($orders as $o) {
            $productId = $o['product_id'];
            $minutesAgo = $o['minutes_ago'];
            unset($o['product_id'], $o['minutes_ago']);

            Order::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $o['id']],
                array_merge($o, [
                    'store_id' => 'store-bleco',
                    'currency' => 'SAR',
                    'source' => 'Direct',
                    'source_details' => 'Al-Saeedi Car Services Website',
                    'delivery_location' => 'Saudi Arabia',
                    'payment_method' => 'Mada',
                    'order_date' => now()->subMinutes($minutesAgo),
                ])
            );

            OrderItem::withoutGlobalScope('store')->updateOrCreate(
                [
                    'order_id' => $o['id'],
                    'product_id' => $productId,
                ],
                [
                    'store_id' => 'store-bleco',
                    'product_name' => $o['items_summary'],
                    'quantity' => 1,
                    'unit_price' => $o['total_amount'],
                    'subtotal' => $o['total_amount'],
                ]
            );
        }

        // Coupons for store-bleco
        $coupons = [
            ['id' => 'coup-blc-1', 'code' => 'Saudi', 'discount_type' => 'percentage', 'discount_value' => 20, 'min_order_amount' => 0, 'usage_count' => 312, 'max_uses' => 5000],
            ['id' => 'coup-blc-2', 'code' => 'BLACKO10', 'discount_type' => 'percentage', 'discount_value' => 10, 'min_order_amount' => 200, 'usage_count' => 54, 'max_uses' => 1000],
            ['id' => 'coup-blc-3', 'code' => 'FLEETVIP', 'discount_type' => 'percentage', 'discount_value' => 15, 'min_order_amount' => 2500, 'usage_count' => 18, 'max_uses' => 100],
        ];

        foreach ($coupons as $cp) {
            Coupon::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $cp['id']],
                array_merge($cp, [
                    'store_id' => 'store-bleco',
                    'status' => 'active',
                    'is_active' => true,
                    'expires_at' => '2026-12-31 23:59:59',
                ])
            );
        }

        // Shipping zones for store-bleco
        $zones = [
            ['id' => 'ship-blc-1', 'name' => 'الرياض - فريق التركيب الفوري المتنقل عند المنزل (VIP)', 'region' => 'منطقة الرياض', 'rate' => 0, 'free_above' => 500, 'estimated_delivery' => 'نفس اليوم / حجز موعد فوري VIP'],
            ['id' => 'ship-blc-2', 'name' => 'الرياض - استلام وتركيب بالمعرض الرئيسي (طريق الملك فهد)', 'region' => 'منطقة الرياض', 'rate' => 0, 'free_above' => 0, 'estimated_delivery' => 'استلام فوري مع فحص الجودة'],
            ['id' => 'ship-blc-3', 'name' => 'المنطقة الغربية - جدة ومكة المكرمة والطائف', 'region' => 'منطقة مكة المكرمة', 'rate' => 35, 'free_above' => 800, 'estimated_delivery' => '٢ - ٣ أيام عمل شحن مؤمن'],
            ['id' => 'ship-blc-4', 'name' => 'المنطقة الشرقية - الدمام، الخبر، الجبيل، الأحساء', 'region' => 'المنطقة الشرقية', 'rate' => 35, 'free_above' => 800, 'estimated_delivery' => '٢ - ٣ أيام عمل سمسا إكسبريس'],
            ['id' => 'ship-blc-5', 'name' => 'كافة محافظات ومدن المملكة (عسير، تبوك، القصيم، نجران)', 'region' => 'كافة مناطق المملكة', 'rate' => 45, 'free_above' => 1000, 'estimated_delivery' => '٣ - ٤ أيام عمل شحن آمن مع تتبع'],
        ];

        foreach ($zones as $z) {
            ShippingZone::withoutGlobalScope('store')->updateOrCreate(
                ['id' => $z['id']],
                array_merge($z, [
                    'store_id' => 'store-bleco',
                    'status' => 'active',
                    'is_active' => true,
                    'min_delivery_days' => 0,
                    'max_delivery_days' => 4,
                ])
            );
        }

        // Theme assignment
        $themeRow = DefaultTheme::assignToStore($store, true);
        $themeRow->fill([
            'theme_id' => 'theme-automotive-luxury',
            'homepage_style' => 'Automotive Flagship',
            'settings' => array_merge(
                DefaultTheme::settingsForPlan('pro', $store),
                [
                    'mode' => 'full',
                    'homepage_style' => 'Automotive Flagship',
                    'pack' => 'automotive_luxury_v1',
                ]
            ),
        ])->save();
    }
}
