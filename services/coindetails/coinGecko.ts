// src/lib/coinGecko.ts
// Loads the full CoinGecko coin list and maps symbol -> id (supports ALL coins)
// Uses in-memory cache (and optional AsyncStorage) to avoid repeated fetches.

type CoinInfo = { id: string; symbol: string; name: string };
let symbolToId: Record<string, string> | null = null;
let lastLoaded = 0;
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // refresh every 6h

// Optional persistence
let AsyncStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {
  // ok if not installed; we’ll skip persistence
}

const STORAGE_KEY = "coingecko:symbolToId:v1";
const STORAGE_TS_KEY = "coingecko:symbolToId:ts:v1";

// Common Binance quote assets (keep sorted by length desc to strip correctly)
const QUOTE_ASSETS = [
  "USDT", "USDC", "BUSD", "TUSD", "BIDR", "IDRT", "NGN",
  "TRY", "BRL", "RUB", "UAH", "GBP", "EUR", "AUD", "ZAR",
  "PAX", "DAI", "BTC", "ETH", "BNB", "USD",
];

function extractBaseFromBinanceSymbol(symbol: string): string {
  const S = symbol.toUpperCase();
  for (const q of QUOTE_ASSETS) {
    if (S.endsWith(q)) return S.slice(0, -q.length);
  }
  // fallback: letters-only prefix
  const m = /^[A-Z]+/.exec(S);
  return m ? m[0] : S;
}

async function loadFromStorage() {
  if (!AsyncStorage) return false;
  try {
    const [mapStr, tsStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(STORAGE_TS_KEY),
    ]);
    if (!mapStr || !tsStr) return false;
    const parsed = JSON.parse(mapStr);
    const ts = Number(tsStr);
    if (parsed && typeof parsed === "object") {
      symbolToId = parsed;
      lastLoaded = ts || Date.now();
      return true;
    }
  } catch {}
  return false;
}

async function saveToStorage() {
  if (!AsyncStorage || !symbolToId) return;
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(symbolToId)),
      AsyncStorage.setItem(STORAGE_TS_KEY, String(lastLoaded)),
    ]);
  } catch {}
}

export async function ensureCoinGeckoMapLoaded(force = false) {
  const now = Date.now();
  if (!force && symbolToId && now - lastLoaded < MAX_AGE_MS) return;

  if (!force && !symbolToId) {
    const ok = await loadFromStorage();
    if (ok && now - lastLoaded < MAX_AGE_MS) return;
  }

  const res = await fetch("https://api.coingecko.com/api/v3/coins/list");
  if (!res.ok) throw new Error("Failed to fetch CoinGecko list");
  const list: CoinInfo[] = await res.json();

  // Build fastest-possible symbol -> id map (latest wins if duplicates)
  const map: Record<string, string> = {};
  for (const c of list) {
    if (!c?.symbol || !c?.id) continue;
    map[c.symbol.toUpperCase()] = c.id;
  }
  symbolToId = map;
  lastLoaded = Date.now();
  saveToStorage().catch(() => {});
}

export async function binanceToCoinGeckoId(binanceSymbol: string): Promise<string | undefined> {
  await ensureCoinGeckoMapLoaded();
  const base = extractBaseFromBinanceSymbol(binanceSymbol);
  return symbolToId?.[base.toUpperCase()];
}
