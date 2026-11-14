<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\Subscription;
use App\Models\User;
use App\Support\Audit;
use App\Support\DefaultTheme;
use App\Support\HostingerCloud;
use App\Support\Plans;
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
            'plan' => ['nullable', Rule::in(['free', 'paid', 'pro', 'premium', 'custom'])],
            'master_granted_pro' => ['nullable', 'boolean'],
            'canva_templates_per_category' => ['nullable', 'integer', 'min:1', 'max:100'],
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
        $data['plan'] = $data['plan'] ?? 'pro';
        $data['currency'] = $data['currency'] ?? 'SAR';
        // New stores join the central Hostinger. Flowers stays on its own account.
        $data['hosting_mode'] = 'shared';
        $data['db_isolation'] = 'shared_store_id';
        $data['master_granted_pro'] = (bool) ($data['master_granted_pro'] ?? false);

        $probe = new Store($data);
        if (! empty($data['domain']) && ! Plans::hasFeature($probe, 'custom_domain')) {
            $data['domain'] = null;
        }

        $store = Store::query()->create($data);

        DefaultTheme::assignToStore($store);

        $planId = Plans::catalog()[Plans::normalizeCode($store->plan)]['id'] ?? 'plan-pro';
        if (Plan::query()->where('id', $planId)->exists()) {
            $existingSub = Subscription::withoutGlobalScope('store')->where('store_id', $store->id)->first();
            if ($existingSub) {
                $existingSub->fill([
                    'plan_id' => $planId,
                    'status' => 'active',
                    'billing_interval' => 'monthly',
                ])->save();
            } else {
                Subscription::withoutGlobalScope('store')->create([
                    'id' => 'sub-'.Str::lower(Str::random(10)),
                    'store_id' => $store->id,
                    'plan_id' => $planId,
                    'status' => 'active',
                    'billing_interval' => 'monthly',
                    'starts_at' => now(),
                    'ends_at' => now()->addMonth(),
                ]);
            }
        }

        return response()->json([
            'data' => $store->fresh(),
            'hosting' => HostingerCloud::domainPolicy($store->id),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $store = Store::query()->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:191'],
            'slug' => ['sometimes', 'string', 'max:191', Rule::unique('stores', 'slug')->ignore($store->id)],
            'domain' => ['nullable', 'string', 'max:191'],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'pending', 'suspended'])],
            'plan' => ['sometimes', Rule::in(['free', 'paid', 'pro', 'premium', 'custom'])],
            'master_granted_pro' => ['sometimes', 'boolean'],
            'canva_templates_per_category' => ['nullable', 'integer', 'min:1', 'max:100'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:191'],
            'owner_email' => ['nullable', 'email', 'max:191'],
            'login_email_active' => ['sometimes', 'boolean'],
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
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $reason = trim((string) ($data['reason'] ?? ''));
        unset($data['reason']);

        $statusChanging = array_key_exists('status', $data) && (string) $data['status'] !== (string) $store->status;
        $loginChanging = array_key_exists('login_email_active', $data)
            && (bool) $data['login_email_active'] !== (bool) $store->login_email_active;
        if (($statusChanging || $loginChanging) && $reason === '') {
            return response()->json([
                'message' => 'Reason is required for status or login email changes.',
                'errors' => ['reason' => ['Reason is required.']],
            ], 422);
        }

        // Master login email uses stores.email — accept owner_email alias from SPA.
        if (array_key_exists('owner_email', $data) && ! array_key_exists('email', $data)) {
            $data['email'] = $data['owner_email'];
        }
        unset($data['owner_email']);

        $previous = [
            'status' => $store->status,
            'login_email_active' => $store->login_email_active,
            'email' => $store->email,
        ];
        $previousEmail = Str::lower(trim((string) $store->email));
        $store->fill($data)->save();

        if ($statusChanging || $loginChanging || array_key_exists('email', $data)) {
            Audit::fromRequest(
                $request,
                'store.master_update',
                'store',
                $store->id,
                [
                    'previous' => $previous,
                    'next' => [
                        'status' => $store->status,
                        'login_email_active' => $store->login_email_active,
                        'email' => $store->email,
                    ],
                    'reason' => $reason !== '' ? $reason : null,
                ],
                $store->id,
            );
        }

        // Keep store-owner User.email in sync when Master changes login email.
        if (array_key_exists('email', $data)) {
            $nextEmail = Str::lower(trim((string) $data['email']));
            if ($nextEmail !== '' && $nextEmail !== $previousEmail) {
                $ownerMembership = StoreUser::query()
                    ->where('store_id', $store->id)
                    ->orderBy('created_at')
                    ->first();
                if ($ownerMembership) {
                    $owner = User::query()->find($ownerMembership->user_id);
                    if ($owner) {
                        $taken = User::query()
                            ->where('email', $nextEmail)
                            ->where('id', '!=', $owner->id)
                            ->exists();
                        if (! $taken) {
                            $owner->email = $nextEmail;
                            $owner->save();
                        }
                    }
                }
            }
        }

        return response()->json(['data' => $store->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        $store = Store::query()->findOrFail($id);
        $store->delete();

        return response()->json(['data' => null, 'message' => 'Store deleted.']);
    }
}
