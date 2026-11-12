<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreSetting;
use App\Services\Loyalty\LoyaltyPointsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

        $reviews = $this->readReviews($id);
        $onlyApproved = $request->boolean('approved_only', ! $request->user());
        if ($onlyApproved) {
            $reviews = array_values(array_filter($reviews, static fn ($row) => (bool) ($row['active'] ?? false)));
        }
        $productId = trim((string) $request->query('product_id', ''));
        if ($productId !== '') {
            $reviews = array_values(array_filter($reviews, static function ($row) use ($productId) {
                $pid = trim((string) ($row['product_id'] ?? ''));

                return $pid !== '' && $pid === $productId;
            }));
        }

        return response()->json([
            'success' => true,
            'data' => $reviews,
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
            'customer_id' => ['nullable', 'string', 'max:64'],
            'product_id' => ['nullable', 'string', 'max:64'],
            'verified' => ['nullable', 'boolean'],
            'has_media' => ['nullable', 'boolean'],
            'media_urls' => ['nullable', 'array'],
            'media_urls.*' => ['string', 'max:500'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'video_url' => ['nullable', 'string', 'max:500'],
        ]);

        $mediaUrls = array_values(array_filter(
            is_array($data['media_urls'] ?? null) ? $data['media_urls'] : []
        ));
        $hasMedia = (bool) ($data['has_media'] ?? false)
            || $mediaUrls !== []
            || ! empty($data['image_url'])
            || ! empty($data['video_url']);

        $reviews = $this->readReviews($id);
        $reviews[] = [
            'id' => $this->newId('rev'),
            'author' => $data['author'],
            'city' => $data['city'] ?? '',
            'product' => $data['product'] ?? '',
            'productAr' => $data['productAr'] ?? '',
            'product_id' => $data['product_id'] ?? '',
            'customer_id' => $data['customer_id'] ?? '',
            'rating' => (int) ($data['rating'] ?? 5),
            'title' => $data['title'] ?? '',
            'titleAr' => $data['titleAr'] ?? '',
            'comment' => $data['comment'],
            'commentAr' => $data['commentAr'] ?? '',
            'verified' => (bool) ($data['verified'] ?? false),
            'active' => false,
            'has_media' => $hasMedia,
            'media_urls' => $mediaUrls,
            'image_url' => $data['image_url'] ?? '',
            'video_url' => $data['video_url'] ?? '',
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
            'reviews.*.product_id' => ['nullable', 'string', 'max:64'],
            'reviews.*.customer_id' => ['nullable', 'string', 'max:64'],
            'reviews.*.rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'reviews.*.title' => ['nullable', 'string', 'max:200'],
            'reviews.*.titleAr' => ['nullable', 'string', 'max:200'],
            'reviews.*.comment' => ['nullable', 'string', 'max:2000'],
            'reviews.*.commentAr' => ['nullable', 'string', 'max:2000'],
            'reviews.*.verified' => ['nullable', 'boolean'],
            'reviews.*.active' => ['nullable', 'boolean'],
            'reviews.*.has_media' => ['nullable', 'boolean'],
            'reviews.*.media_urls' => ['nullable', 'array'],
            'reviews.*.image_url' => ['nullable', 'string', 'max:500'],
            'reviews.*.video_url' => ['nullable', 'string', 'max:500'],
            'reviews.*.likes' => ['nullable', 'integer', 'min:0'],
            'reviews.*.date' => ['nullable', 'string', 'max:40'],
        ]);

        $previous = [];
        foreach ($this->readReviews($id) as $row) {
            $previous[(string) ($row['id'] ?? '')] = $row;
        }

        $clean = array_values(array_map(function ($row) {
            $mediaUrls = array_values(array_filter(
                is_array($row['media_urls'] ?? null) ? $row['media_urls'] : []
            ));
            $hasMedia = (bool) ($row['has_media'] ?? false)
                || $mediaUrls !== []
                || ! empty($row['image_url'])
                || ! empty($row['video_url']);

            return [
                'id' => (string) $row['id'],
                'author' => (string) ($row['author'] ?? ''),
                'city' => (string) ($row['city'] ?? ''),
                'product' => (string) ($row['product'] ?? ''),
                'productAr' => (string) ($row['productAr'] ?? ''),
                'product_id' => (string) ($row['product_id'] ?? ''),
                'customer_id' => (string) ($row['customer_id'] ?? ''),
                'rating' => (int) ($row['rating'] ?? 5),
                'title' => (string) ($row['title'] ?? ''),
                'titleAr' => (string) ($row['titleAr'] ?? ''),
                'comment' => (string) ($row['comment'] ?? ''),
                'commentAr' => (string) ($row['commentAr'] ?? ''),
                'verified' => (bool) ($row['verified'] ?? false),
                'active' => (bool) ($row['active'] ?? false),
                'has_media' => $hasMedia,
                'media_urls' => $mediaUrls,
                'image_url' => (string) ($row['image_url'] ?? ''),
                'video_url' => (string) ($row['video_url'] ?? ''),
                'likes' => (int) ($row['likes'] ?? 0),
                'date' => (string) ($row['date'] ?? ''),
            ];
        }, $data['reviews']));

        $this->writeReviews($id, $clean);

        // Award loyalty points when a review becomes approved (active) — idempotent
        try {
            $loyalty = app(LoyaltyPointsService::class);
            foreach ($clean as $review) {
                $rid = (string) ($review['id'] ?? '');
                $wasActive = (bool) ($previous[$rid]['active'] ?? false);
                $isActive = (bool) ($review['active'] ?? false);
                if ($isActive && ! $wasActive && ! empty($review['customer_id'])) {
                    $loyalty->awardForReview($id, $review);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Loyalty award on review approval failed: '.$e->getMessage(), [
                'store_id' => $id,
            ]);
        }

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
