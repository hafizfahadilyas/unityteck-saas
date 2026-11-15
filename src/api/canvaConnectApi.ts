/**
 * Official Canva Connect — Master Admin testing API client.
 * Separate from in-app Design Studio / KSA templates.
 */
import { apiFetch } from './client';

export type CanvaConnectStatus = {
  configured: boolean;
  connected: boolean;
  table_ready: boolean;
  display_name?: string | null;
  token_expires_at?: string | null;
  scopes: string[];
  granted_scopes?: string | null;
  last_error?: string | null;
  client_id_set?: boolean;
  redirect_uri?: string | null;
  message?: string;
};

export type CanvaConnectDesign = {
  id?: string;
  title?: string;
  urls?: { edit_url?: string; view_url?: string };
  thumbnail?: { url?: string; width?: number; height?: number };
  created_at?: number;
  updated_at?: number;
};

export async function canvaConnectStatus(): Promise<{ data: CanvaConnectStatus }> {
  return apiFetch('/master/canva-connect/status', { portal: 'master' });
}

export async function canvaConnectAuthUrl(
  redirectUri?: string,
): Promise<{
  auth_url: string;
  state: string;
  redirect_uri: string;
  scopes: string[];
  configured: boolean;
}> {
  const q = redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : '';
  return apiFetch(`/master/canva-connect/auth-url${q}`, { portal: 'master' });
}

export async function canvaConnectCallback(body: {
  code: string;
  state: string;
  redirect_uri?: string;
}): Promise<{ ok: boolean; data: CanvaConnectStatus }> {
  return apiFetch('/master/canva-connect/callback', {
    method: 'POST',
    portal: 'master',
    body,
  });
}

export async function canvaConnectDisconnect(): Promise<{ ok: boolean; data: CanvaConnectStatus }> {
  return apiFetch('/master/canva-connect/disconnect', {
    method: 'POST',
    portal: 'master',
  });
}

export async function canvaConnectListDesigns(
  limit = 20,
): Promise<{ data: CanvaConnectDesign[]; continuation?: string | null }> {
  return apiFetch(`/master/canva-connect/designs?limit=${limit}`, { portal: 'master' });
}

export async function canvaConnectCreateDesign(body: {
  title?: string;
  width?: number;
  height?: number;
  preset?: string;
}): Promise<{ data: CanvaConnectDesign }> {
  return apiFetch('/master/canva-connect/designs', {
    method: 'POST',
    portal: 'master',
    body,
  });
}

export async function canvaConnectExportDesign(
  designId: string,
): Promise<{ data: { urls: string[]; job?: unknown } }> {
  return apiFetch(`/master/canva-connect/designs/${encodeURIComponent(designId)}/export`, {
    method: 'POST',
    portal: 'master',
    timeoutMs: 60000,
  });
}
