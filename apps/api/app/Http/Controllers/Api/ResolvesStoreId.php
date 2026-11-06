<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

trait ResolvesStoreId
{
    protected function requireStoreId(Request $request): string|JsonResponse
    {
        $raw = $request->attributes->get('store_id')
            ?? $request->route('storeId')
            ?? $request->query('store_id')
            ?? $request->header('X-Store-Id');

        if (! is_string($raw) || trim($raw) === '') {
            return response()->json([
                'message' => 'X-Store-Id header is required for store-scoped routes.',
            ], 400);
        }

        return $this->canonicalStoreId($raw);
    }

    protected function canonicalStoreId(string $raw): string
    {
        $s = strtolower(trim($raw));
        if ($s === 'flowers' || $s === 'hadaya' || $s === 'makkah' || $s === 'giftshop') {
            return 'store-1';
        }
        if ($s === 'coffee' || $s === 'roasters' || $s === 'hibrew') {
            return 'store-coffee';
        }
        if ($s === 'bleco' || $s === 'car' || $s === 'cars' || $s === 'alsaeedi') {
            return 'store-bleco';
        }

        $matchedId = \App\Models\Store::query()->where('id', $raw)->orWhere('slug', $raw)->orWhere('slug', $s)->value('id');

        return $matchedId ?: trim($raw);
    }

    protected function newId(string $prefix): string
    {
        return $prefix.'-'.bin2hex(random_bytes(6));
    }
}
