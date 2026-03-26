import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ArrowLeft from "@/assets/icons/arrow-left.svg";
import DrawerIcon from "@/assets/icons/drawer.svg";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DrawerActions, useNavigation } from "@react-navigation/native";

const toGradient = (colors: readonly string[]) => colors as [string, string, ...string[]];

type MarketTab = "all" | "favorites" | "spot" | "gainers" | "losers";

type TrendCard = {
  id: string;
  name: string;
  symbol: string;
  price: string;
  change: number;
  badgeColor: string;
  badgeLetter: string;
};

type MarketRow = {
  id: string;
  pair: string;
  quote: string;
  volume: string;
  lastPrice: string;
  lastPriceSub: string;
  change: number;
  isFavorite: boolean;
  type: "spot" | "futures";
};

const TREND_CARDS: TrendCard[] = [
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    price: "$48,750.30",
    change: 3.5,
    badgeColor: "#F7931A",
    badgeLetter: "B",
  },
  {
    id: "sol",
    name: "Solana",
    symbol: "SOL",
    price: "$48,750.30",
    change: 3.5,
    badgeColor: "#131415",
    badgeLetter: "S",
  },
  {
    id: "bnb",
    name: "Binance",
    symbol: "BNB",
    price: "$48,750.30",
    change: 3.5,
    badgeColor: "#F3BA2F",
    badgeLetter: "B",
  },
];

const MARKET_ROWS: MarketRow[] = [
  {
    id: "btc-usdt",
    pair: "BTC/USDT",
    quote: "USDT",
    volume: "2.25B",
    lastPrice: "70,548.15",
    lastPriceSub: "$70,548.15",
    change: 1.7,
    isFavorite: true,
    type: "spot",
  },
  {
    id: "usdc-usdt",
    pair: "USDC/USDT",
    quote: "USDT",
    volume: "1.08B",
    lastPrice: "0.999",
    lastPriceSub: "$0.9999",
    change: -3.6,
    isFavorite: false,
    type: "spot",
  },
  {
    id: "eth-usdt",
    pair: "ETH/USDT",
    quote: "USDT",
    volume: "1.03B",
    lastPrice: "2,075.14",
    lastPriceSub: "$2,075.14",
    change: 4.8,
    isFavorite: true,
    type: "spot",
  },
  {
    id: "agld-usdt",
    pair: "AGLD/USDT",
    quote: "USDT",
    volume: "0.9M",
    lastPrice: "0.962",
    lastPriceSub: "$0.962",
    change: 4.8,
    isFavorite: false,
    type: "spot",
  },
];

