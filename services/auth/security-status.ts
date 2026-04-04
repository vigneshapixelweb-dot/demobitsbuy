import { API_BASE_URL } from '@/services/api/base-url';

type ApiResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  raw?: unknown;
};

type SecurityStatusResponse = {
  email_2fa_status?: string | null;
  google_2fa_status?: string | null;
  anti_phishing_status?: number | string | null;
};

export type SecurityStatus = {
  email2FAEnabled: boolean;
  google2FAEnabled: boolean;
  antiPhishingStatus: number | null;
};

export async function fetchSecurityStatus(token: string): Promise<ApiResult<SecurityStatus>> {
  console.log('[security-status] request', { hasToken: Boolean(token), path: 'security-setting-status' });

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/security-setting-status`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.log('[security-status] network error', { error });
    return {
      success: false,
      message: 'Network request failed. Please check your connection.',
      data: undefined,
      raw: error,
    };
  }

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  const ok = response.ok && json?.success === true;
  const data: SecurityStatusResponse = json?.data ?? {};
  const email2FAEnabled = Boolean(data.email_2fa_status);
  const google2FAEnabled = Boolean(data.google_2fa_status);
  const antiPhishingStatus =
    typeof data.anti_phishing_status === 'number'
      ? data.anti_phishing_status
      : data.anti_phishing_status
      ? Number(data.anti_phishing_status)
      : null;

  console.log('[security-status] response', {
    ok: response.ok,
    status: response.status,
    url: response.url,
    redirected: response.redirected,
    body: json,
  });

  return {
    success: ok,
    message:
      json?.message ||
      json?.error ||
      json?.data?.error ||
      `Request failed${response.status ? ` (${response.status})` : ''}.`,
    data: { email2FAEnabled, google2FAEnabled, antiPhishingStatus },
    raw: json,
  };
}
