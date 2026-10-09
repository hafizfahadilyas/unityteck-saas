<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $query = Customer::query()
            ->forStore($storeId)
            ->orderByDesc('updated_at');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'data' => $query->get(),
            'store_id' => $storeId,
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $customer = Customer::query()->forStore($storeId)->where('id', $id)->firstOrFail();

        return response()->json(['data' => $customer]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'id' => ['nullable', 'string', 'max:64', 'unique:customers,id'],
            'name' => ['required', 'string', 'max:191'],
            'email' => ['required', 'email', 'max:191'],
            'phone' => ['required', 'string', 'max:32'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Other'])],
            'group' => ['nullable', 'string', 'max:64'],
            'acquisition_source' => ['nullable', 'string', 'max:64'],
            'status' => ['nullable', Rule::in(['Active', 'VIP', 'New', 'Inactive', 'Cancelled'])],
        ]);

        $data['id'] = $data['id'] ?? $this->newId('cust');
        $data['store_id'] = $storeId;
        $data['city'] = $data['city'] ?? 'Makkah';
        $data['status'] = $data['status'] ?? 'New';
        $data['acquisition_source'] = $data['acquisition_source'] ?? 'Direct';

        $customer = Customer::query()->create($data);

        return response()->json(['data' => $customer], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $customer = Customer::query()->forStore($storeId)->where('id', $id)->firstOrFail();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:191'],
            'email' => ['sometimes', 'email', 'max:191'],
            'phone' => ['sometimes', 'string', 'max:32'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Other'])],
            'group' => ['nullable', 'string', 'max:64'],
            'acquisition_source' => ['nullable', 'string', 'max:64'],
            'status' => ['sometimes', Rule::in(['Active', 'VIP', 'New', 'Inactive', 'Cancelled'])],
            'total_orders' => ['sometimes', 'integer', 'min:0'],
            'total_spend' => ['sometimes', 'numeric', 'min:0'],
            'avg_order_value' => ['sometimes', 'numeric', 'min:0'],
            'last_order_date' => ['nullable', 'date'],
        ]);

        $customer->fill($data)->save();

        return response()->json(['data' => $customer->fresh()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $customer = Customer::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $customer->delete();

        return response()->json(['data' => null, 'message' => 'Customer deleted.']);
    }
}
