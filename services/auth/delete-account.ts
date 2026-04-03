import { API_BASE_URL } from '@/services/api/base-url';

type ApiResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  raw?: unknown;
};

const isExplicitSuccess = (value: unknown) =>
  value === true || value === 1 || value === 'success';
const isExplicitFailure = (value: unknown) =>
  value === false || value === 0 || value === 'error';

const postForm = async <T = unknown>(
  path: string,
  formData?: FormData,
  token?: string,
): Promise<ApiResult<T>> => {
  console.log('[delete-account] request', { path, hasToken: Boolean(token) });
  const response = await fetch(`${API_BASE_URL}/${path}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  console.log('[delete-account] response', {
    path,
    ok: response.ok,
    status: response.status,
    url: response.url,
    redirected: response.redirected,
    body: json,
  });

  const statusFlag = json?.status ?? json?.success;
  const hasExplicitFailure = isExplicitFailure(statusFlag);
  const hasExplicitSuccess = isExplicitSuccess(statusFlag);
  const ok = response.ok && (hasExplicitSuccess || !hasExplicitFailure);

  return {
    success: ok,
    message:
      json?.message ||
      json?.error ||
      json?.data?.error ||
      json?.data?.email ||
      json?.data?.code ||
      json?.data?.delete_reason ||
      `Request failed${response.status ? ` (${response.status})` : ''}.`,
    data: (json?.data ?? json) as T,
    raw: json,
  };
};

export const requestDeleteAccountOtp = async (token?: string): Promise<ApiResult> => {
  const formData = new FormData();
  return postForm('user-delete-send-otp', formData, token);
};

export type DeleteAccountPayload = {
  email: string;
  code: string;
  deleteReason: string;
  token?: string;
};

export const verifyDeleteAccountOtp = async (
  payload: DeleteAccountPayload,
): Promise<ApiResult> => {
  const formData = new FormData();
  formData.append('email', payload.email);
  formData.append('code', payload.code);
  formData.append('delete_reason', payload.deleteReason);
  return postForm('user-delete-verify-otp', formData, payload.token);
};
