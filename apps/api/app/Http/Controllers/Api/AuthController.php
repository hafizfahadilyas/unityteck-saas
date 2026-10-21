<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuthOtp;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use App\Support\Roles;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const RESET_TTL_MINUTES = 60;

    private const OTP_TTL_MINUTES = 10;

    public function masterLogin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $input = strtolower(trim($data['email']));
        $masterAliases = ['master', 'admin', 'superadmin', 'master@unityteck.com'];
        $email = in_array($input, $masterAliases, true) ? 'master@unityteck.com' : $input;

        $user = User::query()->where('email', $email)->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        if (Roles::normalize($user->role) !== Roles::SUPER_ADMIN) {
            return response()->json([
                'message' => 'This account cannot access Master Admin.',
            ], 403);
        }

        $user->tokens()->where('name', 'master')->delete();
        $token = $user->createToken('master', ['portal:master'])->plainTextToken;

        return response()->json($this->authPayload(
            $user,
            'master',
            $token,
            null,
            null,
            Roles::SUPER_ADMIN
        ));
    }

    public function storeLogin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
            'store_id' => ['nullable', 'string'],
        ]);

        $input = strtolower(trim($data['email']));

        $aliasMap = [
            'admin@giftshop-sa.com' => 'giftshop2030m@gmail.com',
            'makkah' => 'giftshop2030m@gmail.com',
            'ward' => 'giftshop2030m@gmail.com',
            'flowers' => 'giftshop2030m@gmail.com',
            'gifts' => 'giftshop2030m@gmail.com',
            'giftshop' => 'giftshop2030m@gmail.com',
            'giftshop2030m@gmail.com' => 'giftshop2030m@gmail.com',
            'tariq@wardalmakkah.sa' => 'giftshop2030m@gmail.com',
            'admin@bleco.sa' => 'owner@tanjeedmakkah.com',
            'bleco' => 'owner@tanjeedmakkah.com',
            'car' => 'owner@tanjeedmakkah.com',
            'tanjeed' => 'owner@tanjeedmakkah.com',
            'alsaeedi' => 'owner@tanjeedmakkah.com',
            'blacko' => 'owner@tanjeedmakkah.com',
            'coffee' => 'rayan@specialtycoffee.sa',
            'rayan' => 'rayan@specialtycoffee.sa',
            'specialtycoffee' => 'rayan@specialtycoffee.sa',
            'coffee@specialtycoffee.sa' => 'rayan@specialtycoffee.sa',
            'admin@specialtycoffee.sa' => 'rayan@specialtycoffee.sa',
        ];

        $targetEmail = $aliasMap[$input] ?? $input;

        $user = User::query()->where('email', $targetEmail)->first();

        $passwordValid = false;
        if ($user) {
            $passwordValid = Hash::check($data['password'], $user->password);
            if (! $passwordValid && in_array($targetEmail, ['owner@tanjeedmakkah.com', 'support@tanjeedmakkah.com'], true)) {
                $alternate = str_contains($data['password'], 'Blacko')
                    ? str_replace('Blacko', 'Bleco', $data['password'])
                    : str_replace('Bleco', 'Blacko', $data['password']);
                $passwordValid = Hash::check($alternate, $user->password);
            }
        }

        if (! $user || ! $passwordValid) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        if (Roles::normalize($user->role) === Roles::SUPER_ADMIN) {
            return response()->json([
                'message' => 'Use Master Admin login for this account.',
            ], 403);
        }

        $membershipQuery = StoreUser::query()->where('user_id', $user->id);
        if (! empty($data['store_id'])) {
            $membershipQuery->where('store_id', $data['store_id']);
        }

        $membership = $membershipQuery->orderBy('created_at')->first();

        if (! $membership) {
            return response()->json([
                'message' => 'No store membership for this account.',
            ], 403);
        }

        $store = Store::query()->find($membership->store_id);
        $role = Roles::normalize($membership->role ?: $user->role);

        $user->tokens()->where('name', 'store')->delete();
        $token = $user->createToken('store', [
            'portal:store',
            'store:'.$membership->store_id,
        ])->plainTextToken;

        return response()->json($this->authPayload(
            $user,
            'store',
            $token,
            $membership->store_id,
            $store?->name,
            $role
        ));
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $membership = StoreUser::query()
            ->where('user_id', $user->id)
            ->orderBy('created_at')
            ->first();

        $normalized = Roles::normalize($user->role);
        $portal = $normalized === Roles::SUPER_ADMIN ? 'master' : 'store';
        $role = $portal === 'store' && $membership
            ? Roles::normalize($membership->role ?: $user->role)
            : $normalized;

        $store = $membership
            ? Store::query()->find($membership->store_id)
            : null;

        $desc = Roles::describe($role);

        return response()->json([
            'portal' => $portal,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $desc['slug'],
                'role_label' => $desc['label'],
                'role_level' => $desc['level'],
            ],
            'abilities' => $desc['abilities'],
            'store_id' => $membership?->store_id,
            'store_name' => $store?->name,
        ]);
    }

    /** Phase 2.3 — role catalog for portal pickers / docs. */
    public function roles(Request $request): JsonResponse
    {
        $portal = $request->query('portal');
        if ($portal !== null && ! in_array($portal, ['master', 'store'], true)) {
            $portal = null;
        }

        return response()->json([
            'roles' => Roles::listForPortal($portal),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function authPayload(
        User $user,
        string $portal,
        string $token,
        ?string $storeId,
        ?string $storeName,
        string $role,
    ): array {
        $desc = Roles::describe($role);

        return [
            'token' => $token,
            'portal' => $portal,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $desc['slug'],
                'role_label' => $desc['label'],
                'role_level' => $desc['level'],
            ],
            'abilities' => $desc['abilities'],
            'store_id' => $storeId,
            'store_name' => $storeName,
        ];
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()?->currentAccessToken();
        if ($token) {
            $token->delete();
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Phase 2.2 — request password reset. Email delivery stubbed (log + optional reveal).
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'portal' => ['required', 'in:master,store'],
        ]);

        $email = Str::lower($data['email']);
        $user = User::query()->where('email', $email)->first();

        // Always same public message (no email enumeration).
        $public = [
            'ok' => true,
            'message' => 'If that email exists, a reset link was sent.',
            'delivery' => 'stubbed',
        ];

        if (! $user || ! $this->userMatchesPortal($user, $data['portal'])) {
            return response()->json($public);
        }

        $plain = Str::random(64);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => Hash::make($plain),
                'created_at' => now(),
            ]
        );

        Log::info('auth.password_reset_stub', [
            'email' => $email,
            'portal' => $data['portal'],
        ]);

        if ($this->shouldRevealStubSecrets()) {
            $public['dev_token'] = $plain;
            $public['dev_email'] = $email;
        }

        return response()->json($public);
    }

    /**
     * Phase 2.2 — confirm password reset with token; revoke Sanctum tokens.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'portal' => ['required', 'in:master,store'],
        ]);

        $email = Str::lower($data['email']);
        $user = User::query()->where('email', $email)->first();

        if (! $user || ! $this->userMatchesPortal($user, $data['portal'])) {
            throw ValidationException::withMessages([
                'email' => ['Invalid or expired reset link.'],
            ]);
        }

        $row = DB::table('password_reset_tokens')->where('email', $email)->first();
        if (! $row || ! Hash::check($data['token'], $row->token)) {
            throw ValidationException::withMessages([
                'token' => ['Invalid or expired reset link.'],
            ]);
        }

        $created = $row->created_at ? strtotime((string) $row->created_at) : 0;
        if ($created < now()->subMinutes(self::RESET_TTL_MINUTES)->getTimestamp()) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            throw ValidationException::withMessages([
                'token' => ['This reset link has expired. Request a new one.'],
            ]);
        }

        $user->password = $data['password'];
        $user->save();
        $user->tokens()->delete();
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        Log::info('auth.password_reset_done', [
            'email' => $email,
            'portal' => $data['portal'],
        ]);

        return response()->json([
            'ok' => true,
            'message' => 'Password updated. You can sign in now.',
        ]);
    }

    /**
     * Phase 2.2 — OTP request stub (no SMS/email provider yet).
     */
    public function requestOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'portal' => ['required', 'in:master,store'],
            'purpose' => ['required', 'in:login,reset'],
        ]);

        $email = Str::lower($data['email']);
        $user = User::query()->where('email', $email)->first();

        $public = [
            'ok' => true,
            'message' => 'If that email exists, a code was sent.',
            'delivery' => 'stubbed',
            'expires_in' => self::OTP_TTL_MINUTES * 60,
        ];

        if (! $user || ! $this->userMatchesPortal($user, $data['portal'])) {
            return response()->json($public);
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        AuthOtp::query()
            ->where('email', $email)
            ->where('portal', $data['portal'])
            ->where('purpose', $data['purpose'])
            ->whereNull('consumed_at')
            ->delete();

        AuthOtp::query()->create([
            'email' => $email,
            'portal' => $data['portal'],
            'purpose' => $data['purpose'],
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(self::OTP_TTL_MINUTES),
        ]);

        Log::info('auth.otp_stub', [
            'email' => $email,
            'portal' => $data['portal'],
            'purpose' => $data['purpose'],
        ]);

        if ($this->shouldRevealStubSecrets()) {
            $public['dev_code'] = $code;
        }

        return response()->json($public);
    }

    /**
     * Phase 2.2 — verify OTP stub (does not issue session yet — Phase 2.3+ roles).
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'portal' => ['required', 'in:master,store'],
            'purpose' => ['required', 'in:login,reset'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $email = Str::lower($data['email']);

        $otp = AuthOtp::query()
            ->where('email', $email)
            ->where('portal', $data['portal'])
            ->where('purpose', $data['purpose'])
            ->whereNull('consumed_at')
            ->orderByDesc('id')
            ->first();

        if (! $otp || $otp->expires_at->isPast() || ! Hash::check($data['code'], $otp->code_hash)) {
            throw ValidationException::withMessages([
                'code' => ['Invalid or expired code.'],
            ]);
        }

        $otp->consumed_at = now();
        $otp->save();

        return response()->json([
            'ok' => true,
            'verified' => true,
            'message' => 'Code verified.',
        ]);
    }

    private function userMatchesPortal(User $user, string $portal): bool
    {
        $role = Roles::normalize($user->role);

        if ($portal === 'master') {
            return $role === Roles::SUPER_ADMIN;
        }

        return $role !== Roles::SUPER_ADMIN;
    }

    /** Reveal stub token/code only in local/debug — never assume production mailer. */
    private function shouldRevealStubSecrets(): bool
    {
        if (filter_var(env('AUTH_STUB_REVEAL', false), FILTER_VALIDATE_BOOLEAN)) {
            return true;
        }

        return (bool) config('app.debug');
    }
}
