<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderInstallment;
use App\Models\PaymentTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderInstallmentController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $order = Order::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->where('id', $id)
            ->firstOrFail();

        $rows = OrderInstallment::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->where('order_id', $order->id)
            ->orderBy('installment_number')
            ->get();

        return response()->json([
            'data' => $rows,
            'store_id' => $storeId,
            'order_id' => $order->id,
            'meta' => ['total' => $rows->count()],
        ]);
    }

    public function store(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $order = Order::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->where('id', $id)
            ->firstOrFail();

        $data = $request->validate([
            'installment_number' => ['required', 'integer', 'min:1'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'due_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $exists = OrderInstallment::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->where('order_id', $order->id)
            ->where('installment_number', $data['installment_number'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Installment number already exists for this order.',
            ], 422);
        }

        $installment = OrderInstallment::query()->create([
            'id' => $this->newId('inst'),
            'store_id' => $storeId,
            'order_id' => $order->id,
            'installment_number' => $data['installment_number'],
            'amount' => $data['amount'],
            'due_date' => $data['due_date'],
            'status' => 'pending',
            'notes' => $data['notes'] ?? null,
        ]);

        $this->recalcOrderBalances($order);

        return response()->json(['data' => $installment], 201);
    }

    /**
     * Mark installment paid only with a verified payment_transaction_id
     * or an explicit recorded payment amount. Never fake paid status.
     */
    public function recordPayment(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $order = Order::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->where('id', $id)
            ->firstOrFail();

        $data = $request->validate([
            'installment_id' => ['required', 'string', 'max:64'],
            'payment_transaction_id' => ['nullable', 'string', 'max:64'],
            'recorded_amount' => ['nullable', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string'],
        ]);

        if (empty($data['payment_transaction_id']) && empty($data['recorded_amount'])) {
            return response()->json([
                'message' => 'Provide a verified payment_transaction_id or an explicit recorded_amount.',
            ], 422);
        }

        $installment = OrderInstallment::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->where('order_id', $order->id)
            ->where('id', $data['installment_id'])
            ->firstOrFail();

        if ($installment->status === 'paid') {
            return response()->json([
                'message' => 'Installment is already paid.',
                'data' => $installment,
            ], 422);
        }

        if ($installment->status === 'cancelled') {
            return response()->json([
                'message' => 'Cannot record payment on a cancelled installment.',
            ], 422);
        }

        $txnId = null;
        $paidAmount = (float) $installment->amount;

        if (! empty($data['payment_transaction_id'])) {
            $txn = PaymentTransaction::query()
                ->withoutGlobalScope('store')
                ->forStore($storeId)
                ->where('id', $data['payment_transaction_id'])
                ->where(function ($q) use ($order) {
                    $q->whereNull('order_id')->orWhere('order_id', $order->id);
                })
                ->first();

            if (! $txn) {
                return response()->json([
                    'message' => 'Payment transaction not found for this store/order.',
                ], 422);
            }

            if (! in_array((string) $txn->status, ['paid', 'authorized'], true)) {
                return response()->json([
                    'message' => 'Payment transaction is not verified as paid.',
                    'transaction_status' => $txn->status,
                ], 422);
            }

            $txnId = $txn->id;
            $paidAmount = (float) $txn->amount;
        } elseif (! empty($data['recorded_amount'])) {
            $paidAmount = (float) $data['recorded_amount'];
            if ($paidAmount + 0.009 < (float) $installment->amount) {
                return response()->json([
                    'message' => 'Recorded amount is less than the installment amount.',
                    'installment_amount' => (float) $installment->amount,
                    'recorded_amount' => $paidAmount,
                ], 422);
            }
        }

        $updated = DB::transaction(function () use ($installment, $txnId, $data, $order) {
            $installment->status = 'paid';
            $installment->paid_at = now();
            $installment->payment_transaction_id = $txnId;
            if (! empty($data['notes'])) {
                $installment->notes = trim(($installment->notes ? $installment->notes."\n" : '').$data['notes']);
            }
            $installment->save();

            $this->recalcOrderBalances($order);

            return $installment->fresh();
        });

        return response()->json([
            'data' => $updated,
            'order' => $order->fresh(),
            'recorded_amount' => $paidAmount,
        ]);
    }

    protected function recalcOrderBalances(Order $order): void
    {
        $paid = (float) OrderInstallment::query()
            ->withoutGlobalScope('store')
            ->forStore($order->store_id)
            ->where('order_id', $order->id)
            ->where('status', 'paid')
            ->sum('amount');

        $order->amount_paid = round($paid, 2);
        $order->remaining_balance = round(max(0, (float) $order->total_amount - $paid), 2);

        if ($order->payment_plan === null || $order->payment_plan === '') {
            $order->payment_plan = 'installment';
        }

        if ($order->remaining_balance <= 0 && $paid > 0) {
            $order->payment_status = 'paid';
        }

        $order->save();
    }
}
