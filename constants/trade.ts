export type TradePair = {
  base: string;
  quote: string;
  change: string;
};

export type OpenOrder = {
  pair: string;
  quote: string;
  type: string;
  date: string;
  amount: string;
  total: string;
  price: string;
};

export type TpslFieldConfig = {
  key: "tp" | "slTrigger" | "slLimit";
  label: string;
};

export type TradeStatConfig = {
  label: string;
  value: string;
  showAdd: boolean;
};

export const TRADE_ACCENT_BUY = "#00C28E";
export const TRADE_ACCENT_SELL = "#DE2E42";

export const TRADE_COIN_PAIRS: TradePair[] = [
  { base: "BTC", quote: "USDT", change: "+1.88%" },
  { base: "ETH", quote: "USDT", change: "+0.64%" },
  { base: "SOL", quote: "USDT", change: "-2.14%" },
  { base: "XRP", quote: "USDT", change: "+3.02%" },
];

export const TRADE_OPEN_ORDERS: OpenOrder[] = [
  {
    pair: "BTC",
    quote: "USDT",
    type: "Limit / Buy",
    date: "16-03-2026, 08:22:11",
    amount: "0.00",
    total: "28.17",
    price: "1595.00",
  },
  {
    pair: "BTC",
    quote: "USDT",
    type: "Limit / Buy",
    date: "16-03-2026, 09:14:53",
    amount: "0.00",
    total: "28.17",
    price: "1595.00",
  },
];

export const TRADE_ORDER_TABS = ["Open Orders (2)", "My Order (0)", "My Trade (2)"] as const;

export const TRADE_DEPTH_OPTIONS = ["0.001", "0.01", "0.1", "1.0"] as const;

export const TRADE_TPSL_FIELDS: TpslFieldConfig[] = [
  { key: "tp", label: "TP Limit (USDT)" },
  { key: "slTrigger", label: "SL Trigger (USDT)" },
  { key: "slLimit", label: "SL Limit" },
];

export const TRADE_STATS: TradeStatConfig[] = [
  { label: "Avbl", value: "0 USDT", showAdd: true },
  { label: "Max Buy", value: "0 BTC", showAdd: false },
  { label: "Est. Fee", value: "0.000375 BTC", showAdd: false },
];
