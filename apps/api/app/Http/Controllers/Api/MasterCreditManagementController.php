<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiCreditTransaction;
use App\Models\AiMerchantLimit;
use App\Models\Store;
use App\Models\User;
use App\Services\MasterAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MasterCreditManagementController extends Controller
{
    /**
     * List all merchant wallets with search & filter
     */
    public function index(Request $request): JsonResponse
    {
        $wallets = AiMerchantLimit::with('store')->get();

        return response()->json([
            'success' => true,
            'data' => $wallets,
        ]);
    }

    /**
     * Credit Transaction History across all merchants
     */
    public function transactions(Request $request): JsonResponse
    {
        $query = AiCreditTransaction::with('store')->orderBy('created_at', 'desc');

        if ($request->query('store_id')) {
            $query->where('store_id', $request->query('store_id'));
        }
        if ($request->query('type')) {
            $query->where('transaction_type', $request->query('type'));
        }

        $perPage = (int) ($request->query('per_page') ?? 25);
        $transactions = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $transactions->items(),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'total_pages' => $transactions->lastPage(),
                'total_records' => $transactions->total(),
            ],
        ]);
    }

    /**
     * Adjust Credits for an Individual Merchant (Atomic transaction)
     */
    public function adjustCredits(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_id' => 'required|string|exists:stores,id',
            'merchant_id' => 'nullable|string',
            'amount' => 'required|integer', // Can be positive or negative
            'transaction_type' => 'required|string|in:grant,deduction,adjustment,promotional,bonus,refund',
            'reason' => 'required|string',
        ]);

        $storeId = $validated['store_id'];
        $amount = (int) $validated['amount'];
        $type = $validated['transaction_type'];
        $reason = $validated['reason'];

        DB::beginTransaction();
        try {
            $limit = AiMerchantLimit::lockForUpdate()->firstOrCreate(
                ['store_id' => $storeId],
                ['remaining_credits' => 200, 'daily_image_limit' => 25, 'monthly_image_limit' => 200]
            );

            $before = $limit->remaining_credits;
            $newBalance = $before + $amount;

            if ($newBalance < 0) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => "Cannot deduct {$amount} credits. Current balance is {$before}.",
                ], 422);
            }

            $limit->remaining_credits = $newBalance;
            $limit->save();

            $tx = AiCreditTransaction::create([
                'id' => 'tx_' . Str::random(16),
                'store_id' => $storeId,
                'merchant_id' => $validated['merchant_id'] ?? null,
                'provider_id' => 'provider-gemini',
                'transaction_type' => $type,
                'amount' => $amount,
                'balance_after' => $newBalance,
                'reason' => $reason,
                'created_by_user_id' => optional($request->user())->id,
                'created_at' => now(),
            ]);

            MasterAuditService::record(
                'credit_adjustment',
                'credit_management',
                $storeId,
                $validated['merchant_id'] ?? null,
                ['balance' => $before],
                ['balance' => $newBalance, 'change' => $amount, 'transaction_id' => $tx->id],
                $reason
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Wallet balance updated to {$newBalance} credits.",
                'data' => [
                    'store_id' => $storeId,
                    'before_balance' => $before,
                    'amount' => $amount,
                    'new_balance' => $newBalance,
                    'transaction_id' => $tx->id,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Credit adjustment failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Global or Bulk Credit Grant (Apply configured credit allowances to all or selected merchants)
     */
    public function bulkCreditGrant(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'scope' => 'required|string|in:all,selected',
            'store_ids' => 'nullable|array',
            'store_ids.*' => 'string',
            'amount' => 'required|integer|min:1',
            'reason' => 'required|string',
        ]);

        $scope = $validated['scope'];
        $amount = (int) $validated['amount'];
        $reason = $validated['reason'];

        $storeIds = $scope === 'all' ? Store::pluck('id')->toArray() : ($validated['store_ids'] ?? []);

        if (empty($storeIds)) {
            return response()->json(['success' => false, 'message' => 'No target stores specified'], 422);
        }

        DB::beginTransaction();
        try {
            $updated = 0;
            foreach ($storeIds as $sId) {
                $limit = AiMerchantLimit::firstOrCreate(
                    ['store_id' => $sId],
                    ['remaining_credits' => 200, 'daily_image_limit' => 25, 'monthly_image_limit' => 200]
                );

                $limit->remaining_credits += $amount;
                $limit->save();

                AiCreditTransaction::create([
                    'id' => 'tx_' . Str::random(16),
                    'store_id' => $sId,
                    'provider_id' => 'provider-gemini',
                    'transaction_type' => 'bulk_grant',
                    'amount' => $amount,
                    'balance_after' => $limit->remaining_credits,
                    'reason' => $reason,
                    'created_by_user_id' => optional($request->user())->id,
                    'created_at' => now(),
                ]);

                $updated++;
            }

            MasterAuditService::record(
                'bulk_credit_grant',
                'credit_management',
                null,
                null,
                ['scope' => $scope, 'target_count' => count($storeIds)],
                ['amount_per_merchant' => $amount, 'processed_count' => $updated],
                $reason
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully granted {$amount} credits to {$updated} stores.",
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Bulk credit grant failed: ' . $e->getMessage()], 500);
        }
    }
}
