<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use App\Models\StoreSetting;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GiftingController extends Controller
{
    use ResolvesStoreId;

    /**
     * Get or initialize gifting settings for store
     */
    public function getSettings(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        $storeName = $store ? $store->name : 'Store';
        $storeSlug = $store ? strtolower($store->slug ?? '') : '';
        $storeNameLower = strtolower($storeName);

        $storeSetting = StoreSetting::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->first();

        $allSettings = $storeSetting && is_array($storeSetting->settings) ? $storeSetting->settings : [];
        $gifting = $allSettings['gifting'] ?? null;

        // If not initialized yet, generate industry-specific default setup
        if (! $gifting || empty($gifting['cards']) || empty($gifting['boxes'])) {
            $gifting = $this->generateDefaultsForStore($storeName, $storeSlug, $storeNameLower);
        }

        // Fetch real orders for this store to display in Gift Order Management
        $orders = Order::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('status', '!=', 'cancelled')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($o) {
                return [
                    'id' => $o->id,
                    'order_number' => $o->order_number ?: 'ORD-' . substr($o->id, -5),
                    'customer_name' => $o->customer_name ?: 'Customer',
                    'customer_phone' => $o->customer_phone ?: '—',
                    'delivery_location' => $o->delivery_location ?: 'Saudi Arabia',
                    'status' => $o->status ?: 'processing',
                    'total_amount' => (float) $o->total_amount,
                    'is_gift' => true,
                    'gift_message' => $o->source_details ?: 'Gift package for recipient',
                    'recipient_name' => $o->customer_name ?: 'Recipient',
                    'date' => Carbon::parse($o->created_at)->format('d M Y · h:i A'),
                ];
            });

        return response()->json([
            'success' => true,
            'store_id' => $storeId,
            'store_name' => $storeName,
            'data' => [
                'enabled' => $gifting['enabled'] ?? true,
                'allow_anonymous' => $gifting['allow_anonymous'] ?? true,
                'max_message_length' => $gifting['max_message_length'] ?? 250,
                'cards' => $gifting['cards'] ?? [],
                'boxes' => $gifting['boxes'] ?? [],
                'sample_message' => $gifting['sample_message'] ?? [
                    'en' => 'Wishing you joy, success, and special moments from ' . $storeName . '! 💖',
                    'ar' => 'أجمل التهاني وأطيب التمنيات لكم، من ' . $storeName . '! 💖',
                ],
                'real_orders' => $orders,
            ],
        ]);
    }

    /**
     * Save customized gifting settings for store
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'enabled' => ['nullable', 'boolean'],
            'allow_anonymous' => ['nullable', 'boolean'],
            'max_message_length' => ['nullable', 'integer', 'min:50', 'max:500'],
            'cards' => ['nullable', 'array'],
            'boxes' => ['nullable', 'array'],
            'sample_message' => ['nullable', 'array'],
        ]);

        $storeSetting = StoreSetting::withoutGlobalScope('store')
            ->firstOrNew(['store_id' => $storeId]);

        if (! $storeSetting->exists) {
            $storeSetting->id = $this->newId('sst');
            $storeSetting->store_id = $storeId;
        }

        $allSettings = is_array($storeSetting->settings) ? $storeSetting->settings : [];
        $currentGifting = $allSettings['gifting'] ?? [];

        $allSettings['gifting'] = array_merge($currentGifting, $data);
        $storeSetting->settings = $allSettings;
        $storeSetting->save();

        return response()->json([
            'success' => true,
            'message' => 'Gifting settings saved successfully.',
            'store_id' => $storeId,
            'data' => $allSettings['gifting'],
        ]);
    }

    /**
     * Generate niche-specific defaults so coffee stores don't get flower bouquets
     */
    protected function generateDefaultsForStore(string $storeName, string $storeSlug, string $storeNameLower): array
    {
        $isCoffee = str_contains($storeSlug, 'coffee') || str_contains($storeNameLower, 'coffee') || str_contains($storeNameLower, 'roaster') || str_contains($storeNameLower, 'brew');
        $isAuto = str_contains($storeSlug, 'bleco') || str_contains($storeSlug, 'car') || str_contains($storeNameLower, 'car') || str_contains($storeNameLower, 'auto') || str_contains($storeNameLower, 'saeedi');
        $isFlowers = str_contains($storeSlug, 'flower') || str_contains($storeNameLower, 'flower') || str_contains($storeNameLower, 'gift') || str_contains($storeNameLower, 'ورد');

        if ($isCoffee) {
            return [
                'enabled' => true,
                'allow_anonymous' => true,
                'max_message_length' => 250,
                'cards' => [
                    ['id' => 'card-c1', 'titleEn' => 'Coffee Lovers Gift', 'titleAr' => 'هدية لعشاق القهوة', 'category' => 'Specialty Coffee'],
                    ['id' => 'card-c2', 'titleEn' => 'Morning Brew Joy', 'titleAr' => 'صباحات مفعمة بالنكهة', 'category' => 'Celebration'],
                    ['id' => 'card-c3', 'titleEn' => 'Barista Master Selection', 'titleAr' => 'مختارات الباريستا الفاخرة', 'category' => 'VIP Connoisseur'],
                ],
                'boxes' => [
                    ['id' => 'box-c1', 'nameEn' => 'Eco Kraft Coffee Bag', 'nameAr' => 'كيس كرافت صديق للبيئة', 'price' => 10, 'selected' => true],
                    ['id' => 'box-c2', 'nameEn' => 'Wooden Roaster Box', 'nameAr' => 'صندوق خشبي فاخر لمحبي القهوة', 'price' => 25, 'selected' => true],
                    ['id' => 'box-c3', 'nameEn' => 'Deluxe Barista Gift Hamper', 'nameAr' => 'باقة باريستا الملكية المتكاملة', 'price' => 45, 'selected' => true],
                ],
                'sample_message' => [
                    'en' => 'May every morning brew bring warmth, energy, and joy to your day! From ' . $storeName . ' ☕✨',
                    'ar' => 'أتمنى لك صباحاً مفعماً برائحة القهوة الزكية والسعادة الدائمة! من ' . $storeName . ' ☕✨',
                ],
            ];
        }

        if ($isAuto) {
            return [
                'enabled' => true,
                'allow_anonymous' => true,
                'max_message_length' => 250,
                'cards' => [
                    ['id' => 'card-a1', 'titleEn' => 'VIP Detailing Gift Pass', 'titleAr' => 'بطاقة إهداء عناية VIP للسيارة', 'category' => 'Automotive'],
                    ['id' => 'card-a2', 'titleEn' => 'Car Enthusiast Voucher', 'titleAr' => 'قسيمة إهداء لعشاق السيارات', 'category' => 'Care & Polish'],
                    ['id' => 'card-a3', 'titleEn' => 'Ceramic Shield Certificate', 'titleAr' => 'شهادة نانو سيراميك وحماية', 'category' => 'Premium Service'],
                ],
                'boxes' => [
                    ['id' => 'box-a1', 'nameEn' => 'Standard Auto Care Pack', 'nameAr' => 'باقة العناية الأساسية بالمركبة', 'price' => 15, 'selected' => true],
                    ['id' => 'box-a2', 'nameEn' => 'Deluxe Protection Kit Case', 'nameAr' => 'حقيبة حماية فاخرة متكاملة', 'price' => 35, 'selected' => true],
                    ['id' => 'box-a3', 'nameEn' => 'Executive Leather Certificate Folio', 'nameAr' => 'حافظة جلدية ملكية للشهادات', 'price' => 60, 'selected' => true],
                ],
                'sample_message' => [
                    'en' => 'Enjoy a smooth, pristine ride with top-tier car care excellence! From ' . $storeName . ' 🚗✨',
                    'ar' => 'رحلة قيادة مميزة وممتعة بأعلى معايير العناية بسيارتك! من ' . $storeName . ' 🚗✨',
                ],
            ];
        }

        // Default / Flowers & Gifts
        return [
            'enabled' => true,
            'allow_anonymous' => true,
            'max_message_length' => 250,
            'cards' => [
                ['id' => 'card-f1', 'titleEn' => 'Flowers & Love', 'titleAr' => 'هدية مميزة من أجلك', 'category' => 'Romantic'],
                ['id' => 'card-f2', 'titleEn' => 'Special Moments', 'titleAr' => 'أجمل التهاني والتبريكات', 'category' => 'Congratulations'],
                ['id' => 'card-f3', 'titleEn' => 'Eid Mubarak', 'titleAr' => 'عيد مبارك وسعيد', 'category' => 'Celebration'],
            ],
            'boxes' => [
                ['id' => 'box-f1', 'nameEn' => 'Standard Gift Box', 'nameAr' => 'صندوق كلاسيكي أنيق', 'price' => 10, 'selected' => true],
                ['id' => 'box-f2', 'nameEn' => 'Premium Floral Box', 'nameAr' => 'صندوق فاخر ملون بتغليف أنيق', 'price' => 25, 'selected' => true],
                ['id' => 'box-f3', 'nameEn' => 'Luxury Velvet Hamper', 'nameAr' => 'صندوق ملكي مخملي فاخر', 'price' => 40, 'selected' => true],
            ],
            'sample_message' => [
                'en' => 'Sending you heartfelt wishes, happiness, and memorable moments! From ' . $storeName . ' 🌸💖',
                'ar' => 'أجمل التهاني وأصدق التبريكات من القلب بمناسبة هذه اللحظة السعيدة! من ' . $storeName . ' 🌸💖',
            ],
        ];
    }
}
