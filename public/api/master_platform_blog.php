<?php

/**
 * Master Admin — Platform Blog (Google Blogger-style).
 * Visibility: live | unlisted | private. Bilingual EN/AR. Real MySQL only.
 */

declare(strict_types=1);

function souq_ensure_platform_blog_table(PDO $pdo): void
{
    try {
        if (!function_exists('souq_table_exists') || !souq_table_exists($pdo, 'platform_blog_posts')) {
            $isMysql = function_exists('souq_driver_is_mysql')
                ? souq_driver_is_mysql($pdo)
                : ((string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql');

            if ($isMysql) {
                $pdo->exec(
                    "CREATE TABLE IF NOT EXISTS `platform_blog_posts` (
                        `id` VARCHAR(64) NOT NULL,
                        `slug` VARCHAR(191) NOT NULL,
                        `title_en` VARCHAR(255) NOT NULL DEFAULT '',
                        `title_ar` VARCHAR(255) NOT NULL DEFAULT '',
                        `excerpt_en` TEXT NULL,
                        `excerpt_ar` TEXT NULL,
                        `content_en` LONGTEXT NULL,
                        `content_ar` LONGTEXT NULL,
                        `labels` JSON NULL,
                        `category` VARCHAR(128) NOT NULL DEFAULT '',
                        `cover_image` VARCHAR(500) NULL,
                        `author_name` VARCHAR(191) NOT NULL DEFAULT 'Unityteck',
                        `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
                        `visibility` VARCHAR(32) NOT NULL DEFAULT 'private',
                        `access_token` VARCHAR(64) NULL,
                        `seo_title_en` VARCHAR(255) NULL,
                        `seo_title_ar` VARCHAR(255) NULL,
                        `seo_description_en` TEXT NULL,
                        `seo_description_ar` TEXT NULL,
                        `seo_focus_keyword` VARCHAR(191) NULL,
                        `views` INT NOT NULL DEFAULT 0,
                        `published_at` TIMESTAMP NULL DEFAULT NULL,
                        `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `updated_at` TIMESTAMP NULL DEFAULT NULL,
                        `created_by` VARCHAR(64) NULL,
                        PRIMARY KEY (`id`),
                        UNIQUE KEY `platform_blog_slug_unique` (`slug`),
                        KEY `platform_blog_status_vis_idx` (`status`, `visibility`, `published_at`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
                );
            } else {
                $pdo->exec(
                    "CREATE TABLE IF NOT EXISTS platform_blog_posts (
                        id TEXT PRIMARY KEY,
                        slug TEXT NOT NULL UNIQUE,
                        title_en TEXT NOT NULL DEFAULT '',
                        title_ar TEXT NOT NULL DEFAULT '',
                        excerpt_en TEXT,
                        excerpt_ar TEXT,
                        content_en TEXT,
                        content_ar TEXT,
                        labels TEXT,
                        category TEXT NOT NULL DEFAULT '',
                        cover_image TEXT,
                        author_name TEXT NOT NULL DEFAULT 'Unityteck',
                        status TEXT NOT NULL DEFAULT 'draft',
                        visibility TEXT NOT NULL DEFAULT 'private',
                        access_token TEXT,
                        seo_title_en TEXT,
                        seo_title_ar TEXT,
                        seo_description_en TEXT,
                        seo_description_ar TEXT,
                        seo_focus_keyword TEXT,
                        views INTEGER NOT NULL DEFAULT 0,
                        published_at TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT,
                        created_by TEXT
                    )"
                );
            }
        }
    } catch (Throwable) {
        /* degrade safely */
    }
}

function souq_platform_blog_slugify(string $raw): string
{
    $s = strtolower(trim($raw));
    $s = preg_replace('/[^a-z0-9\x{0600}-\x{06FF}\s_-]/u', '', $s) ?: '';
    $s = preg_replace('/[\s_]+/u', '-', $s) ?: '';
    $s = trim($s, '-');
    if ($s === '') {
        $s = 'post-' . substr(bin2hex(random_bytes(4)), 0, 8);
    }
    return substr($s, 0, 180);
}

/**
 * @param array<string, mixed> $row
 * @return array<string, mixed>
 */
function souq_platform_blog_format_row(array $row): array
{
    $labels = $row['labels'] ?? [];
    if (is_string($labels)) {
        $decoded = json_decode($labels, true);
        $labels = is_array($decoded) ? $decoded : [];
    }
    if (!is_array($labels)) {
        $labels = [];
    }

    return [
        'id' => (string) ($row['id'] ?? ''),
        'slug' => (string) ($row['slug'] ?? ''),
        'title_en' => (string) ($row['title_en'] ?? ''),
        'title_ar' => (string) ($row['title_ar'] ?? ''),
        'excerpt_en' => (string) ($row['excerpt_en'] ?? ''),
        'excerpt_ar' => (string) ($row['excerpt_ar'] ?? ''),
        'content_en' => (string) ($row['content_en'] ?? ''),
        'content_ar' => (string) ($row['content_ar'] ?? ''),
        'labels' => array_values(array_filter(array_map('strval', $labels))),
        'category' => (string) ($row['category'] ?? ''),
        'cover_image' => (string) ($row['cover_image'] ?? ''),
        'author_name' => (string) ($row['author_name'] ?? 'Unityteck'),
        'status' => (string) ($row['status'] ?? 'draft'),
        'visibility' => (string) ($row['visibility'] ?? 'private'),
        'access_token' => (string) ($row['access_token'] ?? ''),
        'seo' => [
            'title_en' => (string) ($row['seo_title_en'] ?? ''),
            'title_ar' => (string) ($row['seo_title_ar'] ?? ''),
            'description_en' => (string) ($row['seo_description_en'] ?? ''),
            'description_ar' => (string) ($row['seo_description_ar'] ?? ''),
            'focus_keyword' => (string) ($row['seo_focus_keyword'] ?? ''),
        ],
        'views' => (int) ($row['views'] ?? 0),
        'published_at' => $row['published_at'] ?? null,
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
        'created_by' => $row['created_by'] ?? null,
    ];
}

/**
 * @return bool true if request handled
 */
function souq_platform_blog_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    $isBlogRoute =
        str_starts_with($uri, '/master/blog') ||
        str_starts_with($uri, '/platform/blog');

    if (!$isBlogRoute) {
        return false;
    }

    souq_ensure_platform_blog_table($pdo);

    $portal = strtolower(trim((string) ($_SERVER['HTTP_X_PORTAL'] ?? '')));
    $needMaster = static function () use ($portal, $pdo): bool {
        if ($portal !== 'master') {
            http_response_code(403);
            echo json_encode(['message' => 'Master portal required.']);
            return false;
        }
        if (!function_exists('souq_require_master_bearer_ops')) {
            require_once __DIR__ . '/master_phase1_ops.php';
        }
        if (!souq_require_master_bearer_ops($pdo)) {
            return false;
        }
        return true;
    };

    $now = date('Y-m-d H:i:s');

    // ── Public: list live published posts ──
    if ($uri === '/platform/blog/posts' && $method === 'GET') {
        try {
            $st = $pdo->prepare(
                "SELECT * FROM platform_blog_posts
                 WHERE status = 'published' AND visibility = 'live'
                 ORDER BY COALESCE(published_at, created_at) DESC"
            );
            $st->execute();
            $rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
            $data = array_map('souq_platform_blog_format_row', $rows);
            // Hide access tokens on public list
            $data = array_map(static function (array $p): array {
                unset($p['access_token']);
                return $p;
            }, $data);
            echo json_encode(['success' => true, 'data' => $data, 'meta' => ['source' => 'platform_blog_posts']]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to load posts.']);
        }
        return true;
    }

    // ── Public: single post by slug (live, or unlisted+token) ──
    if (preg_match('#^/platform/blog/posts/([^/]+)$#', $uri, $m) && $method === 'GET') {
        $slug = rawurldecode($m[1]);
        $token = trim((string) ($_GET['token'] ?? ''));
        try {
            $st = $pdo->prepare('SELECT * FROM platform_blog_posts WHERE slug = ? LIMIT 1');
            $st->execute([$slug]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                http_response_code(404);
                echo json_encode(['message' => 'Post not found.']);
                return true;
            }
            $status = (string) ($row['status'] ?? '');
            $vis = (string) ($row['visibility'] ?? '');
            if ($status !== 'published') {
                http_response_code(404);
                echo json_encode(['message' => 'Post not found.']);
                return true;
            }
            if ($vis === 'private') {
                http_response_code(404);
                echo json_encode(['message' => 'Post not found.']);
                return true;
            }
            if ($vis === 'unlisted') {
                $need = (string) ($row['access_token'] ?? '');
                if ($need === '' || !hash_equals($need, $token)) {
                    http_response_code(403);
                    echo json_encode(['message' => 'Unlisted post requires a valid token.']);
                    return true;
                }
            }
            // Increment views (best-effort)
            try {
                $pdo->prepare('UPDATE platform_blog_posts SET views = views + 1 WHERE id = ?')
                    ->execute([(string) $row['id']]);
                $row['views'] = (int) ($row['views'] ?? 0) + 1;
            } catch (Throwable) {
            }
            $out = souq_platform_blog_format_row($row);
            unset($out['access_token']);
            echo json_encode(['success' => true, 'data' => $out]);
        } catch (Throwable) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to load post.']);
        }
        return true;
    }

    // ── Master: list ──
    if ($uri === '/master/blog/posts' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $q = trim((string) ($_GET['q'] ?? ''));
        $status = trim((string) ($_GET['status'] ?? ''));
        $visibility = trim((string) ($_GET['visibility'] ?? ''));
        try {
            $sql = 'SELECT * FROM platform_blog_posts WHERE 1=1';
            $params = [];
            if ($status !== '' && strtolower($status) !== 'all') {
                $sql .= ' AND status = ?';
                $params[] = $status;
            }
            if ($visibility !== '' && strtolower($visibility) !== 'all') {
                $sql .= ' AND visibility = ?';
                $params[] = $visibility;
            }
            if ($q !== '') {
                $sql .= ' AND (title_en LIKE ? OR title_ar LIKE ? OR excerpt_en LIKE ? OR excerpt_ar LIKE ? OR slug LIKE ? OR category LIKE ?)';
                $like = '%' . $q . '%';
                array_push($params, $like, $like, $like, $like, $like, $like);
            }
            $sql .= ' ORDER BY COALESCE(updated_at, created_at) DESC';
            $st = $pdo->prepare($sql);
            $st->execute($params);
            $rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
            $all = array_map('souq_platform_blog_format_row', $rows);

            $metrics = [
                'total' => count($all),
                'draft' => count(array_filter($all, static fn ($p) => ($p['status'] ?? '') === 'draft')),
                'published' => count(array_filter($all, static fn ($p) => ($p['status'] ?? '') === 'published')),
                'live' => count(array_filter($all, static fn ($p) => ($p['visibility'] ?? '') === 'live' && ($p['status'] ?? '') === 'published')),
                'unlisted' => count(array_filter($all, static fn ($p) => ($p['visibility'] ?? '') === 'unlisted')),
                'private' => count(array_filter($all, static fn ($p) => ($p['visibility'] ?? '') === 'private')),
                'views' => array_sum(array_map(static fn ($p) => (int) ($p['views'] ?? 0), $all)),
            ];

            echo json_encode([
                'success' => true,
                'data' => $all,
                'metrics' => $metrics,
                'meta' => ['source' => 'platform_blog_posts'],
            ]);
        } catch (Throwable) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to list platform blog posts.']);
        }
        return true;
    }

    // ── Master: create ──
    if ($uri === '/master/blog/posts' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $titleEn = trim((string) ($input['title_en'] ?? $input['titleEn'] ?? ''));
        $titleAr = trim((string) ($input['title_ar'] ?? $input['titleAr'] ?? ''));
        if ($titleEn === '' && $titleAr === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Title (EN or AR) is required.']);
            return true;
        }
        $id = 'pblog-' . substr(bin2hex(random_bytes(8)), 0, 12);
        $slugBase = trim((string) ($input['slug'] ?? ''));
        if ($slugBase === '') {
            $slugBase = souq_platform_blog_slugify($titleEn !== '' ? $titleEn : $titleAr);
        } else {
            $slugBase = souq_platform_blog_slugify($slugBase);
        }
        $slug = $slugBase;
        $n = 1;
        while (true) {
            $chk = $pdo->prepare('SELECT id FROM platform_blog_posts WHERE slug = ? LIMIT 1');
            $chk->execute([$slug]);
            if (!$chk->fetchColumn()) {
                break;
            }
            $slug = $slugBase . '-' . $n;
            $n++;
            if ($n > 50) {
                $slug = $slugBase . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
                break;
            }
        }

        $status = strtolower(trim((string) ($input['status'] ?? 'draft')));
        if (!in_array($status, ['draft', 'published'], true)) {
            $status = 'draft';
        }
        $visibility = strtolower(trim((string) ($input['visibility'] ?? 'private')));
        if (!in_array($visibility, ['live', 'unlisted', 'private'], true)) {
            $visibility = 'private';
        }
        if ($status === 'draft') {
            // Drafts stay private until published
            $visibility = $visibility === 'live' || $visibility === 'unlisted' ? $visibility : 'private';
        }
        $accessToken = bin2hex(random_bytes(16));
        $labels = $input['labels'] ?? [];
        if (!is_array($labels)) {
            $labels = [];
        }
        $labelsJson = json_encode(array_values(array_filter(array_map('strval', $labels))), JSON_UNESCAPED_UNICODE);
        $seo = is_array($input['seo'] ?? null) ? $input['seo'] : [];
        $publishedAt = $status === 'published' ? $now : null;

        try {
            $st = $pdo->prepare(
                'INSERT INTO platform_blog_posts (
                    id, slug, title_en, title_ar, excerpt_en, excerpt_ar, content_en, content_ar,
                    labels, category, cover_image, author_name, status, visibility, access_token,
                    seo_title_en, seo_title_ar, seo_description_en, seo_description_ar, seo_focus_keyword,
                    views, published_at, created_at, updated_at, created_by
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?)'
            );
            $st->execute([
                $id,
                $slug,
                $titleEn,
                $titleAr,
                trim((string) ($input['excerpt_en'] ?? $input['excerptEn'] ?? '')),
                trim((string) ($input['excerpt_ar'] ?? $input['excerptAr'] ?? '')),
                (string) ($input['content_en'] ?? $input['contentEn'] ?? ''),
                (string) ($input['content_ar'] ?? $input['contentAr'] ?? ''),
                $labelsJson,
                trim((string) ($input['category'] ?? '')),
                trim((string) ($input['cover_image'] ?? $input['coverImage'] ?? '')),
                trim((string) ($input['author_name'] ?? $input['authorName'] ?? 'Unityteck')) ?: 'Unityteck',
                $status,
                $visibility,
                $accessToken,
                trim((string) ($seo['title_en'] ?? $seo['titleEn'] ?? '')),
                trim((string) ($seo['title_ar'] ?? $seo['titleAr'] ?? '')),
                trim((string) ($seo['description_en'] ?? $seo['descriptionEn'] ?? '')),
                trim((string) ($seo['description_ar'] ?? $seo['descriptionAr'] ?? '')),
                trim((string) ($seo['focus_keyword'] ?? $seo['focusKeyword'] ?? '')),
                $publishedAt,
                $now,
                $now,
                'master',
            ]);
            $sel = $pdo->prepare('SELECT * FROM platform_blog_posts WHERE id = ? LIMIT 1');
            $sel->execute([$id]);
            $row = $sel->fetch(PDO::FETCH_ASSOC) ?: [];
            echo json_encode(['success' => true, 'data' => souq_platform_blog_format_row($row)]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create post.', 'error' => $e->getMessage()]);
        }
        return true;
    }

    // ── Master: update / delete / get one ──
    if (preg_match('#^/master/blog/posts/([^/]+)$#', $uri, $m)) {
        if (!$needMaster()) {
            return true;
        }
        $postId = rawurldecode($m[1]);

        if ($method === 'GET') {
            $st = $pdo->prepare('SELECT * FROM platform_blog_posts WHERE id = ? LIMIT 1');
            $st->execute([$postId]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                http_response_code(404);
                echo json_encode(['message' => 'Post not found.']);
                return true;
            }
            echo json_encode(['success' => true, 'data' => souq_platform_blog_format_row($row)]);
            return true;
        }

        if ($method === 'DELETE') {
            $pdo->prepare('DELETE FROM platform_blog_posts WHERE id = ?')->execute([$postId]);
            echo json_encode(['success' => true, 'message' => 'Deleted']);
            return true;
        }

        if (in_array($method, ['PUT', 'PATCH'], true)) {
            $st = $pdo->prepare('SELECT * FROM platform_blog_posts WHERE id = ? LIMIT 1');
            $st->execute([$postId]);
            $existing = $st->fetch(PDO::FETCH_ASSOC);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['message' => 'Post not found.']);
                return true;
            }

            $titleEn = array_key_exists('title_en', $input) || array_key_exists('titleEn', $input)
                ? trim((string) ($input['title_en'] ?? $input['titleEn'] ?? ''))
                : (string) ($existing['title_en'] ?? '');
            $titleAr = array_key_exists('title_ar', $input) || array_key_exists('titleAr', $input)
                ? trim((string) ($input['title_ar'] ?? $input['titleAr'] ?? ''))
                : (string) ($existing['title_ar'] ?? '');
            if ($titleEn === '' && $titleAr === '') {
                http_response_code(422);
                echo json_encode(['message' => 'Title (EN or AR) is required.']);
                return true;
            }

            $slug = (string) ($existing['slug'] ?? '');
            if (isset($input['slug']) && trim((string) $input['slug']) !== '') {
                $slugBase = souq_platform_blog_slugify((string) $input['slug']);
                $slug = $slugBase;
                $n = 1;
                while (true) {
                    $chk = $pdo->prepare('SELECT id FROM platform_blog_posts WHERE slug = ? AND id != ? LIMIT 1');
                    $chk->execute([$slug, $postId]);
                    if (!$chk->fetchColumn()) {
                        break;
                    }
                    $slug = $slugBase . '-' . $n;
                    $n++;
                    if ($n > 50) {
                        break;
                    }
                }
            }

            $status = strtolower(trim((string) ($input['status'] ?? $existing['status'] ?? 'draft')));
            if (!in_array($status, ['draft', 'published'], true)) {
                $status = 'draft';
            }
            $visibility = strtolower(trim((string) ($input['visibility'] ?? $existing['visibility'] ?? 'private')));
            if (!in_array($visibility, ['live', 'unlisted', 'private'], true)) {
                $visibility = 'private';
            }

            $accessToken = (string) ($existing['access_token'] ?? '');
            if ($accessToken === '' || !empty($input['rotate_token'])) {
                $accessToken = bin2hex(random_bytes(16));
            }

            $labels = $input['labels'] ?? null;
            if ($labels === null) {
                $labelsJson = (string) ($existing['labels'] ?? '[]');
            } else {
                if (!is_array($labels)) {
                    $labels = [];
                }
                $labelsJson = json_encode(array_values(array_filter(array_map('strval', $labels))), JSON_UNESCAPED_UNICODE);
            }

            $seo = is_array($input['seo'] ?? null) ? $input['seo'] : [];
            $publishedAt = $existing['published_at'] ?? null;
            if ($status === 'published' && empty($publishedAt)) {
                $publishedAt = $now;
            }
            if ($status === 'draft') {
                // keep published_at history; visibility can still be set for when they publish
            }

            $upd = $pdo->prepare(
                'UPDATE platform_blog_posts SET
                    slug = ?, title_en = ?, title_ar = ?, excerpt_en = ?, excerpt_ar = ?,
                    content_en = ?, content_ar = ?, labels = ?, category = ?, cover_image = ?,
                    author_name = ?, status = ?, visibility = ?, access_token = ?,
                    seo_title_en = ?, seo_title_ar = ?, seo_description_en = ?, seo_description_ar = ?,
                    seo_focus_keyword = ?, published_at = ?, updated_at = ?
                 WHERE id = ?'
            );
            $upd->execute([
                $slug,
                $titleEn,
                $titleAr,
                array_key_exists('excerpt_en', $input) || array_key_exists('excerptEn', $input)
                    ? trim((string) ($input['excerpt_en'] ?? $input['excerptEn'] ?? ''))
                    : (string) ($existing['excerpt_en'] ?? ''),
                array_key_exists('excerpt_ar', $input) || array_key_exists('excerptAr', $input)
                    ? trim((string) ($input['excerpt_ar'] ?? $input['excerptAr'] ?? ''))
                    : (string) ($existing['excerpt_ar'] ?? ''),
                array_key_exists('content_en', $input) || array_key_exists('contentEn', $input)
                    ? (string) ($input['content_en'] ?? $input['contentEn'] ?? '')
                    : (string) ($existing['content_en'] ?? ''),
                array_key_exists('content_ar', $input) || array_key_exists('contentAr', $input)
                    ? (string) ($input['content_ar'] ?? $input['contentAr'] ?? '')
                    : (string) ($existing['content_ar'] ?? ''),
                $labelsJson,
                array_key_exists('category', $input)
                    ? trim((string) $input['category'])
                    : (string) ($existing['category'] ?? ''),
                array_key_exists('cover_image', $input) || array_key_exists('coverImage', $input)
                    ? trim((string) ($input['cover_image'] ?? $input['coverImage'] ?? ''))
                    : (string) ($existing['cover_image'] ?? ''),
                array_key_exists('author_name', $input) || array_key_exists('authorName', $input)
                    ? (trim((string) ($input['author_name'] ?? $input['authorName'] ?? '')) ?: 'Unityteck')
                    : (string) ($existing['author_name'] ?? 'Unityteck'),
                $status,
                $visibility,
                $accessToken,
                array_key_exists('seo', $input)
                    ? trim((string) ($seo['title_en'] ?? $seo['titleEn'] ?? ''))
                    : (string) ($existing['seo_title_en'] ?? ''),
                array_key_exists('seo', $input)
                    ? trim((string) ($seo['title_ar'] ?? $seo['titleAr'] ?? ''))
                    : (string) ($existing['seo_title_ar'] ?? ''),
                array_key_exists('seo', $input)
                    ? trim((string) ($seo['description_en'] ?? $seo['descriptionEn'] ?? ''))
                    : (string) ($existing['seo_description_en'] ?? ''),
                array_key_exists('seo', $input)
                    ? trim((string) ($seo['description_ar'] ?? $seo['descriptionAr'] ?? ''))
                    : (string) ($existing['seo_description_ar'] ?? ''),
                array_key_exists('seo', $input)
                    ? trim((string) ($seo['focus_keyword'] ?? $seo['focusKeyword'] ?? ''))
                    : (string) ($existing['seo_focus_keyword'] ?? ''),
                $publishedAt,
                $now,
                $postId,
            ]);

            $sel = $pdo->prepare('SELECT * FROM platform_blog_posts WHERE id = ? LIMIT 1');
            $sel->execute([$postId]);
            $row = $sel->fetch(PDO::FETCH_ASSOC) ?: [];
            echo json_encode(['success' => true, 'data' => souq_platform_blog_format_row($row)]);
            return true;
        }
    }

    // ── Master: bulk ──
    if ($uri === '/master/blog/posts/bulk' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $action = strtolower(trim((string) ($input['action'] ?? '')));
        $ids = $input['ids'] ?? [];
        if (!is_array($ids) || $ids === []) {
            http_response_code(422);
            echo json_encode(['message' => 'ids required']);
            return true;
        }
        $ids = array_values(array_filter(array_map('strval', $ids)));
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        try {
            if ($action === 'delete') {
                $pdo->prepare("DELETE FROM platform_blog_posts WHERE id IN ($placeholders)")->execute($ids);
            } elseif ($action === 'publish') {
                $pdo->prepare(
                    "UPDATE platform_blog_posts SET status = 'published', published_at = COALESCE(published_at, ?), updated_at = ? WHERE id IN ($placeholders)"
                )->execute(array_merge([$now, $now], $ids));
            } elseif ($action === 'draft') {
                $pdo->prepare(
                    "UPDATE platform_blog_posts SET status = 'draft', updated_at = ? WHERE id IN ($placeholders)"
                )->execute(array_merge([$now], $ids));
            } elseif (in_array($action, ['live', 'unlisted', 'private'], true)) {
                $pdo->prepare(
                    "UPDATE platform_blog_posts SET visibility = ?, updated_at = ? WHERE id IN ($placeholders)"
                )->execute(array_merge([$action, $now], $ids));
            } else {
                http_response_code(422);
                echo json_encode(['message' => 'Unknown action']);
                return true;
            }
            echo json_encode(['success' => true, 'count' => count($ids)]);
        } catch (Throwable) {
            http_response_code(500);
            echo json_encode(['message' => 'Bulk action failed']);
        }
        return true;
    }

    return false;
}
