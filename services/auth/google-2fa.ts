import { API_BASE_URL } from "@/services/api/base-url";

type ApiResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  raw?: unknown;
};

const isExplicitSuccess = (value: unknown) =>
  value === true || value === 1 || value === "success";
const isExplicitFailure = (value: unknown) =>
  value === false || value === 0 || value === "error";

const buildHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    accept: "application/json",
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  return headers;
};

const postForm = async <T = unknown>(
  path: string,
  formData?: FormData,
  token?: string,
): Promise<ApiResult<T>> => {
  console.log("[api] request", {
    path,
    hasToken: Boolean(token),
  });

  const response = await fetch(`${API_BASE_URL}/${path}`, {
    method: "POST",
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

  console.log("[api] response", {
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
      json?.message ??
      json?.error ??
      `Request failed${response.status ? ` (${response.status})` : ""}.`,
    data: (json?.data ?? json) as T,
    raw: json,
  };
};

type GoogleSecretResponse = {
  secret?: string;
  Secret?: string;
  google_secret?: string;
  key?: string;
  qr?: string;
  qr_code?: string;
  qr_code_url?: string;
  qr_url?: string;
  url?: string;
  otpauth_url?: string;
  data?: {
    secret?: string;
    Secret?: string;
    google_secret?: string;
    key?: string;
    qr?: string;
    qr_code?: string;
    qr_code_url?: string;
    qr_url?: string;
    url?: string;
    otpauth_url?: string;
  };
};

export type GoogleSecretResult = ApiResult & {
  secret?: string;
  qrImageUrl?: string;
  otpauthUrl?: string;
};

export const generateGoogleSecret = async (token?: string): Promise<GoogleSecretResult> => {
  const formData = new FormData();
  const result = await postForm<GoogleSecretResponse>("generate-google-secret", formData, token);
  const data = result.data ?? {};
  const secret =
    data.secret ??
    data.Secret ??
    data.google_secret ??
    data.key ??
    data.data?.secret ??
    data.data?.Secret ??
    data.data?.google_secret ??
    data.data?.key;
  const qrImageUrl =
    data.qr ??
    data.qr_code ??
    data.qr_code_url ??
    data.qr_url ??
    data.url ??
    data.data?.qr ??
    data.data?.qr_code ??
    data.data?.qr_code_url ??
    data.data?.qr_url ??
    data.data?.url;
  const otpauthUrl = data.otpauth_url ?? data.data?.otpauth_url;

  return {
    ...result,
    secret,
    qrImageUrl,
    otpauthUrl,
  };
};

export const verifyGoogleSecret = async (otp: string, token?: string): Promise<ApiResult> => {
  const formData = new FormData();
  formData.append("otp", otp);
  return postForm("verify-google-secret", formData, token);
};

export const verifyGoogle2FA = async (otp: string, token?: string): Promise<ApiResult> => {
  const formData = new FormData();
  formData.append("otp", otp);
  return postForm("verify-google-2fa", formData, token);
};

export const disableGoogle2FA = async (otp: string, token?: string): Promise<ApiResult> => {
  const formData = new FormData();
  formData.append("otp", otp);
  return postForm("disable-google-2fa", formData, token);
};
