// src/orderbook/useOrderbookBybit.ts
import { useEffect, useRef, useState } from 'react';

export type OBLevel = { price: number; qty: number };

export function useOrderbookBybit(
  symbol: string | null,
  opts?: { category?: 'linear' | 'spot' | 'inverse'; depth?: 50 | 200 }
) {
  const category = opts?.category ?? 'linear';
  const depth = opts?.depth ?? 50;

  const [bids, setBids] = useState<OBLevel[]>([]);
  const [asks, setAsks] = useState<OBLevel[]>([]);
  const frameRef = useRef<number | null>(null);
  const lastSnapshotRef = useRef<{ bids: string; asks: string }>({ bids: '', asks: '' });

  useEffect(() => {
    if (symbol) return;
    setBids((prev) => (prev.length ? [] : prev));
    setAsks((prev) => (prev.length ? [] : prev));
  }, [symbol]);

  useEffect(() => {
    if (!symbol) return;

    // pick endpoint by category
    const base =
      category === 'spot'
        ? 'wss://stream.bybit.com/v5/public/spot'
        : category === 'inverse'
        ? 'wss://stream.bybit.com/v5/public/inverse'
        : 'wss://stream.bybit.com/v5/public/linear';

    const topic = `orderbook.${depth}.${symbol}`;
    const ws = new WebSocket(base);

    // RESET state/maps on every symbol change
    const bMap = new Map<number, number>();
    const aMap = new Map<number, number>();
    let alive = true;
    lastSnapshotRef.current = { bids: '', asks: '' };

    const emit = () => {
      if (!alive) return;
      if (frameRef.current != null) return;

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        if (!alive) return;

        const nextBids = toLevels(bMap, 'desc', depth);
        const nextAsks = toLevels(aMap, 'asc', depth);
        const nextSignature = {
          bids: levelsSignature(nextBids),
          asks: levelsSignature(nextAsks),
        };

        const { bids: lastBidsSig, asks: lastAsksSig } = lastSnapshotRef.current;
        if (nextSignature.bids === lastBidsSig && nextSignature.asks === lastAsksSig) {
          return;
        }

        lastSnapshotRef.current = nextSignature;
        setBids(nextBids);
        setAsks(nextAsks);
      });
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({ op: 'subscribe', args: [topic] }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg?.topic !== topic || !msg?.data) return;

        const t = msg.type;          // 'snapshot' | 'delta'
        const d = msg.data;          // { b: [...], a: [...] }

        if (t === 'snapshot') {      // full reset on snapshot
          bMap.clear();
          aMap.clear();
        }

        if (Array.isArray(d.b)) {
          for (const [p, q] of d.b) {
            const price = +p, qty = +q;
            if (qty === 0) bMap.delete(price);
            else bMap.set(price, qty);
          }
        }
        if (Array.isArray(d.a)) {
          for (const [p, q] of d.a) {
            const price = +p, qty = +q;
            if (qty === 0) aMap.delete(price);
            else aMap.set(price, qty);
          }
        }
        emit();
      } catch {}
    };

    ws.onerror = () => {};
    return () => {
      alive = false;
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      try { ws.close(); } catch {}
      // state will be replaced on next mount
    };
  }, [symbol, category, depth]);

  return { bids, asks };
}

function toLevels(map: Map<number, number>, dir: 'asc' | 'desc', limit: number): OBLevel[] {
  const arr: OBLevel[] = [];
  map.forEach((qty, price) => arr.push({ price, qty }));
  arr.sort((a, b) => (dir === 'asc' ? a.price - b.price : b.price - a.price));
  return arr.slice(0, limit);
}

function levelsSignature(levels: OBLevel[]) {
  return levels.map((lvl) => `${lvl.price}:${lvl.qty}`).join('|');
}
