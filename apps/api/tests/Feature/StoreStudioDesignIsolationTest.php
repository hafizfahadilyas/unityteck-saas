<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StoreStudioDesignIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_designs_are_isolated_by_store(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');
        $user = $this->memberOf('store-a');

        DB::table('store_studio_designs')->insert([
            'id' => 'dsd-a',
            'store_id' => 'store-a',
            'editor_type' => 'banner',
            'category' => 'banner',
            'title' => 'A Banner',
            'width' => 1600,
            'height' => 600,
            'design_json' => json_encode(['elements' => []]),
            'source' => 'studio',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('store_studio_designs')->insert([
            'id' => 'dsd-b',
            'store_id' => 'store-b',
            'editor_type' => 'logo',
            'category' => 'logo',
            'title' => 'B Logo',
            'width' => 800,
            'height' => 800,
            'design_json' => json_encode(['elements' => []]),
            'source' => 'studio',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/studio-designs')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', 'dsd-a');
    }

    private function insertStore(string $id, string $slug): void
    {
        DB::table('stores')->insert([
            'id' => $id,
            'name' => $id,
            'slug' => $slug,
            'status' => 'active',
            'plan' => 'free',
            'currency' => 'SAR',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function memberOf(string $storeId): User
    {
        $userId = 'user-'.$storeId;
        DB::table('users')->insert([
            'id' => $userId,
            'name' => $storeId,
            'email' => $storeId.'@example.com',
            'password' => bcrypt('secret-pass'),
            'role' => 'store_staff',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('store_users')->insert([
            'id' => 'su-'.$storeId,
            'store_id' => $storeId,
            'user_id' => $userId,
            'role' => 'store_staff',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return User::query()->findOrFail($userId);
    }
}