export default function MarketScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];

  const [activeTab, setActiveTab] = useState<MarketTab>("all");
  const [searchText, setSearchText] = useState("");

  const pageBackground = isDark ? "#020B09" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = palette.textMuted;
  const fieldBg = isDark ? "#021210" : "#FFFFFF";
  const fieldBorder = isDark ? "#275049" : "#D6D6D6";
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);

  const filteredRows = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    return MARKET_ROWS.filter((row) => {
      if (normalized && !row.pair.toLowerCase().includes(normalized)) return false;
      if (activeTab === "favorites" && !row.isFavorite) return false;
      if (activeTab === "spot" && row.type !== "spot") return false;
      if (activeTab === "gainers" && row.change <= 0) return false;
      if (activeTab === "losers" && row.change >= 0) return false;
      return true;
    });
  }, [activeTab, searchText]);

  const onPressMenu = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: pageBackground }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {isDark ? (
        <View pointerEvents="none" style={styles.topGlow}>
          <LinearGradient colors={subtleGlow} style={StyleSheet.absoluteFillObject} />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <ArrowLeft width={24} height={24} color={textMuted} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Markets</Text>
          <Pressable style={styles.iconButton} onPress={onPressMenu}>
            <DrawerIcon width={16} height={16} />
          </Pressable>
        </View>

        <View style={[styles.searchField, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
        >
          <Ionicons name="search" size={20} color={textMuted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search"
            placeholderTextColor={textMuted}
            style={[styles.searchInput, { color: textPrimary }]}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendRow}
        >
          {TREND_CARDS.map((card) => (
            <View
              key={card.id}
              style={[styles.trendCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
            >
              <View style={styles.trendHeader}>
                <View style={[styles.trendBadge, { backgroundColor: card.badgeColor }]}
                >
                  <Text style={styles.trendBadgeText}>{card.badgeLetter}</Text>
                </View>
                <View>
                  <Text style={[styles.trendName, { color: textPrimary }]}
                  >
                    {card.name}
                  </Text>
                  <Text style={[styles.trendSymbol, { color: textMuted }]}
                  >
                    {card.symbol}
                  </Text>
                </View>
              </View>
              <View style={styles.trendFooter}>
                <Text style={[styles.trendPrice, { color: textPrimary }]}
                >
                  {card.price}
                </Text>
                <View style={styles.trendChangeRow}>
                  <Ionicons name="caret-up" size={12} color={palette.accent} />
                  <Text style={[styles.trendChange, { color: palette.accent }]}
                  >
                    +{card.change}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Market Trends</Text>

        <View style={styles.tabRow}>
          {([
            { id: "all", label: "All" },
            { id: "favorites", label: "Favorites" },
            { id: "spot", label: "Spot" },
            { id: "gainers", label: "Gainers" },
            { id: "losers", label: "Losers" },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={styles.tabButton}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? textPrimary : textMuted },
                  ]}
                >
                  {tab.label}
                </Text>
                {isActive ? <View style={[styles.tabUnderline, { backgroundColor: palette.accent }]} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableLabel, { color: textMuted }]}>Name</Text>
          <Text style={[styles.tableLabel, { color: textMuted }]}>Last Price</Text>
          <Text style={[styles.tableLabel, { color: textMuted }]}>24h chg%</Text>
        </View>

        <View style={styles.listSection}>
          {filteredRows.map((row) => {
            const isPositive = row.change >= 0;
            return (
              <View key={row.id} style={styles.row}>
                <View style={styles.nameColumn}>
                  <Text style={[styles.rowPair, { color: textPrimary }]}>{row.pair}</Text>
                  <Text style={[styles.rowVolume, { color: textMuted }]}>{row.volume}</Text>
                </View>
                <View style={styles.priceColumn}>
                  <Text style={[styles.rowPrice, { color: textPrimary }]}>{row.lastPrice}</Text>
                  <Text style={[styles.rowSubPrice, { color: textMuted }]}>{row.lastPriceSub}</Text>
                </View>
                <View
                  style={[
                    styles.changePill,
                    { backgroundColor: isPositive ? "#006553" : "#DE2E42" },
                  ]}
                >
                  <Text style={[styles.changeText, { color: palette.onPrimary }]}
                  >
                    {isPositive ? "+" : ""}
                    {row.change}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 160,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl + Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.xl,
    lineHeight: Typography.line.lg,
  },
  searchField: {
    height: 52,
    borderRadius: Radii.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  trendRow: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  trendCard: {
    width: 160,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  trendHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  trendBadge: {
    width: 42,
    height: 42,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  trendBadgeText: {
    color: "#FFFFFF",
    fontFamily: "Geist-Bold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  trendName: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.md,
  },
  trendSymbol: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.sm,
  },
  trendFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trendPrice: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.sm,
  },
  trendChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  trendChange: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.sm,
  },
  sectionTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.lg,
    marginBottom: Spacing.sm,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(117,129,124,0.4)",
  },
  tabButton: {
    alignItems: "center",
    flex: 1,
  },
  tabText: {
    fontFamily: "Geist-Medium",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  tabUnderline: {
    height: 3,
    width: 26,
    borderRadius: Radii.pill,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  tableLabel: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.sm,
  },
  listSection: {
    gap: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameColumn: {
    flex: 1,
  },
  priceColumn: {
    flex: 1,
    alignItems: "flex-end",
    paddingRight: Spacing.sm,
  },
  rowPair: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  rowVolume: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
    marginTop: 2,
  },
  rowPrice: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  rowSubPrice: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
    marginTop: 2,
  },
  changePill: {
    minWidth: 76,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  changeText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
});
