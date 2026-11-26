<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreAppointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class StoreAppointmentController extends Controller
{
    use ResolvesStoreId;

    private const STATUSES = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];

    private const SLOT_TIMES = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
        '18:00', '18:30', '19:00', '19:30', '20:00',
    ];

    public function storefrontServices(Request $request): JsonResponse
    {
        $id = $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $this->catalogForStore($id),
            'slot_times' => self::SLOT_TIMES,
        ]);
    }

    public function storefrontSlots(Request $request): JsonResponse
    {
        $id = $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        if (! Schema::hasTable('store_appointments')) {
            return response()->json([
                'success' => true,
                'store_id' => $id,
                'date' => (string) $request->query('date', ''),
                'booked' => [],
                'available' => self::SLOT_TIMES,
            ]);
        }

        $date = trim((string) $request->query('date', ''));
        if ($date === '' || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return response()->json(['message' => 'Valid date (YYYY-MM-DD) is required.'], 422);
        }

        $booked = StoreAppointment::query()
            ->where('store_id', $id)
            ->whereDate('appointment_date', $date)
            ->whereIn('status', ['pending', 'approved'])
            ->pluck('appointment_time')
            ->map(static fn ($t) => substr((string) $t, 0, 5))
            ->unique()
            ->values()
            ->all();

        $available = array_values(array_filter(
            self::SLOT_TIMES,
            static fn ($slot) => ! in_array($slot, $booked, true)
        ));

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'date' => $date,
            'booked' => $booked,
            'available' => $available,
        ]);
    }

    public function storefrontStore(Request $request): JsonResponse
    {
        $id = $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        if (! Schema::hasTable('store_appointments')) {
            return response()->json([
                'message' => 'Appointments table is not ready. Run migrations on this host.',
            ], 503);
        }

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:160'],
            'customer_phone' => ['required', 'string', 'max:32'],
            'customer_email' => ['nullable', 'email', 'max:191'],
            'service_key' => ['required', 'string', 'max:64'],
            'additional_services' => ['nullable', 'array'],
            'additional_services.*' => ['string', 'max:64'],
            'vehicle_make' => ['nullable', 'string', 'max:120'],
            'vehicle_model' => ['nullable', 'string', 'max:120'],
            'vehicle_year' => ['nullable', 'string', 'max:16'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'appointment_time' => ['required', 'string', 'max:16', Rule::in(self::SLOT_TIMES)],
            'photo_urls' => ['nullable', 'array', 'max:6'],
            'photo_urls.*' => ['string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $catalog = $this->catalogForStore($id);
        $service = collect($catalog)->firstWhere('key', $data['service_key']);
        if (! $service) {
            return response()->json(['message' => 'Unknown service for this store.'], 422);
        }

        $time = substr((string) $data['appointment_time'], 0, 5);
        $date = substr((string) $data['appointment_date'], 0, 10);

        try {
            $row = DB::transaction(function () use ($id, $data, $service, $time, $date) {
                $clash = StoreAppointment::query()
                    ->where('store_id', $id)
                    ->whereDate('appointment_date', $date)
                    ->where('appointment_time', $time)
                    ->whereIn('status', ['pending', 'approved'])
                    ->lockForUpdate()
                    ->exists();

                if ($clash) {
                    return null;
                }

                $extra = [];
                foreach (($data['additional_services'] ?? []) as $key) {
                    $found = collect($this->catalogForStore($id))->firstWhere('key', $key);
                    if ($found && $key !== $data['service_key']) {
                        $extra[] = $key;
                    }
                }

                return StoreAppointment::query()->create([
                    'id' => $this->newId('apt'),
                    'store_id' => $id,
                    'customer_name' => $data['customer_name'],
                    'customer_phone' => $data['customer_phone'],
                    'customer_email' => $data['customer_email'] ?? null,
                    'service_key' => $data['service_key'],
                    'service_name_en' => $service['name_en'],
                    'service_name_ar' => $service['name_ar'],
                    'additional_services' => $extra,
                    'vehicle_make' => $data['vehicle_make'] ?? null,
                    'vehicle_model' => $data['vehicle_model'] ?? null,
                    'vehicle_year' => $data['vehicle_year'] ?? null,
                    'appointment_date' => $date,
                    'appointment_time' => $time,
                    'photo_urls' => array_values($data['photo_urls'] ?? []),
                    'notes' => $data['notes'] ?? null,
                    'status' => 'pending',
                ]);
            });
        } catch (\Throwable $e) {
            Log::warning('Appointment create failed: '.$e->getMessage(), ['store_id' => $id]);

            return response()->json(['message' => 'Could not save appointment.'], 500);
        }

        if (! $row) {
            return response()->json([
                'message' => 'This time slot is already booked. Please choose another time.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $this->serialize($row),
            'whatsapp' => $this->whatsappDeepLink($row),
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $id = $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        if (! Schema::hasTable('store_appointments')) {
            return response()->json(['success' => true, 'store_id' => $id, 'data' => []]);
        }

        $q = StoreAppointment::query()->where('store_id', $id)->orderByDesc('appointment_date')->orderByDesc('appointment_time');

        $status = trim((string) $request->query('status', ''));
        if ($status !== '' && in_array($status, self::STATUSES, true)) {
            $q->where('status', $status);
        }

        $rows = $q->limit(200)->get()->map(fn ($row) => $this->serialize($row))->values();

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $rows,
        ]);
    }

    public function update(Request $request, string $appointmentId): JsonResponse
    {
        $id = $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        if (! Schema::hasTable('store_appointments')) {
            return response()->json(['message' => 'Appointments unavailable.'], 503);
        }

        $row = StoreAppointment::query()
            ->where('store_id', $id)
            ->where('id', $appointmentId)
            ->first();

        if (! $row) {
            return response()->json(['message' => 'Appointment not found.'], 404);
        }

        $data = $request->validate([
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'staff_name' => ['nullable', 'string', 'max:120'],
            'staff_id' => ['nullable', 'string', 'max:64'],
            'admin_note' => ['nullable', 'string', 'max:2000'],
            'appointment_date' => ['nullable', 'date'],
            'appointment_time' => ['nullable', 'string', 'max:16', Rule::in(self::SLOT_TIMES)],
        ]);

        if (isset($data['appointment_date']) || isset($data['appointment_time'])) {
            $date = substr((string) ($data['appointment_date'] ?? $row->appointment_date?->format('Y-m-d')), 0, 10);
            $time = substr((string) ($data['appointment_time'] ?? $row->appointment_time), 0, 5);
            $clash = StoreAppointment::query()
                ->where('store_id', $id)
                ->where('id', '!=', $row->id)
                ->whereDate('appointment_date', $date)
                ->where('appointment_time', $time)
                ->whereIn('status', ['pending', 'approved'])
                ->exists();
            if ($clash) {
                return response()->json(['message' => 'Time slot already taken.'], 409);
            }
            $row->appointment_date = $date;
            $row->appointment_time = $time;
        }

        foreach (['status', 'staff_name', 'staff_id', 'admin_note'] as $field) {
            if (array_key_exists($field, $data)) {
                $row->{$field} = $data[$field];
            }
        }
        $row->save();

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $this->serialize($row),
        ]);
    }

    /** @return list<array<string, mixed>> */
    private function catalogForStore(string $storeId): array
    {
        // Shared service catalog for Al-Saeedi; isolated by store_id on bookings.
        if (! in_array($storeId, ['store-bleco', 'bleco', 'store-car'], true)
            && ! str_contains(strtolower($storeId), 'bleco')
            && ! str_contains(strtolower($storeId), 'alsaeedi')) {
            // Other stores get empty services until they configure their own.
            return [];
        }

        return [
            [
                'key' => 'interior_upholstery',
                'name_en' => 'Car Interior Upholstery & Renovation',
                'name_ar' => 'تنجيد وتجديد المقصورة الداخلية',
                'duration_min' => 180,
                'from_price' => 450,
                'image' => '/images/categories/vip-luxury-seat-covers.jpg',
            ],
            [
                'key' => 'dashboard_renovation',
                'name_en' => 'Dashboard Renovation',
                'name_ar' => 'تجديد لوحة القيادة',
                'duration_min' => 120,
                'from_price' => 350,
                'image' => '/images/categories/car-accessories.jpg',
            ],
            [
                'key' => 'window_tinting',
                'name_en' => 'Window Tinting & Heat Insulation',
                'name_ar' => 'تظليل النوافذ والعزل الحراري',
                'duration_min' => 90,
                'from_price' => 280,
                'image' => '/images/categories/car-care-bleco.jpg',
            ],
            [
                'key' => 'ppf',
                'name_en' => 'Paint Protection Film (PPF)',
                'name_ar' => 'فيلم حماية الطلاء',
                'duration_min' => 240,
                'from_price' => 900,
                'image' => '/images/categories/car-care-bleco.jpg',
            ],
            [
                'key' => 'polishing_detailing',
                'name_en' => 'Car Polishing & Detailing',
                'name_ar' => 'تلميع وتفصيل السيارة',
                'duration_min' => 150,
                'from_price' => 220,
                'image' => '/images/categories/upholstery-tools.jpg',
            ],
            [
                'key' => 'steering_gear_upholstery',
                'name_en' => 'Steering Wheel & Gear Knob Upholstery',
                'name_ar' => 'تنجيد المقود وقبضة ناقل الحركة',
                'duration_min' => 60,
                'from_price' => 150,
                'image' => '/images/categories/vip-luxury-seat-covers.jpg',
            ],
        ];
    }

    private function serialize(StoreAppointment $row): array
    {
        return [
            'id' => $row->id,
            'store_id' => $row->store_id,
            'customer_name' => $row->customer_name,
            'customer_phone' => $row->customer_phone,
            'customer_email' => $row->customer_email,
            'service_key' => $row->service_key,
            'service_name_en' => $row->service_name_en,
            'service_name_ar' => $row->service_name_ar,
            'additional_services' => $row->additional_services ?? [],
            'vehicle_make' => $row->vehicle_make,
            'vehicle_model' => $row->vehicle_model,
            'vehicle_year' => $row->vehicle_year,
            'appointment_date' => $row->appointment_date?->format('Y-m-d'),
            'appointment_time' => substr((string) $row->appointment_time, 0, 5),
            'photo_urls' => $row->photo_urls ?? [],
            'notes' => $row->notes,
            'status' => $row->status,
            'staff_name' => $row->staff_name,
            'staff_id' => $row->staff_id,
            'admin_note' => $row->admin_note,
            'created_at' => optional($row->created_at)?->toIso8601String(),
            'updated_at' => optional($row->updated_at)?->toIso8601String(),
        ];
    }

    private function whatsappDeepLink(StoreAppointment $row): string
    {
        $phone = '966597757086';
        $msg = sprintf(
            'Appointment %s | %s | %s %s | %s %s %s | %s',
            $row->id,
            $row->service_name_en ?: $row->service_key,
            $row->appointment_date?->format('Y-m-d'),
            substr((string) $row->appointment_time, 0, 5),
            $row->vehicle_make,
            $row->vehicle_model,
            $row->vehicle_year,
            $row->customer_name
        );

        return 'https://wa.me/'.$phone.'?text='.rawurlencode($msg);
    }
}
