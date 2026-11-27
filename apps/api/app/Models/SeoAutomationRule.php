<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoAutomationRule extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'seo_automation_rules';

    protected $fillable = [
        'id',
        'store_id',
        'rule_code',
        'action_type',
        'mode',
        'is_active',
        'last_triggered_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_triggered_at' => 'datetime',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
