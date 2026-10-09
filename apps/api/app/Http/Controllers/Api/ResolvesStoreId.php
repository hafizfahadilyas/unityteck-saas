<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

trait ResolvesStoreId
{
    protected function requireStoreId(Request $request): string|JsonResponse
    {
        $storeId = $request->attributes->get('store_id')
            ?? $request->header('X-Store-Id');

        if (! is_string($storeId) || trim($storeId) === '') {
            return response()->json([
                'message' => 'X-Store-Id header is required for store-scoped routes.',
            ], 400);
        }

        return trim($storeId);
    }

    protected function newId(string $prefix): string
    {
        return $prefix.'-'.bin2hex(random_bytes(6));
    }
}
