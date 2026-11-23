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
 * @return bool true if request handled
 */
function souq_product_groups_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
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
