import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ArrowLeft from "@/assets/icons/arrow-left.svg";
import CalendarIcon from "@/assets/icons/calendar.svg";
import DrawerIcon from "@/assets/icons/drawer.svg";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DrawerActions, useNavigation } from "@react-navigation/native";

const toGradient = (colors: readonly string[]) => colors as [string, string, ...string[]];

const withAlpha = (color: string, alpha: number) => {
  if (!color.startsWith("#")) return color;
  const hex =
    color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
  if (hex.length !== 7) return color;
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
};

const pad = (value: number) => value.toString().padStart(2, "0");

const formatDate = (date: Date) => {
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const addDays = (date: Date, amount: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
};

const parseDate = (value: string) => {
  const parts = value.split("/").map((segment) => segment.trim());
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map((segment) => Number(segment));
  if (!day || !month || !year) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

type Segment = "assets" | "spot";

type AssetTab = "deposit" | "withdraw" | "transfer";

type AssetFilter = {
  id: string;
  label: string;
  symbol: string | null;
};

type AssetHistoryItem = {
  id: string;
  assetName: string;
  assetSymbol: string;
  badgeColor: string;
  type: AssetTab;
  sender: string;
  receiver: string;
  txHash: string;
  actionLabel: string;
  actionValue: string;
  displayDate: string;
  date: string;
  status: "Confirm" | "Pending" | "Failed";
};

type SpotOrder = {
  id: string;
  pair: string;
  side: "Buy" | "Sell";
  price: string;
  amount: string;
  status: "Filled" | "Open" | "Canceled";
  date: string;
};

const ASSET_FILTERS: AssetFilter[] = [
  { id: "all", label: "All", symbol: null },
  { id: "btc", label: "BTC", symbol: "BTC" },
  { id: "eth", label: "ETH", symbol: "ETH" },
  { id: "usdt", label: "USDT", symbol: "USDT" },
];

const DATE_PRESETS = [
  { id: "today", label: "Today", offset: 0 },
  { id: "yesterday", label: "Yesterday", offset: -1 },
  { id: "week", label: "7 days ago", offset: -7 },
  { id: "month", label: "30 days ago", offset: -30 },
  { id: "clear", label: "Clear date", offset: null },
];

const ASSET_HISTORY: AssetHistoryItem[] = [
  {
    id: "btc-deposit-1",
    assetName: "Bitcoin",
    assetSymbol: "BTC",
    badgeColor: "#F7931A",
    type: "deposit",
    sender: "FDARTAFPJ564685SF4FS",
    receiver: "FDARTAFPJ564685SF4FS",
    txHash: "FDARTAFPJ564685SF4FS",
    actionLabel: "Deposit",
    actionValue: "2562542671",
    displayDate: "25-10-2024, 06:30:45",
    date: "2024-10-25T06:30:45",
    status: "Confirm",
  },
  {
    id: "eth-deposit-1",
    assetName: "Ethereum",
    assetSymbol: "ETH",
    badgeColor: "#627EEA",
    type: "deposit",
    sender: "FDARTAFPJ564685SF4FS",
    receiver: "FDARTAFPJ564685SF4FS",
    txHash: "FDARTAFPJ564685SF4FS",
    actionLabel: "Deposit",
    actionValue: "2562542671",
    displayDate: "24-10-2024, 15:10:12",
    date: "2024-10-24T15:10:12",
    status: "Confirm",
  },
  {
    id: "btc-withdraw-1",
    assetName: "Bitcoin",
    assetSymbol: "BTC",
    badgeColor: "#F7931A",
    type: "withdraw",
    sender: "FDARTAFPJ564685SF4FS",
    receiver: "0x7b1ce53f9f0390A4",
    txHash: "A2B4C5D9E1F6",
    actionLabel: "Withdraw",
    actionValue: "0.056 BTC",
    displayDate: "20-10-2024, 09:14:03",
    date: "2024-10-20T09:14:03",
    status: "Pending",
  },
  {
    id: "usdt-transfer-1",
    assetName: "Tether",
    assetSymbol: "USDT",
    badgeColor: "#26A17B",
    type: "transfer",
    sender: "Funding Wallet",
    receiver: "Spot Wallet",
    txHash: "UTR-452190234",
    actionLabel: "Transfer",
    actionValue: "1,250.00",
    displayDate: "19-10-2024, 11:45:02",
    date: "2024-10-19T11:45:02",
    status: "Confirm",
  },
];

const SPOT_ORDERS: SpotOrder[] = [
  {
    id: "spot-1",
    pair: "BTC/USDT",
    side: "Buy",
    price: "31,540.00",
    amount: "0.015 BTC",
    status: "Filled",
    date: "2024-10-25 08:12",
  },
  {
    id: "spot-2",
    pair: "ETH/USDT",
    side: "Sell",
    price: "1,875.20",
    amount: "0.45 ETH",
    status: "Open",
    date: "2024-10-24 13:54",
  },
  {
    id: "spot-3",
    pair: "USDT/INR",
    side: "Buy",
    price: "83.10",
    amount: "2,000 USDT",
    status: "Canceled",
    date: "2024-10-22 10:30",
  },
];

export default function HistoryScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];
  const [activeSegment, setActiveSegment] = useState<Segment>("assets");
  const [activeAssetTab, setActiveAssetTab] = useState<AssetTab>("deposit");
  const [selectedAssetFilter, setSelectedAssetFilter] = useState(ASSET_FILTERS[0].id);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sheetType, setSheetType] = useState<"asset" | null>(null);
  const [activeDateField, setActiveDateField] = useState<"start" | "end" | null>(null);

  const pageBackground = isDark ? "#020B09" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = palette.textMuted;
  const fieldBg = isDark ? "#021210" : "#FFFFFF";
  const fieldBorder = isDark ? "#275049" : "#D6D6D6";
  const segmentBg = isDark ? "#011A16" : "#F2F2F2";
  const segmentBorder = isDark ? "#0C3A32" : "#D6D6D6";
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);

  const selectedFilter = useMemo(
    () => ASSET_FILTERS.find((filter) => filter.id === selectedAssetFilter) ?? ASSET_FILTERS[0],
    [selectedAssetFilter]
  );

  const filteredAssetHistory = useMemo(() => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const startTime = start ? new Date(start.setHours(0, 0, 0, 0)).getTime() : null;
    const endTime = end ? new Date(end.setHours(23, 59, 59, 999)).getTime() : null;

    return ASSET_HISTORY.filter((item) => {
      if (item.type !== activeAssetTab) return false;
      if (selectedFilter.symbol && item.assetSymbol !== selectedFilter.symbol) return false;
      const itemTime = new Date(item.date).getTime();
      if (startTime && itemTime < startTime) return false;
      if (endTime && itemTime > endTime) return false;
      return true;
    });
  }, [activeAssetTab, endDate, selectedFilter.symbol, startDate]);

  const filteredSpotOrders = useMemo(() => {
    if (!selectedFilter.symbol) return SPOT_ORDERS;
    return SPOT_ORDERS.filter((order) => order.pair.startsWith(selectedFilter.symbol ?? ""));
  }, [selectedFilter.symbol]);

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedAssetFilter(ASSET_FILTERS[0].id);
  };

  const handleDatePreset = (presetId: string) => {
    if (!activeDateField) return;
    const preset = DATE_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    if (preset.offset === null) {
      if (activeDateField === "start") setStartDate("");
      if (activeDateField === "end") setEndDate("");
    } else {
      const value = formatDate(addDays(new Date(), preset.offset));
      if (activeDateField === "start") setStartDate(value);
      if (activeDateField === "end") setEndDate(value);
    }
    setActiveDateField(null);
  };

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssetFilter(assetId);
    setSheetType(null);
  };

  const onPressMenu = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };
  const renderAssetCard = (item: AssetHistoryItem) => {
    const statusColor =
      item.status === "Confirm"
        ? palette.accent
        : item.status === "Pending"
          ? "#FFB74D"
          : "#DE2E42";

    return (
      <View key={item.id} style={[styles.card, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
        <View style={styles.cardHeader}>
          <View style={styles.coinWrap}>
            <View style={[styles.coinBadge, { backgroundColor: item.badgeColor }]}>
              <Text style={styles.coinBadgeText}>{item.assetSymbol[0]}</Text>
            </View>
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>{item.assetName}</Text>
            <Text style={[styles.cardSubtitle, { color: textMuted }]}>{item.assetSymbol}</Text>
          </View>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.cardRow}>
          <View style={styles.cardColumn}>
            <Text style={[styles.cardLabel, { color: textMuted }]}>Sender</Text>
            <Text style={[styles.cardValue, { color: textPrimary }]}>{item.sender}</Text>
          </View>
          <View style={[styles.cardColumn, styles.cardColumnRight]}>
            <Text style={[styles.cardLabel, { color: textMuted }]}>Receiver</Text>
            <Text style={[styles.cardValue, { color: textPrimary }]}>{item.receiver}</Text>
          </View>
        </View>
        <View style={styles.cardRow}>
          <View style={styles.cardColumn}>
            <Text style={[styles.cardLabel, { color: textMuted }]}>TX Hash</Text>
            <Text style={[styles.cardValue, { color: textPrimary }]}>{item.txHash}</Text>
          </View>
          <View style={[styles.cardColumn, styles.cardColumnRight]}>
            <Text style={[styles.cardLabel, { color: textMuted }]}>{item.actionLabel}</Text>
            <Text style={[styles.cardValue, { color: textPrimary }]}>{item.actionValue}</Text>
          </View>
        </View>
        <View style={styles.cardRow}>
          <View style={styles.cardColumn}>
            <Text style={[styles.cardLabel, { color: textMuted }]}>Date & Time</Text>
            <Text style={[styles.cardValue, { color: textPrimary }]}>{item.displayDate}</Text>
          </View>
          <View style={[styles.cardColumn, styles.cardColumnRight]}>
            <Text style={[styles.cardLabel, { color: textMuted }]}>Status</Text>
            <Text style={[styles.cardValue, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSpotOrder = (order: SpotOrder) => {
    const statusColor =
      order.status === "Filled"
        ? palette.accent
        : order.status === "Open"
          ? "#FFB74D"
          : "#DE2E42";

    return (
      <View key={order.id} style={[styles.spotCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
        <View style={styles.spotRow}>
          <View>
            <Text style={[styles.spotPair, { color: textPrimary }]}>{order.pair}</Text>
            <Text style={[styles.spotDate, { color: textMuted }]}>{order.date}</Text>
          </View>
          <View style={styles.spotSideWrap}>
            <Text
              style={[
                styles.spotSide,
                { color: order.side === "Buy" ? palette.accent : "#DE2E42" },
              ]}
            >
              {order.side}
            </Text>
          </View>
        </View>
        <View style={styles.spotMetrics}>
          <View>
            <Text style={[styles.spotLabel, { color: textMuted }]}>Price</Text>
            <Text style={[styles.spotValue, { color: textPrimary }]}>{order.price}</Text>
          </View>
          <View>
            <Text style={[styles.spotLabel, { color: textMuted }]}>Amount</Text>
            <Text style={[styles.spotValue, { color: textPrimary }]}>{order.amount}</Text>
          </View>
          <View>
            <Text style={[styles.spotLabel, { color: textMuted }]}>Status</Text>
            <Text style={[styles.spotValue, { color: statusColor }]}>{order.status}</Text>
          </View>
        </View>
      </View>
    );
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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>History</Text>
          <Pressable style={styles.iconButton} onPress={onPressMenu}>
            <DrawerIcon width={16} height={16} />
          </Pressable>
        </View>

        <View style={[styles.segmentContainer, { backgroundColor: segmentBg, borderColor: segmentBorder }]}>
          {([
            { id: "assets", label: "Assets History" },
            { id: "spot", label: "Spot Orders History" },
          ] as const).map((segment) => {
            const isActive = activeSegment === segment.id;
            return (
              <Pressable
                key={segment.id}
                style={[styles.segmentButton, isActive && styles.segmentActive]}
                onPress={() => setActiveSegment(segment.id)}
              >
                {isActive ? (
                  <LinearGradient
                    colors={["#073c33", "#025A4A", "#073c33"]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: -1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                ) : null}
                <Text
                  style={[
                    styles.segmentText,
                    { color: isActive ? palette.onPrimary : textPrimary },
                  ]}
                >
                  {segment.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeSegment === "assets" ? (
          <View style={styles.assetTabs}>
            {([
              { id: "deposit", label: "Deposit History" },
              { id: "withdraw", label: "Withdraw History" },
              { id: "transfer", label: "Transfer History" },
            ] as const).map((tab) => {
              const isActive = activeAssetTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={styles.assetTabButton}
                  onPress={() => setActiveAssetTab(tab.id)}
                >
                  <Text
                    style={[
                      styles.assetTabText,
                      { color: isActive ? textPrimary : textMuted },
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {isActive ? <View style={[styles.assetTabUnderline, { backgroundColor: palette.accent }]} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.spotHeading, { color: textPrimary }]}>Spot Orders</Text>
        )}

        <View style={styles.dateRow}>
          <View style={[styles.dateField, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={textMuted}
              style={[styles.dateInput, { color: textPrimary }]}
            />
            <Pressable onPress={() => setActiveDateField("start")}>
              <CalendarIcon width={20} height={20} />
            </Pressable>
          </View>
          <View style={[styles.dateField, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={textMuted}
              style={[styles.dateInput, { color: textPrimary }]}
            />
            <Pressable onPress={() => setActiveDateField("end")}>
              <CalendarIcon width={20} height={20} />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
          onPress={() => setSheetType("asset")}
        >
          <Text style={[styles.fieldText, { color: textMuted }]}>{selectedFilter.label}</Text>
          <Ionicons name="chevron-down" size={14} color={textMuted} />
        </Pressable>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, styles.clearButton, { borderColor: fieldBorder }]}
            onPress={handleClearFilters}
          >
            <Text style={[styles.actionText, { color: textPrimary }]}>Clear</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.resetButton]}
            onPress={handleResetFilters}
          >
            <Text style={[styles.actionText, { color: palette.onPrimary }]}>Reset</Text>
          </Pressable>
        </View>

        <View style={styles.listSection}>
          {activeSegment === "assets"
            ? filteredAssetHistory.map(renderAssetCard)
            : filteredSpotOrders.map(renderSpotOrder)}
        </View>
      </ScrollView>

      <Modal
        visible={sheetType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetType(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheetType(null)} />
          <View style={[styles.modalCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: textPrimary }]}>Select Asset</Text>
            {ASSET_FILTERS.map((filter) => {
              const selected = filter.id === selectedFilter.id;
              return (
                <Pressable
                  key={filter.id}
                  style={[
                    styles.modalOption,
                    { backgroundColor: selected ? withAlpha(palette.primary, 0.18) : "transparent" },
                  ]}
                  onPress={() => handleSelectAsset(filter.id)}
                >
                  <Text style={[styles.modalOptionText, { color: textPrimary }]}>{filter.label}</Text>
                  {selected ? <Ionicons name="checkmark" size={20} color={palette.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      <Modal
        visible={activeDateField !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDateField(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setActiveDateField(null)} />
          <View style={[styles.modalCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: textPrimary }]}>Select Date</Text>
            {DATE_PRESETS.map((preset) => (
              <Pressable
                key={preset.id}
                style={styles.modalOption}
                onPress={() => handleDatePreset(preset.id)}
              >
                <Text style={[styles.modalOptionText, { color: textPrimary }]}>{preset.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
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
  segmentContainer: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    padding: 4,
    flexDirection: "row",
    gap: 6,
  },
  segmentButton: {
    flex: 1,

    borderRadius: Radii.pill,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  segmentActive: {
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  segmentText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  assetTabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  assetTabButton: {
    flex: 1,
    alignItems: "center",
  },
  assetTabText: {
    fontFamily: "Geist-Medium",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  assetTabUnderline: {
    height: 3,
    width: "70%",
    borderRadius: Radii.pill,
    marginTop: Spacing.xs,
  },
  spotHeading: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dateRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.sm + 2,
  },
  dateField: {
    flex: 1,
    height: 50,
    borderRadius: Radii.lg,
    borderWidth: 0.5,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateInput: {
    flex: 1,
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  field: {
    height: 50,
    borderRadius: Radii.lg,
    borderWidth: 0.5,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.md + 2,
    marginBottom: Spacing.md,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  fieldText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButton: {
    borderWidth: 1,
  },
  resetButton: {
    backgroundColor: "#DE2E42",
  },
  actionText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  listSection: {
    gap: Spacing.md,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  coinWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  coinBadge: {
    width: 32,
    height: 32,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  coinBadgeText: {
    color: "#FFFFFF",
    fontFamily: "Geist-Bold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.xs,
  },
  cardTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  cardSubtitle: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  cardDivider: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(117,129,124,0.4)",
    marginBottom: Spacing.md,
  },
  cardRow: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  cardColumn: {
    flex: 1,
    gap: 4,
  },
  cardColumnRight: {
    alignItems: "flex-end",
  },
  cardLabel: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  cardValue: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  spotCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  spotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  spotPair: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  spotDate: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  spotSideWrap: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  spotSide: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  spotMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  spotLabel: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
    marginBottom: 2,
  },
  spotValue: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    padding: Spacing.lg,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderWidth: 1,
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: Radii.pill,
    backgroundColor: "rgba(120,120,120,0.4)",
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.lg,
    lineHeight: Typography.line.lg,
    marginBottom: Spacing.md,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm + 2,
  },
  modalOptionText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
});
