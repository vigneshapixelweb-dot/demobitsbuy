import { API_BASE_URL } from '@/services/api/base-url';

type ApiResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  raw?: unknown;
};

type LoginActivityItem = {
  id: number;
  user_id: number;
  logged_in_ip: string | null;
  logged_in_location: string | null;
  logged_in_region: string | null;
  logged_in_os: string | null;
  logged_in_browser: string | null;
  logged_in_device: string | null;
  status: number;
  created_at: string;
};

export type LoginActivityResponse = {
  totalCount: number;
  activity: LoginActivityItem[];
};

export async function fetchLoginActivity(
  token: string,
  offset = 0,
  limit = 10
): Promise<ApiResult<LoginActivityResponse>> {
  const formData = new FormData();
  formData.append('offset', String(offset));
  formData.append('limit', String(limit));

  console.log('[login-activity] request', { offset, limit });

  const response = await fetch(`${API_BASE_URL}/login-activity`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  console.log('[login-activity] response', {
    ok: response.ok,
    status: response.status,
    url: response.url,
    redirected: response.redirected,
    body: json,
  });

  return {
    success: response.ok && json?.success === true,
    message:
      json?.message ||
      json?.error ||
      json?.data?.error ||
      `Request failed${response.status ? ` (${response.status})` : ''}.`,
    data: json?.data as LoginActivityResponse,
    raw: json,
  };
}
