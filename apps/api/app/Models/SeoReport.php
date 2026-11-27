<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoReport extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'seo_reports';

    protected $fillable = [
        'id',
        'store_id',
        'report_type',
        'period_start',
        'period_end',
        'metrics_comparison',
        'pdf_path',
        'csv_path',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'metrics_comparison' => 'array',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
