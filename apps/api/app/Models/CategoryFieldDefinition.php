<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CategoryFieldDefinition extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'category_field_definitions';

    protected $fillable = [
        'id',
        'store_id',
        'category_id',
        'name_en',
        'name_ar',
        'field_type',
        'options',
        'sort',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'sort' => 'integer',
            'active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
