<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankTransferProof;
use App\Models\Order;
use App\Models\PaymentTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BankTransferProofController extends Controller
{
    use ResolvesStoreId;

    /**
     * Merchant: list proofs for store.
     */
    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $status = $request->query('status');
        $q = BankTransferProof::query()->forStore($storeId)->orderByDesc('created_at');
        if (is_string($status) && $status !== '') {
            $q->where('status', $status);
        }

        $rows = $q->limit(200)->get()->map(fn (BankTransferProof $p) => $this->serialize($p));

        return response()->json([
            'data' => $rows,
            'store_id' => $storeId,
            'meta' => ['total' => count($rows)],
        ]);
    }

    /**
     * Storefront / customer: upload payment proof. Order stays pending until merchant approve.
     */
    public function storefrontUpload(Request $request): JsonResponse
    {
        $data = $request->validate([
            'store_id' => ['required', 'string'],
            'order_id' => ['required', 'string'],
            'transaction_id' => ['nullable', 'string'],
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:8192'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $storeId = $this->canonicalStoreId($data['store_id']);
        $order = Order::query()->forStore($storeId)->where('id', $data['order_id'])->first();
        if (!$order) {
            return response()->json(['message' => 'Order not found for this store.'], 404);
        }

        $file = $request->file('proof');
        $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $filename = 'btp_'.Str::lower(Str::random(12)).'.'.$ext;
        $path = "stores/{$storeId}/payment-proofs/{$filename}";
        Storage::disk('public')->put($path, file_get_contents($file->getRealPath()));
        $url = Storage::disk('public')->url($path);

        $txId = $data['transaction_id'] ?? null;
        if (!$txId) {
            $tx = PaymentTransaction::query()
                ->where('store_id', $storeId)
                ->where('order_id', $order->id)
                ->where('gateway_provider', 'bank_transfer')
                ->latest()
                ->first();
            $txId = $tx?->id;
        }

        $proof = new BankTransferProof();
        $proof->id = 'btp_'.Str::lower(Str::random(16));
        $proof->store_id = $storeId;
        $proof->order_id = $order->id;
        $proof->transaction_id = $txId;
        $proof->media_path = $path;
        $proof->media_url = $url;
        $proof->status = 'pending';
        $proof->notes = $data['notes'] ?? null;
        $proof->audit_trail = [[
            'at' => now()->toIso8601String(),
            'action' => 'uploaded',
            'by' => 'customer',
        ]];
        $proof->save();

        // Never auto-mark paid
        if ($order->payment_status !== 'paid') {
            $order->payment_status = 'pending';
            $order->save();
        }

        return response()->json([
            'data' => $this->serialize($proof),
            'message' => 'Bank transfer proof uploaded. Awaiting merchant verification.',
            'payment_status' => 'pending',
        ], 201);
    }

    /**
     * Merchant approve — only then mark transaction/order paid.
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        return $this->review($request, $id, 'approved');
    }

    /**
     * Merchant reject — stay unpaid.
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        return $this->review($request, $id, 'rejected');
    }

    private function review(Request $request, string $id, string $decision): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $proof = BankTransferProof::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        if ($proof->status !== 'pending') {
            return response()->json([
                'message' => 'This proof was already reviewed.',
                'data' => $this->serialize($proof),
            ], 422);
        }

        $actor = (string) ($request->user()?->email ?? $request->user()?->id ?? 'merchant');
        $trail = is_array($proof->audit_trail) ? $proof->audit_trail : [];
        $trail[] = [
            'at' => now()->toIso8601String(),
            'action' => $decision,
            'by' => $actor,
            'notes' => $data['notes'] ?? null,
        ];

        $proof->status = $decision;
        $proof->reviewed_by = $actor;
        $proof->reviewed_at = now();
        $proof->notes = $data['notes'] ?? $proof->notes;
        $proof->audit_trail = $trail;
        $proof->save();

        if ($decision === 'approved') {
            if ($proof->transaction_id) {
                $tx = PaymentTransaction::query()
                    ->where('store_id', $storeId)
                    ->where('id', $proof->transaction_id)
                    ->first();
                if ($tx) {
                    $tx->status = 'paid';
                    $tx->save();
                }
            }
            if ($proof->order_id) {
                $order = Order::query()->forStore($storeId)->where('id', $proof->order_id)->first();
                if ($order) {
                    $order->payment_status = 'paid';
                    $order->save();
                }
            }
        }

        return response()->json([
            'data' => $this->serialize($proof),
            'message' => $decision === 'approved'
                ? 'Bank transfer approved. Order marked paid.'
                : 'Bank transfer proof rejected. Order remains unpaid.',
        ]);
    }

    private function serialize(BankTransferProof $p): array
    {
        return [
            'id' => $p->id,
            'store_id' => $p->store_id,
            'order_id' => $p->order_id,
            'transaction_id' => $p->transaction_id,
            'media_url' => $p->media_url,
            'status' => $p->status,
            'reviewed_by' => $p->reviewed_by,
            'notes' => $p->notes,
            'reviewed_at' => $p->reviewed_at?->toIso8601String(),
            'audit_trail' => $p->audit_trail,
            'created_at' => $p->created_at?->toIso8601String(),
        ];
    }
}
