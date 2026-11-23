<?php
/**
 * Per-host sitemap and robots from Hostinger MySQL (store_id isolated).
 * Missing store still publishes homepage only — never copies another store.
 */
declare(strict_types=1);

require_once __DIR__ . '/includes/souq-seo-mysql.php';

function souq_seo_origin_from_request(string $host): string
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    return ($https ? 'https://' : 'http://') . $host;
}

function souq_write_sitemap(): void
{
    $host = souq_seo_normalize_host($_SERVER['HTTP_HOST'] ?? 'localhost');
    $origin = souq_seo_origin_from_request($host);
    $resolved = souq_seo_resolve($host);

    header('Content-Type: application/xml; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
    echo "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";

    $paths = ['/', '/products'];
    if ($resolved && !empty($resolved['page_slugs'])) {
        foreach ($resolved['page_slugs'] as $slug) {
            $slug = trim((string) $slug, '/');
            if ($slug === '' || $slug === 'home' || $slug === 'index') {
                continue;
            }
            $paths[] = '/' . $slug;
        }
    }
    $paths = array_values(array_unique($paths));
    foreach ($paths as $path) {
        echo '  <url><loc>' . htmlspecialchars($origin . $path, ENT_QUOTES) . "</loc></url>\n";
    }

    if ($resolved) {
        foreach ($resolved['product_ids'] as $productId) {
            $id = rawurlencode((string) $productId);
            echo '  <url><loc>' . htmlspecialchars($origin . '/product/' . $id, ENT_QUOTES) . "</loc></url>\n";
        }
    }

    echo "</urlset>\n";
}

function souq_seo_file_bodies(string $host): array
{
    $resolved = souq_seo_resolve($host);
    $robots = '';
    $llms = '';
    $storeId = is_array($resolved) ? trim((string) ($resolved['store_id'] ?? '')) : '';
    if ($storeId !== '') {
        $pdo = souq_seo_pdo();
        if ($pdo) {
            try {
                $st = $pdo->prepare('SELECT robots_txt, extra FROM seo_configs WHERE store_id = ? LIMIT 1');
                $st->execute([$storeId]);
                $row = $st->fetch() ?: [];
                $robots = trim((string) ($row['robots_txt'] ?? ''));
                $extra = [];
                if (!empty($row['extra'])) {
                    $decoded = json_decode((string) $row['extra'], true);
                    if (is_array($decoded)) {
                        $extra = $decoded;
                    }
                }
                $llms = trim((string) ($extra['llms_txt'] ?? ''));
            } catch (Throwable $e) {
                $robots = '';
                $llms = '';
            }
        }
    }

    return [
        'store_id' => $storeId,
        'store_name' => is_array($resolved) ? '' : '',
        'robots' => $robots,
        'llms' => $llms,
        'origin' => souq_seo_origin_from_request($host),
    ];
}

function souq_write_robots(): void
{
    $host = souq_seo_normalize_host($_SERVER['HTTP_HOST'] ?? 'localhost');
    $files = souq_seo_file_bodies($host);
    $origin = $files['origin'];
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    $custom = trim((string) ($files['robots'] ?? ''));
    if ($custom !== '') {
        echo $custom;
        if (!str_contains(strtolower($custom), 'sitemap:')) {
            echo "\nSitemap: {$origin}/sitemap.xml\n";
        }
        return;
    }
    echo "User-agent: *\n";
    echo "Allow: /\n";
    echo "Disallow: /admin\n";
    echo "Disallow: /master\n";
    echo "Disallow: /cart\n";
    echo "Disallow: /checkout\n";
    echo "Sitemap: {$origin}/sitemap.xml\n";
}

function souq_write_llms(): void
{
    $host = souq_seo_normalize_host($_SERVER['HTTP_HOST'] ?? 'localhost');
    $files = souq_seo_file_bodies($host);
    $origin = $files['origin'];
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    $custom = trim((string) ($files['llms'] ?? ''));
    if ($custom !== '') {
        echo $custom;
        if (!str_ends_with($custom, "\n")) {
            echo "\n";
        }
        return;
    }
    // Genuine empty store file when merchant has not saved llms.txt yet
    $title = $host !== '' ? $host : 'Store';
    echo "# {$title}\n\n";
    echo "> Waiting for Data\n\n";
    echo "## Pages\n\n";
    echo "- [Home]({$origin}/)\n";
    echo "- [Sitemap]({$origin}/sitemap.xml)\n";
}
