<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StorefrontAnalyticsEvent extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'storefront_analytics_events';

    protected $fillable = [
        'id',
        'store_id',
        'event_name',
        'path',
        'source',
        'medium',
        'campaign',
        'customer_id',
        'session_key',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Public customer storefront only — never Store Admin / Master / preview.
     * Reports, SEO, Analytics must all use this scope.
     */
    public function scopePublicStorefront(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where('meta->surface', 'public_storefront')
                ->orWhere(function ($legacy) {
                    $legacy
                        ->where(function ($m) {
                            $m->whereNull('meta')
                                ->orWhereNull('meta->surface')
                                ->orWhere('meta->surface', '');
                        })
                        ->where(function ($p) {
                            $p->whereNull('path')
                                ->orWhere(function ($ok) {
                                    $ok->where('path', 'not like', '%admin%')
                                        ->where('path', 'not like', '%dashboard%')
                                        ->where('path', 'not like', '%master%');
                                });
                        })
                        ->where(function ($notAdmin) {
                            $notAdmin->whereNull('meta->surface')
                                ->orWhere('meta->surface', '!=', 'admin');
                        });
                });
        });
    }
}
