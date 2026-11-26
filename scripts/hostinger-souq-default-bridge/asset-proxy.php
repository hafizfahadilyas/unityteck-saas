<?php
/**
 * Same-origin asset proxy — avoids CORS when Vite modules load from tenant host.
 * Usage: /assets/foo.js → asset-proxy.php?f=foo.js (via .htaccess)
 */
declare(strict_types=1);

$f = (string) ($_GET['f'] ?? '');
$f = str_replace('\\', '/', $f);
$f = ltrim($f, '/');
if ($f === '' || str_contains($f, '..') || !preg_match('/^[A-Za-z0-9._\\/-]+$/', $f)) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Bad asset path';
    exit;
}

$base = 'https://mieraf-ksa.com/assets/';
$url = $base . $f;

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_USERAGENT => 'SouqDefaultAssetProxy/1.0',
    CURLOPT_HTTPHEADER => ['Accept: */*'],
]);
$body = curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$ctype = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$err = curl_error($ch);
curl_close($ch);

if ($body === false || $code >= 400) {
    http_response_code($code >= 400 ? $code : 502);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Asset proxy failed: ' . ($err !== '' ? $err : ('HTTP ' . $code));
    exit;
}

if ($ctype === '' || $ctype === 'text/html') {
    if (str_ends_with($f, '.css')) {
        $ctype = 'text/css; charset=utf-8';
    } elseif (str_ends_with($f, '.js') || str_ends_with($f, '.mjs')) {
        $ctype = 'application/javascript; charset=utf-8';
    } elseif (str_ends_with($f, '.map')) {
        $ctype = 'application/json; charset=utf-8';
    } elseif (str_ends_with($f, '.woff2')) {
        $ctype = 'font/woff2';
    } elseif (str_ends_with($f, '.woff')) {
        $ctype = 'font/woff';
    } else {
        $ctype = 'application/octet-stream';
    }
}

header('Content-Type: ' . $ctype);
header('Cache-Control: public, max-age=86400');
header('Access-Control-Allow-Origin: *');
echo $body;
