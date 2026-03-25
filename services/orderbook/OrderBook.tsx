// src/components/OrderBook.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type OBLevel = { price: number; qty: number };

export type OrderBookProps = {
  bids: OBLevel[];                 // sorted desc by price
  asks: OBLevel[];                 // sorted asc by price
  rows?: number;                   // how many rows per side to show (default 12)
  cumulative?: boolean;            // show cumulative qty instead of raw (default false)
  precision?: { price?: number; qty?: number }; // formatting
  onSelect?: (side: 'bid' | 'ask', level: OBLevel, index: number) => void;
  theme?: {
    bg?: string;
    text?: string;
    divider?: string;
    bidText?: string;
    askText?: string;
    bidBar?: string;
    askBar?: string;
    spreadText?: string;
  };
};

type RowAnim = { w: Animated.Value; flash: Animated.Value; lastPx: number; lastQty: number };

export default function OrderBook({
  bids,
  asks,
  rows = 12,
  cumulative = false,
  precision = { price: 2, qty: 4 },
  onSelect,
  theme,
}: OrderBookProps) {
  const t = {                      // defaults (dark-friendly)
    bg: theme?.bg ?? '#0b0f16',
    text: theme?.text ?? '#d1d4dc',
    divider: theme?.divider ?? '#1f2940',
    bidText: theme?.bidText ?? '#26a69a',
    askText: theme?.askText ?? '#ef5350',
    bidBar: theme?.bidBar ?? 'rgba(38,166,154,0.25)',
    askBar: theme?.askBar ?? 'rgba(239,83,80,0.25)',
    spreadText: theme?.spreadText ?? '#9aa4b2',
  };

  // top N
  const topBids = useMemo(() => bids.slice(0, rows), [bids, rows]);
  const topAsks = useMemo(() => asks.slice(0, rows), [asks, rows]);

  // cumulative (optional)
  const cBids = useMemo(() => (cumulative ? cumulate(topBids, 'bid') : topBids), [topBids, cumulative]);
  const cAsks = useMemo(() => (cumulative ? cumulate(topAsks, 'ask') : topAsks), [topAsks, cumulative]);

  // max for scaling bars (use combined so both sides share the same visual scale)
  const maxQty = useMemo(() => {
    const mb = cBids.reduce((m, x) => Math.max(m, x.qty), 0);
    const ma = cAsks.reduce((m, x) => Math.max(m, x.qty), 0);
    return Math.max(1, mb, ma);
  }, [cBids, cAsks]);

  // spread (best ask - best bid)
  const bestBid = topBids[0]?.price ?? 0;
  const bestAsk = topAsks[0]?.price ?? 0;
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;

  // Measure row width once to convert % to px for Animated widths
  const [rowWidth, setRowWidth] = useState(0);
  const onRowLayout = (e: LayoutChangeEvent) => setRowWidth(e.nativeEvent.layout.width);

  // Animated maps keyed by side:price (stable between renders)
  const animsRef = useRef(new Map<string, RowAnim>());

  // Push anim updates when data changes
  useEffect(() => {
    // update side anims
    updateAnimsForSide(cBids, 'bid', rowWidth, maxQty, animsRef.current);
    updateAnimsForSide(cAsks, 'ask', rowWidth, maxQty, animsRef.current);
    // GC old anims not in top lists
    const validKeys = new Set([
      ...cBids.map((l) => keyFor('bid', l.price)),
      ...cAsks.map((l) => keyFor('ask', l.price)),
    ]);
    for (const k of animsRef.current.keys()) {
      if (!validKeys.has(k)) animsRef.current.delete(k);
    }
  }, [cBids, cAsks, rowWidth, maxQty]);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* SPREAD */}
      <View style={[styles.spread, { borderTopColor: t.divider, borderBottomColor: t.divider }]}>
        <Text style={[styles.spreadText, { color: t.spreadText }]}>
          Spread: {formatNum(spread, precision.price ?? 2)}
        </Text>
        <Text style={[styles.midText, { color: t.text }]}>
          {bestBid && bestAsk ? `Bid ${formatNum(bestBid, precision.price)} / Ask ${formatNum(bestAsk, precision.price)}` : '--'}
        </Text>
      </View>

      <View style={styles.columns}>
        {/* BIDS */}
        <View style={styles.side}>
          <HeaderRow left="Price (Bid)" right="Qty" color={t.bidText} />
          <View onLayout={onRowLayout}>
            {cBids.map((l, i) => (
              <OrderRow
                key={keyFor('bid', l.price)}
                side="bid"
                i={i}
                price={l.price}
                qty={l.qty}
                maxQty={maxQty}
                rowWidth={rowWidth}
                colors={{ text: t.bidText, bar: t.bidBar, defaultText: t.text }}
                precision={precision}
                getAnim={(k) => animsRef.current.get(k)}
                onPress={onSelect}
              />
            ))}
          </View>
        </View>

        {/* divider */}
        <View style={[styles.vDivider, { backgroundColor: t.divider }]} />

        {/* ASKS */}
        <View style={styles.side}>
          <HeaderRow left="Price (Ask)" right="Qty" color={t.askText} />
          <View onLayout={onRowLayout}>
            {cAsks.map((l, i) => (
              <OrderRow
                key={keyFor('ask', l.price)}
                side="ask"
                i={i}
                price={l.price}
                qty={l.qty}
                maxQty={maxQty}
                rowWidth={rowWidth}
                colors={{ text: t.askText, bar: t.askBar, defaultText: t.text }}
                precision={precision}
                getAnim={(k) => animsRef.current.get(k)}
                onPress={onSelect}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

/* ---------- Helpers & Subcomponents ---------- */

function HeaderRow({ left, right, color }: { left: string; right: string; color: string }) {
  return (
    <View style={styles.headerRow}>
      <Text style={[styles.headerText, { color }]}>{left}</Text>
      <Text style={[styles.headerText, { color }]}>{right}</Text>
    </View>
  );
}

function OrderRow(props: {
  side: 'bid' | 'ask';
  i: number;
  price: number;
  qty: number;
  maxQty: number;
  rowWidth: number;
  colors: { text: string; bar: string; defaultText: string };
  precision: { price?: number; qty?: number };
  getAnim: (key: string) => RowAnim | undefined;
  onPress?: (side: 'bid' | 'ask', level: OBLevel, index: number) => void;
}) {
  const {
    side, i, price, qty, maxQty, rowWidth, colors, precision, getAnim, onPress,
  } = props;
  const k = keyFor(side, price);
  let anim = getAnim(k);
  // Fallback (first mount): 0 width, no flash
  if (!anim) {
    anim = { w: new Animated.Value(0), flash: new Animated.Value(0), lastPx: 0, lastQty: 0 };
  }

  const widthPx = anim.w; // Animated.Value (px)
  const flash = anim.flash; // 0..1

  return (
    <Pressable
      onPress={() => onPress?.(side, { price, qty }, i)}
      style={styles.row}
    >
      {/* animated depth bar */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.bar,
          { width: widthPx, backgroundColor: colors.bar },
        ]}
      />
      {/* subtle glow when qty changed */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { opacity: flash, backgroundColor: side === 'bid' ? 'rgba(38,166,154,0.2)' : 'rgba(239,83,80,0.2)' },
        ]}
      />
      <View style={styles.rowContent}>
        <Text style={[styles.price, { color: colors.text }]}>
          {formatNum(price, precision.price ?? 2)}
        </Text>
        <Text style={[styles.qty, { color: colors.defaultText }]}>
          {formatNum(qty, precision.qty ?? 4)}
        </Text>
      </View>
    </Pressable>
  );
}

function cumulate(levels: OBLevel[], side: 'bid' | 'ask'): OBLevel[] {
  // bids: running total forward; asks: running total forward (levels already sorted)
  let acc = 0;
  return levels.map((l) => {
    acc += l.qty;
    return { price: l.price, qty: acc };
  });
}

function keyFor(side: 'bid' | 'ask', price: number) {
  return `${side}:${price}`;
}

function formatNum(n: number, digits = 2) {
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function updateAnimsForSide(
  levels: OBLevel[],
  side: 'bid' | 'ask',
  rowWidth: number,
  maxQty: number,
  map: Map<string, RowAnim>,
) {
  if (!rowWidth || !maxQty) return;
  levels.forEach((l) => {
    const k = keyFor(side, l.price);
    let entry = map.get(k);
    const targetPx = Math.max(0, Math.min(rowWidth, (l.qty / maxQty) * rowWidth));
    if (!entry) {
      entry = { w: new Animated.Value(targetPx), flash: new Animated.Value(0), lastPx: targetPx, lastQty: l.qty };
      map.set(k, entry);
      return;
    }
    // width anim
    Animated.timing(entry.w, { toValue: targetPx, duration: 220, useNativeDriver: false }).start();
    // flash on qty change
    if (entry.lastQty !== l.qty) {
      entry.flash.setValue(1);
      Animated.timing(entry.flash, { toValue: 0, duration: 450, useNativeDriver: true }).start();
      entry.lastQty = l.qty;
    }
    entry.lastPx = targetPx;
  });
}
//-------------------------------------------------------------------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { borderRadius: 10, overflow: 'hidden' },
  spread: { paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: 1, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between' },
  spreadText: { fontSize: 12, fontWeight: '600', opacity: 0.9 },
  midText: { fontSize: 12, opacity: 0.9 },
  columns: { flexDirection: 'row', padding: 8, gap: 8 },
  side: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 6 },
  headerText: { fontSize: 12, fontWeight: '700', opacity: 0.9 },
  vDivider: { width: 1, alignSelf: 'stretch' },
  row: { height: 26, justifyContent: 'center', marginVertical: 2, borderRadius: 4, overflow: 'hidden' },
  rowContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  price: { fontSize: 13, fontWeight: '700' },
  qty: { fontSize: 13, fontWeight: '500' },
  bar: { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
});
//-------------------------------------------------------------------------------------------------------------------------------