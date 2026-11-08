<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreAiGenerationUsage extends Model
{
    use BelongsToStore;

    protected $table = 'store_ai_generation_usage';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'period_key',
        'images_used',
        'videos_used',
    ];

    protected function casts(): array
    {
        return [
            'images_used' => 'integer',
            'videos_used' => 'integer',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
