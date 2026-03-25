import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
    Animated,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useOrderbookBybit } from "@/services/orderbook/useOrderbookBybit";
import { CryptoPriceClient, PriceMap } from "@/services/coindetails/CryptoPriceClient";
import { TradeSlider } from "@/components/trade-slider";
import ArrowLeft from "@/assets/icons/arrow-left.svg";
import ChartIcon from "@/assets/icons/Trade/chart.svg";
import CheckIcon from "@/assets/icons/check.svg";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";

// ─── Static Data ────────────────────────────────────────────────────────────

const COIN_PAIRS = [
  { base: "BTC", quote: "USDT", change: "+1.88%" },
  { base: "ETH", quote: "USDT", change: "+0.64%" },
  { base: "SOL", quote: "USDT", change: "-2.14%" },
  { base: "XRP", quote: "USDT", change: "+3.02%" },
];

const OPEN_ORDERS = [
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

const ORDER_TABS = ["Open Orders (2)", "My Order (0)", "My Trade (2)"];
const asGradient = (c: readonly string[]) => c as [string, string, ...string[]];

// ─── Component ───────────────────────────────────────────────────────────────

export default function TradeScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const palette = AppColors[colorScheme];
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [orderTab, setOrderTab] = useState(0);
  const [tpslEnabled, setTpslEnabled] = useState(true);
  const [isPairSheetOpen, setIsPairSheetOpen] = useState(false);
  const [isDepthSheetOpen, setIsDepthSheetOpen] = useState(false);
  const [depthValue, setDepthValue] = useState("0.01");
  const [selectedPair, setSelectedPair] = useState(COIN_PAIRS[0]);
  const [tpLimit, setTpLimit] = useState("");
  const [slTrigger, setSlTrigger] = useState("");
  const [slLimit, setSlLimit] = useState("");
  const [priceValue, setPriceValue] = useState("70653.76");
  const [amountValue, setAmountValue] = useState("");
  const [hideOtherPairs, setHideOtherPairs] = useState(false);
  const [coinPrices, setCoinPrices] = useState<PriceMap>({});

  // animated tab indicator
  const tabLayouts = useRef<{ x: number; width: number }[]>([]);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(30)).current;
  const priceInputRef = useRef<TextInput>(null);
  const amountInputRef = useRef<TextInput>(null);

  const isBuy = activeTab === "buy";
  const accentColor = isBuy ? "#00C28E" : "#DE2E42";
  const accentBuy = "#00C28E";
  const accentSell = "#DE2E42";
  const selectedSymbol = `${selectedPair.base}${selectedPair.quote}`;
  const selectedPrice = coinPrices[selectedSymbol];
  const parseNumeric = (value: string) => {
    const cleaned = value.replace(/,/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const totalValue = parseNumeric(priceValue) * parseNumeric(amountValue);
  const totalDisplay =
    totalValue > 0
      ? totalValue.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })
      : "";

  // Theme aliases
  const bg = palette.background;
  const surface = isDark ? palette.surface : "#F5F5F5";
  const cardBg = isDark ? palette.surface : palette.background;
  const border = palette.border;
  const textPrimary = palette.text;
  const textMuted = palette.textMuted;
  const inputBg = isDark ? "#021210" : "#F0F0F0";
  const inputBorder = isDark ? palette.border : "#D6D6D6";

  const switchOrderTab = (i: number) => {
    setOrderTab(i);
  };

  const adjustTpsl = (value: string, setValue: (v: string) => void, delta: number) => {
    const n = parseFloat(value || "0");
    const next = Math.max(0, n + delta);
    setValue(Number.isFinite(next) ? next.toFixed(2) : "");
  };

  useEffect(() => {
    const symbols = COIN_PAIRS.map((p) => `${p.base}${p.quote}`);
    const client = new CryptoPriceClient(symbols);
    const off = client.onUpdate((prices) => setCoinPrices(prices));
    client.start().catch(() => {});
    return () => {
      off();
      client.stop().catch(() => {});
    };
  }, []);

  const { bids, asks } = useOrderbookBybit(selectedSymbol);
  const obRows = 7;
  const topBids = bids.slice(0, obRows);
  const topAsks = asks.slice(0, obRows);
  const maxQty = Math.max(
    1,
    ...topBids.map((l) => l.qty),
    ...topAsks.map((l) => l.qty)
  );
  const bestBid = topBids[0]?.price ?? 0;
  const bestAsk = topAsks[0]?.price ?? 0;
  const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : 0;

  useEffect(() => {
    const layout = tabLayouts.current[orderTab];
    if (!layout) return;
    Animated.spring(indicatorX, {
      toValue: layout.x,
      useNativeDriver: false,
      speed: 20,
    }).start();
    Animated.spring(indicatorW, {
      toValue: layout.width,
      useNativeDriver: false,
      speed: 20,
    }).start();
  }, [orderTab, indicatorW, indicatorX]);

  // ── Stepper Input ──
  const StepInput = ({
    value,
    onChange,
    placeholder,
    unit,
    inputRef,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    unit?: string;
    inputRef?: RefObject<TextInput>;
  }) => (
    <Pressable
      onPress={() => inputRef?.current?.focus()}
      style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}
    >
      <Pressable
        onPress={() => {
          const n = parseFloat(value) || 0;
          onChange(String(Math.max(0, n - 1).toFixed(2)));
        }}
        style={[styles.stepBtn, { borderColor: inputBorder }]}
      >
        <Text style={[styles.stepBtnText, { color: textPrimary }]}>−</Text>
      </Pressable>
      <View style={styles.inputCenter}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={textMuted}
          keyboardType="decimal-pad"
          selectTextOnFocus
          style={[styles.inputText, { color: textPrimary }]}
          textAlign="center"
        />
        {unit ? (
          <Text style={[styles.inputUnit, { color: textMuted }]}>{unit}</Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => {
          const n = parseFloat(value) || 0;
          onChange(String((n + 1).toFixed(2)));
        }}
        style={[styles.stepBtn, { borderColor: inputBorder }]}
      >
        <Text style={[styles.stepBtnText, { color: textPrimary }]}>+</Text>
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={["top"]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Background glow */}
      {isDark && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={asGradient(["rgba(0,194,142,0.05)", "rgba(0,0,0,0)"])}
            style={{ height: 260 }}
          />
        </View>
      )}

      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <Pressable style={styles.headerBtn}>
          <ArrowLeft width={20} height={20} color={textMuted} />
        </Pressable>

        <Pressable style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>BTC/ETH</Text>
          <Text style={[styles.headerCaret, { color: textMuted }]}>▾</Text>
        </Pressable>

        {/* Hamburger */}
        <Pressable style={styles.headerBtn}>
          <View style={styles.hamburger}>
            {[24, 18, 24].map((w, i) => (
              <View
                key={i}
                style={[styles.hamburgerLine, { width: w, backgroundColor: textMuted }]}
              />
            ))}
          </View>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Pair Selector Bar ── */}
          <View
          style={[
            styles.pairBar,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          {/* Bitcoin icon */}
          <Pressable style={styles.pairLeft} onPress={() => setIsPairSheetOpen(true)}>
            <View style={styles.btcBadge}>
              <Text style={styles.btcBadgeText}>{selectedPair.base.slice(0, 1)}</Text>
            </View>
            <View>
              <View style={styles.pairNameRow}>
                <Text style={[styles.pairName, { color: textPrimary }]}>
                  {selectedPair.base}/{selectedPair.quote}
                </Text>
                <Text style={[styles.dropArrow, { color: textMuted }]}>▾</Text>
              </View>
              <View style={styles.changeRow}>
                <Text style={[styles.changeArrow, { color: accentBuy }]}>↑</Text>
                <Text style={[styles.changeText, { color: accentBuy }]}>
                  {selectedPrice ? `$${selectedPrice.toFixed(2)}` : selectedPair.change}
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Chart icon + chevron */}
          <Pressable
            style={styles.pairRight}
            onPress={() =>
              router.push({
                pathname: "/(stack)/chart",
                params: {
                  symbol: selectedSymbol,
                  pair: `${selectedPair.base}/${selectedPair.quote}`,
                },
              })
            }
          >
            <ChartIcon width={16} height={16} color={textMuted} />
            <Text style={[styles.chevron, { color: textMuted }]}>›</Text>
          </Pressable>
        </View>

        {/* ── Main Trading Panel (2 columns) ── */}
        <View style={styles.tradingPanel}>
          {/* LEFT: Order Book */}
          <View style={styles.orderBookCol}>
            {/* Depth selector */}
            <Pressable
              style={[styles.depthSelector, { backgroundColor: inputBg, borderColor: inputBorder }]}
              onPress={() => setIsDepthSheetOpen(true)}
            >
              <Text style={[styles.depthValue, { color: textPrimary }]}>{depthValue}</Text>
              <View style={styles.depthChevrons}>
                <View style={[styles.depthChevronUp, { borderBottomColor: textMuted }]} />
                <View style={[styles.depthChevronDown, { borderTopColor: textMuted }]} />
              </View>
            </Pressable>

            {/* Column headers */}
            <View style={styles.obHeaders}>
              <View>
                <Text style={[styles.obHeaderLabel, { color: textPrimary }]}>Price</Text>
                <Text style={[styles.obHeaderSub, { color: textMuted }]}>(USDT)</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.obHeaderLabel, { color: textPrimary }]}>Amount</Text>
                <Text style={[styles.obHeaderSub, { color: textMuted }]}>(BTC)</Text>
              </View>
            </View>

            {/* Ask rows (sell) */}
            {topAsks.map((row, i) => {
              const barPct = row.qty / maxQty;
              return (
                <Pressable
                  key={`ask-${i}`}
                  style={styles.obRow}
                  onPress={() => setPriceValue(row.price.toFixed(2))}
                >
                  <View
                    style={[
                      styles.obBar,
                      {
                        backgroundColor: "rgba(222,46,66,0.15)",
                        width: `${barPct * 100}%`,
                        right: 0,
                      },
                    ]}
                  />
                  <Text style={[styles.obPrice, { color: accentSell }]}>
                    {row.price.toFixed(2)}
                  </Text>
                  <Text style={[styles.obAmount, { color: isDark ? textPrimary : textMuted }]}>
                    {row.qty.toFixed(4)}
                  </Text>
                </Pressable>
              );
            })}

            {/* Mid price */}
            <View style={[styles.midPriceRow, { borderTopColor: border, borderBottomColor: border }]}>
              <Text style={[styles.midPrice, { color: accentSell }]}>
                {bestAsk ? bestAsk.toFixed(2) : "--"}
              </Text>
              <Text style={[styles.midPriceSub, { color: textMuted }]}>
                {midPrice ? `≈${midPrice.toFixed(2)}` : "--"}
              </Text>
            </View>

            {/* Bid rows (buy) */}
            {topBids.map((row, i) => {
              const barPct = row.qty / maxQty;
              return (
                <Pressable
                  key={`bid-${i}`}
                  style={styles.obRow}
                  onPress={() => setPriceValue(row.price.toFixed(2))}
                >
                  <View
                    style={[
                      styles.obBar,
                      {
                        backgroundColor: "rgba(0,194,142,0.15)",
                        width: `${barPct * 100}%`,
                        right: 0,
                      },
                    ]}
                  />
                  <Text style={[styles.obPrice, { color: accentBuy }]}>
                    {row.price.toFixed(2)}
                  </Text>
                  <Text style={[styles.obAmount, { color: isDark ? textPrimary : textMuted }]}>
                    {row.qty.toFixed(4)}
                  </Text>
                </Pressable>
              );
            })}

            {/* Bottom mid price */}
            <View style={[styles.midPriceRow, { borderTopColor: border, borderBottomColor: border, marginTop: 2 }]}>
              <Text style={[styles.midPrice, { color: accentBuy }]}>
                {bestBid ? bestBid.toFixed(2) : "--"}
              </Text>
              <Text style={[styles.midPriceSub, { color: textMuted }]}>
                {midPrice ? `≈${midPrice.toFixed(2)}` : "--"}
              </Text>
            </View>
          </View>

          {/* RIGHT: Order Form */}
          <View style={styles.orderFormCol}>
            {/* Buy / Sell toggle */}
            <View style={styles.buySellTab}>
              {(["buy", "sell"] as const).map((tab) => {
                const isActive = activeTab === tab;
                const activeBg = tab === "buy" ? accentBuy : accentSell;
                const inactiveBg = isDark ? "#0B0B0B" : "#FFFFFF";
                const inactiveBorder = isDark ? border : "#D7D7D7";
                const inactiveText = isDark ? "#E7E7E7" : "#1A1A1A";

                return (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[
                      styles.bsBtn,
                      isActive
                        ? { backgroundColor: activeBg }
                        : { backgroundColor: inactiveBg, borderColor: inactiveBorder, borderWidth: 1.5 },
                    ]}
                  >
                    <View style={styles.innerContent}>
                      <Text
                        style={[
                          styles.bsBtnText,
                          { color: isActive ? "#FFFFFF" : inactiveText },
                        ]}
                      >
                        {tab === "buy" ? "Buy" : "Sell"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>


            {/* Order type selector */}
            <Pressable
              style={[
                styles.dropdownRow,
                { backgroundColor: inputBg, borderColor: inputBorder },
              ]}
            >
              <Text style={[styles.dropdownText, { color: textPrimary }]}>Limit</Text>
              <Text style={[styles.dropdownCaret, { color: textMuted }]}>▾</Text>
            </Pressable>

            {/* Price input */}
            <StepInput
              inputRef={priceInputRef}
              value={priceValue}
              onChange={setPriceValue}
              placeholder="Price"
            />

            {/* Amount input */}
            <StepInput
              inputRef={amountInputRef}
              value={amountValue}
              onChange={setAmountValue}
              placeholder="Amount (BTC)"
            />

            {/* Percentage slider */}
            <TradeSlider isDark={isDark} accentColor={accentColor} textMuted={textMuted} />

            {/* Total */}
            <View style={[styles.totalRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              {totalDisplay ? (
                <Text style={[styles.totalValue, { color: textPrimary }]}>
                  {totalDisplay} USDT
                </Text>
              ) : (
                <Text style={[styles.totalPlaceholder, { color: textMuted }]}>Total (USDT)</Text>
              )}
            </View>

            {/* TP/SL toggle */}
            <Pressable
              style={styles.tpslRow}
              onPress={() => setTpslEnabled((v) => !v)}
            >
              <View
                style={[
                  styles.tpslCheckbox,
                  {
                    backgroundColor: tpslEnabled ? accentColor : "transparent",
                    borderColor: tpslEnabled ? accentColor : inputBorder,
                  },
                ]}
              >
                {tpslEnabled && <CheckIcon width={9} height={9} color="#FFFFFF" />}
              </View>
              <Text style={[styles.tpslLabel, { color: textPrimary }]}>TP/SL</Text>
            </Pressable>

            {/* TP/SL fields (visible when enabled) */}
            {tpslEnabled && (
              <>
                {[
                  { key: "tp", label: "TP Limit (USDT)", value: tpLimit, setValue: setTpLimit },
                  { key: "slTrigger", label: "SL Trigger (USDT)", value: slTrigger, setValue: setSlTrigger },
                  { key: "slLimit", label: "SL Limit", value: slLimit, setValue: setSlLimit },
                ].map(({ key, label, value, setValue }) => (
                  <View
                    key={key}
                    style={[
                      styles.tpslInputRow,
                      isDark
                        ? { borderColor: "#275049", backgroundColor: "rgba(0,101,83,0.08)" }
                        : { borderColor: "#D6D6D6", backgroundColor: "#EFEFEF" },
                    ]}
                  >
                    {isDark && (
                      <LinearGradient
                        colors={asGradient(["rgba(60,255,220,0.03)", "rgba(23,152,129,0.03)"])}
                        style={StyleSheet.absoluteFillObject}
                      />
                    )}
                    <Pressable
                      style={[styles.tpslStepBtn, { borderColor: inputBorder }]}
                      onPress={() => adjustTpsl(value, setValue, -1)}
                    >
                      <Text style={[styles.tpslStepText, { color: textPrimary }]}>−</Text>
                    </Pressable>
                    <TextInput
                      value={value}
                      onChangeText={setValue}
                      placeholder={label}
                      placeholderTextColor={textMuted}
                      keyboardType="decimal-pad"
                      style={[styles.tpslInput, { color: textPrimary }]}
                      textAlign="center"
                    />
                    <Pressable
                      style={[styles.tpslStepBtn, { borderColor: inputBorder }]}
                      onPress={() => adjustTpsl(value, setValue, 1)}
                    >
                      <Text style={[styles.tpslStepText, { color: textPrimary }]}>+</Text>
                    </Pressable>
                  </View>
                ))}
              </>
            )}

            {/* Stats block */}
            <View style={styles.statsBlock}>
              {[
                { label: "Avbl", value: "0 USDT", showAdd: true },
                { label: "Max Buy", value: "0 BTC", showAdd: false },
                { label: "Est. Fee", value: "0.000375 BTC", showAdd: false },
              ].map(({ label, value, showAdd }) => (
                <View key={label} style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: textMuted }]}>{label}</Text>
                  <View style={styles.statValueRow}>
                    <Text style={[styles.statValue, { color: isDark ? textPrimary : textMuted }]}>
                      {value}
                    </Text>
                    {showAdd && (
                      <View style={[styles.addBtn, { backgroundColor: accentColor }]}>
                        <Text style={styles.addBtnText}>+</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Action Button */}
            <Pressable
              style={[
                styles.actionBtn,
                { backgroundColor: accentColor },
              ]}
            >
              <Text style={styles.actionBtnText}>
                {isBuy ? "Buy BTC" : "Sell BTC"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Open Orders Section ── */}
        <View style={[styles.ordersSection, { borderTopColor: border }]}>
          {/* Tab row */}
          <View style={styles.orderTabRow}>
            {ORDER_TABS.map((tab, i) => (
              <Pressable
                key={tab}
                onPress={() => switchOrderTab(i)}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  tabLayouts.current[i] = { x, width };
                  if (i === orderTab) {
                    indicatorX.setValue(x);
                    indicatorW.setValue(width);
                  }
                }}
              >
                <Text
                  style={[
                    styles.orderTabText,
                    {
                      color: i === orderTab ? textPrimary : textMuted,
                      fontWeight: i === orderTab ? "600" : "400",
                    },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Animated indicator */}
          <View style={styles.indicatorTrack}>
            <Animated.View
              style={[
                styles.indicator,
                {
                  backgroundColor: accentBuy,
                  transform: [{ translateX: indicatorX }],
                  width: indicatorW,
                },
              ]}
            />
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setHideOtherPairs((v) => !v)}
            >
              <View
                style={[
                  styles.checkboxBox,
                  {
                    borderColor: hideOtherPairs ? accentBuy : border,
                    backgroundColor: hideOtherPairs ? accentBuy : "transparent",
                  },
                ]}
              >
                {hideOtherPairs && <CheckIcon width={9} height={9} color="#FFFFFF" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: textPrimary }]}>
                Hide Other Pairs
              </Text>
            </Pressable>

            <Pressable style={[styles.cancelAllBtn, { backgroundColor: isDark ? "#1F2222" : "#1F2222" }]}>
              <Text style={styles.cancelAllText}>Cancel All</Text>
            </Pressable>
          </View>

          {/* Order cards */}
          <View
            style={[
              styles.orderCard,
              {
                backgroundColor: isDark ? "transparent" : palette.background,
                borderColor: isDark ? "#275049" : "#D6D6D6",
              },
            ]}
          >
            {isDark && (
              <LinearGradient
                colors={asGradient([
                  "rgba(60,255,220,0.025)",
                  "rgba(23,152,129,0.025)",
                  "rgba(19,141,119,0.025)",
                  "rgba(51,255,219,0.025)",
                ])}
                style={StyleSheet.absoluteFillObject}
              />
            )}

            {OPEN_ORDERS.map((order, i) => (
              <View key={i}>
                {i > 0 && (
                  <View style={[styles.orderDivider, { backgroundColor: border }]} />
                )}
                <View style={styles.orderItemHeader}>
                  <View style={styles.orderLeft}>
                    <Text style={[styles.orderPair, { color: textPrimary }]}>
                      <Text style={styles.orderPairBase}>{order.pair}</Text>
                      <Text style={{ color: textMuted, fontSize: Typography.size.sm }}>
                        /{order.quote}
                      </Text>
                    </Text>
                    <View style={[styles.orderTypeBadge, { backgroundColor: isDark ? "rgba(0,194,142,0.12)" : "#E0F5EE" }]}>
                      <Text style={[styles.orderTypeText, { color: accentBuy }]}>
                        {order.type}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.orderDate, { color: textMuted }]}>{order.date}</Text>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.orderDetailLeft}>
                    <View style={styles.orderDetailRow}>
                      <Text style={[styles.orderDetailLabel, { color: textMuted }]}>
                        Amount (USDT)
                      </Text>
                      <Text style={[styles.orderDetailValue, { color: textPrimary }]}>
                        {order.amount}{" "}
                        <Text style={{ color: textMuted }}>/ {order.total}</Text>
                      </Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <Text style={[styles.orderDetailLabel, { color: textMuted }]}>Price</Text>
                      <Text style={[styles.orderDetailValue, { color: textPrimary }]}>
                        {order.price}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={[
                      styles.cancelBtn,
                      { backgroundColor: isDark ? "#1F2222" : "#ECECEC" },
                    ]}
                  >
                    <Text style={[styles.cancelBtnText, { color: isDark ? "#ECECF1" : "#333" }]}>
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={isPairSheetOpen}
        animationType="fade"
        onRequestClose={() => setIsPairSheetOpen(false)}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsPairSheetOpen(false)}
          />
          <View style={[styles.sheetContainer, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: textPrimary }]}>Select Pair</Text>
            {COIN_PAIRS.map((pair) => {
              const symbol = `${pair.base}${pair.quote}`;
              const price = coinPrices[symbol];
              return (
              <Pressable
                key={`${pair.base}-${pair.quote}`}
                style={styles.sheetItem}
                onPress={() => {
                  setSelectedPair(pair);
                  setIsPairSheetOpen(false);
                }}
              >
                <View style={styles.sheetItemLeft}>
                  <View style={styles.sheetBadge}>
                    <Text style={styles.sheetBadgeText}>{pair.base.slice(0, 1)}</Text>
                  </View>
                  <Text style={[styles.sheetPairText, { color: textPrimary }]}>
                    {pair.base}/{pair.quote}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.sheetChangeText,
                    { color: price && price < 0 ? accentSell : accentBuy },
                  ]}
                >
                  {price ? `$${price.toFixed(2)}` : pair.change}
                </Text>
              </Pressable>
            )})}
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={isDepthSheetOpen}
        animationType="fade"
        onRequestClose={() => setIsDepthSheetOpen(false)}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsDepthSheetOpen(false)}
          />
          <View style={[styles.sheetContainer, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: textPrimary }]}>Select Depth</Text>
            {["0.001", "0.01", "0.1", "1.0"].map((v) => (
              <Pressable
                key={v}
                style={styles.sheetItem}
                onPress={() => {
                  setDepthValue(v);
                  setIsDepthSheetOpen(false);
                }}
              >
                <Text style={[styles.sheetPairText, { color: textPrimary }]}>{v}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerCaret: { fontSize: 15 },
  hamburger: {
    gap: 4,
    alignItems: "flex-end",
  },
  hamburgerLine: {
    height: 2,
    borderRadius: Radii.pill,
  },

  // Pair Bar
  pairBar: {
    marginHorizontal: Spacing.xl,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: Radii.md,
    borderWidth: 0.6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pairLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  btcBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F7931A",
    alignItems: "center",
    justifyContent: "center",
  },
  btcBadgeText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  pairNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  pairName: { fontSize: Typography.size.sm, fontWeight: "600" },
  dropArrow: { fontSize: 13 },
  changeRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  changeArrow: { fontSize: 11 },
  changeText: { fontSize: Typography.size.xs, fontWeight: "600" },
  pairRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  chevron: { fontSize: 20 },

  // Pair sheet
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 0.6,
    paddingHorizontal: Spacing.xl,
    paddingTop: 10,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(120,120,120,0.4)",
    marginBottom: 12,
  },
  sheetTitle: { fontSize: Typography.size.md, fontWeight: "700", marginBottom: 10 },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  sheetItemLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  sheetBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F7931A",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  sheetPairText: { fontSize: Typography.size.sm, fontWeight: "600" },
  sheetChangeText: { fontSize: Typography.size.xs, fontWeight: "600" },

  // Trading Panel – 2 cols
  tradingPanel: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    paddingTop: 8,
    gap: 12,
  },

  // Order Book
  orderBookCol: { flex: 1, gap: 0 },
  depthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: Radii.sm,
    borderWidth: 0.6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  depthValue: { fontSize: Typography.size.xs, fontWeight: "500" },
  depthChevrons: { gap: 3 },
  depthChevronUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  depthChevronDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  obHeaders: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  obHeaderLabel: { fontSize: 12, fontWeight: "600" },
  obHeaderSub: { fontSize: 10 },
  obRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 22,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  obBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  obPrice: { fontSize: 12, zIndex: 1, fontVariant: ["tabular-nums"] },
  obAmount: { fontSize: 12, zIndex: 1, fontVariant: ["tabular-nums"] },
  midPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    marginVertical: 3,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  midPrice: { fontSize: Typography.size.sm, fontWeight: "700" },
  midPriceSub: { fontSize: 11, fontWeight: "400" },
  // Order Form
  orderFormCol: { width: 176, gap: 7 },
  buySellTab: {
    flexDirection: "row",
    gap: 6,
  },

  bsBtn: {
    flex: 1,
    height: 30,
    justifyContent: "center",
    overflow: "hidden",

    // 👇 Slant effect
    transform: [{ skewX: "-15deg" }],
    borderRadius: 8,
  },

  innerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

    // 👇 reverse skew so text looks straight
    transform: [{ skewX: "10deg" }],
  },

  bsBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Limit dropdown
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 38,
  },
  dropdownText: { fontSize: 14, fontWeight: "600" },
  dropdownCaret: { fontSize: 14 },

  // Step Input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radii.sm,
    borderWidth: 0.6,
    overflow: "hidden",
  },
  stepBtn: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  stepBtnText: { fontSize: 16, fontWeight: "500" },
  inputCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  inputText: {
    fontSize: Typography.size.xs,
    fontWeight: "500",
    width: "100%",
    textAlign: "center",
    paddingVertical: 9,
  },
  inputUnit: { fontSize: 9, position: "absolute", bottom: 3 },

  // Total
  totalRow: {
    borderRadius: Radii.sm,
    borderWidth: 0.6,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  totalPlaceholder: { fontSize: Typography.size.xs },
  totalValue: { fontSize: Typography.size.sm, fontWeight: "600" },

  // TP/SL
  tpslRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tpslCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tpslLabel: { fontSize: Typography.size.xs, fontWeight: "500" },
  tpslInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radii.sm,
    borderWidth: 0.6,
    overflow: "hidden",
  },
  tpslStepBtn: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  tpslStepText: { fontSize: 15, fontWeight: "500" },
  tpslInput: {
    flex: 1,
    fontSize: 10.5,
    paddingVertical: 8,
  },

  // Stats
  statsBlock: { gap: 4, marginTop: 2 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLabel: { fontSize: 10 },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontSize: 10, textAlign: "right" },
  addBtn: {
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", lineHeight: 14 },

  // Action button
  actionBtn: {
    borderRadius: Radii.pill,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 2,
    shadowColor: "#00C28E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  // Open Orders Section
  ordersSection: {
    marginTop: 16,
    paddingHorizontal: Spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
  orderTabRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: 6,
  },
  orderTabText: { fontSize: Typography.size.xs },
  indicatorTrack: { height: 3, marginBottom: 12, position: "relative" },
  indicator: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 3,
    borderRadius: Radii.pill,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: { fontSize: Typography.size.xs, fontWeight: "500" },
  cancelAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.xs,
  },
  cancelAllText: {
    fontSize: Typography.size.xs,
    fontWeight: "600",
    color: "#ECECF1",
  },

  // Order Card
  orderCard: {
    borderRadius: Radii.md,
    borderWidth: 0.6,
    padding: 12,
    overflow: "hidden",
    gap: 10,
  },
  orderDivider: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  orderItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  orderLeft: { gap: 5 },
  orderPair: { fontSize: 0 },
  orderPairBase: {
    fontSize: Typography.size.md,
    fontWeight: "700",
  },
  orderTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.xs,
  },
  orderTypeText: { fontSize: Typography.size.xs, fontWeight: "600" },
  orderDate: { fontSize: Typography.size.xs },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  orderDetailLeft: { gap: 8 },
  orderDetailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderDetailLabel: { fontSize: Typography.size.xs, width: 80 },
  orderDetailValue: { fontSize: Typography.size.xs, fontWeight: "500" },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.xs,
  },
  cancelBtnText: { fontSize: Typography.size.xs, fontWeight: "500" },
});
