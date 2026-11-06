<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerWallet;
use App\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class WalletController extends Controller
{
    use ResolvesStoreId;

    public function show(Request $request, string $customerId): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        Customer::query()->forStore($storeId)->where('id', $customerId)->firstOrFail();

        $wallet = CustomerWallet::query()
            ->where('store_id', $storeId)
            ->where('customer_id', $customerId)
            ->first();

        return response()->json([
            'data' => [
                'balance' => $wallet ? (float) $wallet->balance : 0.0,
                'loyalty_points' => $wallet ? (int) $wallet->loyalty_points : 0,
            ],
            'store_id' => $storeId,
            'customer_id' => $customerId,
        ]);
    }

    public function transactions(Request $request, string $customerId): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        Customer::query()->forStore($storeId)->where('id', $customerId)->firstOrFail();

        $rows = WalletTransaction::query()
            ->where('store_id', $storeId)
            ->where('customer_id', $customerId)
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => $rows,
            'store_id' => $storeId,
            'customer_id' => $customerId,
        ]);
    }

    public function adjust(Request $request, string $customerId): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        Customer::query()->forStore($storeId)->where('id', $customerId)->firstOrFail();

        $data = $request->validate([
            'type' => ['required', Rule::in(['add', 'deduct'])],
            'amount' => ['required', 'numeric', 'gt:0'],
            'reason' => ['nullable', 'string', 'max:2000'],
            'reset_loyalty' => ['sometimes', 'boolean'],
            'notify_channel' => ['nullable', Rule::in(['email', 'sms', 'whatsapp', 'none'])],
            'employee_id' => ['nullable', 'string', 'max:64'],
            'employee_name' => ['nullable', 'string', 'max:191'],
        ]);

        $amount = round((float) $data['amount'], 2);
        $type = $data['type'];
        $resetLoyalty = (bool) ($data['reset_loyalty'] ?? false);
        $notifyChannel = $data['notify_channel'] ?? null;
        if ($notifyChannel === 'none') {
            $notifyChannel = null;
        }

        $result = DB::transaction(function () use (
            $storeId,
            $customerId,
            $amount,
            $type,
            $resetLoyalty,
            $notifyChannel,
            $data
        ) {
            $wallet = CustomerWallet::query()
                ->where('store_id', $storeId)
                ->where('customer_id', $customerId)
                ->lockForUpdate()
                ->first();

            if (! $wallet) {
                $wallet = CustomerWallet::query()->create([
                    'store_id' => $storeId,
                    'customer_id' => $customerId,
                    'balance' => 0,
                    'loyalty_points' => 0,
                ]);
                $wallet = CustomerWallet::query()
                    ->where('id', $wallet->id)
                    ->lockForUpdate()
                    ->first();
            }

            $balanceBefore = (float) $wallet->balance;

            if ($type === 'deduct' && $balanceBefore < $amount) {
                return response()->json([
                    'message' => 'Insufficient wallet balance for deduction.',
                ], 422);
            }

            $balanceAfter = $type === 'add'
                ? round($balanceBefore + $amount, 2)
                : round($balanceBefore - $amount, 2);

            if ($balanceAfter < 0) {
                return response()->json([
                    'message' => 'Wallet balance cannot be negative.',
                ], 422);
            }

            $wallet->balance = $balanceAfter;
            if ($resetLoyalty) {
                $wallet->loyalty_points = 0;
            }
            $wallet->save();

            $tx = WalletTransaction::query()->create([
                'store_id' => $storeId,
                'customer_id' => $customerId,
                'type' => $type,
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reason' => $data['reason'] ?? null,
                'employee_id' => $data['employee_id'] ?? null,
                'employee_name' => $data['employee_name'] ?? null,
                'notify_channel' => $notifyChannel,
                'reset_loyalty' => $resetLoyalty,
                'created_at' => now(),
            ]);

            return [
                'wallet' => $wallet->fresh(),
                'transaction' => $tx,
            ];
        });

        if ($result instanceof JsonResponse) {
            return $result;
        }

        return response()->json([
            'data' => [
                'balance' => (float) $result['wallet']->balance,
                'loyalty_points' => (int) $result['wallet']->loyalty_points,
                'transaction' => $result['transaction'],
            ],
        ]);
    }
}
