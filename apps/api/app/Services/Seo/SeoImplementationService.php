<?php

namespace App\Services\Seo;

use App\Models\Product;
use App\Models\SeoContentHistory;
use App\Models\SeoImplementation;
use App\Models\SeoMetadata;
use App\Models\SeoRecommendation;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SeoImplementationService
{
    /**
     * Apply an approved SEO recommendation or manual update to live database with full audit trail.
     */
    public function applyImplementation(
        Store $store,
        string $entityType,
        string $entityId,
        string $urlPath,
        array $newPayload,
        ?string $recommendationId = null,
        ?string $userId = null,
        int $creditsConsumed = 1
    ): array {
        return DB::transaction(function () use (
            $store,
            $entityType,
            $entityId,
            $urlPath,
            $newPayload,
            $recommendationId,
            $userId,
            $creditsConsumed
        ) {
            // 1. Fetch current before state
            $existing = SeoMetadata::withoutGlobalScope('store')
                ->where('store_id', $store->id)
                ->where('entity_type', $entityType)
                ->where('entity_id', $entityId)
                ->first();

            $beforeState = $existing ? $existing->toArray() : ['exists' => false];

            // 2. Prepare or create metadata model
            $metadata = $existing ?: new SeoMetadata([
                'id' => 'meta-'.Str::lower(Str::random(10)),
                'store_id' => $store->id,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
            ]);

            $metadata->url_path = $urlPath;
            if (isset($newPayload['title_ar'])) $metadata->title_ar = $newPayload['title_ar'];
            if (isset($newPayload['title_en'])) $metadata->title_en = $newPayload['title_en'];
            if (isset($newPayload['meta_description_ar'])) $metadata->meta_description_ar = $newPayload['meta_description_ar'];
            if (isset($newPayload['meta_description_en'])) $metadata->meta_description_en = $newPayload['meta_description_en'];
            if (isset($newPayload['canonical_url'])) $metadata->canonical_url = $newPayload['canonical_url'];
            if (isset($newPayload['robots_meta'])) $metadata->robots_meta = $newPayload['robots_meta'];
            if (isset($newPayload['og_title_ar'])) $metadata->og_title_ar = $newPayload['og_title_ar'];
            if (isset($newPayload['og_title_en'])) $metadata->og_title_en = $newPayload['og_title_en'];
            if (isset($newPayload['og_description_ar'])) $metadata->og_description_ar = $newPayload['og_description_ar'];
            if (isset($newPayload['og_description_en'])) $metadata->og_description_en = $newPayload['og_description_en'];
            if (isset($newPayload['og_image_url'])) $metadata->og_image_url = $newPayload['og_image_url'];
            if (isset($newPayload['focus_keyword'])) $metadata->focus_keyword = $newPayload['focus_keyword'];
            if (isset($newPayload['secondary_keywords'])) $metadata->secondary_keywords = $newPayload['secondary_keywords'];
            if (isset($newPayload['search_intent'])) $metadata->search_intent = $newPayload['search_intent'];
            if (isset($newPayload['schema_jsonld'])) $metadata->schema_jsonld = $newPayload['schema_jsonld'];
            if (isset($newPayload['faq_items'])) $metadata->faq_items = $newPayload['faq_items'];
            $metadata->status = 'published';
            $metadata->save();

            // If it's a product, synchronize primary product search fields
            if ($entityType === 'product') {
                $prod = Product::query()->forStore($store->id)->where('id', $entityId)->first();
                if ($prod) {
                    if (!empty($newPayload['title_ar']) && empty($prod->name_ar)) {
                        $prod->name_ar = $newPayload['title_ar'];
                    }
                    $prod->save();
                }
            }

            // 3. Log into SEO Content History
            SeoContentHistory::create([
                'id' => 'sch-'.Str::lower(Str::random(10)),
                'store_id' => $store->id,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'field_name' => 'all_metadata',
                'old_value' => json_encode($beforeState, JSON_UNESCAPED_UNICODE),
                'new_value' => json_encode($metadata->toArray(), JSON_UNESCAPED_UNICODE),
                'changed_by' => $recommendationId ? 'ai_agent' : 'merchant_manual',
            ]);

            // 4. Create implementation record for 1-click rollback
            $implId = 'impl-'.Str::lower(Str::random(12));
            $implementation = SeoImplementation::create([
                'id' => $implId,
                'store_id' => $store->id,
                'recommendation_id' => $recommendationId,
                'target_url' => $urlPath,
                'action_type' => $recommendationId ? 'ai_recommendation_apply' : 'manual_save',
                'executed_by_user_id' => $userId,
                'credits_consumed' => $creditsConsumed,
                'before_state' => $beforeState,
                'after_state' => $metadata->toArray(),
                'live_validation_status' => 'verified_live',
            ]);

            // Update recommendation status if applicable
            if ($recommendationId) {
                SeoRecommendation::where('id', $recommendationId)
                    ->where('store_id', $store->id)
                    ->update(['status' => 'implemented']);
            }

            return [
                'success' => true,
                'implementation' => $implementation,
                'metadata' => $metadata->fresh(),
            ];
        });
    }

    /**
     * Revert an implementation back to its exact before_state.
     */
    public function rollbackImplementation(Store $store, string $implementationId): array
    {
        return DB::transaction(function () use ($store, $implementationId) {
            $impl = SeoImplementation::where('id', $implementationId)
                ->where('store_id', $store->id)
                ->first();

            if (!$impl) {
                return ['success' => false, 'message' => 'Implementation record not found.'];
            }

            if ($impl->rolled_back_at !== null) {
                return ['success' => false, 'message' => 'This implementation has already been rolled back.'];
            }

            $beforeState = $impl->before_state;

            if (isset($beforeState['exists']) && $beforeState['exists'] === false) {
                // Delete if it didn't exist before
                if (isset($beforeState['entity_type'], $beforeState['entity_id'])) {
                    SeoMetadata::withoutGlobalScope('store')
                        ->where('store_id', $store->id)
                        ->where('entity_type', $beforeState['entity_type'])
                        ->where('entity_id', $beforeState['entity_id'])
                        ->delete();
                }
            } elseif (!empty($beforeState['id'])) {
                // Restore previous state
                $metadata = SeoMetadata::withoutGlobalScope('store')
                    ->where('store_id', $store->id)
                    ->where('id', $beforeState['id'])
                    ->first();

                if ($metadata) {
                    $metadata->fill($beforeState)->save();
                }
            }

            $impl->rolled_back_at = now();
            $impl->save();

            if ($impl->recommendation_id) {
                SeoRecommendation::where('id', $impl->recommendation_id)
                    ->where('store_id', $store->id)
                    ->update(['status' => 'rolled_back']);
            }

            return [
                'success' => true,
                'message' => 'SEO changes rolled back successfully.',
                'implementation' => $impl->fresh(),
            ];
        });
    }
}
