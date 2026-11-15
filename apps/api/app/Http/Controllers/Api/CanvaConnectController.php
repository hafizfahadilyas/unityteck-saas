<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CanvaConnectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Official Canva Connect — Master Admin testing surface only.
 * Existing Design Studio (CanvaImageStudioModal) is untouched.
 */
class CanvaConnectController extends Controller
{
    public function __construct(protected CanvaConnectService $canva) {}

    private function requireMaster(Request $request): ?JsonResponse
    {
        $portal = strtolower((string) $request->header('X-Portal', $request->attributes->get('portal', '')));
        $user = $request->user();
        if ($portal !== 'master' || ! $user || $user->role !== 'super_admin') {
            return response()->json(['message' => 'Master SuperAdmin required.'], 403);
        }

        return null;
    }

    public function status(Request $request): JsonResponse
    {
        if ($deny = $this->requireMaster($request)) {
            return $deny;
        }

        return response()->json([
            'data' => $this->canva->connectionStatus(CanvaConnectService::OWNER_MASTER),
        ]);
    }

    public function authUrl(Request $request): JsonResponse
    {
        if ($deny = $this->requireMaster($request)) {
            return $deny;
        }

        if (! $this->canva->isConfigured()) {
            return response()->json([
                'message' => 'Set CANVA_CLIENT_ID and CANVA_CLIENT_SECRET on the API .env, then create a public/private app in Canva Developer Portal.',
                'error' => 'not_configured',
                'configured' => false,
            ], 400);
        }

        if (! $this->canva->tableReady()) {
            return response()->json([
                'message' => 'canva_oauth_connections table missing. Run the Canva OAuth migration.',
                'error' => 'table_missing',
            ], 503);
        }

        try {
            $payload = $this->canva->beginAuthorization($request->input('redirect_uri'));
        } catch (\RuntimeException $e) {
            $code = $e->getMessage();
            $msg = $code === 'CANVA_REDIRECT_MISSING'
                ? 'Set CANVA_REDIRECT_URI or pass redirect_uri (Master SPA URL with tab=canva-real).'
                : 'Canva OAuth is not configured.';

            return response()->json(['message' => $msg, 'error' => strtolower($code)], 400);
        }

        return response()->json([
            'auth_url' => $payload['auth_url'],
            'state' => $payload['state'],
            'redirect_uri' => $payload['redirect_uri'],
            'scopes' => $payload['scopes'],
            'configured' => true,
        ]);
    }

    public function callback(Request $request): JsonResponse
    {
        if ($deny = $this->requireMaster($request)) {
            return $deny;
        }

        $data = $request->validate([
            'code' => ['required', 'string', 'max:2048'],
            'state' => ['required', 'string', 'max:256'],
            'redirect_uri' => ['nullable', 'string', 'max:500'],
        ]);

        if (! $this->canva->tableReady()) {
            return response()->json([
                'message' => 'canva_oauth_connections table missing.',
                'error' => 'table_missing',
            ], 503);
        }

        $result = $this->canva->exchangeAuthorizationCode(
            $data['code'],
            $data['state'],
            $data['redirect_uri'] ?? null,
        );

        if (! ($result['success'] ?? false)) {
            return response()->json([
                'message' => $result['message'] ?? 'Canva connect failed.',
                'error' => $result['error'] ?? 'callback_failed',
            ], 400);
        }

        return response()->json([
            'ok' => true,
            'data' => $this->canva->connectionStatus(CanvaConnectService::OWNER_MASTER),
        ]);
    }

    public function disconnect(Request $request): JsonResponse
    {
        if ($deny = $this->requireMaster($request)) {
            return $deny;
        }

        $this->canva->disconnect(CanvaConnectService::OWNER_MASTER);

        return response()->json([
            'ok' => true,
            'data' => $this->canva->connectionStatus(CanvaConnectService::OWNER_MASTER),
        ]);
    }

    public function createDesign(Request $request): JsonResponse
    {
        if ($deny = $this->requireMaster($request)) {
            return $deny;
        }

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'width' => ['nullable', 'integer', 'min:40', 'max:8000'],
            'height' => ['nullable', 'integer', 'min:40', 'max:8000'],
            'preset' => ['nullable', 'string', 'max:64'],
        ]);

        $result = $this->canva->createDesign($data, CanvaConnectService::OWNER_MASTER);
        if (! ($result['success'] ?? false)) {
            $status = ($result['error'] ?? '') === 'not_connected' ? 409 : 400;

            return response()->json([
                'message' => $result['message'] ?? 'Create failed.',
                'error' => $result['error'] ?? 'create_failed',
            ], $status);
        }

        return response()->json(['data' => $result['design']]);
    }

    public function listDesigns(Request $request): JsonResponse
    {
        if ($deny = $this->requireMaster($request)) {
            return $deny;
        }

        $limit = (int) $request->query('limit', 20);
        $result = $this->canva->listDesigns(CanvaConnectService::OWNER_MASTER, $limit);
        if (! ($result['success'] ?? false)) {
            $status = ($result['error'] ?? '') === 'not_connected' ? 409 : 400;

            return response()->json([
                'message' => $result['message'] ?? 'List failed.',
                'error' => $result['error'] ?? 'list_failed',
            ], $status);
        }

        return response()->json([
            'data' => $result['items'] ?? [],
            'continuation' => $result['continuation'] ?? null,
        ]);
    }

    public function exportDesign(Request $request, string $designId): JsonResponse
    {
        if ($deny = $this->requireMaster($request)) {
            return $deny;
        }

        $designId = trim($designId);
        if ($designId === '') {
            return response()->json(['message' => 'design_id required.', 'error' => 'missing_design_id'], 422);
        }

        $result = $this->canva->exportDesignPng($designId, CanvaConnectService::OWNER_MASTER);
        if (! ($result['success'] ?? false)) {
            $status = ($result['error'] ?? '') === 'not_connected' ? 409 : 400;

            return response()->json([
                'message' => $result['message'] ?? 'Export failed.',
                'error' => $result['error'] ?? 'export_failed',
                'job' => $result['job'] ?? null,
            ], $status);
        }

        return response()->json([
            'data' => [
                'urls' => $result['urls'] ?? [],
                'job' => $result['job'] ?? null,
            ],
        ]);
    }
}
