import { API_BASE_URL } from '@/services/api/base-url';

type ApiResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  raw?: unknown;
};

export type UserDetails = {
  id?: string | number | null;
  fullName?: string | null;
  username?: string | null;
  nickname?: string | null;
  email?: string | null;
  emailVerifiedAt?: string | null;
  phone?: string | null;
  address?: string | null;
  countryId?: string | number | null;
  countryName?: string | null;
  bio?: string | null;
  dob?: string | null;
  avatarUrl?: string | null;
  status?: string | number | null;
  uniqueId?: string | null;
  antiPhishingCode?: string | null;
  deviceId?: string | null;
  deviceToken?: string | null;
  deviceType?: string | null;
  tfaStatus?: string | null;
  sumsubRestrict?: string | number | null;
  verifiedKyc?: string | number | null;
  kycStatus?: string | number | null;
  isVerified?: boolean;
  raw?: unknown;
};

const isExplicitSuccess = (value: unknown) => value === true || value === 1 || value === 'success';
const isExplicitFailure = (value: unknown) => value === false || value === 0 || value === 'error';

const pickString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
};

const normalizeFullName = (profile: Record<string, unknown>): string | null => {
  const direct = pickString(profile.full_name, profile.name, profile.fullName);
  if (direct) return direct;
  const first = pickString(profile.first_name, profile.firstname, profile.fname);
  const last = pickString(profile.last_name, profile.lastname, profile.lname);
  const combined = [first, last].filter(Boolean).join(' ').trim();
  return combined.length ? combined : null;
};

const toBool = (value: unknown) => {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return undefined;
};

export const normalizeUserDetails = (raw: unknown): UserDetails => {
  const profile = (raw ?? {}) as Record<string, unknown>;
  const fullName = normalizeFullName(profile);
  const username = pickString(profile.username, profile.user_name, profile.uname);
  const nickname = pickString(profile.nickname, profile.nick_name, profile.display_name);
  const email = pickString(profile.email, profile.user_email, profile.username_email, profile.login_email);
  const emailVerifiedAt = pickString(profile.email_verified_at);
  const phone = pickString(profile.phone, profile.mobile, profile.phone_number);
  const address = pickString(profile.address, profile.street_address, profile.address_line);
  const countryId =
    (profile.country_id as string | number | null | undefined) ??
    (profile.countryId as string | number | null | undefined) ??
    null;
  const countryName = pickString(profile.country_name, profile.countryName);
  const bio = pickString(profile.bio, profile.about, profile.description);
  const dob = pickString(profile.dob, profile.date_of_birth, profile.birth_date);
  const avatarUrl = pickString(
    profile.profile_image,
    profile.profile_image_url,
    profile.profile_pic,
    profile.avatar,
    profile.image,
    profile.photo,
  );
  const status =
    (profile.status as string | number | null | undefined) ??
    (profile.user_status as string | number | null | undefined) ??
    null;
  const uniqueId = pickString(profile.unique_id, profile.uniqueId, profile.uid);
  const antiPhishingCode = pickString(profile.anti_phishing_code, profile.antiPhishingCode);
  const deviceId = pickString(profile.device_id, profile.deviceId);
  const deviceToken = pickString(profile.device_token, profile.deviceToken);
  const deviceType = pickString(profile.device_type, profile.deviceType);
  const tfaStatus = pickString(profile.tfa, profile.tfa_status, profile.two_factor);
  const sumsubRestrict =
    (profile.sumsub_restrict as string | number | null | undefined) ??
    (profile.sumsubRestrict as string | number | null | undefined) ??
    null;
  const verifiedKyc =
    (profile.verified_kyc as string | number | null | undefined) ??
    (profile.verifiedKyc as string | number | null | undefined) ??
    null;
  const kycStatus =
    (profile.kyc_status as string | number | null | undefined) ??
    (profile.kycStatus as string | number | null | undefined) ??
    (profile.is_kyc as string | number | null | undefined) ??
    null;
  const isVerified =
    toBool(profile.is_verified) ??
    toBool(profile.kyc_verified) ??
    toBool(profile.verified_kyc) ??
    (typeof kycStatus === 'number'
      ? kycStatus === 1
      : typeof kycStatus === 'string'
        ? /verified|approved|complete/i.test(kycStatus)
        : undefined);

  return {
    id: (profile.id as string | number | null | undefined) ?? null,
    fullName,
    username,
    nickname,
    email,
    emailVerifiedAt,
    phone,
    address,
    countryId,
    countryName,
    bio,
    dob,
    avatarUrl,
    status,
    uniqueId,
    antiPhishingCode,
    deviceId,
    deviceToken,
    deviceType,
    tfaStatus,
    sumsubRestrict,
    verifiedKyc,
    kycStatus,
    isVerified,
    raw,
  };
};

export async function fetchUserDetails(token: string): Promise<ApiResult<UserDetails>> {
  console.log('[get-user-details] request', { hasToken: Boolean(token) });

  const response = await fetch(`${API_BASE_URL}/get-user-details`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
  });

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  console.log('[get-user-details] response', {
    ok: response.ok,
    status: response.status,
    url: response.url,
    redirected: response.redirected,
    body: json,
  });

  const statusFlag = json?.status ?? json?.success;
  const ok = response.ok && (isExplicitSuccess(statusFlag) || !isExplicitFailure(statusFlag));
  const dataSource =
    json?.data?.user_details ??
    json?.data?.user ??
    json?.data ??
    json?.user_details ??
    json?.user ??
    null;

  return {
    success: ok,
    message:
      json?.message ||
      json?.error ||
      json?.data?.error ||
      `Request failed${response.status ? ` (${response.status})` : ''}.`,
    data: dataSource ? normalizeUserDetails(dataSource) : undefined,
    raw: json,
  };
}
