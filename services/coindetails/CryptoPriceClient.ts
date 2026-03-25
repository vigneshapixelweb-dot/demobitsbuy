// src/lib/CryptoPriceClient.ts
import { binanceToCoinGeckoId, ensureCoinGeckoMapLoaded } from "./coinGecko";

export type PriceMap = Record<string, number>;

const HEARTBEAT_EVERY_MS = 15_000;
const INACTIVITY_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 5_000;
const MAX_RETRIES = 8;

type Listener = (prices: PriceMap, usingSocket: boolean) => void;

export class CryptoPriceClient {
  private symbols: string[];
  private ws?: WebSocket;
  private usingSocket = false;
  private disposed = false;

  private latest: PriceMap = {};
  private listeners = new Set<Listener>();

  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private watchdogTimer?: ReturnType<typeof setTimeout>;
  private pollTimer?: ReturnType<typeof setInterval>;
  private retries = 0;

  constructor(symbols: string[]) {
    this.symbols = symbols.map((s) => s.toUpperCase());
  }

  updateSymbols(symbols: string[]) {
    this.symbols = symbols.map((s) => s.toUpperCase());
    // quick restart to reflect stream changes
    this.handleSocketFailure();
  }

  onUpdate(fn: Listener) {
    this.listeners.add(fn);
    if (Object.keys(this.latest).length) fn({ ...this.latest }, this.usingSocket);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const snap = { ...this.latest };
    const mode = this.usingSocket;
    this.listeners.forEach((fn) => fn(snap, mode));
  }

  async start() {
    if (this.disposed) return;
    // make sure CoinGecko map is ready for fallback path
    await ensureCoinGeckoMapLoaded().catch(() => {});
    await this.openSocket();
    if (!this.usingSocket) this.startPolling();
  }

  async stop() {
    this.disposed = true;
    this.teardownSocket();
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = undefined;
    this.listeners.clear();
  }

  isUsingSocket() {
    return this.usingSocket;
  }

  // ---- WebSocket ----
  private async openSocket() {
    this.teardownSocket();
    try {
      const streams = this.symbols.map((s) => `${s.toLowerCase()}@ticker`).join("/");
      const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
      this.ws = new WebSocket(url);
      this.usingSocket = true;
      this.retries = 0;

      this.ws.onopen = () => {
        this.startHeartbeat();
        this.startWatchdog();
      };

      this.ws.onmessage = (evt) => {
        this.bumpWatchdog();
        try {
          const obj = JSON.parse(String(evt.data));
          const d = obj?.data ?? obj;
          const symbol = String(d?.s ?? "").toUpperCase();
          const price = Number(d?.c);
          if (symbol && Number.isFinite(price)) {
            this.latest[symbol] = price;
            this.emit();
          }
        } catch {}
      };

      this.ws.onerror = () => this.handleSocketFailure();
      this.ws.onclose = () => this.handleSocketFailure();
    } catch {
      this.handleSocketFailure();
    }
  }

  private handleSocketFailure() {
    this.usingSocket = false;
    this.teardownSocket();
    this.failoverToPolling();
    this.scheduleReconnect();
    this.emit();
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      try {
        this.ws?.send(JSON.stringify({ op: "ping", t: Date.now() }));
      } catch {}
    }, HEARTBEAT_EVERY_MS);
  }

  private startWatchdog() {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    this.watchdogTimer = setTimeout(() => this.handleSocketFailure(), INACTIVITY_TIMEOUT_MS);
  }

  private bumpWatchdog() {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    this.watchdogTimer = setTimeout(() => this.handleSocketFailure(), INACTIVITY_TIMEOUT_MS);
  }

  private scheduleReconnect() {
    if (this.disposed) return;
    if (this.retries >= MAX_RETRIES) return; // stay on polling
    this.retries += 1;
    const backoff = Math.min(30, 2 ** this.retries) + Math.floor(Math.random() * 3);
    setTimeout(async () => {
      if (this.disposed) return;
      await this.openSocket();
      if (this.usingSocket && this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = undefined;
        this.emit();
      }
    }, backoff * 1000);
  }

  private teardownSocket() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    this.heartbeatTimer = undefined;
    this.watchdogTimer = undefined;
    try {
      this.ws?.close();
    } catch {}
    this.ws = undefined;
  }

  // ---- Polling (Binance → CoinGecko) ----
  private failoverToPolling() {
    if (this.pollTimer) return;
    this.startPolling();
  }

  private startPolling() {
    this.pollOnce();
    this.pollTimer = setInterval(() => this.pollOnce(), POLL_INTERVAL_MS);
  }

  private async pollOnce() {
    if (this.disposed) return;
    const snapshot: PriceMap = {};
    for (const s of this.symbols) {
      const p = (await this.fetchBinancePrice(s)) ?? (await this.fetchCoinGeckoPrice(s));
      if (typeof p === "number") snapshot[s] = p;
    }
    if (Object.keys(snapshot).length) {
      Object.assign(this.latest, snapshot);
      this.emit();
    }
  }

  private async fetchBinancePrice(symbol: string) {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      if (res.ok) {
        const obj = await res.json();
        const n = Number(obj?.price);
        return Number.isFinite(n) ? n : undefined;
      }
    } catch {}
    return undefined;
  }

  private async fetchCoinGeckoPrice(symbol: string) {
    try {
      const id = await binanceToCoinGeckoId(symbol);
      if (!id) return undefined;
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`
      );
      if (!res.ok) return undefined;
      const obj = await res.json();
      const n = Number(obj?.[id]?.usd);
      return Number.isFinite(n) ? n : undefined;
    } catch {}
    return undefined;
  }
}
