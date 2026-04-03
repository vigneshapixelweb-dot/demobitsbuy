import { API_BASE_URL } from '@/services/api/base-url';

type ApiResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  raw?: unknown;
};

type DeviceActivityItem = {
  id: number;
  user_id?: number;
  device?: string | null;
  device_type?: string | null;
  ip_address?: string | null;
  location?: string | null;
  status?: number;
  created_at?: string;
};

export type DeviceActivityResponse = {
  totalCount: number;
  activity: DeviceActivityItem[];
};

export async function fetchDeviceActivity(
  token: string,
  offset = 0,
  limit = 10
): Promise<ApiResult<DeviceActivityResponse>> {
  const formData = new FormData();
  formData.append('offset', String(offset));
  formData.append('limit', String(limit));

  console.log('[device-activity] request', { offset, limit });

  const response = await fetch(`${API_BASE_URL}/device-activity`, {
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

  console.log('[device-activity] response', {
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
    data: json?.data as DeviceActivityResponse,
    raw: json,
  };
}
