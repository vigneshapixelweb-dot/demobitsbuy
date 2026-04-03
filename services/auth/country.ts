import { API_BASE_URL } from "@/services/api/base-url";

export type Country = {
  id: number | string;
  name: string;
  code?: string | null;
  dialCode?: string | null;
  phoneNumberLimit?: string | null;
  sumsubRestrict?: number | string | null;
  imageUrl?: string | null;
  raw?: unknown;
};

type ApiResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  raw?: unknown;
};

const isExplicitSuccess = (value: unknown) => value === true || value === 1 || value === "success";
const isExplicitFailure = (value: unknown) => value === false || value === 0 || value === "error";

const postForm = async <T = unknown>(
  path: string,
  formData?: FormData,
  token?: string,
): Promise<ApiResult<T>> => {
  console.log("[country-api] request", {
    path,
    hasToken: Boolean(token),
    hasBody: Boolean(formData),
  });

  const response = await fetch(`${API_BASE_URL}/${path}`, {
    method: "POST",
    headers: {
      accept: "application/json",
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

  const statusFlag = json?.status ?? json?.success;
  const hasExplicitFailure = isExplicitFailure(statusFlag);
  const hasExplicitSuccess = isExplicitSuccess(statusFlag);
  const ok = response.ok && (hasExplicitSuccess || !hasExplicitFailure);

  console.log("[country-api] response", {
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
      `Request failed${response.status ? ` (${response.status})` : ""}.`,
    data: (json?.data ?? json) as T,
    raw: json,
  };
};

const mapCountry = (item: any): Country => ({
  id: item?.id,
  name: String(item?.name ?? ""),
  code: item?.code ?? null,
  dialCode: item?.dial_code ?? item?.dialCode ?? null,
  phoneNumberLimit: item?.phone_number_limit ?? item?.phoneNumberLimit ?? null,
  sumsubRestrict: item?.sumsub_restrict ?? item?.sumsubRestrict ?? null,
  imageUrl: item?.image_url ?? item?.imageUrl ?? null,
  raw: item,
});

export async function fetchCountries(): Promise<ApiResult<{ countries: Country[] }>> {
  const result = await postForm<any>("get-country");
  const payload = result.raw ?? {};
  const dataSource = payload?.data ?? payload;
  const list = Array.isArray(dataSource)
    ? dataSource
    : Array.isArray(dataSource?.data)
      ? dataSource.data
      : [];
  const countries = list.map(mapCountry);
  return { ...result, data: { countries } };
}

export async function updateCountry(
  token: string | undefined,
  countryId: string | number,
): Promise<ApiResult> {
  const formData = new FormData();
  formData.append("country_id", String(countryId));
  return postForm("update-country", formData, token);
}
