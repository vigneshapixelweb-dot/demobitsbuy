export type LoginPayload = {
  usernameEmail: string;
  password: string;
  deviceType: string;
  deviceId: string;
  deviceToken: string;
};

export type LoginResult = {
  success: boolean;
  message?: string;
  token?: string | null;
  user?: unknown;
  raw?: unknown;
};

import { API_BASE_URL } from "@/services/api/base-url";

const LOGIN_URL = `${API_BASE_URL}/login`;

const isExplicitSuccess = (value: unknown) => value === true || value === 1 || value === 'success';
const isExplicitFailure = (value: unknown) => value === false || value === 0 || value === 'error';
const normalizeUsernameEmail = (value: string) => {
  const trimmed = value.trim();
  const hasDoubleQuotes = trimmed.startsWith('"') && trimmed.endsWith('"');
  const hasSingleQuotes = trimmed.startsWith("'") && trimmed.endsWith("'");
  if (hasDoubleQuotes || hasSingleQuotes) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

export async function loginApi(payload: LoginPayload): Promise<LoginResult> {
  const usernameEmail = normalizeUsernameEmail(payload.usernameEmail);

  console.log('[loginApi] request', {
    usernameEmail,
    passwordLength: payload.password.length,
    deviceType: payload.deviceType,
    deviceId: payload.deviceId,
    deviceToken: payload.deviceToken,
  });

  const formData = new FormData();
  formData.append('username_email', usernameEmail);
  formData.append('password', payload.password);
  formData.append('device_type', payload.deviceType);
  formData.append('device_id', payload.deviceId);
  formData.append('device_token', payload.deviceToken);

  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      accept: 'application/json',
    },
    body: formData,
  });

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  console.log();
  
  console.log('[loginApi] response', {
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

  if (!ok) {
    return {
      success: false,
      message:
        json?.message ??
        json?.error ??
        `Login failed${response.status ? ` (${response.status})` : ''}.`,
      raw: json,
    };
  }

  const token =
    json?.data?.token ??
    json?.data?.access_token ??
    json?.token ??
    json?.access_token ??
    null;
  const user =
    json?.data?.user ??
    json?.data?.user_details ??
    json?.user ??
    json?.data ??
    null;

  return {
    success: true,
    message: json?.message ?? 'Login successful.',
    token,
    user,
    raw: json,
  };
}
