<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiCreditTransaction;
use App\Models\AiMerchantLimit;
use App\Models\AiSubscriptionPlan;
use App\Models\MerchantAiSubscription;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreAiPayment;
use App\Models\Subscription;
use App\Services\MasterAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MasterPaymentManagementController extends Controller
{
    /**
     * Unified Payment Requests Listing
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $storeId = $request->query('store_id');
        $perPage = (int) ($request->query('per_page') ?? 20);

        $query = StoreAiPayment::with('store')->orderBy('created_at', 'desc');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        if ($storeId) {
            $query->where('store_id', $storeId);
        }

        $payments = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $payments->items(),
            'pagination' => [
                'current_page' => $payments->currentPage(),
                'total_pages' => $payments->lastPage(),
                'total_records' => $payments->total(),
            ],
        ]);
    }

    /**
     * Approve Payment Request (Atomically activates exact purchased entitlement)
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
            'reason' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $payment = StoreAiPayment::lockForUpdate()->find($id);

            if (!$payment) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Payment request not found'], 404);
            }

            if ($payment->status === 'approved') {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Payment has already been approved'], 400);
            }

            $user = $request->user();
            $adminName = $user ? $user->name : 'Master Admin';

            $beforeStatus = $payment->status;
            $payment->status = 'approved';
            $payment->reviewed_by = $adminName;
            $payment->reviewed_at = now();
            if (!empty($validated['notes'])) {
                $payment->notes = $validated['notes'];
            }
            $payment->save();

            // 1. If AI Package or AI Subscription
            $aiPlan = AiSubscriptionPlan::where('code', $payment->package_id)
                ->orWhere('id', $payment->package_id)
                ->first();

            $creditsGranted = 0;
            if ($aiPlan) {
                // Activate AI subscription
                $aiSub = MerchantAiSubscription::firstOrNew(['store_id' => $payment->store_id]);
                $aiSub->id = $aiSub->id ?: 'aisub_' . Str::random(16);
                $aiSub->plan_id = $aiPlan->id;
                $aiSub->status = 'active';
                $aiSub->starts_at = now();
                $days = $aiPlan->billing_cycle === 'yearly' ? 365 : 30;
                $aiSub->ends_at = now()->addDays($days);
                $aiSub->assigned_by = $user ? $user->id : null;
                $aiSub->save();

                // Grant AI plan credits + bonus
                $creditsGranted = $aiPlan->credits + $aiPlan->bonus_credits;
            } else {
                // Standard credits from package name or amount
                $creditsGranted = max(50, (int) round($payment->amount_sar * 5));
            }

            // Top up wallet
            $limit = AiMerchantLimit::firstOrCreate(
                ['store_id' => $payment->store_id],
                ['remaining_credits' => 200, 'daily_image_limit' => 25, 'monthly_image_limit' => 200]
            );
            $limit->remaining_credits += $creditsGranted;
            $limit->save();

            // Record transaction
            AiCreditTransaction::create([
                'id' => 'tx_' . Str::random(16),
                'store_id' => $payment->store_id,
                'provider_id' => 'provider-gemini',
                'transaction_type' => 'payment_approval',
                'amount' => $creditsGranted,
                'balance_after' => $limit->remaining_credits,
                'reason' => "Approved payment #{$payment->id} for package {$payment->package_name}",
                'reference_id' => $payment->id,
                'created_by_user_id' => $user ? $user->id : null,
                'created_at' => now(),
            ]);

            MasterAuditService::record(
                'approve_payment',
                'payment_management',
                $payment->store_id,
                null,
                ['status' => $beforeStatus],
                ['status' => 'approved', 'credits_granted' => $creditsGranted, 'payment_id' => $payment->id],
                $validated['reason'] ?? "Payment approved by {$adminName}"
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Payment #{$payment->id} approved. Entitlements and {$creditsGranted} credits activated.",
                'data' => $payment,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Payment approval failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reject Payment Request
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $payment = StoreAiPayment::find($id);
        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Payment request not found'], 404);
        }

        if ($payment->status === 'approved') {
            return response()->json(['success' => false, 'message' => 'Cannot reject an already approved payment.'], 400);
        }

        $user = $request->user();
        $adminName = $user ? $user->name : 'Master Admin';

        $beforeStatus = $payment->status;
        $payment->status = 'rejected';
        $payment->reviewed_by = $adminName;
        $payment->reviewed_at = now();
        $payment->notes = $validated['rejection_reason'];
        $payment->save();

        MasterAuditService::record(
            'reject_payment',
            'payment_management',
            $payment->store_id,
            null,
            ['status' => $beforeStatus],
            ['status' => 'rejected', 'reason' => $validated['rejection_reason']],
            $validated['rejection_reason']
        );

        return response()->json([
            'success' => true,
            'message' => "Payment #{$payment->id} rejected.",
            'data' => $payment,
        ]);
    }
}
