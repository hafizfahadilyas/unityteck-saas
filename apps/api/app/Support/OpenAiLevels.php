<?php

namespace App\Support;

/**
 * Intelligence levels — reasoning effort ≠ token caps.
 * Only emit params officially supported by the selected model family.
 */
final class OpenAiLevels
{
    /**
     * @return array{low: array, medium: array, high: array}
     */
    public static function catalog(): array
    {
        return [
            'low' => [
                'label' => 'Low',
                'reasoning_effort' => 'low',
                'default_max_output_tokens' => 512,
                'preferred_models' => ['gpt-5.4-mini', 'gpt-4.1-mini'],
                'context_policy' => 'minimal',
            ],
            'medium' => [
                'label' => 'Medium',
                'reasoning_effort' => 'medium',
                'default_max_output_tokens' => 2048,
                'preferred_models' => ['gpt-5.4-mini', 'gpt-5.4'],
                'context_policy' => 'relevant',
            ],
            'high' => [
                'label' => 'High',
                'reasoning_effort' => 'high',
                'default_max_output_tokens' => 8192,
                'preferred_models' => ['gpt-5.4', 'gpt-5.4-pro'],
                'context_policy' => 'rich',
            ],
        ];
    }

    public static function normalize(string $level): string
    {
        $level = strtolower(trim($level));

        return in_array($level, ['low', 'medium', 'high'], true) ? $level : 'medium';
    }

    /**
     * @return array{reasoning_effort: string, default_max_output_tokens: int, preferred_models: list<string>, context_policy: string}
     */
    public static function for(string $level): array
    {
        $n = self::normalize($level);

        return self::catalog()[$n];
    }

    /**
     * Models known to accept reasoning_effort (extend as OpenAI docs change).
     */
    public static function supportsReasoningEffort(string $model): bool
    {
        $m = strtolower($model);

        return str_contains($m, 'gpt-5')
            || str_contains($m, 'o1')
            || str_contains($m, 'o3')
            || str_contains($m, 'o4');
    }
}
