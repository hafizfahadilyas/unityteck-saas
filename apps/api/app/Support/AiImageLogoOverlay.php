<?php

namespace App\Support;

/**
 * Soft-composites store logo onto a generated image (GD). Real logo only — never invents one.
 */
final class AiImageLogoOverlay
{
    /**
     * @return array{ok: true, binary: string, mime: string}|array{ok: false, message: string}
     */
    public static function apply(
        string $imageBinary,
        string $imageMime,
        string $logoBinary,
        string $logoMime,
        string $position = 'bottom_end',
        float $opacity = 0.88,
        float $maxWidthRatio = 0.18,
    ): array {
        if (! function_exists('imagecreatefromstring') || ! function_exists('imagepng')) {
            return ['ok' => false, 'message' => 'GD extension unavailable for logo overlay.'];
        }

        $base = @imagecreatefromstring($imageBinary);
        $logo = @imagecreatefromstring($logoBinary);
        if ($base === false || $logo === false) {
            if (is_resource($base) || $base instanceof \GdImage) {
                imagedestroy($base);
            }
            if (is_resource($logo) || $logo instanceof \GdImage) {
                imagedestroy($logo);
            }

            return ['ok' => false, 'message' => 'Could not decode image or logo for overlay.'];
        }

        $bw = imagesx($base);
        $bh = imagesy($base);
        $lw = imagesx($logo);
        $lh = imagesy($logo);
        if ($bw < 32 || $bh < 32 || $lw < 1 || $lh < 1) {
            imagedestroy($base);
            imagedestroy($logo);

            return ['ok' => false, 'message' => 'Image dimensions too small for overlay.'];
        }

        $targetW = max(24, (int) round($bw * max(0.08, min(0.28, $maxWidthRatio))));
        $scale = $targetW / $lw;
        $targetH = max(16, (int) round($lh * $scale));
        $resized = imagecreatetruecolor($targetW, $targetH);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
        imagefilledrectangle($resized, 0, 0, $targetW, $targetH, $transparent);
        imagecopyresampled($resized, $logo, 0, 0, 0, 0, $targetW, $targetH, $lw, $lh);

        $pad = (int) max(8, round(min($bw, $bh) * 0.025));
        $pos = BrandConsistentPromptBuilder::resolveLogoPosition($position);
        [$dx, $dy] = match ($pos) {
            'top_start' => [$pad, $pad],
            'top_end' => [$bw - $targetW - $pad, $pad],
            'bottom_start' => [$pad, $bh - $targetH - $pad],
            default => [$bw - $targetW - $pad, $bh - $targetH - $pad],
        };

        imagealphablending($base, true);
        $pct = (int) round(max(20, min(100, $opacity * 100)));
        imagecopymerge($base, $resized, $dx, $dy, 0, 0, $targetW, $targetH, $pct);

        ob_start();
        $outMime = 'image/png';
        if (str_contains(strtolower($imageMime), 'jpeg') || str_contains(strtolower($imageMime), 'jpg')) {
            imagejpeg($base, null, 92);
            $outMime = 'image/jpeg';
        } else {
            imagepng($base, null, 6);
        }
        $binary = (string) ob_get_clean();

        imagedestroy($resized);
        imagedestroy($logo);
        imagedestroy($base);

        if ($binary === '') {
            return ['ok' => false, 'message' => 'Logo overlay produced empty output.'];
        }

        return ['ok' => true, 'binary' => $binary, 'mime' => $outMime];
    }

    /**
     * Load remote or local public storage logo bytes for this store only.
     *
     * @return array{ok: true, binary: string, mime: string}|array{ok: false, message: string}
     */
    public static function fetchLogoBytes(string $logoUrl): array
    {
        $url = trim($logoUrl);
        if ($url === '') {
            return ['ok' => false, 'message' => 'Logo URL empty.'];
        }

        if (str_starts_with($url, 'data:')) {
            if (! preg_match('#^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$#', $url, $m)) {
                return ['ok' => false, 'message' => 'Invalid data URL logo.'];
            }
            $bin = base64_decode($m[2], true);
            if ($bin === false || $bin === '') {
                return ['ok' => false, 'message' => 'Could not decode data URL logo.'];
            }

            return ['ok' => true, 'binary' => $bin, 'mime' => $m[1]];
        }

        // Relative /storage path → local disk
        if (str_starts_with($url, '/storage/')) {
            $rel = substr($url, strlen('/storage/'));
            $rel = preg_replace('/\?.*$/', '', $rel) ?? $rel;
            $path = storage_path('app/public/'.$rel);
            if (! is_file($path)) {
                return ['ok' => false, 'message' => 'Logo file not found on disk.'];
            }
            $bin = (string) file_get_contents($path);
            $mime = function_exists('mime_content_type') ? (string) mime_content_type($path) : 'image/png';

            return $bin !== ''
                ? ['ok' => true, 'binary' => $bin, 'mime' => $mime ?: 'image/png']
                : ['ok' => false, 'message' => 'Logo file empty.'];
        }

        if (! str_starts_with($url, 'http://') && ! str_starts_with($url, 'https://')) {
            return ['ok' => false, 'message' => 'Unsupported logo URL scheme.'];
        }

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(20)->get($url);
            if (! $response->successful()) {
                return ['ok' => false, 'message' => 'Failed to fetch logo URL.'];
            }
            $bin = $response->body();
            $mime = (string) ($response->header('Content-Type') ?: 'image/png');
            if ($bin === '') {
                return ['ok' => false, 'message' => 'Fetched logo empty.'];
            }

            return ['ok' => true, 'binary' => $bin, 'mime' => explode(';', $mime)[0] ?: 'image/png'];
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => 'Logo fetch error: '.$e->getMessage()];
        }
    }
}
