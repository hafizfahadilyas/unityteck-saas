<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreAiTrialUsage extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'store_ai_trial_usages';

    protected $fillable = [
        'id',
        'store_id',
        'trial_items_limit',
        'trial_items_used',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'trial_items_limit' => 'integer',
            'trial_items_used' => 'integer',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
