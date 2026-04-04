import { API_BASE_URL } from "@/services/api/base-url";

export type ApiResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  raw?: unknown;
};

export type TicketListItem = {
  id: string | number | null;
  ticketId: string;
  subject: string;
  status: string;
  createdAt: string;
  raw?: unknown;
};

export type TicketMessage = {
  id: string | number | null;
  type: "incoming" | "outgoing";
  text: string;
  time: string;
  raw?: unknown;
};

const isExplicitSuccess = (value: unknown) => value === true || value === 1 || value === "success";
const isExplicitFailure = (value: unknown) => value === false || value === 0 || value === "error";

const buildHeaders = (token?: string) => {
  const headers: Record<string, string> = { accept: "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
};

const postForm = async <T = unknown>(
  path: string,
  formData?: FormData,
  token?: string,
): Promise<ApiResult<T>> => {
  console.log("[support-api] request", {
    path,
    hasToken: Boolean(token),
    hasBody: Boolean(formData),
  });

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/${path}`, {
      method: "POST",
      headers: buildHeaders(token),
      body: formData,
    });
  } catch (error) {
    console.log("[support-api] network error", { path, error });
    return {
      success: false,
      message: "Network request failed. Please check your connection.",
      data: undefined,
      raw: error,
    };
  }

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

  console.log("[support-api] response", {
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

const normalizeStatus = (value: unknown) => {
  if (typeof value === "number") return value === 1 ? "Open" : "Closed";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "Open";
    if (/open/i.test(trimmed)) return "Open";
    if (/close/i.test(trimmed)) return "Closed";
    return trimmed;
  }
  return "Open";
};

const mapTicket = (item: any): TicketListItem => {
  const id = item?.id ?? item?.ticket_id ?? item?.ticketId ?? null;
  const ticketId = String(item?.ticket_id ?? item?.ticketId ?? item?.id ?? "");
  const subject =
    String(item?.title ?? item?.subject ?? item?.message ?? item?.ticket_title ?? "Support Ticket");
  const status = normalizeStatus(item?.status ?? item?.ticket_status ?? item?.state);
  const createdAt = String(item?.created_at ?? item?.createdAt ?? item?.date ?? "");
  return {
    id,
    ticketId,
    subject,
    status,
    createdAt,
    raw: item,
  };
};

const hasSenderMarker = (item: any) => {
  return (
    item?.sender_type !== undefined ||
    item?.message_by !== undefined ||
    item?.user_type !== undefined ||
    item?.from !== undefined ||
    item?.sender !== undefined ||
    item?.is_admin !== undefined ||
    item?.is_user !== undefined
  );
};

const inferMessageType = (item: any, fallbackType?: "incoming" | "outgoing"): "incoming" | "outgoing" => {
  const alignment = typeof item?.alignment === "string" ? item.alignment.toLowerCase() : "";
  if (alignment.includes("right")) return "outgoing";
  if (alignment.includes("left")) return "incoming";

  const sender = String(
    item?.sender_type ??
      item?.message_by ??
      item?.user_type ??
      item?.from ??
      item?.sender ??
      "",
  ).toLowerCase();
  if (sender.includes("user") || sender.includes("client") || sender.includes("customer")) {
    return "outgoing";
  }
  if (sender.includes("support") || sender.includes("admin")) {
    return "incoming";
  }
  if (item?.is_admin === 1 || item?.is_admin === true) return "incoming";
  if (item?.is_user === 1 || item?.is_user === true) return "outgoing";
  if (fallbackType && !hasSenderMarker(item)) return fallbackType;
  return "incoming";
};

const mapMessage = (
  item: any,
  index: number,
  fallbackType?: "incoming" | "outgoing",
): TicketMessage => {
  const id = item?.id ?? item?.message_id ?? item?.reply_id ?? index;
  const text =
    String(item?.message ?? item?.reply ?? item?.text ?? item?.body ?? item?.content ?? "").trim() ||
    "(no message)";
  const time = String(item?.created_at ?? item?.createdAt ?? item?.time ?? "");
  return {
    id,
    type: inferMessageType(item, fallbackType),
    text,
    time,
    raw: item,
  };
};

export async function fetchTicketList(token?: string): Promise<ApiResult<{ tickets: TicketListItem[] }>> {
  const result = await postForm<any>("ticket-list", undefined, token);
  const payload = result.raw ?? {};
  const dataSource = payload?.data ?? payload?.tickets ?? payload;
  const list = Array.isArray(dataSource)
    ? dataSource
    : Array.isArray(dataSource?.tickets)
      ? dataSource.tickets
      : Array.isArray(dataSource?.data)
        ? dataSource.data
        : [];
  const tickets = list.map(mapTicket);
  return { ...result, data: { tickets } };
}

export type AddTicketPayload = {
  title: string;
  message: string;
  ticketImage?: {
    uri: string;
    name?: string;
    type?: string;
  } | null;
};

export async function addTicket(
  token: string | undefined,
  payload: AddTicketPayload,
): Promise<ApiResult> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("message", payload.message);
  if (payload.ticketImage?.uri) {
    formData.append("ticket_image", {
      uri: payload.ticketImage.uri,
      name: payload.ticketImage.name ?? "ticket.jpg",
      type: payload.ticketImage.type ?? "image/jpeg",
    } as any);
  }
  return postForm("add-ticket", formData, token);
}

export type SendMessagePayload = {
  message: string;
  ticketId: string;
  supportImage?: {
    uri: string;
    name?: string;
    type?: string;
  } | null;
};

export async function sendTicketMessage(
  token: string | undefined,
  payload: SendMessagePayload,
): Promise<ApiResult<{ messages: TicketMessage[] }>> {
  const formData = new FormData();
  formData.append("message", payload.message);
  formData.append("ticket_id", payload.ticketId);
  if (payload.supportImage?.uri) {
    formData.append("support_image", {
      uri: payload.supportImage.uri,
      name: payload.supportImage.name ?? "support.jpg",
      type: payload.supportImage.type ?? "image/jpeg",
    } as any);
  }
  const result = await postForm<any>("send-message", formData, token);
  const payloadData = result.raw ?? {};
  const dataSource = payloadData?.data ?? payloadData;
  const list = Array.isArray(dataSource)
    ? dataSource
    : Array.isArray(dataSource?.messages)
      ? dataSource.messages
      : Array.isArray(dataSource?.chat)
        ? dataSource.chat
        : Array.isArray(dataSource?.chats)
          ? dataSource.chats
          : [];
  const messages = list.map((item: any, index: number) => mapMessage(item, index, "outgoing"));
  return { ...result, data: { messages } };
}

export async function viewTicket(
  token: string | undefined,
  ticketId: string,
): Promise<ApiResult<{ ticketId: string; messages: TicketMessage[] }>> {
  const formData = new FormData();
  formData.append("ticket_id", ticketId);
  const result = await postForm<any>("view-ticket", formData, token);
  const payload = result.raw ?? {};
  const dataSource = payload?.data ?? payload;
  const list = Array.isArray(dataSource?.messages)
    ? dataSource.messages
    : Array.isArray(dataSource?.chat)
      ? dataSource.chat
      : Array.isArray(dataSource?.chats)
        ? dataSource.chats
        : Array.isArray(dataSource)
          ? dataSource
          : [];
  const messages = list.map(mapMessage);
  return { ...result, data: { ticketId, messages } };
}

export async function getTicketCount(token?: string): Promise<ApiResult> {
  return postForm("get-count", undefined, token);
}

export async function getUnreadMessages(token?: string): Promise<ApiResult> {
  return postForm("get-unread-message", undefined, token);
}

export async function markUserRead(
  token: string | undefined,
  ticketId: string,
): Promise<ApiResult> {
  const formData = new FormData();
  formData.append("ticket_id", ticketId);
  return postForm("mark-user-read", formData, token);
}
