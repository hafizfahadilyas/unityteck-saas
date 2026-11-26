<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreAppointment extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'store_appointments';

    protected $fillable = [
        'id',
        'store_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'service_key',
        'service_name_en',
        'service_name_ar',
        'additional_services',
        'vehicle_make',
        'vehicle_model',
        'vehicle_year',
        'appointment_date',
        'appointment_time',
        'photo_urls',
        'notes',
        'status',
        'staff_name',
        'staff_id',
        'admin_note',
    ];

    protected function casts(): array
    {
        return [
            'additional_services' => 'array',
            'photo_urls' => 'array',
            'appointment_date' => 'date:Y-m-d',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
