<?php
/**
 * Isolated Hostinger site for souq-default.mieraf-ksa.com
 * Loads central storefront shell, then rewrites /assets to mieraf absolute URLs
 * (avoids redirect+CORS failure for Vite type=module).
 */
declare(strict_types=1);

$candidates = [
    dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'mieraf-ksa.com' . DIRECTORY_SEPARATOR . 'public_html' . DIRECTORY_SEPARATOR . 'storefront-shell.php',
    '/home/u393490678/domains/mieraf-ksa.com/public_html/storefront-shell.php',
    dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storefront-shell.php',
];

$shell = null;
foreach ($candidates as $path) {
    if (is_file($path)) {
        $shell = $path;
        break;
    }
}

if ($shell === null) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Souq default bridge: storefront-shell.php not found.\nTried:\n- " . implode("\n- ", $candidates);
    exit;
}

ob_start();
require $shell;
$html = (string) ob_get_clean();

// Point hashed Vite assets at central origin (CORS * enabled there)
$html = preg_replace(
    '#\b(href|src)=([\'"])(/assets/[^\'"]+)\2#i',
    '$1=$2https://mieraf-ksa.com$3$2',
    $html,
) ?? $html;

// Module / stylesheet CORS mode
$html = preg_replace(
    '#(<script\b[^>]*\bsrc=(["\'])https://mieraf-ksa\.com/assets/[^"\']+\2)(?![^>]*\bcrossorigin=)#i',
    '$1 crossorigin="anonymous"',
    $html,
) ?? $html;
$html = preg_replace(
    '#(<link\b[^>]*\bhref=(["\'])https://mieraf-ksa\.com/assets/[^"\']+\2)(?![^>]*\bcrossorigin=)#i',
    '$1 crossorigin="anonymous"',
    $html,
) ?? $html;

echo $html;
