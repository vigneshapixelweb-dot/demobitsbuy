import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import ArrowLeft from "@/assets/icons/arrow-left.svg";
import BuyDark from "@/assets/icons/Dashboard/Buy_dark.svg";
import BuyLight from "@/assets/icons/Dashboard/Buy_light.svg";
import ContentBox from "@/assets/icons/Dashboard/Content Box -full (1).svg";
import DepositDark from "@/assets/icons/Dashboard/deposit_dark.svg";
import DepositLight from "@/assets/icons/Dashboard/deposite_light.svg";
import FiatDepositsIcon from "@/assets/icons/Dashboard/Fiat_deposits.svg";
import KycIcon from "@/assets/icons/Dashboard/kyc_verification.svg";
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
    pair: "BTC/USDT",
    volume: "2.25B",
    price: "70,548.15",
    change: "+1.7%",
    up: true,
  },
  {
    key: "usdc",
    pair: "USDC/USDT",
    volume: "1.08B",
    price: "0.999",
    change: "+3.6%",
    up: false,
  },
  {
    key: "eth",
    pair: "ETH/USDT",
    volume: "1.03B",
    price: "2,075.14",
    change: "+4.8%",
    up: true,
  },
];

const FILTER_TABS = ["All", "Favorites", "Spot", "Gainers", "Losers"];

