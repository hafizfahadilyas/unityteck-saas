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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const RESET_TTL_MINUTES = 60;

    private const OTP_TTL_MINUTES = 5;

    /**
     * Password login closed — email OTP (Clerk) or /auth/otp/verify only.
     */
    public function masterLogin(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Password login is disabled. Use email verification code (OTP).',
            'code' => 'OTP_REQUIRED',
        ], 403);
    }

    /**
     * Password login closed — email OTP (Clerk) or /auth/otp/verify only.
     */
    public function storeLogin(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Password login is disabled. Use email verification code (OTP).',
            'code' => 'OTP_REQUIRED',
        ], 403);
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
            ? $this->resolveStorePortalRole($user, $membership->role)
            : $normalized;

        $store = $membership
            ? Store::query()->find($membership->store_id)
            : null;

        $desc = Roles::describe($role);
        $roleLabel = $portal === 'store' && $role === Roles::ADMIN
            ? 'Store Owner'
            : $desc['label'];

        return response()->json([
            'portal' => $portal,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $desc['slug'],
                'role_label' => $roleLabel,
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
        $roleLabel = $portal === 'store' && $role === Roles::ADMIN
            ? 'Store Owner'
            : $desc['label'];

        return [
            'token' => $token,
            'portal' => $portal,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $desc['slug'],
                'role_label' => $roleLabel,
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
     * Request OTP (1 minute TTL). Login always stores a code.
     * Real inbox delivery requires MAIL_MAILER=smtp; log/array only write to laravel.log.
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
        $userOk = $user && $this->userMatchesPortal($user, $data['portal']);

        $public = [
            'ok' => true,
            'message' => 'If that email exists, a code was sent.',
            'delivery' => 'stubbed',
            'expires_in' => self::OTP_TTL_MINUTES * 60,
        ];

        // Reset: do not reveal whether account exists
        if ($data['purpose'] === 'reset' && ! $userOk) {
            return response()->json($public);
        }

        // Login: always create OTP (passwordless / unknown email handled on verify + SPA fallback)
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

        $subject = $data['purpose'] === 'reset'
            ? 'UnityTeck password reset code'
            : 'UnityTeck login verification code';
        $html = '<p>Your verification code is <strong style="font-size:20px;letter-spacing:3px">'
            . e($code)
            . '</strong>.</p><p>This code expires in '
            . self::OTP_TTL_MINUTES
            . ' minute(s). If you did not request it, ignore this email.</p>';

        $delivery = 'failed';
        try {
            $mailer = (string) config('mail.default', 'log');
            Mail::mailer($mailer)->html($html, function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
            });
            $delivery = in_array($mailer, ['log', 'array'], true) ? 'logged' : 'email';
            Log::info('auth.otp_email_sent', [
                'email' => $email,
                'portal' => $data['portal'],
                'purpose' => $data['purpose'],
                'mailer' => $mailer,
            ]);
        } catch (\Throwable $e) {
            $delivery = 'failed';
            Log::warning('auth.otp_email_failed', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
        }

        $public['delivery'] = $delivery;
        $public['message'] = $delivery === 'email'
            ? 'Verification code sent to your email.'
            : 'SMTP not configured for real inbox — use on-screen / returned code.';

        // Reveal code whenever real SMTP delivery did not happen (or debug)
        if ($this->shouldRevealStubSecrets() || $delivery !== 'email') {
            $public['dev_code'] = $code;
        }

        return response()->json($public);
    }

    /**
     * After Clerk verifies email OTP, mint a Sanctum PAT.
     * Requires clerk_token — email alone cannot mint a session.
     */
    public function exchangeClerkSession(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'portal' => ['required', 'in:master,store'],
            'store_id' => ['nullable', 'string'],
            'clerk_token' => ['required', 'string', 'min:20'],
        ]);

        // Hostinger MySQL cold-start can be 20–50s — wake the PDO before Clerk + membership queries.
        try {
            DB::select('select 1 as ok');
        } catch (\Throwable) {
            // assert path / createToken will surface a real DB error if still down
        }

        $email = Str::lower(trim($data['email']));
        // Clerk owns the OTP email (may be +clerk_test). Membership uses registered store email.
        $this->assertClerkTokenOwnsEmail($data['clerk_token'], $email);
        $accountEmail = $this->normalizeClerkDevLoginEmail($email);

        $user = User::query()->where('email', $accountEmail)->first();
        if (! $user && $accountEmail !== $email) {
            $user = User::query()->where('email', $email)->first();
        }

        if (! $user || ! $this->userMatchesPortal($user, $data['portal'])) {
            throw ValidationException::withMessages([
                'email' => ['No matching account for this portal.'],
            ]);
        }

        if ($data['portal'] === 'master') {
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
        // Master SuperAdmin Active/Inactive — Hostinger MySQL (default true when column null).
        if ($store && $store->getAttribute('login_email_active') === false) {
            throw ValidationException::withMessages([
                'email' => ['This store login email is inactive. Contact platform support.'],
            ]);
        }
        $role = $this->resolveStorePortalRole($user, $membership->role);

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

    /**
     * Verify OTP. For purpose=login, issues a lifetime Sanctum session token.
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

        if ($data['purpose'] !== 'login') {
            return response()->json([
                'ok' => true,
                'verified' => true,
                'message' => 'Code verified.',
            ]);
        }

        $user = User::query()->where('email', $email)->first();
        if (! $user || ! $this->userMatchesPortal($user, $data['portal'])) {
            throw ValidationException::withMessages([
                'email' => ['No matching account for this portal.'],
            ]);
        }

        if ($data['portal'] === 'master') {
            $token = $user->createToken('master', ['portal:master'])->plainTextToken;

            return response()->json(array_merge(
                $this->authPayload($user, 'master', $token, null, null, Roles::SUPER_ADMIN),
                ['ok' => true, 'verified' => true, 'message' => 'Code verified.']
            ));
        }

        $membership = StoreUser::query()
            ->where('user_id', $user->id)
            ->orderBy('created_at')
            ->first();

        if (! $membership) {
            return response()->json([
                'message' => 'No store membership for this account.',
            ], 403);
        }

        $store = Store::query()->find($membership->store_id);
        $role = $this->resolveStorePortalRole($user, $membership->role);

        $token = $user->createToken('store', [
            'portal:store',
            'store:'.$membership->store_id,
        ])->plainTextToken;

        return response()->json(array_merge(
            $this->authPayload(
                $user,
                'store',
                $token,
                $membership->store_id,
                $store?->name,
                $role
            ),
            ['ok' => true, 'verified' => true, 'message' => 'Code verified.']
        ));
    }

    /**
     * Primary merchant seats (flowers / coffee / bleco owners) must keep products.write.
     * Legacy store_owner / bad membership slug must not collapse to viewer.
     */
    private function resolveStorePortalRole(User $user, ?string $membershipRole): string
    {
        $fromMembership = Roles::normalize($membershipRole ?: $user->role);
        $fromUser = Roles::normalize($user->role);

        if (in_array($fromMembership, [Roles::ADMIN, Roles::MANAGER], true)) {
            return $fromMembership;
        }

        // User record says admin/manager but membership slug was legacy/unknown → restore write access
        if (in_array($fromUser, [Roles::ADMIN, Roles::MANAGER], true)) {
            return $fromUser;
        }

        // Explicit limited seats stay limited
        if (in_array($fromMembership, [
            Roles::SUPPORT,
            Roles::SALES,
            Roles::MARKETING,
            Roles::SEO,
            Roles::CONTENT,
            Roles::DEVELOPER,
        ], true)) {
            return $fromMembership;
        }

        // Unknown / viewer on a store login with owner-like user name slug → admin
        $raw = strtolower(trim((string) ($membershipRole ?: $user->role)));
        if (in_array($raw, ['store_owner', 'owner', 'storeowner', ''], true)) {
            return Roles::ADMIN;
        }

        return $fromMembership;
    }

    private function userMatchesPortal(User $user, string $portal): bool
    {
        $role = Roles::normalize($user->role);

        if ($portal === 'master') {
            return $role === Roles::SUPER_ADMIN;
        }

        return $role !== Roles::SUPER_ADMIN;
    }

    /**
     * Strip Clerk reserved `+clerk_test` subaddress so Sanctum maps to the real store user.
     * Example: mieraf.sa8+clerk_test@gmail.com → mieraf.sa8@gmail.com
     */
    private function normalizeClerkDevLoginEmail(string $email): string
    {
        $email = Str::lower(trim($email));
        if (! str_contains($email, '@')) {
            return $email;
        }

        [$local, $domain] = explode('@', $email, 2);
        $local = (string) preg_replace('/\+clerk_test.*$/i', '', $local);

        return $local.'@'.$domain;
    }

    /**
     * Prove Clerk OTP session owns this email before minting Sanctum.
     * Prefer CLERK_SECRET_KEY (Backend API). Without it, reject in production;
     * local/debug still requires a well-formed JWT with matching email claim.
     */
    private function assertClerkTokenOwnsEmail(string $clerkToken, string $email): void
    {
        $parts = explode('.', $clerkToken);
        if (count($parts) !== 3) {
            throw ValidationException::withMessages([
                'clerk_token' => ['Invalid verification session. Complete email OTP again.'],
            ]);
        }

        $payloadJson = base64_decode(strtr($parts[1], '-_', '+/'), true);
        $payload = is_string($payloadJson) ? json_decode($payloadJson, true) : null;
        if (! is_array($payload)) {
            throw ValidationException::withMessages([
                'clerk_token' => ['Invalid verification session. Complete email OTP again.'],
            ]);
        }

        if (isset($payload['exp']) && (int) $payload['exp'] < time()) {
            throw ValidationException::withMessages([
                'clerk_token' => ['Verification session expired. Request a new OTP.'],
            ]);
        }

        $secret = (string) config('services.clerk.secret', '');
        if ($secret !== '') {
            $sessionId = (string) ($payload['sid'] ?? '');
            if ($sessionId === '') {
                throw ValidationException::withMessages([
                    'clerk_token' => ['Invalid verification session. Complete email OTP again.'],
                ]);
            }

            $sessionResp = $this->clerkHttp($secret)
                ->get('https://api.clerk.com/v1/sessions/'.$sessionId);

            if (! $sessionResp->successful()) {
                throw ValidationException::withMessages([
                    'clerk_token' => ['Could not verify OTP session with identity provider.'],
                ]);
            }

            $status = (string) $sessionResp->json('status');
            if (! in_array($status, ['active', 'pending'], true)) {
                throw ValidationException::withMessages([
                    'clerk_token' => ['OTP session is not active. Request a new code.'],
                ]);
            }

            $userId = (string) ($sessionResp->json('user_id') ?: ($payload['sub'] ?? ''));
            if ($userId === '') {
                throw ValidationException::withMessages([
                    'clerk_token' => ['Could not resolve verified user from OTP session.'],
                ]);
            }

            $userResp = $this->clerkHttp($secret)
                ->get('https://api.clerk.com/v1/users/'.$userId);

            if (! $userResp->successful()) {
                throw ValidationException::withMessages([
                    'clerk_token' => ['Could not verify email ownership after OTP.'],
                ]);
            }

            $emails = collect($userResp->json('email_addresses') ?? [])
                ->pluck('email_address')
                ->filter()
                ->map(fn ($e) => Str::lower((string) $e))
                ->values()
                ->all();

            if (! in_array($email, $emails, true)) {
                throw ValidationException::withMessages([
                    'clerk_token' => ['Verified OTP email does not match login email.'],
                ]);
            }

            return;
        }

        // Unsigned JWT checks are forgeable — never mint Sanctum without Clerk secret.
        throw ValidationException::withMessages([
            'clerk_token' => ['CLERK_SECRET_KEY is required to verify OTP sessions.'],
        ]);
    }

    /**
     * Clerk Backend API client. Local Windows often lacks a CA bundle (cURL 60),
     * which blocks OTP → Sanctum exchange — relax verify only outside production.
     */
    private function clerkHttp(string $secret): \Illuminate\Http\Client\PendingRequest
    {
        // Two sequential Clerk calls (session + user) + Hostinger DB. Client exchange budget is 60s.
        $req = Http::withToken($secret)
            ->acceptJson()
            ->timeout(20)
            ->connectTimeout(8);

        if (! app()->environment('production')) {
            $req = $req->withOptions(['verify' => false]);
        }

        return $req;
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
