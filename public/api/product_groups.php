<?php

/**
 * HiBrew coffee-only: parent grouped product → independent child products.
 * Used by Hostinger gateway (public/api), not Laravel.
 */

declare(strict_types=1);

function souq_is_coffee_grouped_store(string $storeId): bool
{
    $id = strtolower(trim($storeId));
    return $id === 'store-coffee'
        || str_contains($id, 'coffee')
        || str_contains($id, 'hibrew');
}

function souq_is_grouped_product_type(?string $productType): bool
{
    return strtolower(trim((string) $productType)) === 'grouped';
}

function souq_ensure_product_group_members_table(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    try {
        if (function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo)) {
            $chk = $pdo->query("SHOW TABLES LIKE 'product_group_members'");
            if ($chk && $chk->fetch()) {
                return;
            }
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS product_group_members (
                    id VARCHAR(64) NOT NULL PRIMARY KEY,
                    store_id VARCHAR(64) NOT NULL,
                    parent_product_id VARCHAR(64) NOT NULL,
                    child_product_id VARCHAR(64) NOT NULL,
                    sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
                    selector_image_url TEXT NULL,
                    created_at TIMESTAMP NULL DEFAULT NULL,
                    updated_at TIMESTAMP NULL DEFAULT NULL,
                    UNIQUE KEY pgm_store_parent_child_uq (store_id, parent_product_id, child_product_id),
                    UNIQUE KEY pgm_store_child_uq (store_id, child_product_id),
                    KEY pgm_store_parent_sort_idx (store_id, parent_product_id, sort_order)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
            return;
        }
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS product_group_members (
                id TEXT PRIMARY KEY,
                store_id TEXT NOT NULL,
                parent_product_id TEXT NOT NULL,
                child_product_id TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                selector_image_url TEXT NULL,
                created_at TEXT NULL,
                updated_at TEXT NULL
            )"
        );
    } catch (Throwable) {
        /* table may already exist or no CREATE privilege */
    }
}

/** @return list<string> */
function souq_group_child_ids_for_store(PDO $pdo, string $storeId): array
{
    souq_ensure_product_group_members_table($pdo);
    try {
        $st = $pdo->prepare('SELECT child_product_id FROM product_group_members WHERE store_id = ?');
        $st->execute([$storeId]);
        $ids = [];
        while ($row = $st->fetch()) {
            $cid = (string) ($row['child_product_id'] ?? '');
            if ($cid !== '') {
                $ids[$cid] = true;
            }
        }

        return array_keys($ids);
    } catch (Throwable) {
        return [];
    }
}

function souq_product_type_from_row(array $row, array $full = []): string
{
    $pt = (string) ($row['product_type'] ?? '');
    if ($pt !== '') {
        return $pt;
    }
    $pt = (string) ($full['product_type'] ?? $full['productType'] ?? '');

    return $pt;
}

/**
 * Attach is_grouped / purchasable / group_children onto a formatted product payload.
 *
 * @param  array<string, mixed>  $formatted
 * @return array<string, mixed>
 */