const asGradient = (colors: readonly string[]) =>
  colors as [string, string, ...string[]];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? "dark";
  const palette = AppColors[colorScheme];
  const isDark = colorScheme === "dark";

  const contentPadding = useMemo(
    () => ({
      paddingTop: Spacing.lg,
      paddingBottom: insets.bottom + 120,
    }),
    [insets.bottom],
  );

  const cardTextColor = isDark ? palette.text : palette.onPrimary;
  const cardMutedText = isDark ? palette.textMuted : "rgba(255, 255, 255, 0.7)";
  const actionCircle = isDark ? palette.surface : palette.primary;
  const topGlow = isDark
    ? palette.gradients.background
    : ["rgba(61, 255, 220, 0.08)", "rgba(255, 255, 255, 0)"];
  // const balanceCardHeight = Math.round((width - Spacing.xl * 2) * (190 / 390));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
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
        <View style={styles.header}>
          <Pressable
            style={[styles.headerIcon, { borderColor: palette.border }]}
          >
            <ArrowLeft width={20} height={20} color={palette.textMuted} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            Dashboard
          </Text>
          <View style={styles.menuIcon}>
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
          </View>
        </View>

        <View
          style={[
            styles.balanceCard,
            {
              borderColor: isDark ? palette.border : "rgba(255, 255, 255, 0.3)",
            },
          ]}
        >
          <ContentBox
            style={{ position: "absolute" }}
            width="118%"
            height="159%"
          />
          <Text style={[styles.cardLabel, { color: cardMutedText }]}>
            Total value (BTC)
          </Text>
          <Text style={[styles.cardValue, { color: cardTextColor }]}>
            $2,385.60
          </Text>
          <View style={styles.cardRow}>
            <Text style={[styles.cardSubText, { color: cardMutedText }]}>
              = 0000000BTC
            </Text>
            <View style={[styles.eyeIcon, { borderColor: cardMutedText }]} />
          </View>
        </View>

        <View style={styles.actionsRow}>
          {ACTIONS.map((action) => {
            const Icon = isDark ? action.dark : action.light;
            return (
              <View key={action.key} style={styles.actionItem}>
                <View
                  style={[
                    styles.actionCircle,
                    {
                      backgroundColor: actionCircle,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Icon width={24} height={24} />
                </View>
                <Text style={[styles.actionLabel, { color: palette.text }]}>
                  {action.label}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          Explore the market
        </Text>
        <View style={styles.infoRow}>
          <View
            style={[
              styles.infoCard,
              {
                borderColor: palette.border,
                backgroundColor: isDark ? undefined : palette.background,
              },
            ]}
          >
            <LinearGradient
              colors={asGradient(palette.gradients.input)}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={[styles.infoTitle, { color: palette.text }]}>
              KYC Verification
            </Text>
            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.infoBody, { color: palette.textMuted }]}>
                Integrated third-party API ensures fast, compliant onboarding.
              </Text>
              <KycIcon width={40} height={40} style={styles.infoIcon} />
            </View>
          </View>
          <View
            style={[
              styles.infoCard,
              {
                borderColor: palette.border,
                backgroundColor: isDark ? undefined : palette.background,
              },
            ]}
          >
            <LinearGradient
              colors={asGradient(palette.gradients.input)}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={[styles.infoTitle, { color: palette.text }]}>
              Easy Fiat Deposits
            </Text>
            <Text style={[styles.infoBody, { color: palette.textMuted }]}>
              Deposit USD, EUR, and GBP securely through bank-wire API
              integration.
            </Text>
            <FiatDepositsIcon width={50} height={50} style={styles.infoIcon} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          Market Trends
        </Text>
        <View style={styles.filterRow}>
          {FILTER_TABS.map((tab, index) => (
            <View key={tab} style={styles.filterTab}>
              <Text
                style={[
                  styles.filterText,
                  { color: index === 0 ? palette.accent : palette.textMuted },
                ]}
              >
                {tab}
              </Text>
              {index === 0 ? (
                <View
                  style={[
                    styles.filterIndicator,
                    { backgroundColor: palette.accent },
                  ]}
                />
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.marketHeaderRow}>
          <Text style={[styles.marketHeaderText, { color: palette.textMuted }]}>
            Name
          </Text>
          <Text style={[styles.marketHeaderText, { color: palette.textMuted }]}>
            Last Price
          </Text>
          <Text style={[styles.marketHeaderText, { color: palette.textMuted }]}>
            24h chg%
          </Text>
        </View>

        {MARKET_ROWS.map((row) => (
          <View key={row.key} style={styles.marketRow}>
            <View style={styles.marketLeft}>
              <Text style={[styles.marketPair, { color: palette.text }]}>
                {row.pair}
              </Text>
              <Text style={[styles.marketVolume, { color: palette.textMuted }]}>
                {row.volume}
              </Text>
            </View>
            <View style={styles.marketMiddle}>
              <Text style={[styles.marketPrice, { color: palette.text }]}>
                {row.price}
              </Text>
              <Text
                style={[styles.marketSubPrice, { color: palette.textMuted }]}
              >
                ${row.price}
              </Text>
            </View>
            <View
              style={[
                styles.changePill,
                { backgroundColor: row.up ? palette.primary : palette.alert },
              ]}
            >
              <Text style={[styles.changeText, { color: palette.onPrimary }]}>
                {row.change}
              </Text>
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
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
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
  balanceCard: {
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  balanceCardBg: {
    // position: 'absolute',
  },
  cardLabel: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.sm,
  },
  cardValue: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.sm,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardSubText: {
    fontSize: Typography.size.sm,
  },
  eyeIcon: {
    width: 18,
    height: 10,
    borderWidth: 1,
    borderRadius: Radii.pill,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  actionItem: {
    alignItems: "center",
    width: 72,
  },
  actionCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    borderWidth: 0.7,
  },
  actionLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  infoCard: {
    flex: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    // minHeight: 130,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.sm,
  },
  infoBody: {
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  infoIcon: {
    // position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterTab: {
    alignItems: "flex-start",
  },
  filterText: {
    fontSize: Typography.size.sm,
  },
  filterIndicator: {
    width: 26,
    height: 2,
    borderRadius: Radii.pill,
    marginTop: Spacing.xs,
  },
  marketHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  marketHeaderText: {
    fontSize: Typography.size.xs,
  },
  marketRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  marketLeft: {
    flex: 1,
  },
  marketMiddle: {
    flex: 1,
    alignItems: "flex-end",
    paddingRight: Spacing.md,
  },
  marketPair: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  marketVolume: {
    fontSize: Typography.size.xs,
    marginTop: Spacing.xs,
  },
  marketPrice: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  marketSubPrice: {
    fontSize: Typography.size.xs,
    marginTop: Spacing.xs,
  },
  changePill: {
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minWidth: 66,
    alignItems: "center",
  },
  changeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
});
