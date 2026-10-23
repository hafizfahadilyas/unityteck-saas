const fs = require('fs');
const path = require('path');

const phpCode = `<?php
/**
 * UnityTeck Multi-Store E-Commerce Platform
 * Hostinger Production Database & REST API Gateway
 * Fully Multi-Tenant, Zero Stale LocalStorage Cache, Lifetime Live Sync.
 * Supports: Stores, Products, Categories, Blog Articles & Settings, Commerce Tools,
 *           Reviews/Comments, Banners, Theme Settings, Builder Layouts, Pages, Brands.
 */

declare(strict_types=1);

// Disable error display in production to prevent JSON corruption
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Security & Fresh Data Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Store-Id, X-Portal, Cache-Control, Pragma');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0');
header('Pragma: no-cache');
header('Expires: 0');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Ensure database directory exists
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0777, true);
}
$dbPath = $dataDir . '/platform.sqlite';

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Initialize Core Schema
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS stores (
            id TEXT PRIMARY KEY,
            name TEXT,
            slug TEXT,
            domain TEXT,
            data TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS products (
            id TEXT,
            store_id TEXT,
            name TEXT,
            name_ar TEXT,
            sku TEXT,
            price REAL,
            original_price REAL,
            stock INTEGER,
            category TEXT,
            category_ar TEXT,
            image_url TEXT,
            gallery_urls TEXT,
            status TEXT DEFAULT 'published',
            is_active INTEGER DEFAULT 1,
            data TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
        CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

        CREATE TABLE IF NOT EXISTS categories (
            id TEXT,
            store_id TEXT,
            parent_id TEXT NULL,
            name TEXT,
            name_ar TEXT,
            slug TEXT,
            image_url TEXT,
            sort_order INTEGER DEFAULT 0,
            meta_title TEXT,
            meta_description TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id);
        CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

        CREATE TABLE IF NOT EXISTS blog_articles (
            id TEXT,
            store_id TEXT,
            title TEXT,
            title_ar TEXT,
            title_en TEXT,
            slug TEXT,
            category TEXT,
            category_ar TEXT,
            category_en TEXT,
            read_time TEXT,
            read_time_en TEXT,
            image TEXT,
            summary TEXT,
            summary_ar TEXT,
            summary_en TEXT,
            content TEXT,
            content_ar TEXT,
            content_en TEXT,
            author TEXT,
            tags TEXT,
            status TEXT DEFAULT 'published',
            views_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            is_featured INTEGER DEFAULT 0,
            seo TEXT,
            commerce_tools TEXT,
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_blog_store ON blog_articles(store_id);
        CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_articles(status);

        CREATE TABLE IF NOT EXISTS blog_settings (
            store_id TEXT PRIMARY KEY,
            post_settings TEXT,
            seo_settings TEXT,
            featured_article_id TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT,
            store_id TEXT,
            product_id TEXT NULL,
            name TEXT,
            name_en TEXT,
            role TEXT,
            role_en TEXT,
            avatar TEXT,
            rating REAL DEFAULT 5,
            comment TEXT,
            comment_en TEXT,
            verified INTEGER DEFAULT 1,
            date TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_reviews_store ON reviews(store_id);

        CREATE TABLE IF NOT EXISTS banners (
            id TEXT,
            store_id TEXT,
            type TEXT DEFAULT 'promo',
            title TEXT,
            title_en TEXT,
            subtitle TEXT,
            subtitle_en TEXT,
            image_url TEXT,
            video_url TEXT,
            link_url TEXT,
            button_text TEXT,
            button_text_en TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            settings TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_banners_store ON banners(store_id);

        CREATE TABLE IF NOT EXISTS theme_settings (
            store_id TEXT,
            theme_id TEXT,
            settings TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (store_id, theme_id)
        );

        CREATE TABLE IF NOT EXISTS builder_layouts (
            store_id TEXT,
            theme_id TEXT,
            blocks TEXT,
            seasonal_theme TEXT,
            typography_settings TEXT,
            header_settings TEXT,
            mobile_menu_icon TEXT,
            is_published INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (store_id, theme_id)
        );

        CREATE TABLE IF NOT EXISTS store_settings (
            store_id TEXT PRIMARY KEY,
            settings TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS pages (
            id TEXT,
            store_id TEXT,
            slug TEXT,
            title_ar TEXT,
            title_en TEXT,
            content_ar TEXT,
            content_en TEXT,
            category TEXT DEFAULT 'legal',
            is_system_default INTEGER DEFAULT 0,
            is_published INTEGER DEFAULT 1,
            meta_description_ar TEXT,
            meta_description_en TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_pages_store ON pages(store_id);

        CREATE TABLE IF NOT EXISTS brands (
            id TEXT,
            store_id TEXT,
            name TEXT,
            name_ar TEXT,
            slug TEXT,
            logo_url TEXT,
            description TEXT,
            description_en TEXT,
            website TEXT,
            country TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            show_in_channels INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_brands_store ON brands(store_id);
    ");

    // Auto-seed stores and products if stores table is empty
    $storeCount = (int)$pdo->query("SELECT COUNT(*) FROM stores")->fetchColumn();
    if ($storeCount === 0 && file_exists(__DIR__ . '/initial_seed.json')) {
        $seedContent = file_get_contents(__DIR__ . '/initial_seed.json');
        $seed = json_decode($seedContent, true);
        if ($seed && isset($seed['stores']) && is_array($seed['stores'])) {
            $insertStore = $pdo->prepare("INSERT OR REPLACE INTO stores (id, name, slug, domain, data, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))");
            foreach ($seed['stores'] as $st) {
                $insertStore->execute([
                    $st['id'],
                    $st['name'] ?? '',
                    $st['slug'] ?? '',
                    $st['domain'] ?? ($st['custom_domain'] ?? ''),
                    json_encode($st, JSON_UNESCAPED_UNICODE)
                ]);
            }
        }
        if ($seed && isset($seed['products']) && is_array($seed['products'])) {
            $insertProd = $pdo->prepare("
                INSERT OR REPLACE INTO products (
                    id, store_id, name, name_ar, sku, price, original_price, stock, 
                    category, category_ar, image_url, gallery_urls, status, is_active, data, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ");
            foreach ($seed['products'] as $sId => $prodList) {
                if (!is_array($prodList)) continue;
                foreach ($prodList as $p) {
                    $pId = $p['id'] ?? ('prod-' . uniqid());
                    $sku = $p['sku'] ?? '';
                    $name = $p['name'] ?? '';
                    $nameAr = $p['nameAr'] ?? ($p['name_ar'] ?? '');
                    $price = (float)($p['price'] ?? 0);
                    $origPrice = (float)($p['originalPrice'] ?? ($p['original_price'] ?? 0));
                    $stock = (int)($p['stock'] ?? 0);
                    $cat = $p['category'] ?? '';
                    $catAr = $p['categoryAr'] ?? ($p['category_ar'] ?? '');
                    $img = $p['image'] ?? ($p['image_url'] ?? '');
                    $gallery = is_array($p['galleryUrls'] ?? null) ? json_encode($p['galleryUrls']) : (is_array($p['gallery_urls'] ?? null) ? json_encode($p['gallery_urls']) : json_encode([$img]));
                    $status = $p['status'] ?? 'published';
                    $isActive = ($p['isActive'] ?? ($p['is_active'] ?? true)) ? 1 : 0;

                    $insertProd->execute([
                        $pId, $sId, $name, $nameAr, $sku, $price, $origPrice, $stock,
                        $cat, $catAr, $img, $gallery, $status, $isActive,
                        json_encode($p, JSON_UNESCAPED_UNICODE)
                    ]);
                }
            }
        }
    }

    // Auto-seed categories if categories table is empty
    $catCount = (int)$pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();
    if ($catCount === 0 && file_exists(__DIR__ . '/initial_seed.json')) {
        $seedContent = file_get_contents(__DIR__ . '/initial_seed.json');
        $seed = json_decode($seedContent, true);
        if ($seed && isset($seed['categories']) && is_array($seed['categories'])) {
            $insertCat = $pdo->prepare("
                INSERT OR REPLACE INTO categories (
                    id, store_id, parent_id, name, name_ar, slug, image_url, sort_order, meta_title, meta_description, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            ");
            foreach ($seed['categories'] as $c) {
                $cId = $c['id'] ?? ('cat-' . uniqid());
                $sId = $c['store_id'] ?? 'store-1';
                $pId = !empty($c['parent_id']) ? $c['parent_id'] : null;
                $name = $c['name'] ?? '';
                $nameAr = $c['name_ar'] ?? ($c['nameAr'] ?? '');
                $slug = $c['slug'] ?? '';
                $img = $c['image_url'] ?? ($c['imageUrl'] ?? '');
                $sort = (int)($c['sort_order'] ?? ($c['sortOrder'] ?? 0));
                $mTitle = $c['meta_title'] ?? ($c['metaTitle'] ?? '');
                $mDesc = $c['meta_description'] ?? ($c['metaDescription'] ?? '');
                $act = ($c['is_active'] ?? ($c['isActive'] ?? true)) ? 1 : 0;

                $insertCat->execute([
                    $cId, $sId, $pId, $name, $nameAr, $slug, $img, $sort, $mTitle, $mDesc, $act
                ]);
            }
        }
    }

    // Auto-seed blog articles for store-1 (Hadaya Mecca Flowers) if empty
    $articleCount = (int)$pdo->query("SELECT COUNT(*) FROM blog_articles WHERE store_id = 'store-1'")->fetchColumn();
    if ($articleCount === 0) {
        $seedArticles = [
            [
                'id' => 'a-1',
                'store_id' => 'store-1',
                'title' => 'كيك مع ورد في مكة: أفكار إهداء تصنع الفرحة',
                'title_ar' => 'كيك مع ورد في مكة: أفكار إهداء تصنع الفرحة',
                'title_en' => 'Cake with Flowers in Mecca: Gift Ideas Creating Pure Joy',
                'slug' => 'cake-with-flowers-in-mecca',
                'category' => 'كيك مع ورد في مكة',
                'category_ar' => 'كيك مع ورد في مكة',
                'category_en' => 'Cake & Flowers',
                'read_time' => '3 دقائق قراءة',
                'read_time_en' => '3 min read',
                'image' => 'https://cdn.files.salla.network/other/246985580/526058e5-3543-4d24-b93f-1ced5ca0d974-original.webp',
                'summary' => 'تعتبر هدية الكيك مع الورد في مكة من أجمل الهدايا التي تجمع بين المذاق اللذيذ والمظهر الأنيق للمناسبات وأعياد الميلاد.',
                'summary_ar' => 'تعتبر هدية الكيك مع الورد في مكة من أجمل الهدايا التي تجمع بين المذاق اللذيذ والمظهر الأنيق للمناسبات وأعياد الميلاد.',
                'summary_en' => 'Pairing fresh cakes with bouquets combines taste and aesthetic beauty for birthdays and weddings.',
                'content' => 'تعتبر هدية الكيك مع الورد في مكة من أجمل الهدايا التي تجمع بين المذاق اللذيذ والمظهر الأنيق للمناسبات وأعياد الميلاد. نوفر باقات متميزة تجمع بين أجود أنواع الكيك الطازج والورود الهولندية النضرة مع كروت إهداء ملكية وتوصيل مبرد وسريع لجميع أحياء مكة المكرمة.',
                'content_ar' => 'تعتبر هدية الكيك مع الورد في مكة من أجمل الهدايا التي تجمع بين المذاق اللذيذ والمظهر الأنيق للمناسبات وأعياد الميلاد. نوفر باقات متميزة تجمع بين أجود أنواع الكيك الطازج والورود الهولندية النضرة مع كروت إهداء ملكية وتوصيل مبرد وسريع لجميع أحياء مكة المكرمة.',
                'content_en' => 'Pairing artisan fresh cakes with hand-tied Dutch bouquets creates an unforgettable sensory celebration for birthdays, graduations, and anniversaries across Mecca.',
                'author' => json_encode(['name' => 'منسق هدايا مكة', 'avatar' => 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png', 'role' => 'Master Florist']),
                'views_count' => 540,
                'comments_count' => 8,
                'is_featured' => 1
            ],
            [
                'id' => 'a-2',
                'store_id' => 'store-1',
                'title' => 'ورد مع قهوة وحلا في مكة: الضيافة الحجازية الأصيلة',
                'title_ar' => 'ورد مع قهوة وحلا في مكة: الضيافة الحجازية الأصيلة',
                'title_en' => 'Flowers with Coffee & Sweets in Mecca: Authentic Hijazi Hospitality',
                'slug' => 'flowers-coffee-sweets-mecca',
                'category' => 'ورد مع قهوة وحلا في مكة',
                'category_ar' => 'ورد مع قهوة وحلا في مكة',
                'category_en' => 'Coffee & Sweets',
                'read_time' => '4 دقائق قراءة',
                'read_time_en' => '4 min read',
                'image' => 'https://cdn.files.salla.network/other/246985580/1b671cbc-3ffd-423d-97b8-f51660a118a4-original.webp',
                'summary' => 'عندما تبحث عن هدية تجمع بين الأصالة والذوق الرفيع، فإن الورد مع القهوة والحلا يقدم تجربة إهداء متكاملة تعبر عن التقدير.',
                'summary_ar' => 'عندما تبحث عن هدية تجمع بين الأصالة والذوق الرفيع، فإن الورد مع القهوة والحلا يقدم تجربة إهداء متكاملة تعبر عن التقدير.',
                'summary_en' => 'A tasteful tribute blending Arabica coffee, artisan sweets, and fresh blooms.',
                'content' => 'عندما تبحث عن هدية تجمع بين الأصالة والذوق الرفيع، فإن الورد مع القهوة والحلا يقدم تجربة إهداء متكاملة تعبر عن التقدير والامتنان في كل مناسبة بمكة المكرمة مع أروع تشكيلات الحلويات الفاخرة وباقات الجوري النضرة.',
                'content_ar' => 'عندما تبحث عن هدية تجمع بين الأصالة والذوق الرفيع، فإن الورد مع القهوة والحلا يقدم تجربة إهداء متكاملة تعبر عن التقدير والامتنان في كل مناسبة بمكة المكرمة مع أروع تشكيلات الحلويات الفاخرة وباقات الجوري النضرة.',
                'content_en' => 'A quintessential Saudi tribute blending freshly roasted Arabica beans, artisanal sweets, and crisp blooms celebrating genuine Hijazi hospitality.',
                'author' => json_encode(['name' => 'أخصائي الضيافة', 'avatar' => 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png', 'role' => 'Hospitality Concierge']),
                'views_count' => 420,
                'comments_count' => 5,
                'is_featured' => 0
            ],
            [
                'id' => 'a-3',
                'store_id' => 'store-1',
                'title' => 'ورد مع عصافير الحب في مكة: هدايا استثنائية غير تقليدية',
                'title_ar' => 'ورد مع عصافير الحب في مكة: هدايا استثنائية غير تقليدية',
                'title_en' => 'Flowers with Lovebirds in Mecca: Extraordinary Unique Gifts',
                'slug' => 'flowers-with-lovebirds-mecca',
                'category' => 'ورد مع عصافير الحب في مكة',
                'category_ar' => 'ورد مع عصافير الحب في مكة',
                'category_en' => 'Lovebirds & Blooms',
                'read_time' => '4 دقائق قراءة',
                'read_time_en' => '4 min read',
                'image' => 'https://cdn.files.salla.network/other/246985580/a2442680-362e-405c-a209-13b09aa686b0-original.webp',
                'summary' => 'تجمع هذه الهدية بين جمال الورود الطبيعية وحيوية عصافير الحب لتترك ذكرى تدوم طويلاً لدى الشخص المهدى إليه.',
                'summary_ar' => 'تجمع هذه الهدية بين جمال الورود الطبيعية وحيوية عصافير الحب لتترك ذكرى تدوم طويلاً لدى الشخص المهدى إليه.',
                'summary_en' => 'Combining live lovebirds and natural roses creates an extraordinary emotional impact.',
                'content' => 'تجمع هذه الهدية الفريدة بين جمال الورود الطبيعية الزاهية وحيوية عصافير الحب المغردة داخل قفص ذهبي فاخر، لتصنع لحظة بهجة استثنائية لا تُنسى في المناسبات الكبرى بمكة.',
                'content_ar' => 'تجمع هذه الهدية الفريدة بين جمال الورود الطبيعية الزاهية وحيوية عصافير الحب المغردة داخل قفص ذهبي فاخر، لتصنع لحظة بهجة استثنائية لا تُنسى في المناسبات الكبرى بمكة.',
                'content_en' => 'Combining cheerful lovebirds in an ornate gilded cage alongside lush fresh blooms delivers a magical gift of living beauty.',
                'author' => json_encode(['name' => 'خبير الهدايا الحية', 'avatar' => 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png', 'role' => 'Master Curator']),
                'views_count' => 610,
                'comments_count' => 7,
                'is_featured' => 0
            ],
            [
                'id' => 'a-4',
                'store_id' => 'store-1',
                'title' => 'ورد مع أسماك الزينة في مكة: روح الطبيعة في تصميم فريد',
                'title_ar' => 'ورد مع أسماك الزينة في مكة: روح الطبيعة في تصميم فريد',
                'title_en' => 'Flowers with Aquarium Fish in Mecca: Nature in Unique Harmony',
                'slug' => 'flowers-aquarium-fish-mecca',
                'category' => 'ورد مع اسماك الزينة في مكة',
                'category_ar' => 'ورد مع اسماك الزينة في مكة',
                'category_en' => 'Fish & Flowers',
                'read_time' => '5 دقائق قراءة',
                'read_time_en' => '5 min read',
                'image' => 'https://cdn.files.salla.network/other/246985580/4c4647a0-069b-4113-8525-4117a0ee5521-original.webp',
                'summary' => 'هدية مبتكرة تجمع بين هدوء الحياة المائية وأناقة باقات الزهور لتزيين المكاتب والبيوت الراقية.',
                'summary_ar' => 'هدية مبتكرة تجمع بين هدوء الحياة المائية وأناقة باقات الزهور لتزيين المكاتب والبيوت الراقية.',
                'summary_en' => 'A breathtaking novelty uniting aquatic tranquility with vivid floristry.',
                'content' => 'هدية مبتكرة تجمع بين هدوء الحياة المائية في حوض كريستالي أنيق وتألق باقات الزهور الهولندية المختارة بعناية لتزيين أرقى المكاتب والمجالس في مكة المكرمة.',
                'content_ar' => 'هدية مبتكرة تجمع بين هدوء الحياة المائية في حوض كريستالي أنيق وتألق باقات الزهور الهولندية المختارة بعناية لتزيين أرقى المكاتب والمجالس في مكة المكرمة.',
                'content_en' => 'A breathtaking harmonious novelty uniting crystal aquatic tranquility with vivid premium floristry for executive offices and luxury homes.',
                'author' => json_encode(['name' => 'مهندس الديكور الحيوي', 'avatar' => 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png', 'role' => 'Design Specialist']),
                'views_count' => 490,
                'comments_count' => 4,
                'is_featured' => 0
            ],
        ];

        $insArt = $pdo->prepare("
            INSERT OR REPLACE INTO blog_articles (
                id, store_id, title, title_ar, title_en, slug, category, category_ar, category_en,
                read_time, read_time_en, image, summary, summary_ar, summary_en, content, content_ar, content_en,
                author, views_count, comments_count, is_featured, status, published_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'), datetime('now'), datetime('now'))
        ");
        foreach ($seedArticles as $art) {
            $insArt->execute([
                $art['id'], $art['store_id'], $art['title'], $art['title_ar'], $art['title_en'],
                $art['slug'], $art['category'], $art['category_ar'], $art['category_en'],
                $art['read_time'], $art['read_time_en'], $art['image'],
                $art['summary'], $art['summary_ar'], $art['summary_en'],
                $art['content'], $art['content_ar'], $art['content_en'],
                $art['author'], $art['views_count'], $art['comments_count'], $art['is_featured']
            ]);
        }
    }

    // Auto-seed customer reviews for store-1 if empty
    $reviewCount = (int)$pdo->query("SELECT COUNT(*) FROM reviews WHERE store_id = 'store-1'")->fetchColumn();
    if ($reviewCount === 0) {
        $seedReviews = [
            [
                'id' => 'rev-1',
                'store_id' => 'store-1',
                'name' => 'د. سارة الغامدي',
                'name_en' => 'Dr. Sarah Al-Ghamdi',
                'role' => 'مكة المكرمة · حي الشوقية',
                'role_en' => 'Mecca • Al-Shawqiyyah',
                'avatar' => '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
                'rating' => 5,
                'comment' => 'ما شاء الله تبارك الرحمن، تنسيق باقة الورد فاق التوقعات بكثير! الورد طبيعي جداً وفريش والتغليف فاخر يليق بأرقى المناسبات، والتوصيل خلال 45 دقيقة فقط.',
                'comment_en' => 'Exceeded all expectations! The roses were remarkably fresh and the packaging is worthy of the finest VIP celebrations, delivered in under 45 minutes.',
                'verified' => 1,
                'date' => 'منذ 3 أيام'
            ],
            [
                'id' => 'rev-2',
                'store_id' => 'store-1',
                'name' => 'م. عبدالرحمن الحربي',
                'name_en' => 'Eng. Abdulrahman Al-Harbi',
                'role' => 'مكة المكرمة · حي العوالي',
                'role_en' => 'Mecca • Al-Awali VIP',
                'avatar' => '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg',
                'rating' => 5,
                'comment' => 'طلبت بوكس الجوري وشوكولاتة باتشي، الصراحة فخامة لا توصف والاهتمام بأدق التفاصيل والكرت المكتوب بخط اليد مع ختم الشمع الملكي كان لمسة إبداعية.',
                'comment_en' => 'Ordered the roses & Patchi chocolate chest. Unmatched elegance, bespoke attention to detail, and the wax-sealed calligraphy card was breathtaking.',
                'verified' => 1,
                'date' => 'منذ أسبوع'
            ],
            [
                'id' => 'rev-3',
                'store_id' => 'store-1',
                'name' => 'أ/ فيصل السلمي',
                'name_en' => 'Faisal Al-Sulami',
                'role' => 'مكة المكرمة · العزيزية',
                'role_en' => 'Mecca • Al-Aziziyah',
                'avatar' => '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg',
                'rating' => 5,
                'comment' => 'خدمة أكثر من رائعة وتجاوب فوري عبر الواتساب. الأفضل في مكة بلا منازع، الفازة الكريستالية كانت تحفة فنية أبهرت كل الضيوف في المجلس.',
                'comment_en' => 'Prompt WhatsApp concierge assistance and unmatched floristry quality. The crystal vase became the highlight of our reception salon.',
                'verified' => 1,
                'date' => 'منذ 10 أيام'
            ],
            [
                'id' => 'rev-4',
                'store_id' => 'store-1',
                'name' => 'نورة الهذلي',
                'name_en' => 'Noura Al-Hothali',
                'role' => 'مكة المكرمة · بطحاء قريش',
                'role_en' => 'Mecca • Batha Quraish',
                'avatar' => '/src/assets/images/hadaya_white_orchid_penthouse_1791218732789.jpg',
                'rating' => 5,
                'comment' => 'تنسيق باقة العروس مع اللؤلؤ كان حلم وتحقق، الله يعطيكم العافية على الدقة والاحترافية وسرعة التوصيل المبرد اللي حافظت على نضارة كل وردة.',
                'comment_en' => 'The bridal bouquet with pearls was a dream come true. Immense gratitude for the chilled express delivery that kept every single petal fresh.',
                'verified' => 1,
                'date' => 'منذ أسبوعين'
            ],
            [
                'id' => 'rev-5',
                'store_id' => 'store-1',
                'name' => 'سعيد الزهراني',
                'name_en' => 'Saeed Al-Zahrani',
                'role' => 'مكة المكرمة · النزهة',
                'role_en' => 'Mecca • Al-Nuzha',
                'avatar' => '/src/assets/images/hadaya_blue_flower_1791218844895.jpg',
                'rating' => 5,
                'comment' => 'باقات الزهور الزرقاء نادرة جداً ومتقنة الصنع، تجربة شراء سهلة وخدمة عملاء راقية. أنصح الجميع بالتعامل معهم.',
                'comment_en' => 'The rare blue floral arrangement was exquisite. Effortless ordering process and VIP customer service.',
                'verified' => 1,
                'date' => 'منذ أسبوعين'
            ],
        ];

        $insRev = $pdo->prepare("
            INSERT OR REPLACE INTO reviews (
                id, store_id, name, name_en, role, role_en, avatar, rating, comment, comment_en, verified, date, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        ");
        foreach ($seedReviews as $r) {
            $insRev->execute([
                $r['id'], $r['store_id'], $r['name'], $r['name_en'], $r['role'], $r['role_en'],
                $r['avatar'], $r['rating'], $r['comment'], $r['comment_en'], $r['verified'], $r['date']
            ]);
        }
    }

    // Always enforce latest ZEDAAN perfume image for HM-WOMEN-01
    $pdo->exec('
        UPDATE products 
        SET image_url = "/images/hadaya_women_luxury_gift_zedaan.webp",
            gallery_urls = \\\'["/images/hadaya_women_luxury_gift_zedaan.webp"]\\\',
            updated_at = datetime("now")
        WHERE sku = "HM-WOMEN-01" AND (image_url LIKE "%1791219815272%" OR image_url IS NULL OR image_url = "")
    ');

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database initialization failed: ' . $e->getMessage()]);
    exit;
}

// Parse request path
$rawUri = $_SERVER['REQUEST_URI'] ?? '/health';
$uri = parse_url($rawUri, PHP_URL_PATH) ?: '/';
// Strip script name or /api prefix
$uri = preg_replace('#^/api#', '', $uri);
$uri = preg_replace('#^/public/api#', '', $uri);
$uri = preg_replace('#^/index\\.php#', '', $uri);
if ($uri === '' || $uri === '/') {
    $uri = '/';
}

$headerStoreId = $_SERVER['HTTP_X_STORE_ID'] ?? null;
$queryStoreId = $_GET['storeId'] ?? ($_GET['store_id'] ?? null);
$storeId = $headerStoreId ?: ($queryStoreId ?: 'store-1');

// Match store_id inside path if present (e.g., /stores/{store_id}/...)
if (preg_match('#^/stores/([^/]+)#', $uri, $mStore)) {
    $storeId = $mStore[1];
}

$inputJson = file_get_contents('php://input');
$inputData = json_decode($inputJson, true) ?: [];

// ── FORMATTERS ──

function formatProduct(array $row): array {
    $full = [];
    if (!empty($row['data'])) {
        $decoded = json_decode($row['data'], true);
        if (is_array($decoded)) {
            $full = $decoded;
        }
    }
    $gallery = [];
    if (!empty($row['gallery_urls'])) {
        $decGal = json_decode($row['gallery_urls'], true);
        if (is_array($decGal)) {
            $gallery = $decGal;
        }
    }
    if (empty($gallery) && !empty($row['image_url'])) {
        $gallery = [$row['image_url']];
    }

    return array_merge($full, [
        'id' => (string)$row['id'],
        'storeId' => (string)$row['store_id'],
        'store_id' => (string)$row['store_id'],
        'name' => (string)$row['name'],
        'nameAr' => (string)($row['name_ar'] ?? $row['name']),
        'name_ar' => (string)($row['name_ar'] ?? $row['name']),
        'sku' => (string)$row['sku'],
        'price' => (float)$row['price'],
        'originalPrice' => !empty($row['original_price']) ? (float)$row['original_price'] : (float)$row['price'],
        'original_price' => !empty($row['original_price']) ? (float)$row['original_price'] : (float)$row['price'],
        'stock' => (int)$row['stock'],
        'category' => (string)($row['category'] ?? ''),
        'categoryAr' => (string)($row['category_ar'] ?? $row['category'] ?? ''),
        'category_ar' => (string)($row['category_ar'] ?? $row['category'] ?? ''),
        'image' => (string)($row['image_url'] ?? ''),
        'image_url' => (string)($row['image_url'] ?? ''),
        'imageUrl' => (string)($row['image_url'] ?? ''),
        'galleryUrls' => $gallery,
        'gallery_urls' => $gallery,
        'status' => (string)($row['status'] ?? 'published'),
        'isActive' => (bool)($row['is_active'] ?? true),
        'is_active' => (bool)($row['is_active'] ?? true),
        'imageVersion' => (string)strtotime($row['updated_at'] ?? 'now'),
        'isStale' => false,
    ]);
}

function formatCategory(array $row): array {
    return [
        'id' => (string)$row['id'],
        'store_id' => (string)$row['store_id'],
        'storeId' => (string)$row['store_id'],
        'parent_id' => !empty($row['parent_id']) ? (string)$row['parent_id'] : null,
        'parentId' => !empty($row['parent_id']) ? (string)$row['parent_id'] : null,
        'name' => (string)$row['name'],
        'name_ar' => !empty($row['name_ar']) ? (string)$row['name_ar'] : null,
        'nameAr' => !empty($row['name_ar']) ? (string)$row['name_ar'] : null,
        'slug' => (string)$row['slug'],
        'image_url' => !empty($row['image_url']) ? (string)$row['image_url'] : null,
        'imageUrl' => !empty($row['image_url']) ? (string)$row['image_url'] : null,
        'sort_order' => (int)($row['sort_order'] ?? 0),
        'sortOrder' => (int)($row['sort_order'] ?? 0),
        'meta_title' => !empty($row['meta_title']) ? (string)$row['meta_title'] : null,
        'metaTitle' => !empty($row['meta_title']) ? (string)$row['meta_title'] : null,
        'meta_description' => !empty($row['meta_description']) ? (string)$row['meta_description'] : null,
        'metaDescription' => !empty($row['meta_description']) ? (string)$row['meta_description'] : null,
        'is_active' => (bool)($row['is_active'] ?? 1),
        'isActive' => (bool)($row['is_active'] ?? 1),
    ];
}

function formatBlogArticle(array $row): array {
    $author = !empty($row['author']) ? json_decode($row['author'], true) : null;
    if (!is_array($author)) {
        $author = [
            'name' => $row['author'] ?: 'Sarah Ahmed',
            'avatar' => 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png',
            'role' => 'Master Florist & Gift Concierge'
        ];
    }
    $seo = !empty($row['seo']) ? json_decode($row['seo'], true) : [];
    if (!is_array($seo)) $seo = [];

    return [
        'id' => (string)$row['id'],
        'store_id' => (string)$row['store_id'],
        'storeId' => (string)$row['store_id'],
        'title' => (string)$row['title'],
        'titleAr' => !empty($row['title_ar']) ? (string)$row['title_ar'] : (string)$row['title'],
        'titleEn' => !empty($row['title_en']) ? (string)$row['title_en'] : (string)$row['title'],
        'slug' => (string)($row['slug'] ?: preg_replace('/[^a-zA-Z0-9_-]/', '-', strtolower($row['title']))),
        'excerpt' => (string)($row['summary'] ?: ''),
        'summary' => (string)($row['summary'] ?: ''),
        'summaryAr' => !empty($row['summary_ar']) ? (string)$row['summary_ar'] : (string)($row['summary'] ?: ''),
        'summaryEn' => !empty($row['summary_en']) ? (string)$row['summary_en'] : (string)($row['summary'] ?: ''),
        'content' => (string)($row['content'] ?: ''),
        'contentAr' => !empty($row['content_ar']) ? (string)$row['content_ar'] : (string)($row['content'] ?: ''),
        'contentEn' => !empty($row['content_en']) ? (string)$row['content_en'] : (string)($row['content'] ?: ''),
        'category' => (string)($row['category'] ?: 'General'),
        'categoryAr' => !empty($row['category_ar']) ? (string)$row['category_ar'] : (string)($row['category'] ?: 'General'),
        'categoryEn' => !empty($row['category_en']) ? (string)$row['category_en'] : (string)($row['category'] ?: 'General'),
        'readTime' => !empty($row['read_time']) ? (string)$row['read_time'] : '3 دقائق قراءة',
        'read_time' => !empty($row['read_time']) ? (string)$row['read_time'] : '3 دقائق قراءة',
        'readTimeEn' => !empty($row['read_time_en']) ? (string)$row['read_time_en'] : '3 min read',
        'image' => (string)($row['image'] ?: ''),
        'thumbnail' => (string)($row['image'] ?: ''),
        'author' => $author,
        'status' => (string)($row['status'] ?: 'published'),
        'views' => (int)($row['views_count'] ?? 0),
        'comments' => (int)($row['comments_count'] ?? 0),
        'published_at' => (string)($row['published_at'] ?? date('c')),
        'updated_at' => (string)($row['updated_at'] ?? date('c')),
        'featured' => (bool)($row['is_featured'] ?? false),
        'seo' => $seo,
    ];
}

function formatReview(array $row): array {
    return [
        'id' => (string)$row['id'],
        'store_id' => (string)$row['store_id'],
        'productId' => !empty($row['product_id']) ? (string)$row['product_id'] : null,
        'name' => (string)$row['name'],
        'nameEn' => !empty($row['name_en']) ? (string)$row['name_en'] : (string)$row['name'],
        'role' => (string)($row['role'] ?? ''),
        'roleEn' => !empty($row['role_en']) ? (string)$row['role_en'] : (string)($row['role'] ?? ''),
        'avatar' => (string)($row['avatar'] ?? ''),
        'rating' => (float)($row['rating'] ?? 5),
        'comment' => (string)($row['comment'] ?? ''),
        'commentEn' => !empty($row['comment_en']) ? (string)$row['comment_en'] : (string)($row['comment'] ?? ''),
        'verified' => (bool)($row['verified'] ?? 1),
        'date' => (string)($row['date'] ?? 'مؤخراً'),
        'isActive' => (bool)($row['is_active'] ?? 1),
    ];
}

function formatBanner(array $row): array {
    $settings = !empty($row['settings']) ? json_decode($row['settings'], true) : [];
    if (!is_array($settings)) $settings = [];
    return [
        'id' => (string)$row['id'],
        'store_id' => (string)$row['store_id'],
        'type' => (string)($row['type'] ?? 'promo'),
        'title' => (string)($row['title'] ?? ''),
        'titleEn' => !empty($row['title_en']) ? (string)$row['title_en'] : (string)($row['title'] ?? ''),
        'subtitle' => (string)($row['subtitle'] ?? ''),
        'subtitleEn' => !empty($row['subtitle_en']) ? (string)$row['subtitle_en'] : (string)($row['subtitle'] ?? ''),
        'imageUrl' => (string)($row['image_url'] ?? ''),
        'videoUrl' => (string)($row['video_url'] ?? ''),
        'linkUrl' => (string)($row['link_url'] ?? ''),
        'buttonText' => (string)($row['button_text'] ?? ''),
        'buttonTextEn' => !empty($row['button_text_en']) ? (string)$row['button_text_en'] : (string)($row['button_text'] ?? ''),
        'sortOrder' => (int)($row['sort_order'] ?? 0),
        'isActive' => (bool)($row['is_active'] ?? 1),
        'settings' => $settings,
    ];
}

// ── ROUTER ──

// 1. Health check
if ($uri === '/health') {
    $prodTotal = (int)$pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
    $stTotal = (int)$pdo->query("SELECT COUNT(*) FROM stores")->fetchColumn();
    $artTotal = (int)$pdo->query("SELECT COUNT(*) FROM blog_articles")->fetchColumn();
    $revTotal = (int)$pdo->query("SELECT COUNT(*) FROM reviews")->fetchColumn();
    echo json_encode([
        'status' => 'ok',
        'provider' => 'Hostinger Cloud API',
        'database' => 'active_live_sqlite',
        'stores_count' => $stTotal,
        'products_count' => $prodTotal,
        'blog_articles_count' => $artTotal,
        'reviews_count' => $revTotal,
        'timestamp' => date('c'),
    ]);
    exit;
}

// 2. Auth / Me Mock Endpoint
if ($uri === '/auth/me') {
    echo json_encode([
        'user' => [
            'id' => 'user-store-1',
            'name' => 'متجر هدايا',
            'email' => 'giftshop2030m@gmail.com',
            'role' => 'manager',
        ],
        'portal' => 'store',
        'store_id' => $storeId,
        'store_name' => 'متجر هدايا - مكة المكرمة',
    ]);
    exit;
}

// 3. Stores List
if ($uri === '/stores' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM stores ORDER BY id ASC");
    $stores = [];
    while ($row = $stmt->fetch()) {
        $st = json_decode($row['data'], true) ?: [];
        $st['id'] = $row['id'];
        $st['name'] = $row['name'];
        $st['slug'] = $row['slug'];
        $st['domain'] = $row['domain'];
        $cnt = (int)$pdo->query("SELECT COUNT(*) FROM products WHERE store_id = '{$row['id']}'")->fetchColumn();
        $st['productsCount'] = $cnt;
        $stores[] = $st;
    }
    echo json_encode(['data' => $stores]);
    exit;
}

// 4. Categories Endpoints (CRUD)
if (($uri === '/categories' || strpos($uri, '/categories') === 0) && $method === 'GET') {
    if (preg_match('#^/categories/([^/?]+)#', $uri, $m) && !in_array($m[1], ['', 'search'])) {
        $catId = $m[1];
        $st = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
        $st->execute([$catId]);
        $row = $st->fetch();
        if ($row) {
            echo json_encode(['data' => formatCategory($row)]);
            exit;
        }
        http_response_code(404);
        echo json_encode(['message' => 'Category not found']);
        exit;
    }

    $q = trim($_GET['q'] ?? '');
    $parentId = $_GET['parent_id'] ?? null;
    $rootsOnly = !empty($_GET['roots']);

    $sql = "SELECT * FROM categories WHERE (store_id = ? OR store_id = ?)";
    $altStoreId = $storeId === 'store-1' ? 'giftshop-sa' : ($storeId === 'giftshop-sa' ? 'store-1' : $storeId);
    $params = [$storeId, $altStoreId];

    if (!empty($q)) {
        $sql .= " AND (name LIKE ? OR name_ar LIKE ? OR slug LIKE ?)";
        $params[] = "%$q%";
        $params[] = "%$q%";
        $params[] = "%$q%";
    }

    if ($rootsOnly) {
        $sql .= " AND (parent_id IS NULL OR parent_id = '')";
    } elseif ($parentId !== null && $parentId !== '') {
        $sql .= " AND parent_id = ?";
        $params[] = $parentId;
    }

    $sql .= " ORDER BY sort_order ASC, name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $output = array_map('formatCategory', $rows);
    echo json_encode([
        'data' => $output,
        'count' => count($output),
        'store_id' => $storeId,
    ]);
    exit;
}

if ($uri === '/categories' && $method === 'POST') {
    $cId = !empty($inputData['id']) ? (string)$inputData['id'] : ('cat-' . time() . '-' . substr(md5(uniqid()), 0, 6));
    $name = trim($inputData['name'] ?? '');
    $nameAr = !empty($inputData['name_ar']) ? trim($inputData['name_ar']) : (!empty($inputData['nameAr']) ? trim($inputData['nameAr']) : null);
    $slug = !empty($inputData['slug']) ? trim($inputData['slug']) : strtolower(preg_replace('/[^a-zA-Z0-9_-]/', '-', $name));
    $parentId = !empty($inputData['parent_id']) ? $inputData['parent_id'] : (!empty($inputData['parentId']) ? $inputData['parentId'] : null);
    $imageUrl = $inputData['image_url'] ?? ($inputData['imageUrl'] ?? null);
    $sortOrder = (int)($inputData['sort_order'] ?? ($inputData['sortOrder'] ?? 0));
    $metaTitle = $inputData['meta_title'] ?? ($inputData['metaTitle'] ?? null);
    $metaDesc = $inputData['meta_description'] ?? ($inputData['metaDescription'] ?? null);
    $isActive = isset($inputData['is_active']) ? (int)(bool)$inputData['is_active'] : (isset($inputData['isActive']) ? (int)(bool)$inputData['isActive'] : 1);

    $stmt = $pdo->prepare("
        INSERT OR REPLACE INTO categories (
            id, store_id, parent_id, name, name_ar, slug, image_url, sort_order, meta_title, meta_description, is_active, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ");
    $stmt->execute([
        $cId, $storeId, $parentId, $name, $nameAr, $slug, $imageUrl, $sortOrder, $metaTitle, $metaDesc, $isActive
    ]);

    $res = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
    $res->execute([$cId]);
    $created = $res->fetch();
    echo json_encode(['data' => formatCategory($created)]);
    exit;
}

if (preg_match('#^/categories/([^/]+)$#', $uri, $matches) && in_array($method, ['PATCH', 'PUT', 'POST'])) {
    $catId = $matches[1];
    $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
    $stmt->execute([$catId]);
    $existing = $stmt->fetch();
    if ($existing) {
        $name = isset($inputData['name']) ? trim($inputData['name']) : $existing['name'];
        $nameAr = isset($inputData['name_ar']) ? $inputData['name_ar'] : (isset($inputData['nameAr']) ? $inputData['nameAr'] : $existing['name_ar']);
        $slug = isset($inputData['slug']) ? trim($inputData['slug']) : $existing['slug'];
        $parentId = array_key_exists('parent_id', $inputData) ? $inputData['parent_id'] : (array_key_exists('parentId', $inputData) ? $inputData['parentId'] : $existing['parent_id']);
        $imageUrl = array_key_exists('image_url', $inputData) ? $inputData['image_url'] : (array_key_exists('imageUrl', $inputData) ? $inputData['imageUrl'] : $existing['image_url']);
        $sortOrder = isset($inputData['sort_order']) ? (int)$inputData['sort_order'] : (isset($inputData['sortOrder']) ? (int)$inputData['sortOrder'] : (int)$existing['sort_order']);
        $metaTitle = array_key_exists('meta_title', $inputData) ? $inputData['meta_title'] : (array_key_exists('metaTitle', $inputData) ? $inputData['metaTitle'] : $existing['meta_title']);
        $metaDesc = array_key_exists('meta_description', $inputData) ? $inputData['meta_description'] : (array_key_exists('metaDescription', $inputData) ? $inputData['metaDescription'] : $existing['meta_description']);
        $isActive = isset($inputData['is_active']) ? (int)(bool)$inputData['is_active'] : (isset($inputData['isActive']) ? (int)(bool)$inputData['isActive'] : (int)$existing['is_active']);

        $upd = $pdo->prepare("
            UPDATE categories SET
                name = ?, name_ar = ?, slug = ?, parent_id = ?, image_url = ?, sort_order = ?, meta_title = ?, meta_description = ?, is_active = ?, updated_at = datetime('now')
            WHERE id = ?
        ");
        $upd->execute([
            $name, $nameAr, $slug, $parentId, $imageUrl, $sortOrder, $metaTitle, $metaDesc, $isActive, $catId
        ]);

        $sel = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
        $sel->execute([$catId]);
        $row = $sel->fetch();
        echo json_encode(['data' => formatCategory($row)]);
        exit;
    }
}

if (preg_match('#^/categories/([^/]+)$#', $uri, $matches) && $method === 'DELETE') {
    $catId = $matches[1];
    $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
    $stmt->execute([$catId]);
    echo json_encode(['data' => ['id' => $catId, 'deleted' => true]]);
    exit;
}

// 5. Products Endpoints (CRUD)
if ($uri === '/products' && $method === 'GET') {
    $effectiveStore = $storeId;
    $count = (int)$pdo->query("SELECT COUNT(*) FROM products WHERE store_id = " . $pdo->quote($effectiveStore))->fetchColumn();
    if ($count === 0 && $effectiveStore !== 'store-1') {
        $baseStmt = $pdo->prepare("SELECT * FROM products WHERE store_id = 'store-1'");
        $baseStmt->execute();
        $ins = $pdo->prepare("
            INSERT OR REPLACE INTO products (
                id, store_id, name, name_ar, sku, price, original_price, stock, 
                category, category_ar, image_url, gallery_urls, status, is_active, data, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ");
        while ($baseRow = $baseStmt->fetch()) {
            $newId = preg_replace('/^women-gift-|^prod-/', '', $baseRow['id']) . '-' . substr(md5($effectiveStore), 0, 4);
            $ins->execute([
                $newId, $effectiveStore, $baseRow['name'], $baseRow['name_ar'], $baseRow['sku'],
                $baseRow['price'], $baseRow['original_price'], $baseRow['stock'],
                $baseRow['category'], $baseRow['category_ar'], $baseRow['image_url'],
                $baseRow['gallery_urls'], $baseRow['status'], $baseRow['is_active'],
                $baseRow['data']
            ]);
        }
    }

    $q = "SELECT * FROM products WHERE store_id = :storeId ORDER BY updated_at DESC, id ASC";
    $stmt = $pdo->prepare($q);
    $stmt->execute([':storeId' => $effectiveStore]);

    $products = [];
    while ($row = $stmt->fetch()) {
        $products[] = formatProduct($row);
    }

    echo json_encode([
        'data' => $products,
        'meta' => [
            'total' => count($products),
            'page' => 1,
            'per_page' => max(1, count($products)),
            'last_page' => 1,
        ]
    ]);
    exit;
}

if ($uri === '/products' && $method === 'POST') {
    $id = $inputData['id'] ?? ('prod-' . uniqid());
    $sku = $inputData['sku'] ?? ('SKU-' . strtoupper(substr(uniqid(), -6)));
    $name = $inputData['name'] ?? 'منتج جديد';
    $nameAr = $inputData['name_ar'] ?? ($inputData['nameAr'] ?? $name);
    $price = (float)($inputData['price'] ?? 0);
    $origPrice = (float)($inputData['original_price'] ?? ($inputData['originalPrice'] ?? $price));
    $stock = (int)($inputData['stock'] ?? 10);
    $cat = $inputData['category'] ?? 'عام';
    $catAr = $inputData['category_ar'] ?? ($inputData['categoryAr'] ?? $cat);
    $img = $inputData['image_url'] ?? ($inputData['image'] ?? '/images/hadaya_women_luxury_gift_zedaan.webp');
    $gal = isset($inputData['gallery_urls']) && is_array($inputData['gallery_urls']) 
        ? json_encode($inputData['gallery_urls']) 
        : (isset($inputData['galleryUrls']) && is_array($inputData['galleryUrls']) ? json_encode($inputData['galleryUrls']) : json_encode([$img]));
    $status = $inputData['status'] ?? 'published';
    $isActive = (!isset($inputData['is_active']) || $inputData['is_active']) ? 1 : 0;

    $stmt = $pdo->prepare("
        INSERT OR REPLACE INTO products (
            id, store_id, name, name_ar, sku, price, original_price, stock, 
            category, category_ar, image_url, gallery_urls, status, is_active, data, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ");
    $stmt->execute([
        $id, $storeId, $name, $nameAr, $sku, $price, $origPrice, $stock,
        $cat, $catAr, $img, $gal, $status, $isActive,
        json_encode($inputData, JSON_UNESCAPED_UNICODE)
    ]);

    $fetch = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $fetch->execute([$id]);
    $created = $fetch->fetch();
    echo json_encode(['data' => formatProduct($created)]);
    exit;
}

if (preg_match('#^/products/([^/]+)$#', $uri, $matches) && in_array($method, ['PATCH', 'PUT', 'POST'])) {
    $pId = $matches[1];
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$pId]);
    $existing = $stmt->fetch();
    if (!$existing) {
        $stmt2 = $pdo->prepare("SELECT * FROM products WHERE sku = ?");
        $stmt2->execute([$pId]);
        $existing = $stmt2->fetch();
    }

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['message' => 'Product not found: ' . $pId]);
        exit;
    }

    $existingData = json_decode($existing['data'] ?? '{}', true) ?: [];
    $mergedData = array_merge($existingData, $inputData);

    $name = $inputData['name'] ?? $existing['name'];
    $nameAr = $inputData['name_ar'] ?? ($inputData['nameAr'] ?? $existing['name_ar']);
    $sku = $inputData['sku'] ?? $existing['sku'];
    $price = isset($inputData['price']) ? (float)$inputData['price'] : (float)$existing['price'];
    $origPrice = isset($inputData['original_price']) ? (float)$inputData['original_price'] : (isset($inputData['originalPrice']) ? (float)$inputData['originalPrice'] : (float)$existing['original_price']);
    $stock = isset($inputData['stock']) ? (int)$inputData['stock'] : (int)$existing['stock'];
    $cat = $inputData['category'] ?? $existing['category'];
    $catAr = $inputData['category_ar'] ?? ($inputData['categoryAr'] ?? $existing['category_ar']);
    $img = $inputData['image_url'] ?? ($inputData['image'] ?? $existing['image_url']);
    
    $gal = $existing['gallery_urls'];
    if (isset($inputData['gallery_urls']) && is_array($inputData['gallery_urls'])) {
        $gal = json_encode($inputData['gallery_urls']);
    } elseif (isset($inputData['galleryUrls']) && is_array($inputData['galleryUrls'])) {
        $gal = json_encode($inputData['galleryUrls']);
    } elseif ($img !== $existing['image_url']) {
        $curGal = json_decode($existing['gallery_urls'], true) ?: [];
        $gal = json_encode(array_values(array_unique(array_merge([$img], $curGal))));
    }

    $status = $inputData['status'] ?? $existing['status'];
    $isActive = isset($inputData['is_active']) ? ($inputData['is_active'] ? 1 : 0) : (isset($inputData['isActive']) ? ($inputData['isActive'] ? 1 : 0) : $existing['is_active']);

    $upd = $pdo->prepare("
        UPDATE products 
        SET name = ?, name_ar = ?, sku = ?, price = ?, original_price = ?, stock = ?,
            category = ?, category_ar = ?, image_url = ?, gallery_urls = ?, status = ?, is_active = ?,
            data = ?, updated_at = datetime('now')
        WHERE id = ?
    ");
    $upd->execute([
        $name, $nameAr, $sku, $price, $origPrice, $stock,
        $cat, $catAr, $img, $gal, $status, $isActive,
        json_encode($mergedData, JSON_UNESCAPED_UNICODE),
        $existing['id']
    ]);

    $fetch = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $fetch->execute([$existing['id']]);
    $updated = $fetch->fetch();
    echo json_encode(['data' => formatProduct($updated)]);
    exit;
}

if (preg_match('#^/products/([^/]+)$#', $uri, $matches) && $method === 'DELETE') {
    $pId = $matches[1];
    $del = $pdo->prepare("DELETE FROM products WHERE id = ? OR sku = ?");
    $del->execute([$pId, $pId]);
    echo json_encode(['success' => true]);
    exit;
}

if (preg_match('#^/products/([^/]+)/toggle-publish$#', $uri, $matches) && $method === 'POST') {
    $pId = $matches[1];
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? OR sku = ?");
    $stmt->execute([$pId, $pId]);
    $existing = $stmt->fetch();
    if ($existing) {
        $newActive = $existing['is_active'] ? 0 : 1;
        $newStatus = $newActive ? 'published' : 'draft';
        $upd = $pdo->prepare("UPDATE products SET is_active = ?, status = ?, updated_at = datetime('now') WHERE id = ?");
        $upd->execute([$newActive, $newStatus, $existing['id']]);
        $existing['is_active'] = $newActive;
        $existing['status'] = $newStatus;
        echo json_encode(['data' => formatProduct($existing)]);
        exit;
    }
}

// ── 6. BLOG ARTICLES & SETTINGS & COMMERCE TOOLS ──

// Bulk action on blog articles
if (preg_match('#^/stores/([^/]+)/blog/articles/bulk$#', $uri, $mBulk) && $method === 'POST') {
    $targetStore = $mBulk[1];
    $action = $inputData['action'] ?? '';
    $ids = $inputData['ids'] ?? [];
    if (!empty($ids) && is_array($ids)) {
        if ($action === 'delete') {
            $inQ = implode(',', array_fill(0, count($ids), '?'));
            $st = $pdo->prepare("DELETE FROM blog_articles WHERE store_id = ? AND id IN ($inQ)");
            $st->execute(array_merge([$targetStore], $ids));
        } elseif ($action === 'publish' || $action === 'draft') {
            $inQ = implode(',', array_fill(0, count($ids), '?'));
            $st = $pdo->prepare("UPDATE blog_articles SET status = ?, updated_at = datetime('now') WHERE store_id = ? AND id IN ($inQ)");
            $st->execute(array_merge([$action, $targetStore], $ids));
        }
    }
    echo json_encode(['success' => true, 'count' => count($ids), 'message' => 'Bulk action completed']);
    exit;
}

// Article Commerce Tools config (GET / PUT)
if (preg_match('#^/stores/([^/]+)/blog/commerce-tools/([^/]+)$#', $uri, $mTools)) {
    $targetStore = $mTools[1];
    $artId = $mTools[2];
    if (in_array($method, ['PUT', 'POST'])) {
        $toolsJson = json_encode($inputData, JSON_UNESCAPED_UNICODE);
        $st = $pdo->prepare("UPDATE blog_articles SET commerce_tools = ?, updated_at = datetime('now') WHERE store_id = ? AND id = ?");
        $st->execute([$toolsJson, $targetStore, $artId]);
        echo json_encode(['success' => true, 'data' => $inputData]);
        exit;
    }
    $st = $pdo->prepare("SELECT commerce_tools FROM blog_articles WHERE store_id = ? AND id = ?");
    $st->execute([$targetStore, $artId]);
    $raw = $st->fetchColumn();
    $decoded = $raw ? json_decode($raw, true) : null;
    echo json_encode(['success' => true, 'data' => $decoded ?: ['article_id' => $artId]]);
    exit;
}

// Single Article (GET / PUT / DELETE)
if (preg_match('#^/stores/([^/]+)/blog/articles/([^/]+)$#', $uri, $mArt)) {
    $targetStore = $mArt[1];
    $artId = $mArt[2];

    if ($method === 'GET') {
        $st = $pdo->prepare("SELECT * FROM blog_articles WHERE (store_id = ? OR store_id = 'store-1') AND id = ?");
        $st->execute([$targetStore, $artId]);
        $row = $st->fetch();
        if ($row) {
            echo json_encode(['success' => true, 'data' => formatBlogArticle($row)]);
            exit;
        }
        http_response_code(404);
        echo json_encode(['message' => 'Article not found']);
        exit;
    }

    if (in_array($method, ['PUT', 'PATCH', 'POST'])) {
        $st = $pdo->prepare("SELECT * FROM blog_articles WHERE store_id = ? AND id = ?");
        $st->execute([$targetStore, $artId]);
        $existing = $st->fetch();
        if (!$existing) {
            // If doesn't exist, try creating
            $existing = [];
        }

        $title = $inputData['title'] ?? ($existing['title'] ?? 'Untitled Article');
        $titleAr = $inputData['title_ar'] ?? ($inputData['titleAr'] ?? ($existing['title_ar'] ?? $title));
        $titleEn = $inputData['title_en'] ?? ($inputData['titleEn'] ?? ($existing['title_en'] ?? $title));
        $slug = $inputData['slug'] ?? ($existing['slug'] ?? preg_replace('/[^a-zA-Z0-9_-]/', '-', strtolower($titleEn)));
        $cat = $inputData['category'] ?? ($existing['category'] ?? 'General');
        $catAr = $inputData['category_ar'] ?? ($inputData['categoryAr'] ?? ($existing['category_ar'] ?? $cat));
        $catEn = $inputData['category_en'] ?? ($inputData['categoryEn'] ?? ($existing['category_en'] ?? $cat));
        $readTime = $inputData['read_time'] ?? ($inputData['readTime'] ?? ($existing['read_time'] ?? '3 دقائق قراءة'));
        $readTimeEn = $inputData['read_time_en'] ?? ($inputData['readTimeEn'] ?? ($existing['read_time_en'] ?? '3 min read'));
        $img = $inputData['thumbnail'] ?? ($inputData['image'] ?? ($existing['image'] ?? ''));
        $summary = $inputData['excerpt'] ?? ($inputData['summary'] ?? ($existing['summary'] ?? ''));
        $summaryAr = $inputData['summary_ar'] ?? ($inputData['summaryAr'] ?? ($existing['summary_ar'] ?? $summary));
        $summaryEn = $inputData['summary_en'] ?? ($inputData['summaryEn'] ?? ($existing['summary_en'] ?? $summary));
        $content = $inputData['content'] ?? ($existing['content'] ?? '');
        $contentAr = $inputData['content_ar'] ?? ($inputData['contentAr'] ?? ($existing['content_ar'] ?? $content));
        $contentEn = $inputData['content_en'] ?? ($inputData['contentEn'] ?? ($existing['content_en'] ?? $content));
        $status = $inputData['status'] ?? ($existing['status'] ?? 'published');
        $isFeatured = isset($inputData['featured']) ? (int)(bool)$inputData['featured'] : (isset($inputData['is_featured']) ? (int)(bool)$inputData['is_featured'] : (int)($existing['is_featured'] ?? 0));
        
        $authorData = isset($inputData['author']) && is_array($inputData['author']) ? json_encode($inputData['author'], JSON_UNESCAPED_UNICODE) : ($existing['author'] ?? json_encode(['name' => $inputData['author'] ?? 'Admin']));
        $seoData = isset($inputData['seo']) && is_array($inputData['seo']) ? json_encode($inputData['seo'], JSON_UNESCAPED_UNICODE) : ($existing['seo'] ?? '{}');

        $upd = $pdo->prepare("
            INSERT OR REPLACE INTO blog_articles (
                id, store_id, title, title_ar, title_en, slug, category, category_ar, category_en,
                read_time, read_time_en, image, summary, summary_ar, summary_en, content, content_ar, content_en,
                author, status, is_featured, seo, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ");
        $upd->execute([
            $artId, $targetStore, $title, $titleAr, $titleEn, $slug, $cat, $catAr, $catEn,
            $readTime, $readTimeEn, $img, $summary, $summaryAr, $summaryEn, $content, $contentAr, $contentEn,
            $authorData, $status, $isFeatured, $seoData
        ]);

        $sel = $pdo->prepare("SELECT * FROM blog_articles WHERE store_id = ? AND id = ?");
        $sel->execute([$targetStore, $artId]);
        $row = $sel->fetch();
        echo json_encode(['success' => true, 'data' => formatBlogArticle($row), 'message' => 'Article saved successfully']);
        exit;
    }

    if ($method === 'DELETE') {
        $del = $pdo->prepare("DELETE FROM blog_articles WHERE store_id = ? AND id = ?");
        $del->execute([$targetStore, $artId]);
        echo json_encode(['success' => true, 'message' => 'Article deleted successfully']);
        exit;
    }
}

// Blog Settings (GET / PUT / POST)
if (preg_match('#^/stores/([^/]+)/blog/settings$#', $uri, $mSet)) {
    $targetStore = $mSet[1];
    if (in_array($method, ['PUT', 'POST'])) {
        $postSet = isset($inputData['post_settings']) ? json_encode($inputData['post_settings'], JSON_UNESCAPED_UNICODE) : null;
        $seoSet = isset($inputData['seo_settings']) ? json_encode($inputData['seo_settings'], JSON_UNESCAPED_UNICODE) : null;
        $featId = $inputData['featured_article_id'] ?? null;

        $st = $pdo->prepare("
            INSERT OR REPLACE INTO blog_settings (store_id, post_settings, seo_settings, featured_article_id, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        ");
        $st->execute([$targetStore, $postSet, $seoSet, $featId]);
        echo json_encode(['success' => true, 'message' => 'Blog settings saved successfully']);
        exit;
    }

    $st = $pdo->prepare("SELECT * FROM blog_settings WHERE store_id = ?");
    $st->execute([$targetStore]);
    $row = $st->fetch() ?: [];
    echo json_encode([
        'success' => true,
        'post_settings' => json_decode($row['post_settings'] ?? '{}', true) ?: [],
        'seo_settings' => json_decode($row['seo_settings'] ?? '{}', true) ?: [],
        'featured_article_id' => $row['featured_article_id'] ?? null,
    ]);
    exit;
}

// Blog Articles List & Create (/stores/{id}/blog/articles OR /blog/articles)
if (preg_match('#^/stores/([^/]+)/blog/articles#', $uri, $mList) || $uri === '/blog/articles') {
    $targetStore = !empty($mList[1]) ? $mList[1] : $storeId;

    if ($method === 'POST') {
        $newId = !empty($inputData['id']) ? (string)$inputData['id'] : ('art-' . time() . '-' . substr(md5(uniqid()), 0, 5));
        $title = $inputData['title'] ?? 'مقال جديد';
        $titleAr = $inputData['title_ar'] ?? ($inputData['titleAr'] ?? $title);
        $titleEn = $inputData['title_en'] ?? ($inputData['titleEn'] ?? $title);
        $slug = $inputData['slug'] ?? preg_replace('/[^a-zA-Z0-9_-]/', '-', strtolower($titleEn));
        $cat = $inputData['category'] ?? 'عام';
        $catAr = $inputData['category_ar'] ?? ($inputData['categoryAr'] ?? $cat);
        $catEn = $inputData['category_en'] ?? ($inputData['categoryEn'] ?? $cat);
        $readTime = $inputData['read_time'] ?? ($inputData['readTime'] ?? '3 دقائق قراءة');
        $readTimeEn = $inputData['read_time_en'] ?? ($inputData['readTimeEn'] ?? '3 min read');
        $img = $inputData['thumbnail'] ?? ($inputData['image'] ?? '');
        $summary = $inputData['excerpt'] ?? ($inputData['summary'] ?? '');
        $summaryAr = $inputData['summary_ar'] ?? ($inputData['summaryAr'] ?? $summary);
        $summaryEn = $inputData['summary_en'] ?? ($inputData['summaryEn'] ?? $summary);
        $content = $inputData['content'] ?? '';
        $contentAr = $inputData['content_ar'] ?? ($inputData['contentAr'] ?? $content);
        $contentEn = $inputData['content_en'] ?? ($inputData['contentEn'] ?? $content);
        $status = $inputData['status'] ?? 'published';
        $isFeatured = isset($inputData['featured']) ? (int)(bool)$inputData['featured'] : (isset($inputData['is_featured']) ? (int)(bool)$inputData['is_featured'] : 0);
        $authorData = isset($inputData['author']) && is_array($inputData['author']) ? json_encode($inputData['author'], JSON_UNESCAPED_UNICODE) : json_encode(['name' => $inputData['author'] ?? 'Admin']);
        $seoData = isset($inputData['seo']) && is_array($inputData['seo']) ? json_encode($inputData['seo'], JSON_UNESCAPED_UNICODE) : '{}';

        $ins = $pdo->prepare("
            INSERT OR REPLACE INTO blog_articles (
                id, store_id, title, title_ar, title_en, slug, category, category_ar, category_en,
                read_time, read_time_en, image, summary, summary_ar, summary_en, content, content_ar, content_en,
                author, status, is_featured, seo, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ");
        $ins->execute([
            $newId, $targetStore, $title, $titleAr, $titleEn, $slug, $cat, $catAr, $catEn,
            $readTime, $readTimeEn, $img, $summary, $summaryAr, $summaryEn, $content, $contentAr, $contentEn,
            $authorData, $status, $isFeatured, $seoData
        ]);

        $sel = $pdo->prepare("SELECT * FROM blog_articles WHERE store_id = ? AND id = ?");
        $sel->execute([$targetStore, $newId]);
        $row = $sel->fetch();
        echo json_encode(['success' => true, 'data' => formatBlogArticle($row), 'message' => 'Article created successfully']);
        exit;
    }

    // GET articles list
    $q = trim($_GET['q'] ?? '');
    $cat = trim($_GET['category'] ?? '');
    $status = trim($_GET['status'] ?? '');

    $sql = "SELECT * FROM blog_articles WHERE store_id = ?";
    $params = [$targetStore];

    // If zero articles for current store and store is not store-1, fallback clone from store-1
    $cnt = (int)$pdo->query("SELECT COUNT(*) FROM blog_articles WHERE store_id = " . $pdo->quote($targetStore))->fetchColumn();
    if ($cnt === 0) {
        $sql = "SELECT * FROM blog_articles WHERE (store_id = ? OR store_id = 'store-1')";
    }

    if (!empty($q)) {
        $sql .= " AND (title LIKE ? OR title_ar LIKE ? OR title_en LIKE ? OR summary LIKE ? OR summary_en LIKE ?)";
        $params[] = "%$q%"; $params[] = "%$q%"; $params[] = "%$q%"; $params[] = "%$q%"; $params[] = "%$q%";
    }
    if (!empty($cat) && $cat !== 'All Categories' && $cat !== 'All') {
        $sql .= " AND (category = ? OR category_ar = ? OR category_en = ?)";
        $params[] = $cat; $params[] = $cat; $params[] = $cat;
    }
    if (!empty($status) && $status !== 'All Statuses') {
        $sql .= " AND status = ?";
        $params[] = strtolower($status);
    }

    $sql .= " ORDER BY is_featured DESC, updated_at DESC, id ASC";
    $st = $pdo->prepare($sql);
    $st->execute($params);
    $rows = $st->fetchAll();
    $articles = array_map('formatBlogArticle', $rows);

    // Compute Metrics
    $totalArticles = count($articles);
    $published = 0;
    $drafts = 0;
    $totalViews = 0;
    $totalComments = 0;
    $featured = null;
    foreach ($articles as $a) {
        if ($a['status'] === 'published') $published++;
        else $drafts++;
        $totalViews += $a['views'];
        $totalComments += $a['comments'];
        if ($a['featured'] && !$featured) {
            $featured = $a;
        }
    }

    // Load Settings
    $stSettings = $pdo->prepare("SELECT * FROM blog_settings WHERE store_id = ?");
    $stSettings->execute([$targetStore]);
    $settingsRow = $stSettings->fetch() ?: [];

    echo json_encode([
        'success' => true,
        'data' => $articles,
        'metrics' => [
            'total_articles' => $totalArticles,
            'total_views' => $totalViews,
            'total_comments' => $totalComments,
            'published' => $published,
            'drafts' => $drafts,
            'weekly_articles_growth' => '+' . min($totalArticles, 4) . ' this week',
            'weekly_views_growth' => '+14% this week',
            'weekly_comments_growth' => '+5% this week',
        ],
        'featured_article' => $featured ?: ($articles[0] ?? null),
        'post_settings' => json_decode($settingsRow['post_settings'] ?? '{}', true) ?: [
            'layout' => 'Large Image + Excerpt',
            'articles_per_page' => 10,
            'order_by' => 'Latest',
            'sort_order' => 'Descending'
        ],
        'seo_settings' => json_decode($settingsRow['seo_settings'] ?? '{}', true) ?: [
            'enabled' => true,
            'meta_title' => 'Blog | Official Store Articles',
            'meta_description' => 'Discover articles and guides directly from our store.',
            'focus_keyword' => 'store articles'
        ],
        'store_id' => $targetStore,
    ]);
    exit;
}

// ── 7. REVIEWS & CUSTOMER COMMENTS ──
if (preg_match('#^/stores/([^/]+)/reviews#', $uri, $mRev) || $uri === '/reviews') {
    $targetStore = !empty($mRev[1]) ? $mRev[1] : $storeId;

    if ($method === 'POST') {
        $rId = !empty($inputData['id']) ? (string)$inputData['id'] : ('rev-' . time() . '-' . substr(md5(uniqid()), 0, 4));
        $name = $inputData['name'] ?? 'عميل متميز';
        $nameEn = $inputData['name_en'] ?? ($inputData['nameEn'] ?? $name);
        $role = $inputData['role'] ?? 'عميل موثق';
        $roleEn = $inputData['role_en'] ?? ($inputData['roleEn'] ?? 'Verified Buyer');
        $avatar = $inputData['avatar'] ?? '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg';
        $rating = (float)($inputData['rating'] ?? 5);
        $comment = $inputData['comment'] ?? '';
        $commentEn = $inputData['comment_en'] ?? ($inputData['commentEn'] ?? $comment);
        $verified = isset($inputData['verified']) ? (int)(bool)$inputData['verified'] : 1;
        $date = $inputData['date'] ?? 'الآن';

        $ins = $pdo->prepare("
            INSERT OR REPLACE INTO reviews (
                id, store_id, name, name_en, role, role_en, avatar, rating, comment, comment_en, verified, date, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        ");
        $ins->execute([
            $rId, $targetStore, $name, $nameEn, $role, $roleEn, $avatar, $rating, $comment, $commentEn, $verified, $date
        ]);

        $st = $pdo->prepare("SELECT * FROM reviews WHERE store_id = ? AND id = ?");
        $st->execute([$targetStore, $rId]);
        echo json_encode(['success' => true, 'data' => formatReview($st->fetch())]);
        exit;
    }

    $st = $pdo->prepare("SELECT * FROM reviews WHERE store_id = ? OR store_id = 'store-1' ORDER BY id ASC");
    $st->execute([$targetStore]);
    $rows = $st->fetchAll();
    echo json_encode([
        'success' => true,
        'data' => array_map('formatReview', $rows),
        'count' => count($rows),
        'store_id' => $targetStore,
    ]);
    exit;
}

// ── 8. BANNERS (PROMO, COUNTDOWN, VIDEO, CUSTOM) ──
if (preg_match('#^/stores/([^/]+)/banners#', $uri, $mBan) || $uri === '/banners') {
    $targetStore = !empty($mBan[1]) ? $mBan[1] : $storeId;

    if (in_array($method, ['PUT', 'POST'])) {
        $bannersList = is_array($inputData) && isset($inputData['banners']) ? $inputData['banners'] : (is_array($inputData) ? $inputData : []);
        $ins = $pdo->prepare("
            INSERT OR REPLACE INTO banners (
                id, store_id, type, title, title_en, subtitle, subtitle_en, image_url, video_url, link_url, button_text, button_text_en, sort_order, is_active, settings, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ");
        foreach ($bannersList as $b) {
            $bId = $b['id'] ?? ('ban-' . uniqid());
            $ins->execute([
                $bId, $targetStore, $b['type'] ?? 'promo', $b['title'] ?? '', $b['titleEn'] ?? ($b['title_en'] ?? ''),
                $b['subtitle'] ?? '', $b['subtitleEn'] ?? ($b['subtitle_en'] ?? ''),
                $b['imageUrl'] ?? ($b['image_url'] ?? ''), $b['videoUrl'] ?? ($b['video_url'] ?? ''),
                $b['linkUrl'] ?? ($b['link_url'] ?? ''), $b['buttonText'] ?? ($b['button_text'] ?? ''),
                $b['buttonTextEn'] ?? ($b['button_text_en'] ?? ''), (int)($b['sortOrder'] ?? 0),
                isset($b['isActive']) ? (int)(bool)$b['isActive'] : 1,
                json_encode($b['settings'] ?? [], JSON_UNESCAPED_UNICODE)
            ]);
        }
        echo json_encode(['success' => true, 'message' => 'Banners saved successfully']);
        exit;
    }

    $st = $pdo->prepare("SELECT * FROM banners WHERE store_id = ? OR store_id = 'store-1' ORDER BY sort_order ASC");
    $st->execute([$targetStore]);
    $rows = $st->fetchAll();
    echo json_encode(['success' => true, 'data' => array_map('formatBanner', $rows)]);
    exit;
}

// ── 9. THEME SETTINGS & PAGE BUILDER LAYOUTS ──
if (preg_match('#^/stores/([^/]+)/theme-settings#', $uri, $mTS) || $uri === '/theme-settings') {
    $targetStore = !empty($mTS[1]) ? $mTS[1] : $storeId;
    $themeId = $_GET['theme_id'] ?? 'theme-flora-luxe';

    if (in_array($method, ['PUT', 'POST'])) {
        $st = $pdo->prepare("
            INSERT OR REPLACE INTO theme_settings (store_id, theme_id, settings, updated_at)
            VALUES (?, ?, ?, datetime('now'))
        ");
        $st->execute([$targetStore, $themeId, json_encode($inputData, JSON_UNESCAPED_UNICODE)]);
        echo json_encode(['success' => true, 'data' => $inputData]);
        exit;
    }

    $st = $pdo->prepare("SELECT settings FROM theme_settings WHERE store_id = ? AND theme_id = ?");
    $st->execute([$targetStore, $themeId]);
    $raw = $st->fetchColumn();
    $decoded = $raw ? json_decode($raw, true) : null;
    echo json_encode(['success' => true, 'data' => $decoded ?: []]);
    exit;
}

if (preg_match('#^/stores/([^/]+)/builder-layout#', $uri, $mBL)) {
    $targetStore = $mBL[1];
    $themeId = $inputData['theme_id'] ?? ($_GET['theme_id'] ?? 'theme-flora-luxe');

    if (in_array($method, ['PUT', 'POST'])) {
        $st = $pdo->prepare("
            INSERT OR REPLACE INTO builder_layouts (
                store_id, theme_id, blocks, seasonal_theme, typography_settings, header_settings, mobile_menu_icon, is_published, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ");
        $st->execute([
            $targetStore, $themeId,
            json_encode($inputData['blocks'] ?? [], JSON_UNESCAPED_UNICODE),
            json_encode($inputData['seasonal_theme'] ?? [], JSON_UNESCAPED_UNICODE),
            json_encode($inputData['typography_settings'] ?? [], JSON_UNESCAPED_UNICODE),
            json_encode($inputData['header_settings'] ?? [], JSON_UNESCAPED_UNICODE),
            json_encode($inputData['mobile_menu_icon'] ?? [], JSON_UNESCAPED_UNICODE),
            isset($inputData['is_published']) ? (int)(bool)$inputData['is_published'] : 1
        ]);
        echo json_encode(['success' => true, 'data' => $inputData]);
        exit;
    }

    $st = $pdo->prepare("SELECT * FROM builder_layouts WHERE store_id = ? AND theme_id = ?");
    $st->execute([$targetStore, $themeId]);
    $row = $st->fetch();
    if ($row) {
        echo json_encode([
            'success' => true,
            'data' => [
                'theme_id' => $row['theme_id'],
                'blocks' => json_decode($row['blocks'] ?? '[]', true),
                'seasonal_theme' => json_decode($row['seasonal_theme'] ?? '{}', true),
                'typography_settings' => json_decode($row['typography_settings'] ?? '{}', true),
                'header_settings' => json_decode($row['header_settings'] ?? '{}', true),
                'mobile_menu_icon' => json_decode($row['mobile_menu_icon'] ?? '{}', true),
                'is_published' => (bool)$row['is_published']
            ]
        ]);
        exit;
    }
    echo json_encode(['success' => true, 'data' => null]);
    exit;
}

// ── 10. PAGES & POLICIES ──
if (preg_match('#^/stores/([^/]+)/pages#', $uri, $mP) || $uri === '/pages') {
    $targetStore = !empty($mP[1]) ? $mP[1] : $storeId;

    if (in_array($method, ['PUT', 'POST'])) {
        $pId = $inputData['id'] ?? ('page-' . uniqid());
        $ins = $pdo->prepare("
            INSERT OR REPLACE INTO pages (
                id, store_id, slug, title_ar, title_en, content_ar, content_en, category, is_system_default, is_published, meta_description_ar, meta_description_en, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ");
        $ins->execute([
            $pId, $targetStore, $inputData['slug'] ?? '',
            $inputData['titleAr'] ?? ($inputData['title_ar'] ?? ''),
            $inputData['titleEn'] ?? ($inputData['title_en'] ?? ''),
            $inputData['contentAr'] ?? ($inputData['content_ar'] ?? ''),
            $inputData['contentEn'] ?? ($inputData['content_en'] ?? ''),
            $inputData['category'] ?? 'legal',
            isset($inputData['isSystemDefault']) ? (int)(bool)$inputData['isSystemDefault'] : 0,
            isset($inputData['isPublished']) ? (int)(bool)$inputData['isPublished'] : 1,
            $inputData['metaDescriptionAr'] ?? '', $inputData['metaDescriptionEn'] ?? ''
        ]);
        echo json_encode(['success' => true, 'data' => $inputData]);
        exit;
    }

    $st = $pdo->prepare("SELECT * FROM pages WHERE store_id = ? OR store_id = 'store-1'");
    $st->execute([$targetStore]);
    $rows = $st->fetchAll();
    echo json_encode(['success' => true, 'data' => $rows]);
    exit;
}

// ── 11. BRANDS ──
if (preg_match('#^/stores/([^/]+)/brands#', $uri, $mBr) || $uri === '/brands') {
    $targetStore = !empty($mBr[1]) ? $mBr[1] : $storeId;

    if (in_array($method, ['PUT', 'POST'])) {
        $bId = $inputData['id'] ?? ('brand-' . uniqid());
        $ins = $pdo->prepare("
            INSERT OR REPLACE INTO brands (
                id, store_id, name, name_ar, slug, logo_url, description, description_en, website, country, sort_order, is_active, show_in_channels, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ");
        $ins->execute([
            $bId, $targetStore, $inputData['name'] ?? '', $inputData['nameAr'] ?? ($inputData['name_ar'] ?? ''),
            $inputData['slug'] ?? '', $inputData['logo'] ?? ($inputData['logo_url'] ?? ''),
            $inputData['description'] ?? '', $inputData['descriptionEn'] ?? ($inputData['description_en'] ?? ''),
            $inputData['website'] ?? '', $inputData['country'] ?? '',
            (int)($inputData['sortOrder'] ?? 0),
            isset($inputData['isActive']) ? (int)(bool)$inputData['isActive'] : 1,
            isset($inputData['showInChannels']) ? (int)(bool)$inputData['showInChannels'] : 1
        ]);
        echo json_encode(['success' => true, 'data' => $inputData]);
        exit;
    }

    $st = $pdo->prepare("SELECT * FROM brands WHERE store_id = ? OR store_id = 'store-1' ORDER BY sort_order ASC");
    $st->execute([$targetStore]);
    $rows = $st->fetchAll();
    echo json_encode(['success' => true, 'data' => $rows]);
    exit;
}

// ── 12. UPLOAD FILE ENDPOINT ──
if ($uri === '/upload' && $method === 'POST') {
    $uploadDir = __DIR__ . '/../images/uploads';
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }

    if (!empty($_FILES['file']['tmp_name'])) {
        $ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION)) ?: 'webp';
        $filename = 'upload_' . time() . '_' . substr(md5(uniqid()), 0, 8) . '.' . $ext;
        $dest = $uploadDir . '/' . $filename;
        if (move_uploaded_file($_FILES['file']['tmp_name'], $dest)) {
            echo json_encode([
                'url' => '/images/uploads/' . $filename,
                'status' => 'success'
            ]);
            exit;
        }
    }

    if (!empty($inputData['base64'])) {
        $b64 = $inputData['base64'];
        $b64 = preg_replace('/^data:image\\/\\w+;base64,/', '', $b64);
        $data = base64_decode($b64);
        if ($data !== false) {
            $filename = 'upload_' . time() . '_' . substr(md5(uniqid()), 0, 8) . '.webp';
            $dest = $uploadDir . '/' . $filename;
            file_put_contents($dest, $data);
            echo json_encode([
                'url' => '/images/uploads/' . $filename,
                'status' => 'success'
            ]);
            exit;
        }
    }

    http_response_code(400);
    echo json_encode(['error' => 'No file provided or invalid payload']);
    exit;
}

// ── 13. FALLBACK 404 ──
http_response_code(404);
echo json_encode(['message' => 'API Endpoint not found: ' . $uri]);
`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'api', 'index.php'), phpCode.trim(), 'utf8');
console.log('Successfully generated public/api/index.php');
