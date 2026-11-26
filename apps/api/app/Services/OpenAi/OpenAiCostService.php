<?php

namespace App\Services\OpenAi;

use App\Models\OpenAiModelPricing;
use Illuminate\Support\Str;

/**
 * Cost from configurable pricing rows + actual usage tokens (never invent usage).
 */
final class OpenAiCostService
{
    public function ensureDefaultPricing(): void
    {
        $defaults = [
            ['model' => 'gpt-5.4-mini', 'modality' => 'text', 'input' => 0.25, 'output' => 2.00, 'cached' => 0.025],
            ['model' => 'gpt-5.4', 'modality' => 'text', 'input' => 1.25, 'output' => 10.00, 'cached' => 0.125],
            ['model' => 'gpt-5.4-pro', 'modality' => 'text', 'input' => 15.00, 'output' => 60.00, 'cached' => null],
            ['model' => 'gpt-4.1-mini', 'modality' => 'text', 'input' => 0.40, 'output' => 1.60, 'cached' => 0.10],
            ['model' => 'gpt-image-2.6-flare', 'modality' => 'image', 'input' => 0, 'output' => 0, 'cached' => null, 'image' => 0.042],
        ];

        foreach ($defaults as $row) {
            $exists = OpenAiModelPricing::query()
                ->where('model', $row['model'])
                ->where('modality', $row['modality'])
                ->exists();
            if ($exists) {
                continue;
            }
            OpenAiModelPricing::query()->create([
                'id' => 'oap-'.Str::lower(Str::random(12)),
                'model' => $row['model'],
                'modality' => $row['modality'],
                'input_per_1m_usd' => $row['input'],
                'output_per_1m_usd' => $row['output'],
                'cached_input_per_1m_usd' => $row['cached'] ?? null,
                'image_per_unit_usd' => $row['image'] ?? null,
                'active' => true,
            ]);
        }
    }

    /**
     * @param  array{input_tokens?: int, output_tokens?: int, cached_tokens?: int}  $usage
     */
    public function costForText(string $model, array $usage): float
    {
        $pricing = OpenAiModelPricing::query()
            ->where('model', $model)
            ->where('modality', 'text')
            ->where('active', true)
            ->first();

        if (! $pricing) {
            return 0.0;
        }

        $input = max(0, (int) ($usage['input_tokens'] ?? 0));
        $output = max(0, (int) ($usage['output_tokens'] ?? 0));
        $cached = max(0, (int) ($usage['cached_tokens'] ?? 0));
        $billableInput = max(0, $input - $cached);

        $cost = ($billableInput / 1_000_000) * (float) $pricing->input_per_1m_usd;
        $cost += ($output / 1_000_000) * (float) $pricing->output_per_1m_usd;
        if ($cached > 0 && $pricing->cached_input_per_1m_usd !== null) {
            $cost += ($cached / 1_000_000) * (float) $pricing->cached_input_per_1m_usd;
        }

        return round($cost, 6);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listPricing(): array
    {
        $this->ensureDefaultPricing();

        return OpenAiModelPricing::query()
            ->orderBy('modality')
            ->orderBy('model')
            ->get()
            ->map(fn (OpenAiModelPricing $p) => [
                'id' => $p->id,
                'model' => $p->model,
                'modality' => $p->modality,
                'input_per_1m_usd' => (float) $p->input_per_1m_usd,
                'output_per_1m_usd' => (float) $p->output_per_1m_usd,
                'cached_input_per_1m_usd' => $p->cached_input_per_1m_usd !== null ? (float) $p->cached_input_per_1m_usd : null,
                'image_per_unit_usd' => $p->image_per_unit_usd !== null ? (float) $p->image_per_unit_usd : null,
                'active' => (bool) $p->active,
            ])
            ->all();
    }
}
