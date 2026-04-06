import { API_BASE_URL } from "@/services/api/base-url";

export type ApiResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  raw?: unknown;
};

export type WalletAsset = {
  id: string | number | null;
  name: string;
  symbol: string;
  type?: string | null;
  priceUsd: number;
  imageUrl?: string | null;
  balances: {
    overview: number;
    spot: number;
    funding: number;
  };
  usdBalances: {
    overview: number;
    spot: number;
    funding: number;
  };
  raw?: unknown;
};

const isExplicitSuccess = (value: unknown) => value === true || value === 1 || value === "success";
const isExplicitFailure = (value: unknown) => value === false || value === 0 || value === "error";

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const mapWalletItem = (item: any): WalletAsset => {
  const priceUsd = toNumber(item?.usd_live_price);
  const overview = item?.overview_wallet ?? {};
  const spot = item?.spot_wallet ?? {};
  const funding = item?.wallet ?? {};

  const overviewBalance = toNumber(overview?.balance);
  const spotBalance = toNumber(spot?.balance);
  const fundingBalance = toNumber(funding?.balance);

  const overviewUsd = toNumber(overview?.usd_balance ?? overview?.usdBalance);
  const spotUsd = toNumber(spot?.usd_balance ?? spot?.usdBalance);
  const fundingUsd = toNumber(funding?.usd_balance ?? funding?.usdBalance);

  return {
    id: item?.id ?? null,
    name: String(item?.name ?? item?.symbol ?? "Asset"),
    symbol: String(item?.symbol ?? "").toUpperCase(),
    type: item?.type ?? null,
    priceUsd,
    imageUrl: item?.image_url ?? null,
    balances: {
      overview: overviewBalance,
      spot: spotBalance,
      funding: fundingBalance,
    },
    usdBalances: {
      overview: overviewUsd || overviewBalance * priceUsd,
      spot: spotUsd || spotBalance * priceUsd,
      funding: fundingUsd || fundingBalance * priceUsd,
    },
    raw: item,
  };
};

export async function fetchWallet(token?: string): Promise<ApiResult<{ assets: WalletAsset[] }>> {
  console.log("[wallet] request", { hasToken: Boolean(token), path: "wallet" });

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/wallet`, {
      method: "POST",
      headers: {
        accept: "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (error) {
    console.log("[wallet] network error", { error });
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

  console.log("[wallet] response", {
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

  const walletList = json?.data?.wallet ?? json?.wallet ?? [];
  const assets = Array.isArray(walletList) ? walletList.map(mapWalletItem) : [];

  return {
    success: ok,
    message:
      json?.message ||
      json?.error ||
      json?.data?.error ||
      `Request failed${response.status ? ` (${response.status})` : ""}.`,
    data: { assets },
    raw: json,
  };
}
