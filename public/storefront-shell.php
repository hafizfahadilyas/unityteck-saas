<?php
/**
 * Serves the storefront HTML with this host's own SEO from Hostinger MySQL / Laravel.
 * Missing store meta stays on the platform title. It never copies another store.
 */
declare(strict_types=1);

require_once __DIR__ . '/includes/souq-seo-mysql.php';

$htmlFile = __DIR__ . '/index.html';
$html = is_file($htmlFile) ? (string) file_get_contents($htmlFile) : '';
if ($html === '') {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Storefront file is missing.';
    exit;
}

$host = souq_seo_normalize_host($_SERVER['HTTP_HOST'] ?? '');
$uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
$path = parse_url($uri, PHP_URL_PATH) ?: '/';
$query = [];
parse_str((string) (parse_url($uri, PHP_URL_QUERY) ?: ''), $query);
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
$origin = ($https ? 'https://' : 'http://') . ($host ?: 'localhost');

$title = 'منصة سوق | التجارة الإلكترونية الشاملة';
$description = 'منصة تجارة إلكترونية متعددة المتاجر.';
$keywords = '';
$canonical = $origin . $path;
$lang = 'ar';
$dir = 'rtl';
$gtm = null;
$ga4 = null;
$gsc = null;
$ogImage = '';

$pathLower = strtolower($path);
$isMasterPortal = $pathLower === '/master' || str_starts_with($pathLower, '/master/');
$isAdminPortal =
    $pathLower === '/admin'
    || str_starts_with($pathLower, '/admin/')
    || $pathLower === '/store/login'
    || str_starts_with($pathLower, '/store/login')
    || $pathLower === '/store/forgot-password'
    || $pathLower === '/store/reset-password'
    || $pathLower === '/master/forgot-password'
    || $pathLower === '/master/reset-password';

// Master / admin chrome must never inherit coffee/flowers storefront SEO titles.
if ($isMasterPortal) {
    $title = 'منصة سوق | لوحة تحكم المشرف';
    $description = 'لوحة تحكم المشرف لمنصة سوق متعددة المتاجر في المملكة.';
} elseif ($isAdminPortal) {
    $title = 'لوحة تحكم المتجر | منصة سوق';
    $description = 'لوحة تحكم التاجر لمنصة سوق.';
} else {
    // Shared hosts (mieraf): ?store=bleco / /bleco must not inherit coffee shell title.
    $resolved = $host !== '' ? souq_seo_resolve($host, $path, $query) : null;
    if ($resolved) {
        if ($resolved['title'] !== '') {
            $title = $resolved['title'];
        }
        if ($resolved['description'] !== '') {
            $description = $resolved['description'];
        }
        $keywords = $resolved['keywords'];
        if ($resolved['canonical'] !== '') {
            $canonical = $resolved['canonical'];
        }
        $lang = $resolved['lang'] ?: $lang;
        $dir = $resolved['dir'] ?: $dir;
        $gtm = $resolved['gtm'];
        $ga4 = $resolved['ga4'];
        $gsc = $resolved['gsc'];
        $ogImage = $resolved['og_image'];
    }
}

$esc = static function (string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
};

$html = preg_replace('/<html\b[^>]*>/i', '<html lang="' . $esc($lang) . '" dir="' . $esc($dir) . '">', $html, 1) ?? $html;
$html = preg_replace('/<title>.*?<\/title>/su', '<title>' . $esc($title) . '</title>', $html, 1) ?? $html;

$setMeta = static function (string $html, string $attr, string $key, string $content) use ($esc): string {
    if ($content === '') {
        return $html;
    }
    $pattern = '/<meta\s+' . preg_quote($attr, '/') . '=["\']' . preg_quote($key, '/') . '["\']\s+content=["\'][^"\']*["\']\s*\/?>/i';
    $tag = '<meta ' . $attr . '="' . $esc($key) . '" content="' . $esc($content) . '" />';
    if (preg_match($pattern, $html)) {
        return preg_replace($pattern, $tag, $html, 1) ?? $html;
    }
    return str_replace('</head>', "    {$tag}\n  </head>", $html);
};

$html = $setMeta($html, 'name', 'description', $description);
$html = $setMeta($html, 'name', 'keywords', $keywords);
$html = $setMeta($html, 'property', 'og:title', $title);
$html = $setMeta($html, 'property', 'og:description', $description);
$html = $setMeta($html, 'property', 'og:url', $canonical);
if ($ogImage !== '') {
    $html = $setMeta($html, 'property', 'og:image', $ogImage);
}
$html = $setMeta($html, 'name', 'twitter:title', $title);
$html = $setMeta($html, 'name', 'twitter:description', $description);
if ($gsc) {
    $html = $setMeta($html, 'name', 'google-site-verification', (string) $gsc);
}

if (!str_contains($html, 'rel="canonical"')) {
    $html = str_replace('</head>', '    <link rel="canonical" href="' . $esc($canonical) . "\" />\n  </head>", $html);
} else {
    $html = preg_replace(
        '/<link\s+rel=["\']canonical["\']\s+href=["\'][^"\']*["\']\s*\/?>/i',
        '<link rel="canonical" href="' . $esc($canonical) . '" />',
        $html,
        1
    ) ?? $html;
}

$headInject = '';
if ($gtm && preg_match('/^GTM-[A-Z0-9]+$/i', (string) $gtm)) {
    $gtmId = $esc((string) $gtm);
    $headInject .= <<<HTML
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','{$gtmId}');</script>

HTML;
}
if ($ga4 && preg_match('/^G-[A-Z0-9]+$/i', (string) $ga4)) {
    $ga4Id = $esc((string) $ga4);
    $headInject .= <<<HTML
    <script async src="https://www.googletagmanager.com/gtag/js?id={$ga4Id}"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','{$ga4Id}');</script>

HTML;
}
if ($headInject !== '') {
    $html = str_replace('</head>', $headInject . "  </head>", $html);
}

if ($gtm && preg_match('/^GTM-[A-Z0-9]+$/i', (string) $gtm) && !str_contains($html, 'googletagmanager.com/ns.html')) {
    $gtmId = $esc((string) $gtm);
    $noscript = '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=' . $gtmId . '" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>';
    $html = preg_replace('/<body([^>]*)>/i', '<body$1>' . $noscript, $html, 1) ?? $html;
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
echo $html;
