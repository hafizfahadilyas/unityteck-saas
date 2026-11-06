<?php
/**
 * Serves the storefront HTML with this host's own SEO.
 * Missing store meta stays on the platform title. It never copies another store.
 */
declare(strict_types=1);

$htmlFile = __DIR__ . '/index.html';
$html = is_file($htmlFile) ? (string)file_get_contents($htmlFile) : '';
if ($html === '') {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Storefront file is missing.';
    exit;
}

$host = strtolower((string)preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
if (str_starts_with($host, 'www.')) {
    $host = substr($host, 4);
}

$title = 'منصة سوق | التجارة الإلكترونية الشاملة';
$description = 'منصة تجارة إلكترونية متعددة المتاجر.';
$canonical = 'https://' . $host . (parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');

$db = __DIR__ . '/api/data/platform.sqlite';
if ($host !== '' && is_file($db)) {
    try {
        $pdo = new PDO('sqlite:' . $db, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $rows = $pdo->query('SELECT id, name, domain, data FROM stores')->fetchAll(PDO::FETCH_ASSOC);
        $aliases = [
            'mieraf-ksa.com' => 'store-coffee',
            'giftshop-sa.com' => 'store-1',
            'tanjeedmakkah.com' => 'store-bleco',
        ];
        $match = null;
        foreach ($rows as $row) {
            $data = json_decode((string)($row['data'] ?? ''), true);
            if (!is_array($data)) {
                $data = [];
            }
            $domains = [];
            foreach (['domain', 'custom_domain', 'demo_domain'] as $field) {
                $value = strtolower(trim((string)($row[$field] ?? $data[$field] ?? '')));
                $value = preg_replace('#^https?://#', '', $value) ?? $value;
                $value = explode('/', $value)[0];
                if (str_starts_with($value, 'www.')) {
                    $value = substr($value, 4);
                }
                if ($value !== '') {
                    $domains[] = $value;
                }
            }
            $id = (string)$row['id'];
            if (in_array($host, $domains, true) || (($aliases[$host] ?? '') === $id)) {
                $match = [$row, $data];
                break;
            }
        }
        if ($match) {
            [$row, $data] = $match;
            $seo = is_array($data['seo'] ?? null) ? $data['seo'] : [];
            $name = trim((string)($data['nameAr'] ?? $data['name'] ?? $row['name'] ?? ''));
            $metaTitle = trim((string)($seo['metaTitle'] ?? $data['metaTitle'] ?? $data['meta_title'] ?? ''));
            $metaDesc = trim((string)($seo['metaDescription'] ?? $data['metaDescription'] ?? $data['meta_description'] ?? ''));
            if ($metaTitle !== '') {
                $title = $metaTitle;
            } elseif ($name !== '') {
                $title = $name;
            }
            if ($metaDesc !== '') {
                $description = $metaDesc;
            } elseif ($name !== '') {
                $description = $name;
            }
        }
    } catch (Throwable $e) {
        /* keep the platform title */
    }
}

$esc = static function (string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
};

$html = preg_replace('/<title>.*?<\/title>/su', '<title>' . $esc($title) . '</title>', $html, 1) ?? $html;
$html = preg_replace('/(<meta name="description" content=")[^"]*(")/u', '$1' . $esc($description) . '$2', $html, 1) ?? $html;
$html = preg_replace('/(<meta property="og:title" content=")[^"]*(")/u', '$1' . $esc($title) . '$2', $html, 1) ?? $html;
$html = preg_replace('/(<meta property="og:description" content=")[^"]*(")/u', '$1' . $esc($description) . '$2', $html, 1) ?? $html;
$html = preg_replace('/(<meta name="keywords" content=")[^"]*(")/u', '$1' . $esc($title) . '$2', $html, 1) ?? $html;
if (!str_contains($html, 'rel="canonical"')) {
    $html = str_replace('</head>', '    <link rel="canonical" href="' . $esc($canonical) . "\" />\n  </head>", $html);
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
echo $html;
