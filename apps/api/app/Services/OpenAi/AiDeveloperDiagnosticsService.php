<?php

namespace App\Services\OpenAi;

use App\Models\IntegrationHealthLog;
use App\Models\Store;
use App\Models\StoreAiDevRequest;
use App\Models\StoreOpenAiUsageLog;
use App\Support\HostingerCloud;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Phase 3 — read-only diagnostics for Master SuperAdmin.
 * Never edits source, never deploys, never returns secrets.
 */
final class AiDeveloperDiagnosticsService
{
    /**
     * @return array<string, mixed>
     */
    public function diagnose(Store $store, ?StoreAiDevRequest $request = null): array
    {
        $report = [
            'ok' => true,
            'status' => 'PASS',
            'store_id' => $store->id,
            'generated_at' => now()->toIso8601String(),
            'hosting' => HostingerCloud::domainPolicy($store->id),
            'security' => [
                'merchant_can_edit_source' => false,
                'auto_deploy_allowed' => false,
                'secrets_in_response' => false,
            ],
            'checks' => [],
            'recommendations' => [],
            'code_fix_proposals' => [],
            'note_en' => 'Read-only report. Master must review before any human fix. No automatic deploy.',
            'note_ar' => 'تقرير للقراءة فقط. الماستر يراجع قبل أي إصلاح يدوي. لا نشر تلقائي.',
        ];

        $report['checks'][] = $this->checkStoreRow($store);
        $report['checks'][] = $this->checkIntegrationLogs($store);
        $report['checks'][] = $this->checkOpenAiFailures($store);

        if ($request) {
            $report['request'] = [
                'id' => $request->id,
                'title' => $request->title,
                'category' => $request->category,
                'priority' => $request->priority,
            ];
            $report['recommendations'][] = [
                'en' => 'Keep merchant on support workflow only. Do not grant repo or server access.',
                'ar' => 'أبقِ التاجر على مسار الدعم فقط. لا تمنح وصول المستودع أو الخادم.',
            ];
        }

        $failed = collect($report['checks'])->contains(fn ($c) => ($c['status'] ?? '') === 'FAIL');
        $blocked = collect($report['checks'])->contains(fn ($c) => ($c['status'] ?? '') === 'BLOCKED');
        if ($failed) {
            $report['status'] = 'FAIL';
        } elseif ($blocked) {
            $report['status'] = 'BLOCKED';
        }

        // Explicit: never auto-generate patches that write files.
        $report['code_fix_proposals'][] = [
            'status' => 'BLOCKED',
            'en' => 'Automated code patch + branch + deploy is disabled. Master or authorized engineer only.',
            'ar' => 'إصلاح الكود التلقائي والفرع والنشر معطّل. فقط الماستر أو مهندس مخوّل.',
        ];

        return $report;
    }

    /**
     * @return array<string, mixed>
     */
    private function checkStoreRow(Store $store): array
    {
        return [
            'id' => 'store_record',
            'status' => $store->exists ? 'PASS' : 'FAIL',
            'message_en' => $store->exists
                ? 'Store row present. Plan='.($store->plan ?? 'n/a').' status='.($store->status ?? 'n/a')
                : 'Store row missing.',
            'message_ar' => $store->exists
                ? 'سجل المتجر موجود.'
                : 'سجل المتجر غير موجود.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function checkIntegrationLogs(Store $store): array
    {
        if (! Schema::hasTable('integration_health_logs')) {
            return [
                'id' => 'integration_logs',
                'status' => 'BLOCKED',
                'message_en' => 'integration_health_logs table not migrated.',
                'message_ar' => 'جدول سجلات التكامل غير مُرحّل.',
            ];
        }

        $recentFail = IntegrationHealthLog::query()
            ->where('store_id', $store->id)
            ->where('success', false)
            ->orderByDesc('request_at')
            ->limit(5)
            ->get(['provider', 'category', 'test_type', 'error_code', 'error_message_sanitized', 'request_at']);

        return [
            'id' => 'integration_logs',
            'status' => $recentFail->isEmpty() ? 'PASS' : 'FAIL',
            'message_en' => $recentFail->isEmpty()
                ? 'No recent failed integration health logs for this store.'
                : 'Recent failed integration checks found (sanitized).',
            'message_ar' => $recentFail->isEmpty()
                ? 'لا فشل حديث في سجلات التكامل لهذا المتجر.'
                : 'وُجدت فحوصات تكامل فاشلة حديثة (مُنقّاة).',
            'samples' => $recentFail->map(static fn ($r) => [
                'provider' => $r->provider,
                'category' => $r->category,
                'test_type' => $r->test_type,
                'error_code' => $r->error_code,
                'error_message' => $r->error_message_sanitized,
                'at' => optional($r->request_at)?->toIso8601String(),
            ])->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function checkOpenAiFailures(Store $store): array
    {
        if (! Schema::hasTable('store_openai_usage_logs')) {
            return [
                'id' => 'openai_usage',
                'status' => 'BLOCKED',
                'message_en' => 'OpenAI usage log table not migrated.',
                'message_ar' => 'جدول استخدام OpenAI غير مُرحّل.',
            ];
        }

        $fails = StoreOpenAiUsageLog::query()
            ->where('store_id', $store->id)
            ->whereIn('status', ['failed', 'blocked', 'payment_required'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['status', 'error_code', 'error_message', 'model', 'created_at']);

        // Strip anything that looks like a key
        $samples = $fails->map(static function ($r) {
            $msg = (string) ($r->error_message ?? '');
            $msg = preg_replace('/sk-[a-zA-Z0-9_\-]{10,}/', '[redacted]', $msg) ?? $msg;

            return [
                'status' => $r->status,
                'error_code' => $r->error_code,
                'error_message' => Str::limit($msg, 240),
                'model' => $r->model,
                'at' => optional($r->created_at)?->toIso8601String(),
            ];
        })->all();

        return [
            'id' => 'openai_usage',
            'status' => $fails->isEmpty() ? 'PASS' : 'FAIL',
            'message_en' => $fails->isEmpty()
                ? 'No recent OpenAI failures for this store.'
                : 'Recent OpenAI failures / blocks (keys redacted).',
            'message_ar' => $fails->isEmpty()
                ? 'لا فشل حديث لـ OpenAI لهذا المتجر.'
                : 'فشل/حظر حديث لـ OpenAI (المفاتيح محذوفة).',
            'samples' => $samples,
        ];
    }
}
