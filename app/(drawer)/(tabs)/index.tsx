import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import ArrowLeft from "@/assets/icons/arrow-left.svg";
import BuyDark from "@/assets/icons/Dashboard/Buy_dark.svg";
import BuyLight from "@/assets/icons/Dashboard/Buy_light.svg";
import BalanceHideDark from "@/assets/icons/Dashboard/balance details hide_dark.svg";
import BalanceHideLight from "@/assets/icons/Dashboard/balance details hide_light.svg";
import ContentBoxDark from "@/assets/icons/Dashboard/Content Box_dark.svg";
import ContentBoxLight from "@/assets/icons/Dashboard/Content Box_light.svg";
import DepositDark from "@/assets/icons/Dashboard/deposit_dark.svg";
import DepositLight from "@/assets/icons/Dashboard/deposite_light.svg";
import FiatDepositsDark from "@/assets/icons/Dashboard/fiatdeposite_dark.svg";
import FiatDepositsLight from "@/assets/icons/Dashboard/fiatdeposite_light.svg";
import KycDark from "@/assets/icons/Dashboard/kycverfication_dark.svg";
import KycLight from "@/assets/icons/Dashboard/kycverfication_light.svg";
import SellDark from "@/assets/icons/Dashboard/Sell_dark.svg";
import SellLight from "@/assets/icons/Dashboard/Sell_light.svg";
import WithdrawDark from "@/assets/icons/Dashboard/withdraw_dark.svg";
import WithdrawLight from "@/assets/icons/Dashboard/withdraw_light.svg";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";

const ACTIONS = [
  { key: "buy", label: "Buy", dark: BuyDark, light: BuyLight },
  { key: "sell", label: "Sell", dark: SellDark, light: SellLight },
  { key: "deposit", label: "Deposit", dark: DepositDark, light: DepositLight },
  {
    key: "withdraw",
    label: "Withdraw",
    dark: WithdrawDark,
    light: WithdrawLight,
  },
];

const MARKET_ROWS = [
  {
    key: "btc",
    base: "BTC",
    quote: "USDT",
    volume: "2.25B",
    price: "70,548.15",
    subPrice: "$70,548.15",
    change: "+1.7%",
    up: true,
  },
  {
    key: "usdc",
    base: "USDC",
    quote: "USDT",
    volume: "1.08B",
    price: "0.999",
    subPrice: "$0.9999",
    change: "-3.6%",
    up: false,
  },
  {
    key: "eth",
    base: "ETH",
    quote: "USDT",
    volume: "1.03B",
    price: "2,075.14",
    subPrice: "$2,075.14",
    change: "+4.8%",
    up: true,
  },
];

const FILTER_TABS = ["All", "Favorites", "Spot", "Gainers", "Losers"];
const INDICATOR_MIN_WIDTH = 8;

