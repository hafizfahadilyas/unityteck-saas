<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeMediaUploadTest extends TestCase
{
    use RefreshDatabase;

    private const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    public function test_upload_stays_in_the_url_store_folder_with_version(): void
    {
        Storage::fake('public');
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');

        Sanctum::actingAs($this->memberOf('store-b'));
        $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-a/media', [
                'url' => self::PNG,
                'file_name' => 'leak.png',
                'store_id' => 'store-a',
            ])
            ->assertStatus(403);

        $this->assertSame([], Storage::disk('public')->allFiles('stores/store-a'));

        Sanctum::actingAs($this->memberOf('store-a'));
        $response = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/media', [
                'url' => self::PNG,
                'file_name' => 'hero.png',
                'store_id' => 'store-b',
            ])
            ->assertCreated();

        $url = (string) $response->json('data.url');
        $version = \Carbon\Carbon::parse($response->json('data.updated_at'))->timestamp;
        $this->assertStringContainsString('/stores/store-a/media/', $url);
        $this->assertStringContainsString('?v='.$version, $url);
        $this->assertStringNotContainsString('/stores/store-b/', $url);
        $this->assertSame('store-a', $response->json('data.store_id'));

        $relative = ltrim(strtok(str_replace('/storage/', '', $url), '?') ?: '', '/');
        Storage::disk('public')->assertExists($relative);
        $this->assertSame([], Storage::disk('public')->allFiles('stores/store-b'));
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
