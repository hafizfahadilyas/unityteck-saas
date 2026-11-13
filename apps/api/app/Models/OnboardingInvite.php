<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OnboardingInvite extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'token',
        'store_id',
        'plan',
        'label',
        'locale',
        'text_dir',
        'currency',
        'timezone',
        'expires_at',
        'used_at',
        'redeemed_store_id',
        'created_by_user_id',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }
}
