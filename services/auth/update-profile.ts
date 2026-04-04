import { API_BASE_URL } from '@/services/api/base-url';
import { normalizeUserDetails, type UserDetails } from '@/services/auth/user-details';

type ApiResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  raw?: unknown;
};

type UpdateProfilePayload = {
  username: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: {
    uri: string;
    name?: string;
    type?: string;
  } | null;
};

const isExplicitSuccess = (value: unknown) => value === true || value === 1 || value === 'success';
const isExplicitFailure = (value: unknown) => value === false || value === 0 || value === 'error';

export async function updateProfileDetails(
  token: string,
  payload: UpdateProfilePayload,
): Promise<ApiResult<UserDetails>> {
  const formData = new FormData();
  formData.append('username', payload.username);
  if (payload.lastName) {
    formData.append('lastname', payload.lastName);
  }
  if (payload.phoneNumber) {
    formData.append('phone_number', payload.phoneNumber);
  }

  if (payload.profileImage?.uri) {
    formData.append('profile_image', {
      uri: payload.profileImage.uri,
      name: payload.profileImage.name ?? 'profile.jpg',
      type: payload.profileImage.type ?? 'image/jpeg',
    } as any);
  }

  console.log('[update-profile] request', {
    hasToken: Boolean(token),
    usernameLength: payload.username.length,
    hasImage: Boolean(payload.profileImage?.uri),
  });

  const response = await fetch(`${API_BASE_URL}/update-profile-details`, {
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

  const statusFlag = json?.status ?? json?.success;
  const ok = response.ok && (isExplicitSuccess(statusFlag) || !isExplicitFailure(statusFlag));
  const dataSource =
    json?.data?.user_details ??
    json?.data?.user ??
    json?.data ??
    json?.user_details ??
    json?.user ??
    null;

  console.log('[update-profile] response', {
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
    data: dataSource ? normalizeUserDetails(dataSource) : undefined,
    raw: json,
  };
}
