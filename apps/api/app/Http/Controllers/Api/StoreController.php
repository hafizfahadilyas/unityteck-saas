<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreUser;
use App\Support\DefaultTheme;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $query = Store::query()->orderBy('name');

        $portal = strtolower((string) $request->attributes->get(
            'portal',
            $request->header('X-Portal', 'store')
        ));
        $user = $request->user();

        // Store portal: only stores the user belongs to (never leak other tenants)
        if ($portal !== 'master' && $user) {
            $memberIds = StoreUser::query()
                ->where('user_id', $user->id)
                ->pluck('store_id')
                ->all();
            $query->whereIn('id', $memberIds ?: ['__none__']);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'data' => $query->get(),
            'portal' => $request->attributes->get('portal'),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $store = Store::query()->findOrFail($id);

        return response()->json(['data' => $store]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['nullable', 'string', 'max:64', 'unique:stores,id'],
            'name' => ['required', 'string', 'max:191'],
            'slug' => ['required', 'string', 'max:191', 'unique:stores,slug'],
            'domain' => ['nullable', 'string', 'max:191'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'pending', 'suspended'])],
            'plan' => ['nullable', Rule::in(['free', 'paid', 'pro', 'custom'])],
            'master_granted_pro' => ['nullable', 'boolean'],
            'currency' => ['nullable', 'string', 'max:10'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:191'],
            'owner_name' => ['nullable', 'string', 'max:191'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:191'],
            'logo' => ['nullable', 'string', 'max:191'],
            'accent_color' => ['nullable', 'string', 'max:32'],
            'hosting_mode' => ['nullable', Rule::in(['shared', 'dedicated', 'client'])],
            'db_isolation' => ['nullable', Rule::in(['shared_store_id', 'dedicated_mysql'])],
            'zatca_vat_number' => ['nullable', 'string', 'max:32'],
        ]);

        $data['id'] = $data['id'] ?? 'store-'.Str::lower(Str::random(8));
        $data['status'] = $data['status'] ?? 'pending';
        $data['plan'] = $data['plan'] ?? 'free';
        $data['currency'] = $data['currency'] ?? 'SAR';
        $data['hosting_mode'] = $data['hosting_mode'] ?? 'shared';
        $data['db_isolation'] = $data['db_isolation'] ?? 'shared_store_id';
        $data['master_granted_pro'] = (bool) ($data['master_granted_pro'] ?? false);

        $store = Store::query()->create($data);

        // Every new client store gets the default dummy e-commerce theme (basic or full by plan)
        DefaultTheme::assignToStore($store);

        return response()->json(['data' => $store->fresh()], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $store = Store::query()->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:191'],
            'slug' => ['sometimes', 'string', 'max:191', Rule::unique('stores', 'slug')->ignore($store->id)],
            'domain' => ['nullable', 'string', 'max:191'],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'pending', 'suspended'])],
            'plan' => ['sometimes', Rule::in(['free', 'paid', 'pro', 'custom'])],
            'master_granted_pro' => ['sometimes', 'boolean'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:191'],
            'owner_name' => ['nullable', 'string', 'max:191'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:191'],
            'logo' => ['nullable', 'string', 'max:191'],
            'accent_color' => ['nullable', 'string', 'max:32'],
            'hosting_mode' => ['sometimes', Rule::in(['shared', 'dedicated', 'client'])],
            'db_isolation' => ['sometimes', Rule::in(['shared_store_id', 'dedicated_mysql'])],
            'zatca_vat_number' => ['nullable', 'string', 'max:32'],
            'products_count' => ['sometimes', 'integer', 'min:0'],
            'orders_count' => ['sometimes', 'integer', 'min:0'],
            'revenue' => ['sometimes', 'numeric', 'min:0'],
            'visitors_count' => ['sometimes', 'integer', 'min:0'],
        ]);

        $store->fill($data)->save();

        return response()->json(['data' => $store->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        $store = Store::query()->findOrFail($id);
        $store->delete();

        return response()->json(['data' => null, 'message' => 'Store deleted.']);
    }
}