const asGradient = (colors: readonly string[]) =>
  colors as [string, string, ...string[]];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "dark";
  const palette = AppColors[colorScheme];
  const isDark = colorScheme === "dark";
  const [selectedFilter, setSelectedFilter] = useState(0);
  const tabLayouts = useRef<{ x: number; width: number }[]>([]);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(0)).current;

  const contentPadding = useMemo(
    () => ({
      paddingTop: Spacing.lg,
      paddingBottom: insets.bottom + 120,
    }),
    [insets.bottom],
  );

  const cardBg = isDark ? palette.surface : palette.primary;
  const cardBorder = isDark ? palette.border : "transparent";
  const cardTextColor = isDark ? palette.text : palette.onPrimary;
  const cardMutedText = isDark ? palette.textMuted : "rgba(255,255,255,0.75)";
 
  const actionCircle = isDark ? palette.surface : palette.primary;
  const KycIcon = isDark ? KycDark : KycLight;
  const FiatDepositsIcon = isDark ? FiatDepositsDark : FiatDepositsLight;
  const BalanceHideIcon = isDark ? BalanceHideDark : BalanceHideLight;
  const ContentBox = isDark ? ContentBoxDark : ContentBoxLight;

  const infoCardBg = isDark ? palette.surface : palette.background;
  const infoCardBorder = palette.border;
  const infoCardTitleColor = palette.text;
  const infoCardBodyColor = palette.textMuted;

  const marketTextColor = palette.text;
  const upPillBg = palette.primary;
  const downPillBg = "#DE2E42";

  const topGlow = isDark
    ? (["rgba(255,255,255,0.04)", "rgba(102,102,102,0)"] as const)
    : (["rgba(61,255,220,0.06)", "rgba(255,255,255,0)"] as const);

  useEffect(() => {
    const layout = tabLayouts.current[selectedFilter];
    if (!layout) return;
    indicatorX.setValue(layout.x);
    indicatorW.setValue(INDICATOR_MIN_WIDTH);
    Animated.timing(indicatorW, {
      toValue: layout.width,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selectedFilter, indicatorW, indicatorX]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Top glow */}
      <View pointerEvents="none" style={styles.topGlow}>
        <LinearGradient
          colors={asGradient(topGlow)}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, contentPadding]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable
            style={[styles.headerIcon, { borderColor: palette.border }]}
          >
            <ArrowLeft width={20} height={20} color={palette.textMuted} />
          </Pressable>

          <Text style={[styles.headerTitle, { color: palette.text }]}>
            Dashboard
          </Text>

          <Pressable style={styles.menuIcon}>
            <View
              style={[styles.menuLine, { backgroundColor: palette.textMuted }]}
            />
            <View
              style={[
                styles.menuLine,
                styles.menuLineWide,
                { backgroundColor: palette.textMuted },
              ]}
            />
            <View
              style={[styles.menuLine, { backgroundColor: palette.textMuted }]}
            />
          </Pressable>
        </View>

        {/* ── Balance Card ── */}
        <View
          style={[
            styles.balanceCard,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
          ]}
        >
          
          <ContentBox style={styles.cardPattern} width="120%" height="120%" />

          {/* Card content */}
          <View style={styles.cardContent}>
            <Text style={[styles.cardLabel, { color: cardMutedText }]}>
              Total value (BTC)
            </Text>
            <Text style={[styles.cardValue, { color: cardTextColor }]}>
              $2,385.60
            </Text>
            <View style={styles.cardSubRow}>
              <Text style={[styles.cardSubText, { color: cardMutedText }]}>
                = 0000000BTC
              </Text>
              <BalanceHideIcon width={16} height={12} />
            </View>
          </View>

          {/* Inset shadow overlay for dark */}
          {isDark ? <View style={styles.cardInsetShadow} /> : null}
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.actionsRow}>
          {ACTIONS.map((action) => {
            const Icon = isDark ? action.dark : action.light;
            return (
              <Pressable key={action.key} style={styles.actionItem}>
                <View
                  style={[
                    styles.actionCircle,
                    {
                      backgroundColor: actionCircle,
                      borderColor: isDark ? palette.border : palette.primaryAlt,
                    },
                  ]}
                >
                  <Icon width={24} height={24} />
                </View>
                <Text style={[styles.actionLabel, { color: palette.text }]}>
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Explore the Market ── */}
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          Explore the market
        </Text>
        <View style={styles.infoRow}>
          {/* KYC card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: infoCardBg,
                borderColor: infoCardBorder,
              },
            ]}
          >
            {isDark ? (
              <LinearGradient
                colors={asGradient(palette.gradients.input)}
                style={StyleSheet.absoluteFillObject}
              />
            ) : null}
            <View style={styles.infoCardTextBlock}>
              <Text style={[styles.infoTitle, { color: infoCardTitleColor }]}>
                KYC Verification
              </Text>
              <Text style={[styles.infoBody, { color: infoCardBodyColor }]}>
                Integrated third-party API ensures fast, compliant onboarding.
              </Text>
            </View>
            <KycIcon
              width={32}
              height={32}
              style={styles.infoIconAbsolute}
            />
          </View>

          {/* Fiat card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: infoCardBg,
                borderColor: infoCardBorder,
              },
            ]}
          >
            {isDark ? (
              <LinearGradient
                colors={asGradient(palette.gradients.input)}
                style={StyleSheet.absoluteFillObject}
              />
            ) : null}
            <View style={styles.infoCardTextBlock}>
              <Text style={[styles.infoTitle, { color: infoCardTitleColor }]}>
                Easy Fiat Deposits
              </Text>
              <Text style={[styles.infoBody, { color: infoCardBodyColor }]}>
                Deposit USD, EUR, and GBP securely through bank-wire API
                integration.
              </Text>
            </View>
            <FiatDepositsIcon
              width={32}
              height={32}
              style={styles.infoIconAbsolute}
            />
          </View>
        </View>

        {/* ── Market Trends ── */}
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          Market Trends
        </Text>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {FILTER_TABS.map((tab, index) => (
            <Pressable
              key={tab}
              style={styles.filterTab}
              onPress={() => setSelectedFilter(index)}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                tabLayouts.current[index] = { x, width };
                if (index === selectedFilter) {
                  indicatorX.setValue(x);
                  indicatorW.setValue(width);
                }
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: palette.text,
                    fontWeight: index === selectedFilter ? "700" : "400",
                  },
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
          <Animated.View
            style={[
              styles.filterIndicatorAnimated,
              {
                backgroundColor: palette.accent,
                transform: [{ translateX: indicatorX }],
                width: indicatorW,
              },
            ]}
          />
        </View>

        {/* Divider */}
        <View
          style={[
            styles.dividerWrapper,
            { backgroundColor: palette.border },
          ]}
        />

        {/* Table header */}
        <View style={styles.marketHeaderRow}>
          <Text style={[styles.marketHeaderText, { color: palette.textMuted }]}>
            Name
          </Text>
          <Text
            style={[
              styles.marketHeaderText,
              styles.marketHeaderCenter,
              { color: palette.textMuted },
            ]}
          >
            Last Price
          </Text>
          <Text
            style={[
              styles.marketHeaderText,
              styles.marketHeaderRight,
              { color: palette.textMuted },
            ]}
          >
            24h chg%
          </Text>
        </View>

        {/* Market rows */}
        {MARKET_ROWS.map((row) => (
          <View key={row.key} style={styles.marketRow}>
            {/* Left: pair + volume */}
            <View style={styles.marketLeft}>
              <Text style={[styles.marketPairText, { color: marketTextColor }]}>
                <Text style={styles.marketPairBase}>{row.base}</Text>
                <Text style={[styles.marketPairSlash, { color: palette.textMuted }]}>
                  /
                </Text>
                <Text style={[styles.marketPairQuote, { color: palette.textMuted }]}>
                  {row.quote}
                </Text>
              </Text>
              <Text style={[styles.marketVolume, { color: palette.textMuted }]}>
                {row.volume}
              </Text>
            </View>

            {/* Middle: price */}
            <View style={styles.marketMiddle}>
              <Text style={[styles.marketPrice, { color: marketTextColor }]}>
                {row.price}
              </Text>
              <Text
                style={[styles.marketSubPrice, { color: palette.textMuted }]}
              >
                {row.subPrice}
              </Text>
            </View>

            {/* Right: change pill */}
            <View
              style={[
                styles.changePill,
                { backgroundColor: row.up ? upPillBg : downPillBg },
              ]}
            >
              <Text style={styles.changeText}>{row.change}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 220,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: "600",
  },
  menuIcon: {
    width: 34,
    height: 28,
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
  },
  menuLine: {
    width: 20,
    height: 2,
    borderRadius: Radii.pill,
  },
  menuLineWide: {
    width: 26,
  },

  // Balance card
  balanceCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    overflow: "hidden",
    minHeight: 160,
  },
  cardPattern: {
    position: "absolute",
    right: -22,
    top: -18,
  },
  cardContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  cardLabel: {
    fontSize: Typography.size.sm,
    fontWeight: "400",
  },
  cardValue: {
    fontSize: 32,
    fontWeight: "600",
    lineHeight: 48,
  },
  cardSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardSubText: {
    fontSize: Typography.size.sm,
  },
  eyeIcon: {
    width: 16,
    height: 10,
    borderWidth: 1,
    borderRadius: Radii.pill,
  },
  cardInsetShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radii.xl,
    shadowColor: "#070C09",
    shadowOffset: { width: -8, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  actionItem: {
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  actionCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.7,
  },
  actionLabel: {
    fontSize: Typography.size.sm,
    fontWeight: "500",
    textAlign: "center",
  },

  // Explore the market
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  infoCard: {
    flex: 1,
    borderRadius: Radii.lg,
    borderWidth: 0.8,
    padding: 10,
    overflow: "hidden",
    minHeight: 100,
  },
  infoCardTextBlock: {
    gap: Spacing.sm,
    paddingRight: 36,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.24,
    lineHeight: 18,
  },
  infoBody: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.18,
  },
  infoIconAbsolute: {
    position: "absolute",
    bottom: 14,
    right: 14,
  },

  // Market Trends
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
    position: "relative",
    paddingBottom: Spacing.xs,
  },
  filterTab: {
    alignItems: "flex-start",
  },
  filterText: {
    fontSize: Typography.size.sm,
  },
  filterIndicatorAnimated: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: 2,
    borderRadius: Radii.pill,
  },
  dividerWrapper: {
    height: 1,
    marginBottom: Spacing.md,
  },
  marketHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  marketHeaderText: {
    fontSize: Typography.size.xs,
    flex: 1,
  },
  marketHeaderCenter: {
    textAlign: "right",
  },
  marketHeaderRight: {
    textAlign: "right",
    maxWidth: 80,
  },
  marketRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  marketLeft: {
    flex: 1,
    gap: 6,
  },
  marketPairText: {
    fontSize: 0, // parent zero; children set sizes
  },
  marketPairBase: {
    fontSize: Typography.size.md,
    fontWeight: "600",
    lineHeight: 16,
  },
  marketPairSlash: {
    fontSize: Typography.size.md,
    lineHeight: 16,
  },
  marketPairQuote: {
    fontSize: Typography.size.sm,
    fontWeight: "300",
    lineHeight: 16,
  },
  marketVolume: {
    fontSize: Typography.size.xs,
  },
  marketMiddle: {
    flex: 1,
    alignItems: "flex-end",
    paddingRight: Spacing.md,
    gap: 6,
  },
  marketPrice: {
    fontSize: Typography.size.md,
    fontWeight: "600",
    lineHeight: 16,
  },
  marketSubPrice: {
    fontSize: Typography.size.xs,
    lineHeight: 18,
  },
  changePill: {
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    alignItems: "center",
  },
  changeText: {
    color: "#FFFFFF",
    fontSize: Typography.size.sm,
    fontWeight: "400",
    lineHeight: 20,
    textAlign: "right",
  },
});
