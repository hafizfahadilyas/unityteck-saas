<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreBankAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StoreBankAccountController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $query = StoreBankAccount::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->orderByDesc('is_default')
            ->orderBy('bank_name');

        if ($request->query('is_active') !== null && $request->query('is_active') !== '') {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $rows = $query->get();

        return response()->json([
            'data' => $rows,
            'store_id' => $storeId,
            'meta' => ['total' => $rows->count()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'bank_name' => ['required', 'string', 'max:191'],
            'bank_name_ar' => ['nullable', 'string', 'max:191'],
            'account_title' => ['required', 'string', 'max:191'],
            'account_title_ar' => ['nullable', 'string', 'max:191'],
            'iban' => ['required', 'string', 'max:64'],
            'account_number' => ['nullable', 'string', 'max:64'],
            'payment_reference_prefix' => ['nullable', 'string', 'max:32'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $account = DB::transaction(function () use ($data, $storeId) {
            $isDefault = (bool) ($data['is_default'] ?? false);

            if ($isDefault) {
                StoreBankAccount::query()
                    ->withoutGlobalScope('store')
                    ->forStore($storeId)
                    ->update(['is_default' => false]);
            }

            return StoreBankAccount::query()->create([
                'id' => $this->newId('bank'),
                'store_id' => $storeId,
                'bank_name' => $data['bank_name'],
                'bank_name_ar' => $data['bank_name_ar'] ?? null,
                'account_title' => $data['account_title'],
                'account_title_ar' => $data['account_title_ar'] ?? null,
                'iban' => strtoupper(trim($data['iban'])),
                'account_number' => $data['account_number'] ?? null,
                'payment_reference_prefix' => $data['payment_reference_prefix'] ?? null,
                'is_default' => $isDefault,
                'is_active' => $data['is_active'] ?? true,
            ]);
        });

        return response()->json(['data' => $account], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $account = StoreBankAccount::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->where('id', $id)
            ->firstOrFail();

        $data = $request->validate([
            'bank_name' => ['sometimes', 'string', 'max:191'],
            'bank_name_ar' => ['nullable', 'string', 'max:191'],
            'account_title' => ['sometimes', 'string', 'max:191'],
            'account_title_ar' => ['nullable', 'string', 'max:191'],
            'iban' => ['sometimes', 'string', 'max:64'],
            'account_number' => ['nullable', 'string', 'max:64'],
            'payment_reference_prefix' => ['nullable', 'string', 'max:32'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        DB::transaction(function () use ($account, $data, $storeId) {
            if (! empty($data['iban'])) {
                $data['iban'] = strtoupper(trim($data['iban']));
            }

            if (array_key_exists('is_default', $data) && $data['is_default']) {
                StoreBankAccount::query()
                    ->withoutGlobalScope('store')
                    ->forStore($storeId)
                    ->where('id', '!=', $account->id)
                    ->update(['is_default' => false]);
            }

            $account->fill($data)->save();
        });

        return response()->json(['data' => $account->fresh()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $account = StoreBankAccount::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->where('id', $id)
            ->firstOrFail();

        $account->delete();

        return response()->json(['message' => 'Bank account deleted.', 'id' => $id]);
    }
}
