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
  console.log('[change-password] request', { path, hasToken: Boolean(token) });
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

  console.log('[change-password] response', {
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
  const fieldError =
    json?.data?.current_password ||
    json?.data?.new_password ||
    json?.data?.confirm_password ||
    json?.data?.code;
  const message =
    json?.message === 'Validation Error'
      ? fieldError || json?.message
      : json?.message ||
        json?.error ||
        json?.data?.error ||
        fieldError ||
        `Request failed${response.status ? ` (${response.status})` : ''}.`;

  return {
    success: ok,
    message,
    data: (json?.data ?? json) as T,
    raw: json,
  };
};

export const requestChangePasswordOtp = async (token?: string): Promise<ApiResult> => {
  const formData = new FormData();
  return postForm('request-change-password-otp', formData, token);
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  code: string;
  token?: string;
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<ApiResult> => {
  const formData = new FormData();
  formData.append('current_password', payload.currentPassword);
  formData.append('new_password', payload.newPassword);
  formData.append('confirm_password', payload.confirmPassword);
  formData.append('code', payload.code);
  return postForm('change-password', formData, payload.token);
};
