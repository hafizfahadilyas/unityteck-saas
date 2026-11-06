<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Customer reviews for a store. Persisted on store_settings (not theme JSON).
 */
class StoreReviewsController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request, string $storeId): JsonResponse
    {
        $id = $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        return response()->json([
            'success' => true,
            'data' => $this->readReviews($id),
            'store_id' => $id,
        ]);
    }

    public function store(Request $request, string $storeId): JsonResponse
    {
        $id = $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $data = $request->validate([
            'author' => ['required', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
            'product' => ['nullable', 'string', 'max:200'],
            'productAr' => ['nullable', 'string', 'max:200'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:200'],
            'titleAr' => ['nullable', 'string', 'max:200'],
            'comment' => ['required', 'string', 'max:2000'],
            'commentAr' => ['nullable', 'string', 'max:2000'],
        ]);

        $reviews = $this->readReviews($id);
        $reviews[] = [
            'id' => $this->newId('rev'),
            'author' => $data['author'],
            'city' => $data['city'] ?? '',
            'product' => $data['product'] ?? '',
            'productAr' => $data['productAr'] ?? '',
            'rating' => (int) ($data['rating'] ?? 5),
            'title' => $data['title'] ?? '',
            'titleAr' => $data['titleAr'] ?? '',
            'comment' => $data['comment'],
            'commentAr' => $data['commentAr'] ?? '',
            'verified' => false,
            'active' => false,
            'likes' => 0,
            'date' => now()->toDateString(),
        ];
        $this->writeReviews($id, $reviews);

        return response()->json([
            'success' => true,
            'data' => $reviews[array_key_last($reviews)],
            'message' => 'Review submitted for approval.',
            'store_id' => $id,
        ], 201);
    }

    public function update(Request $request, string $storeId): JsonResponse
    {
        $id = $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $data = $request->validate([
            'reviews' => ['required', 'array'],
            'reviews.*.id' => ['required', 'string', 'max:80'],
            'reviews.*.author' => ['nullable', 'string', 'max:120'],
            'reviews.*.city' => ['nullable', 'string', 'max:120'],
            'reviews.*.product' => ['nullable', 'string', 'max:200'],
            'reviews.*.productAr' => ['nullable', 'string', 'max:200'],
            'reviews.*.rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'reviews.*.title' => ['nullable', 'string', 'max:200'],
            'reviews.*.titleAr' => ['nullable', 'string', 'max:200'],
            'reviews.*.comment' => ['nullable', 'string', 'max:2000'],
            'reviews.*.commentAr' => ['nullable', 'string', 'max:2000'],
            'reviews.*.verified' => ['nullable', 'boolean'],
            'reviews.*.active' => ['nullable', 'boolean'],
            'reviews.*.likes' => ['nullable', 'integer', 'min:0'],
            'reviews.*.date' => ['nullable', 'string', 'max:40'],
        ]);

        $clean = array_values(array_map(function ($row) {
            return [
                'id' => (string) $row['id'],
                'author' => (string) ($row['author'] ?? ''),
                'city' => (string) ($row['city'] ?? ''),
                'product' => (string) ($row['product'] ?? ''),
                'productAr' => (string) ($row['productAr'] ?? ''),
                'rating' => (int) ($row['rating'] ?? 5),
                'title' => (string) ($row['title'] ?? ''),
                'titleAr' => (string) ($row['titleAr'] ?? ''),
                'comment' => (string) ($row['comment'] ?? ''),
                'commentAr' => (string) ($row['commentAr'] ?? ''),
                'verified' => (bool) ($row['verified'] ?? false),
                'active' => (bool) ($row['active'] ?? false),
                'likes' => (int) ($row['likes'] ?? 0),
                'date' => (string) ($row['date'] ?? ''),
            ];
        }, $data['reviews']));

        $this->writeReviews($id, $clean);

        return response()->json([
            'success' => true,
            'data' => $clean,
            'message' => 'Reviews updated.',
            'store_id' => $id,
        ]);
    }

    private function readReviews(string $storeId): array
    {
        $row = StoreSetting::withoutGlobalScope('store')->where('store_id', $storeId)->first();
        $settings = is_array($row?->settings) ? $row->settings : [];
        $reviews = $settings['customer_reviews'] ?? [];

        return is_array($reviews) ? array_values($reviews) : [];
    }

    private function writeReviews(string $storeId, array $reviews): void
    {
        $row = StoreSetting::withoutGlobalScope('store')->firstOrNew(['store_id' => $storeId]);
        if (! $row->exists) {
            $row->id = $this->newId('sst');
            $row->store_id = $storeId;
        }
        $current = is_array($row->settings) ? $row->settings : [];
        $current['customer_reviews'] = array_values($reviews);
        $row->settings = $current;
        $row->save();
    }
}
