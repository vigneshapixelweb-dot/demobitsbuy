export type WalletSegment = "overview" | "spot" | "funding";
export type BalanceCurrency = "BTC" | "USDT" | "INR";
export type WalletActionKey = "deposit" | "withdraw" | "transfer" | "history";

export type WalletSegmentTab = {
  key: WalletSegment;
  label: string;
};

export type WalletAction = {
  key: WalletActionKey;
  label: string;
};

export type WalletCoinRow = {
  key: string;
  symbol: string;
  name: string;
  badgeText: string;
  badgeColor: string;
  priceUsd: number;
  holdings: Record<WalletSegment, number>;
};

export const WALLET_SEGMENTS: WalletSegmentTab[] = [
  { key: "overview", label: "Overview" },
  { key: "spot", label: "Spot" },
  { key: "funding", label: "Funding" },
];

export const WALLET_CURRENCIES: BalanceCurrency[] = ["BTC", "USDT", "INR"];

export const WALLET_ACTIONS: WalletAction[] = [
  { key: "deposit", label: "Deposit" },
  { key: "withdraw", label: "Withdraw" },
  { key: "transfer", label: "Transfer" },
  { key: "history", label: "History" },
];

export const WALLET_BALANCE_BY_SEGMENT: Record<WalletSegment, { usd: number; btc: number }> = {
  overview: { usd: 2385.6, btc: 0.03421 },
  spot: { usd: 1548.2, btc: 0.02197 },
  funding: { usd: 837.4, btc: 0.01224 },
};

export const WALLET_FIAT_RATE_BY_CURRENCY: Record<BalanceCurrency, number> = {
  BTC: 0.00001434,
  USDT: 1,
  INR: 83.2,
};

export const WALLET_COINS: WalletCoinRow[] = [
  {
    key: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    badgeText: "B",
    badgeColor: "#F7931A",
    priceUsd: 70548.15,
    holdings: { overview: 0, spot: 0.0124, funding: 0.0061 },
  },
  {
    key: "eth",
    symbol: "ETH",
    name: "Ethereum",
    badgeText: "E",
    badgeColor: "#627EEA",
    priceUsd: 2075.14,
    holdings: { overview: 0, spot: 0.38, funding: 0.11 },
  },
  {
    key: "bnb",
    symbol: "BNB",
    name: "Binance",
    badgeText: "BN",
    badgeColor: "#F3BA2F",
    priceUsd: 610.45,
    holdings: { overview: 0, spot: 2.2, funding: 0.75 },
  },
  {
    key: "trx",
    symbol: "TRX",
    name: "Tron",
    badgeText: "TR",
    badgeColor: "#FF060A",
    priceUsd: 0.128,
    holdings: { overview: 0, spot: 265, funding: 90 },
  },
  {
    key: "ltc",
    symbol: "LTC",
    name: "Litecoin",
    badgeText: "L",
    badgeColor: "#345D9D",
    priceUsd: 84.72,
    holdings: { overview: 0, spot: 7.6, funding: 2.8 },
  },
  {
    key: "sol",
    symbol: "SOL",
    name: "Solana",
    badgeText: "S",
    badgeColor: "#1C1E24",
    priceUsd: 138.64,
    holdings: { overview: 0, spot: 8.2, funding: 3.1 },
  },
];

export const formatWalletPrimaryBalance = (usdValue: number, currency: BalanceCurrency) => {
  const converted = usdValue * WALLET_FIAT_RATE_BY_CURRENCY[currency];
  if (currency === "BTC") {
    return `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === "USDT") {
    return `${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
  }
  return `INR ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatWalletAssetAmount = (value: number, symbol: string) => {
  const decimals = symbol === "BTC" || symbol === "ETH" ? 4 : 2;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
};
