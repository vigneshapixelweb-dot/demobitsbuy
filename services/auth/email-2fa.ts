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

const buildHeaders = (token?: string) => {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
};

const postForm = async <T = unknown>(
  path: string,
  formData?: FormData,
  token?: string,
): Promise<ApiResult<T>> => {
  console.log('[email-2fa] request', {
    path,
    hasToken: Boolean(token),
  });

  const response = await fetch(`${API_BASE_URL}/${path}`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: formData,
  });

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  const statusFlag = json?.status ?? json?.success;
  const hasExplicitFailure = isExplicitFailure(statusFlag);
  const hasExplicitSuccess = isExplicitSuccess(statusFlag);
  const ok = response.ok && (hasExplicitSuccess || !hasExplicitFailure);

  console.log('[email-2fa] response', {
    path,
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
    data: (json?.data ?? json) as T,
    raw: json,
  };
};

export const enableEmail2FA = async (token?: string): Promise<ApiResult> => {
  const formData = new FormData();
  return postForm('enable-email-2fa', formData, token);
};

export const verifyEnableEmail2FA = async (
  otp: string,
  token?: string,
): Promise<ApiResult> => {
  const formData = new FormData();
  formData.append('otp', otp);
  return postForm('verify-enable-email-2fa', formData, token);
};

export const resendEnableEmail2FA = async (token?: string): Promise<ApiResult> => {
  const formData = new FormData();
  return postForm('resend-enable-email-2fa', formData, token);
};

export const requestDisableEmail2FAOtp = async (
  email: string,
  token?: string,
): Promise<ApiResult> => {
  const formData = new FormData();
  formData.append('email', email);
  console.log('[email-2fa] disable-otp email', email);
  return postForm('disable-email-2fa-otp', formData, token);
};

export const disableEmail2FA = async (
  otp: string,
  token?: string,
): Promise<ApiResult> => {
  const formData = new FormData();
  formData.append('otp', otp);
  return postForm('disable-email-2fa', formData, token);
};