function souq_attach_group_meta(PDO $pdo, array $formatted, array $row, bool $withChildren): array
{
    $full = [];
    if (! empty($row['data'])) {
        $decoded = json_decode((string) $row['data'], true);
        if (is_array($decoded)) {
            $full = $decoded;
        }
    }
    $productType = souq_product_type_from_row($row, array_merge($full, $formatted));
    $isGrouped = souq_is_grouped_product_type($productType);
    $formatted['product_type'] = $productType !== '' ? $productType : ($formatted['product_type'] ?? $formatted['productType'] ?? null);
    $formatted['productType'] = $formatted['product_type'];
    $formatted['is_grouped'] = $isGrouped;
    $formatted['isGrouped'] = $isGrouped;
    $formatted['purchasable'] = ! $isGrouped;

    if (! $isGrouped || ! $withChildren) {
        if (! isset($formatted['group_children'])) {
            $formatted['group_children'] = [];
            $formatted['groupChildren'] = [];
        }

        return $formatted;
    }

    souq_ensure_product_group_members_table($pdo);
    $storeId = (string) ($row['store_id'] ?? $formatted['store_id'] ?? '');
    $parentId = (string) ($row['id'] ?? $formatted['id'] ?? '');
    if ($storeId === '' || $parentId === '') {
        $formatted['group_children'] = [];
        $formatted['groupChildren'] = [];

        return $formatted;
    }

    try {
        $st = $pdo->prepare(
            'SELECT child_product_id, sort_order, selector_image_url
             FROM product_group_members
             WHERE store_id = ? AND parent_product_id = ?
             ORDER BY sort_order ASC'
        );
        $st->execute([$storeId, $parentId]);
        $members = $st->fetchAll() ?: [];
    } catch (Throwable) {
        $formatted['group_children'] = [];
        $formatted['groupChildren'] = [];

        return $formatted;
    }

    $children = [];
    foreach ($members as $m) {
        $cid = (string) ($m['child_product_id'] ?? '');
        if ($cid === '') {
            continue;
        }
        $cst = $pdo->prepare('SELECT * FROM products WHERE id = ? AND store_id = ? LIMIT 1');
        $cst->execute([$cid, $storeId]);
        $crow = $cst->fetch();
        if (! $crow) {
            continue;
        }
        // Avoid recursive group attach on children (3rd arg false).
        $childFmt = formatProduct($crow, false, false);
        $childFmt['is_grouped'] = false;
        $childFmt['isGrouped'] = false;
        $childFmt['purchasable'] = true;
        $childFmt['group_children'] = [];
        $childFmt['groupChildren'] = [];
        $sel = trim((string) ($m['selector_image_url'] ?? ''));
        $childFmt['selector_image_url'] = $sel !== '' ? $sel : null;
        $childFmt['selectorImageUrl'] = $childFmt['selector_image_url'];
        $childFmt['group_sort_order'] = (int) ($m['sort_order'] ?? 0);
        $children[] = $childFmt;
    }

    $formatted['group_children'] = $children;
    $formatted['groupChildren'] = $children;

    return $formatted;
}

/**
 * Replace old HiBrew group demo with parent + 3 children + full custom-field suite.
 * POST /products/seed-hibrew-cf-group?store_id=store-coffee&confirm=REPLACE_CF_DEMO_2026
 *
 * @return array{ok:bool,parent_id?:string,child_ids?:list<string>,removed?:list<string>,message?:string}
 */
