<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/**
 * Public storefront signup. One row per store_id + email.
 * Name, email, phone, and city come from the customer. Nothing is invented.
 */
class StorefrontCustomerController extends Controller
{
    use ResolvesStoreId;

    public function upsert(Request $request): JsonResponse
    {
        $rawStore = (string) ($request->input('store_id') ?: $request->header('X-Store-Id') ?: '');
        if (trim($rawStore) === '') {
            return response()->json(['message' => 'store_id is required.'], 422);
        }

        $storeId = $this->canonicalStoreId($rawStore);
        if (! Store::query()->where('id', $storeId)->exists()) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:191'],
            'email' => ['required', 'email', 'max:191'],
            'phone' => ['required', 'string', 'max:32'],
            'city' => ['required', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'source' => ['nullable', 'in:google,email'],
        ]);

        $email = Str::lower(trim($data['email']));
        $phone = trim($data['phone']);
        if (strlen(preg_replace('/\D+/', '', $phone) ?? '') < 8) {
            return response()->json(['message' => 'A real phone number is required.'], 422);
        }

        $key = 'sf-customer:'.$storeId.':'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 12)) {
            return response()->json(['message' => 'Too many attempts. Try again shortly.'], 429);
        }
        RateLimiter::hit($key, 60);

        $source = ($data['source'] ?? 'email') === 'google' ? 'Google' : 'Direct';

        $customer = Customer::query()
            ->where('store_id', $storeId)
            ->where('email', $email)
            ->first();

        if ($customer) {
            $customer->fill([
                'name' => trim($data['name']),
                'phone' => $phone,
                'city' => trim($data['city']),
                'country' => isset($data['country']) ? trim((string) $data['country']) : $customer->country,
                'acquisition_source' => $customer->acquisition_source ?: $source,
            ])->save();
        } else {
            $customer = Customer::query()->create([
                'id' => $this->newId('cust'),
                'store_id' => $storeId,
                'name' => trim($data['name']),
                'email' => $email,
                'phone' => $phone,
                'city' => trim($data['city']),
                'country' => isset($data['country']) && trim((string) $data['country']) !== ''
                    ? trim((string) $data['country'])
                    : null,
                'group' => 'Regular',
                'status' => 'New',
                'acquisition_source' => $source,
                'total_orders' => 0,
                'total_spend' => 0,
                'avg_order_value' => 0,
            ]);
        }

        return response()->json([
            'data' => $customer->fresh(),
            'store_id' => $storeId,
        ]);
    }
}
