import { API_BASE_URL } from "@/services/api/base-url";

export type ApiResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  raw?: unknown;
};

export type KycDocument = {
  uri: string;
  name?: string;
  type?: string;
};

export type AddKycPayload = {
  firstname: string;
  lastname: string;
  country: string;
  documentType: string;
  documentNumber: string;
  documentExpiryDate: string;
  idFrontDocument: KycDocument;
  idBackDocument: KycDocument;
};

export type KycDetail = {
  id?: number | string | null;
  userId?: number | string | null;
  firstname?: string | null;
  lastname?: string | null;
  country?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  documentExpiryDate?: string | null;
  idFrontDocument?: string | null;
  idBackDocument?: string | null;
  status?: number | boolean | null;
  remark?: string | null;
  raw?: unknown;
};

export type AdvancedKycDetail = {
  id?: number | string | null;
  userId?: number | string | null;
  address?: string | null;
  document?: string | null;
  status?: number | boolean | null;
  remark?: string | null;
  raw?: unknown;
};

export type AddAdvancedKycPayload = {
  address: string;
  addressProof: KycDocument;
};

const isExplicitSuccess = (value: unknown) => value === true || value === 1 || value === "success";
const isExplicitFailure = (value: unknown) => value === false || value === 0 || value === "error";

export async function addKycDetail(
  token: string | undefined,
  payload: AddKycPayload,
): Promise<ApiResult> {
  console.log("[kyc] request", {
    hasToken: Boolean(token),
    documentType: payload.documentType,
    country: payload.country,
  });

  const formData = new FormData();
  formData.append("firstname", payload.firstname);
  formData.append("lastname", payload.lastname);
  formData.append("country", payload.country);
  formData.append("document_type", payload.documentType);
  formData.append("document_number", payload.documentNumber);
  formData.append("document_expiry_date", payload.documentExpiryDate);
  formData.append("id_front_document", {
    uri: payload.idFrontDocument.uri,
    name: payload.idFrontDocument.name ?? "id_front.jpg",
    type: payload.idFrontDocument.type ?? "image/jpeg",
  } as any);
  formData.append("id_back_document", {
    uri: payload.idBackDocument.uri,
    name: payload.idBackDocument.name ?? "id_back.jpg",
    type: payload.idBackDocument.type ?? "image/jpeg",
  } as any);

  const response = await fetch(`${API_BASE_URL}/add-kyc-detail`, {
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

  console.log("[kyc] response", {
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
    data: json?.data ?? json,
    raw: json,
  };
}

export async function fetchKycDetail(token: string | undefined): Promise<ApiResult<KycDetail>> {
  console.log("[kyc] request", {
    path: "get-kyc-detail",
    hasToken: Boolean(token),
  });

  const response = await fetch(`${API_BASE_URL}/get-kyc-detail`, {
    method: "POST",
    headers: {
      accept: "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
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

  console.log("[kyc] response", {
    ok: response.ok,
    status: response.status,
    url: response.url,
    redirected: response.redirected,
    body: json,
  });

  const data = json?.data ?? null;
  const detail: KycDetail | undefined = data
    ? {
        id: data.id ?? null,
        userId: data.user_id ?? null,
        firstname: data.firstname ?? null,
        lastname: data.lastname ?? null,
        country: data.country ?? null,
        documentType: data.document_type ?? null,
        documentNumber: data.document_number ?? null,
        documentExpiryDate: data.document_expiry_date ?? null,
        idFrontDocument: data.id_front_document ?? null,
        idBackDocument: data.id_back_document ?? null,
        status: data.status ?? null,
        remark: data.remark ?? null,
        raw: data,
      }
    : undefined;

  return {
    success: ok,
    message:
      json?.message ||
      json?.error ||
      json?.data?.error ||
      `Request failed${response.status ? ` (${response.status})` : ""}.`,
    data: detail,
    raw: json,
  };
}

export async function fetchAdvancedKycDetail(
  token: string | undefined,
): Promise<ApiResult<AdvancedKycDetail>> {
  console.log("[kyc] request", {
    path: "getkyc_adv_detail",
    hasToken: Boolean(token),
  });

  const response = await fetch(`${API_BASE_URL}/getkyc_adv_detail`, {
    method: "POST",
    headers: {
      accept: "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
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

  console.log("[kyc] response", {
    ok: response.ok,
    status: response.status,
    url: response.url,
    redirected: response.redirected,
    body: json,
  });

  const data = json?.data ?? null;
  const detail: AdvancedKycDetail | undefined = data
    ? {
        id: data.id ?? null,
        userId: data.user_id ?? null,
        address: data.address ?? null,
        document: data.document ?? data.document_url ?? null,
        status: data.status ?? null,
        remark: data.remark ?? data.error ?? null,
        raw: data,
      }
    : undefined;

  return {
    success: ok,
    message:
      json?.message ||
      json?.error ||
      json?.data?.error ||
      `Request failed${response.status ? ` (${response.status})` : ""}.`,
    data: detail,
    raw: json,
  };
}

export async function addAdvancedKycDetail(
  token: string | undefined,
  payload: AddAdvancedKycPayload,
): Promise<ApiResult> {
  console.log("[kyc] request", {
    path: "addkyc_adv_detail",
    hasToken: Boolean(token),
  });

  const formData = new FormData();
  formData.append("address", payload.address);
  formData.append("address_proof", {
    uri: payload.addressProof.uri,
    name: payload.addressProof.name ?? "address_proof.jpg",
    type: payload.addressProof.type ?? "image/jpeg",
  } as any);

  const response = await fetch(`${API_BASE_URL}/addkyc_adv_detail`, {
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

  console.log("[kyc] response", {
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
    data: json?.data ?? json,
    raw: json,
  };
}