function souq_seed_hibrew_cf_group(PDO $pdo, string $storeId): array
{
    if (! souq_is_coffee_grouped_store($storeId)) {
        return ['ok' => false, 'message' => 'Coffee store only.'];
    }
    souq_ensure_product_group_members_table($pdo);

    $stamp = 'cfdemo';
    $parentId = 'prod-grp-'.$stamp;
    $childIds = ['prod-grp-c1-'.$stamp, 'prod-grp-c2-'.$stamp, 'prod-grp-c3-'.$stamp];

    $buildFields = static function (string $childKey) use ($stamp): array {
        $p = "cf-{$stamp}-{$childKey}";

        return [
            ['id' => "{$p}-short", 'name' => 'Gift note', 'nameAr' => 'ملاحظة الهدية', 'description' => 'Short text', 'type' => 'Short Text', 'required' => false, 'hidden' => false, 'extraPrice' => 0, 'options' => []],
            ['id' => "{$p}-long", 'name' => 'Special instructions', 'nameAr' => 'تعليمات خاصة', 'type' => 'Long Text', 'required' => false, 'hidden' => false, 'extraPrice' => 0, 'options' => []],
            ['id' => "{$p}-number", 'name' => 'Quantity of cups', 'nameAr' => 'عدد الأكواب', 'type' => 'Number', 'required' => false, 'hidden' => false, 'extraPrice' => 0, 'options' => []],
            [
                'id' => "{$p}-single-text", 'name' => 'Extraction Profile', 'nameAr' => 'ملف الاستخلاص', 'type' => 'Single Choice', 'required' => false, 'hidden' => false, 'extraPrice' => 0,
                'options' => [
                    ['label' => 'Standard 15 Bar', 'labelAr' => 'قياسي 15 بار', 'price' => 0],
                    ['label' => 'Commercial 20 Bar', 'labelAr' => 'تجاري 20 بار', 'price' => 49],
                    ['label' => 'Turbo Bloom', 'labelAr' => 'تيربو بلوم', 'price' => 99, 'compareAtPrice' => 149],
                ],
            ],
            [
                'id' => "{$p}-single-img", 'name' => 'Care Package', 'nameAr' => 'باقة العناية', 'type' => 'Single Choice Image', 'required' => false, 'hidden' => false, 'extraPrice' => 0,
                'options' => [
                    ['label' => 'Care Pro 1 Year', 'labelAr' => 'عناية برو لسنة', 'imageUrl' => '/images/hibrew_scale_isolated.jpg', 'price' => 99, 'compareAtPrice' => 199],
                    ['label' => 'Care Pro 2 Years', 'labelAr' => 'عناية برو لسنتين', 'imageUrl' => '/images/hibrew_barista_kit_isolated.jpg', 'price' => 179, 'compareAtPrice' => 299],
                ],
            ],
            [
                'id' => "{$p}-single-color", 'name' => 'Machine color', 'nameAr' => 'لون الماكينة', 'type' => 'Single Choice Color', 'required' => false, 'hidden' => false, 'extraPrice' => 0,
                'options' => [
                    ['label' => 'Silver', 'labelAr' => 'فضي', 'color' => '#C0C0C0', 'price' => 0],
                    ['label' => 'Black', 'labelAr' => 'أسود', 'color' => '#111111', 'price' => 49],
                    ['label' => 'Copper', 'labelAr' => 'نحاسي', 'color' => '#B87333', 'price' => 79],
                ],
            ],
            [
                'id' => "{$p}-multi-text", 'name' => 'Extra services', 'nameAr' => 'خدمات إضافية', 'type' => 'Multiple Choice', 'required' => false, 'hidden' => false, 'extraPrice' => 0,
                'options' => [
                    ['label' => 'Express setup', 'labelAr' => 'تركيب سريع', 'price' => 49],
                    ['label' => 'Training session', 'labelAr' => 'جلسة تدريب', 'price' => 99],
                ],
            ],
            [
                'id' => "{$p}-multi-img", 'name' => 'Barista Add-on Offers', 'nameAr' => 'عروض إضافات الباريستا', 'type' => 'Multiple Choice Image', 'required' => false, 'hidden' => false, 'extraPrice' => 0,
                'options' => [
                    ['label' => 'Precision Tamper', 'labelAr' => 'تامبر دقيق', 'imageUrl' => '/images/hibrew_barista_kit_isolated.jpg', 'price' => 99, 'compareAtPrice' => 199],
                    ['label' => 'Digital Scale', 'labelAr' => 'ميزان رقمي', 'imageUrl' => '/images/hibrew_scale_isolated.jpg', 'price' => 79, 'compareAtPrice' => 149],
                    ['label' => 'Milk Pitcher', 'labelAr' => 'إبريق الحليب', 'imageUrl' => '/images/espresso_wood_pitcher_1791363392554.jpg', 'price' => 49, 'compareAtPrice' => 99],
                ],
            ],
            [
                'id' => "{$p}-multi-color", 'name' => 'Accent colors', 'nameAr' => 'ألوان إضافية', 'type' => 'Multiple Choice Color', 'required' => false, 'hidden' => false, 'extraPrice' => 0,
                'options' => [
                    ['label' => 'Teal', 'labelAr' => 'تيل', 'color' => '#1d8b94', 'price' => 19],
                    ['label' => 'Gold', 'labelAr' => 'ذهبي', 'color' => '#D4AF37', 'price' => 29],
                    ['label' => 'Rose', 'labelAr' => 'وردي', 'color' => '#e11d48', 'price' => 29],
                ],
            ],
            ['id' => "{$p}-img-upload", 'name' => 'Upload logo', 'nameAr' => 'رفع الشعار', 'type' => 'Image Upload', 'required' => false, 'hidden' => false, 'extraPrice' => 25, 'options' => []],
            ['id' => "{$p}-file-upload", 'name' => 'Upload PDF brief', 'nameAr' => 'رفع ملف PDF', 'type' => 'File Upload', 'required' => false, 'hidden' => false, 'extraPrice' => 0, 'options' => []],
            ['id' => "{$p}-date", 'name' => 'Delivery date', 'nameAr' => 'تاريخ التوصيل', 'type' => 'Date', 'required' => false, 'hidden' => false, 'extraPrice' => 0, 'options' => []],
            ['id' => "{$p}-time", 'name' => 'Preferred time', 'nameAr' => 'الوقت المفضل', 'type' => 'Time', 'required' => false, 'hidden' => false, 'extraPrice' => 0, 'options' => []],
            ['id' => "{$p}-datetime", 'name' => 'Install slot', 'nameAr' => 'موعد التركيب', 'type' => 'Date and Time', 'required' => false, 'hidden' => false, 'extraPrice' => 0, 'options' => []],
            ['id' => "{$p}-location", 'name' => 'Install city', 'nameAr' => 'مدينة التركيب', 'type' => 'Location', 'required' => false, 'hidden' => false, 'extraPrice' => 0, 'options' => []],
            ['id' => "{$p}-color-picker", 'name' => 'Custom paint', 'nameAr' => 'طلاء مخصص', 'type' => 'Color Selector', 'required' => false, 'hidden' => false, 'extraPrice' => 120, 'options' => []],
            [
                'id' => "{$p}-size", 'name' => 'Counter size', 'nameAr' => 'مقاس الركن', 'type' => 'Size Selector', 'required' => false, 'hidden' => false, 'extraPrice' => 0,
                'options' => [
                    ['label' => 'S', 'labelAr' => 'صغير', 'price' => 0],
                    ['label' => 'M', 'labelAr' => 'وسط', 'price' => 49],
                    ['label' => 'L', 'labelAr' => 'كبير', 'price' => 99],
                ],
            ],
            ['id' => "{$p}-divider", 'name' => 'Divider', 'nameAr' => 'فاصل', 'type' => 'Divider', 'required' => false, 'hidden' => false, 'extraPrice' => 0, 'options' => []],
            [
                'id' => "{$p}-content", 'name' => 'Why this model', 'nameAr' => 'لماذا هذا الموديل', 'type' => 'Content', 'required' => false, 'hidden' => false, 'extraPrice' => 0, 'options' => [],
                'contentEn' => "This {$childKey} edition includes full custom fields demo for HiBrew KSA.",
                'contentAr' => "هذا الموديل ({$childKey}) يعرض كل أنواع الحقول المخصصة في هايبرو السعودية.",
                'imageUrl' => '/images/hibrew_h7a_flagship_machine.png',
            ],
        ];
    };

    $childrenMeta = [
        ['id' => $childIds[0], 'key' => 'silver', 'name' => 'HiBrew Silver Pro (Group Child)', 'nameAr' => 'هايبرو سيلفر برو', 'sku' => 'GRP-CF-SILVER', 'price' => 1999, 'original' => 2299, 'stock' => 12, 'image' => '/images/group_demo_child_silver.jpg'],
        ['id' => $childIds[1], 'key' => 'grinder', 'name' => 'HiBrew Precision Grinder (Group Child)', 'nameAr' => 'طاحونة هايبرو الدقيقة', 'sku' => 'GRP-CF-GRINDER', 'price' => 749, 'original' => 899, 'stock' => 18, 'image' => '/images/hibrew_scale_isolated.jpg'],
        ['id' => $childIds[2], 'key' => 'black', 'name' => 'HiBrew Compact Black (Group Child)', 'nameAr' => 'هايبرو كومباكت أسود', 'sku' => 'GRP-CF-BLACK', 'price' => 399, 'original' => 549, 'stock' => 20, 'image' => '/images/hibrew_h7a_flagship_machine.png'],
    ];

    $removed = [];
    try {
        $st = $pdo->prepare(
            "SELECT id FROM products WHERE store_id = ?
             AND (
               id IN ('prod-grp-live-yvdusf','prod-c1-yvdusf','prod-c2-yvdusf','prod-c3-yvdusf',?,?,?,?)
               OR id LIKE 'prod-c1-yvdusf%' OR id LIKE 'prod-c2-yvdusf%' OR id LIKE 'prod-c3-yvdusf%'
               OR id LIKE 'prod-grp-demo%' OR sku LIKE 'GRP-CHILD-%' OR sku LIKE 'GRP-DEMO%'
               OR sku IN ('GRP-CF-PARENT','GRP-CF-SILVER','GRP-CF-GRINDER','GRP-CF-BLACK','GRP-DEMO-01','GRP-DEMO')
             )"
        );
        $st->execute([$storeId, $parentId, $childIds[0], $childIds[1], $childIds[2]]);
        while ($row = $st->fetch()) {
            $removed[] = (string) $row['id'];
        }
    } catch (Throwable $e) {
        return ['ok' => false, 'message' => 'Scan failed: '.$e->getMessage()];
    }

    $hasCustom = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'custom_fields');
    $hasData = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'data');
    $hasOrig = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'original_price');
    $hasType = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'product_type');
    $hasGallery = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'gallery_urls');
    $hasNameAr = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'name_ar');
    $hasSlug = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'slug');
    $hasStatus = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'status');
    $hasActive = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'is_active');
    $hasCat = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'category');
    $hasDesc = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'description');

    try {
        $pdo->beginTransaction();

        if ($removed) {
            $in = implode(',', array_fill(0, count($removed), '?'));
            $pdo->prepare("DELETE FROM product_group_members WHERE store_id = ? AND (parent_product_id IN ($in) OR child_product_id IN ($in))")
                ->execute(array_merge([$storeId], $removed, $removed));
            $pdo->prepare("DELETE FROM products WHERE store_id = ? AND id IN ($in)")
                ->execute(array_merge([$storeId], $removed));
        }

        $now = date('Y-m-d H:i:s');
        $upsert = static function (array $row) use ($pdo, $hasCustom, $hasData, $hasOrig, $hasType, $hasGallery, $hasNameAr, $hasSlug, $hasStatus, $hasActive, $hasCat, $hasDesc, $now): void {
            $cols = ['id', 'store_id', 'name', 'price', 'sku', 'stock', 'image_url'];
            $vals = [$row['id'], $row['store_id'], $row['name'], $row['price'], $row['sku'], $row['stock'], $row['image_url']];
            if ($hasNameAr) {
                $cols[] = 'name_ar';
                $vals[] = $row['name_ar'];
            }
            if ($hasSlug) {
                $cols[] = 'slug';
                $vals[] = $row['slug'];
            }
            if ($hasDesc) {
                $cols[] = 'description';
                $vals[] = $row['description'];
            }
            if ($hasOrig) {
                $cols[] = 'original_price';
                $vals[] = $row['original_price'];
            }
            if ($hasType) {
                $cols[] = 'product_type';
                $vals[] = $row['product_type'];
            }
            if ($hasStatus) {
                $cols[] = 'status';
                $vals[] = $row['status'];
            }
            if ($hasActive) {
                $cols[] = 'is_active';
                $vals[] = $row['is_active'];
            }
            if ($hasCat) {
                $cols[] = 'category';
                $vals[] = $row['category'];
            }
            if ($hasGallery) {
                $cols[] = 'gallery_urls';
                $vals[] = json_encode($row['gallery_urls'], JSON_UNESCAPED_UNICODE);
            }
            if ($hasCustom) {
                $cols[] = 'custom_fields';
                $vals[] = json_encode($row['custom_fields'], JSON_UNESCAPED_UNICODE);
            }
            if ($hasData) {
                $cols[] = 'data';
                $vals[] = json_encode($row['data'], JSON_UNESCAPED_UNICODE);
            }
            $cols[] = 'created_at';
            $cols[] = 'updated_at';
            $vals[] = $now;
            $vals[] = $now;
            $ph = implode(',', array_fill(0, count($cols), '?'));
            $updates = [];
            foreach ($cols as $c) {
                if (in_array($c, ['id', 'store_id', 'created_at'], true)) {
                    continue;
                }
                $updates[] = "`{$c}` = VALUES(`{$c}`)";
            }
            $sql = 'INSERT INTO products (`'.implode('`,`', $cols)."`) VALUES ($ph) ON DUPLICATE KEY UPDATE ".implode(',', $updates);
            $pdo->prepare($sql)->execute($vals);
        };

        $parentPayload = [
            'id' => $parentId,
            'store_id' => $storeId,
            'name' => 'HiBrew Custom Fields Group',
            'name_ar' => 'مجموعة حقول هايبرو المخصصة',
            'slug' => 'hibrew-custom-fields-group-'.$stamp,
            'description' => 'Grouped parent — switch children; all custom field types show on buy.',
            'price' => 0,
            'original_price' => 0,
            'sku' => 'GRP-CF-PARENT',
            'stock' => 0,
            'product_type' => 'grouped',
            'status' => 'published',
            'is_active' => 1,
            'image_url' => '/images/hibrew_h7a_flagship_machine.png',
            'gallery_urls' => ['/images/hibrew_h7a_flagship_machine.png'],
            'category' => 'machines',
            'custom_fields' => [],
            'data' => [
                'product_type' => 'grouped',
                'productType' => 'grouped',
                'isGrouped' => true,
                'purchasable' => false,
                'customFields' => [],
            ],
        ];
        $upsert($parentPayload);

        foreach ($childrenMeta as $i => $c) {
            $fields = $buildFields($c['key']);
            $upsert([
                'id' => $c['id'],
                'store_id' => $storeId,
                'name' => $c['name'],
                'name_ar' => $c['nameAr'],
                'slug' => 'hibrew-'.$c['key'].'-'.$stamp,
                'description' => 'Independent child '.$c['key'].' with full custom fields suite.',
                'price' => $c['price'],
                'original_price' => $c['original'],
                'sku' => $c['sku'],
                'stock' => $c['stock'],
                'product_type' => 'Physical Product',
                'status' => 'published',
                'is_active' => 1,
                'image_url' => $c['image'],
                'gallery_urls' => [$c['image']],
                'category' => 'machines',
                'custom_fields' => $fields,
                'data' => [
                    'product_type' => 'Physical Product',
                    'customFields' => $fields,
                    'custom_fields' => $fields,
                ],
            ]);
            $pdo->prepare(
                'INSERT INTO product_group_members
                 (id, store_id, parent_product_id, child_product_id, sort_order, selector_image_url, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order), selector_image_url = VALUES(selector_image_url), updated_at = VALUES(updated_at)'
            )->execute([
                'pgm-'.$stamp.'-'.$i,
                $storeId,
                $parentId,
                $c['id'],
                $i,
                $c['image'],
                $now,
                $now,
            ]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        return ['ok' => false, 'message' => 'Seed failed: '.$e->getMessage()];
    }

    return [
        'ok' => true,
        'parent_id' => $parentId,
        'child_ids' => $childIds,
        'removed' => $removed,
        'field_count' => count($buildFields('silver')),
        'slug' => 'hibrew-custom-fields-group-'.$stamp,
    ];
}

/**
 * @return bool true if request handled
 */
function souq_product_groups_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    // One-shot: replace old group demo + seed full custom fields on 3 children.
    if ($uri === '/products/seed-hibrew-cf-group') {
        if (! in_array($method, ['POST', 'PUT'], true)) {
            http_response_code(405);
            echo json_encode(['message' => 'POST required.']);

            return true;
        }
        $confirm = (string) ($input['confirm'] ?? ($_GET['confirm'] ?? ''));
        if ($confirm !== 'REPLACE_CF_DEMO_2026') {
            http_response_code(403);
            echo json_encode(['message' => 'confirm=REPLACE_CF_DEMO_2026 required.']);

            return true;
        }
        if ($storeId === '') {
            $storeId = 'store-coffee';
        }
        $result = souq_seed_hibrew_cf_group($pdo, $storeId);
        http_response_code(($result['ok'] ?? false) ? 200 : 500);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);

        return true;
    }

    if (! preg_match('#^/products/([^/]+)/group-members$#', $uri, $m)) {
        return false;
    }

    $parentId = (string) $m[1];
    if ($storeId === '') {
        http_response_code(422);
        echo json_encode(['message' => 'store_id is required.']);

        return true;
    }

    if (! souq_is_coffee_grouped_store($storeId)) {
        http_response_code(403);
        echo json_encode([
            'message' => 'Grouped products are only available for the HiBrew coffee store.',
            'message_ar' => 'المنتجات المجمعة متاحة فقط لمتجر هايبرو للقهوة.',
        ]);

        return true;
    }

    souq_ensure_product_group_members_table($pdo);

    $pst = $pdo->prepare('SELECT * FROM products WHERE id = ? AND store_id = ? LIMIT 1');
    $pst->execute([$parentId, $storeId]);
    $parent = $pst->fetch();
    if (! $parent) {
        http_response_code(404);
        echo json_encode(['message' => 'Product not found.']);

        return true;
    }

    $parentType = souq_product_type_from_row($parent, []);
    if ($method === 'GET') {
        if (! souq_is_grouped_product_type($parentType)) {
            http_response_code(422);
            echo json_encode(['message' => 'Product is not a grouped parent.']);

            return true;
        }
        $enriched = souq_attach_group_meta($pdo, formatProduct($parent, false), $parent, true);
        $data = [];
        foreach ($enriched['group_children'] ?? [] as $i => $child) {
            $data[] = [
                'id' => 'pgm-'.$parentId.'-'.$i,
                'store_id' => $storeId,
                'parent_product_id' => $parentId,
                'child_product_id' => (string) ($child['id'] ?? ''),
                'sort_order' => (int) ($child['group_sort_order'] ?? $i),
                'selector_image_url' => $child['selector_image_url'] ?? null,
                'child' => $child,
            ];
        }
        echo json_encode([
            'data' => $data,
            'meta' => [
                'parent_product_id' => $parentId,
                'count' => count($data),
                'min' => 3,
                'max' => 4,
            ],
        ]);

        return true;
    }

    if (! in_array($method, ['PUT', 'POST', 'PATCH'], true)) {
        return false;
    }

    $members = $input['members'] ?? null;
    if (! is_array($members)) {
        http_response_code(422);
        echo json_encode(['message' => 'members array is required.']);

        return true;
    }
    $count = count($members);
    if ($count < 3 || $count > 4) {
        http_response_code(422);
        echo json_encode([
            'message' => 'Group must contain 3–4 child products.',
            'message_ar' => 'يجب أن تحتوي المجموعة على 3 إلى 4 منتجات فرعية.',
        ]);

        return true;
    }

    // Promote parent type if needed.
    if (! souq_is_grouped_product_type($parentType)) {
        try {
            if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'product_type')) {
                $pdo->prepare('UPDATE products SET product_type = ? WHERE id = ? AND store_id = ?')
                    ->execute(['grouped', $parentId, $storeId]);
            }
        } catch (Throwable) {
            /* optional column */
        }
        try {
            $data = [];
            if (! empty($parent['data'])) {
                $decoded = json_decode((string) $parent['data'], true);
                if (is_array($decoded)) {
                    $data = $decoded;
                }
            }
            $data['product_type'] = 'grouped';
            $data['productType'] = 'grouped';
            $data['isGrouped'] = true;
            $data['purchasable'] = false;
            if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'data')) {
                $pdo->prepare('UPDATE products SET data = ? WHERE id = ? AND store_id = ?')
                    ->execute([json_encode($data, JSON_UNESCAPED_UNICODE), $parentId, $storeId]);
            }
        } catch (Throwable) {
            /* optional */
        }
    }

    $childIds = [];
    foreach ($members as $i => $row) {
        $cid = trim((string) ($row['child_product_id'] ?? $row['childProductId'] ?? ''));
        if ($cid === '' || $cid === $parentId) {
            http_response_code(422);
            echo json_encode(['message' => 'Invalid child product id.', 'index' => $i]);

            return true;
        }
        if (isset($childIds[$cid])) {
            http_response_code(422);
            echo json_encode(['message' => 'Duplicate child product in the group.']);

            return true;
        }
        $childIds[$cid] = $row;
    }

    foreach (array_keys($childIds) as $cid) {
        $cst = $pdo->prepare('SELECT id, product_type, data FROM products WHERE id = ? AND store_id = ? LIMIT 1');
        $cst->execute([$cid, $storeId]);
        $crow = $cst->fetch();
        if (! $crow) {
            http_response_code(422);
            echo json_encode([
                'message' => 'One or more child products were not found in this store.',
                'child_product_id' => $cid,
            ]);

            return true;
        }
        $cdata = [];
        if (! empty($crow['data'])) {
            $decoded = json_decode((string) $crow['data'], true);
            if (is_array($decoded)) {
                $cdata = $decoded;
            }
        }
        if (souq_is_grouped_product_type(souq_product_type_from_row($crow, $cdata))) {
            http_response_code(422);
            echo json_encode([
                'message' => 'A grouped parent cannot be added as a child product.',
                'child_product_id' => $cid,
            ]);

            return true;
        }
        $conf = $pdo->prepare(
            'SELECT parent_product_id FROM product_group_members
             WHERE store_id = ? AND child_product_id = ? AND parent_product_id != ? LIMIT 1'
        );
        $conf->execute([$storeId, $cid, $parentId]);
        if ($conf->fetch()) {
            http_response_code(422);
            echo json_encode([
                'message' => 'A child product already belongs to another group.',
                'child_product_id' => $cid,
            ]);

            return true;
        }
    }

    $pdo->beginTransaction();
    try {
        $pdo->prepare('DELETE FROM product_group_members WHERE store_id = ? AND parent_product_id = ?')
            ->execute([$storeId, $parentId]);
        $i = 0;
        foreach ($childIds as $cid => $row) {
            $mid = 'pgm-'.bin2hex(random_bytes(6));
            $sel = trim((string) ($row['selector_image_url'] ?? $row['selectorImageUrl'] ?? ''));
            $sort = isset($row['sort_order']) ? (int) $row['sort_order'] : $i;
            $now = date('Y-m-d H:i:s');
            $pdo->prepare(
                'INSERT INTO product_group_members
                 (id, store_id, parent_product_id, child_product_id, sort_order, selector_image_url, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            )->execute([
                $mid,
                $storeId,
                $parentId,
                $cid,
                $sort,
                $sel !== '' ? $sel : null,
                $now,
                $now,
            ]);
            $i++;
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['message' => 'Failed to save group members.', 'error' => $e->getMessage()]);

        return true;
    }

    // Re-run GET response
    return souq_product_groups_dispatch($pdo, $uri, 'GET', $storeId, []);
}
