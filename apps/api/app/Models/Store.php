<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Store extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'slug',
        'domain',
        'status',
        'plan',
        'master_granted_pro',
        'canva_templates_per_category',
        'currency',
        'locale',
        'text_direction',
        'timezone',
        'phone',
        'email',
        'login_email_active',
        'owner_name',
        'city',
        'country',
        'category',
        'logo',
        'accent_color',
        'hosting_mode',
        'db_isolation',
        'zatca_vat_number',
        'products_count',
        'orders_count',
        'revenue',
        'visitors_count',
        'hosting_id',
        'database_id',
        'ssl_status',
        'deployment_status',
        'subscription_status',
        'demo_domain',
        'custom_domain',
        'hostinger_status',
        'dns_status',
    ];

    protected function casts(): array
    {
        return [
            'master_granted_pro' => 'boolean',
            'login_email_active' => 'boolean',
            'canva_templates_per_category' => 'integer',
            'products_count' => 'integer',
            'orders_count' => 'integer',
            'revenue' => 'decimal:2',
            'visitors_count' => 'integer',
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(StoreSetting::class);
    }

    public function aiBrandProfile(): HasOne
    {
        return $this->hasOne(StoreAiBrandProfile::class);
    }

    public function seoConfig(): HasOne
    {
        return $this->hasOne(SeoConfig::class);
    }

    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class);
    }
}
