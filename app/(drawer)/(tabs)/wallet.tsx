import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { DrawerActions, TabActions, useNavigation } from "@react-navigation/native";
import type { SvgProps } from "react-native-svg";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import ArrowLeft from "@/assets/icons/arrow-left.svg";
import DrawerIcon from "@/assets/icons/drawer.svg";
import BalanceHideDark from "@/assets/icons/Dashboard/balance details hide_dark.svg";
import BalanceHideLight from "@/assets/icons/Dashboard/balance details hide_light.svg";
import DepositDark from "@/assets/icons/Wallet/deposit_dark.svg";
import DepositLight from "@/assets/icons/Wallet/deposite_light.svg";
import HistoryDark from "@/assets/icons/Wallet/history_dark.svg";
import HistoryLight from "@/assets/icons/Wallet/history_light.svg";
import SearchIcon from "@/assets/icons/Wallet/search.svg";
import TransferDark from "@/assets/icons/Wallet/transfer_dark.svg";
import TransferLight from "@/assets/icons/Wallet/transfer_light.svg";
import WalletContentDark from "@/assets/icons/Wallet/wallet_Content Box_dark.svg";
import WalletContentLight from "@/assets/icons/Wallet/wallet_Content Box_light.svg";
import WithdrawDark from "@/assets/icons/Wallet/withdraw_dark.svg";
import WithdrawLight from "@/assets/icons/Wallet/withdraw_light.svg";
import {
  type BalanceCurrency,
  formatWalletAssetAmount,
  formatWalletPrimaryBalance,
  WALLET_ACTIONS,
  WALLET_BALANCE_BY_SEGMENT,
  WALLET_COINS,
  WALLET_CURRENCIES,
  type WalletActionKey,
  WALLET_SEGMENTS,
  type WalletSegment,
} from "@/constants/wallet";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";

type ActionConfig = {
  key: WalletActionKey;
  label: string;
  dark: ComponentType<SvgProps>;
  light: ComponentType<SvgProps>;
};

const ACTION_ICON_BY_KEY: Record<
  WalletActionKey,
  { dark: ComponentType<SvgProps>; light: ComponentType<SvgProps> }
> = {
  deposit: { dark: DepositDark, light: DepositLight },
  withdraw: { dark: WithdrawDark, light: WithdrawLight },
  transfer: { dark: TransferDark, light: TransferLight },
  history: { dark: HistoryDark, light: HistoryLight },
};

const ACTIONS: ActionConfig[] = WALLET_ACTIONS.map((action) => ({
  ...action,
  dark: ACTION_ICON_BY_KEY[action.key].dark,
  light: ACTION_ICON_BY_KEY[action.key].light,
}));

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

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];

  const [activeSegment, setActiveSegment] = useState<WalletSegment>("overview");
  const [selectedCurrency, setSelectedCurrency] = useState<BalanceCurrency>("BTC");
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const segmentLayouts = useRef<{ x: number; width: number }[]>([]);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(0)).current;

  const cardFloat = useRef(new Animated.Value(0)).current;
  const actionEntrance = useRef(ACTIONS.map(() => new Animated.Value(0))).current;

  const contentPadding = useMemo(
    () => ({
      paddingBottom:
        insets.bottom + Spacing.xxxl + Spacing.xxl + Spacing.lg + Spacing.md + Spacing.sm,
      paddingTop: Spacing.md,
    }),
    [insets.bottom],
  );

  const activeSegmentIndex = WALLET_SEGMENTS.findIndex((item) => item.key === activeSegment);
  const balance = WALLET_BALANCE_BY_SEGMENT[activeSegment];
  const HideIcon = isDark ? BalanceHideDark : BalanceHideLight;
  const ContentBox = isDark ? WalletContentDark : WalletContentLight;
  const pageBackground = palette.background;
  const textPrimary = palette.text;
  const textMuted = palette.textMuted;
  const cardTextPrimary = palette.onPrimary;
  const cardTextMuted = withAlpha(palette.onPrimary, 0.82);
  const dividerColor = palette.border;
  const segmentActiveColor = palette.text;
  const segmentIndicator = palette.accent;
  const searchBg = isDark ? withAlpha(palette.surface, 0.78) : palette.surface;
  const searchBorder = palette.border;
  const searchPlaceholder = textMuted;
  const rowDivider = withAlpha(palette.border, isDark ? 0.62 : 0.82);
  const cardBorder = isDark ? palette.border : palette.transparent;
  const actionCircleBorder = withAlpha(palette.border, isDark ? 0.62 : 1);
  const actionCircleBg = isDark ? palette.surface : palette.primary;
  const currencyChipBg = isDark ? "#1F2222" : palette.background;
  const currencyChipText = palette.text;
  const topGlowColors = toGradient([withAlpha(palette.accent, 0.12), withAlpha(palette.background, 0)]);
  const cardOverlayColors = toGradient([withAlpha(palette.background, 0.06), withAlpha(palette.background, 0.58)]);
  const actionGlowColors = toGradient([withAlpha(palette.accent, 0.12), withAlpha(palette.surface, 0.08)]);

  const filteredCoins = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return WALLET_COINS;
    return WALLET_COINS.filter((coin) => {
      return coin.symbol.toLowerCase().includes(keyword) || coin.name.toLowerCase().includes(keyword);
    });
  }, [searchQuery]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cardFloat, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(cardFloat, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [cardFloat]);

  useEffect(() => {
    const entrance = Animated.stagger(
      70,
      actionEntrance.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ),
    );
    entrance.start();
  }, [actionEntrance]);

  useEffect(() => {
    const layout = segmentLayouts.current[activeSegmentIndex];
    if (!layout) return;
    Animated.parallel([
      Animated.timing(indicatorX, { toValue: layout.x, duration: 180, useNativeDriver: false }),
      Animated.timing(indicatorW, { toValue: layout.width, duration: 180, useNativeDriver: false }),
    ]).start();
  }, [activeSegmentIndex, indicatorW, indicatorX]);

  const onPressBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    navigation.dispatch(TabActions.jumpTo("index"));
  };

  const onPressMenu = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const onPressAction = (action: ActionConfig) => {
    if (action.key === "deposit") {
      router.push("/(stack)/deposit");
      return;
    }
    if (action.key === "withdraw") {
      router.push("/(stack)/withdraw");
      return;
    }
    if (action.key === "transfer") {
      router.push("/(stack)/transfer");
      return;
    }
    if (action.key === "history") {
      router.push("/(drawer)/(tabs)/history");
      return;
    }
    Alert.alert(action.label, `${action.label} flow will be connected to backend APIs.`);
  };

  const onSelectNextCurrency = () => {
    const index = WALLET_CURRENCIES.indexOf(selectedCurrency);
    setSelectedCurrency(WALLET_CURRENCIES[(index + 1) % WALLET_CURRENCIES.length]);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: pageBackground }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {isDark ? (
        <View pointerEvents="none" style={styles.topGlow}>
          <LinearGradient
            colors={topGlowColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, contentPadding]}
      >
        <View style={styles.header}>
          <Pressable style={styles.headerIconButton} onPress={onPressBack}>
            <ArrowLeft width={24} height={24} color={textMuted} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Wallet</Text>
          <Pressable style={styles.menuButton} onPress={onPressMenu}>
            <DrawerIcon width={16} height={16} />
          </Pressable>
        </View>

        <View style={[styles.segmentContainer, { borderBottomColor: dividerColor }]}>
          {WALLET_SEGMENTS.map((segment, index) => (
            <Pressable
              key={segment.key}
              onPress={() => setActiveSegment(segment.key)}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                segmentLayouts.current[index] = { x, width };
                if (activeSegmentIndex === index) {
                  indicatorX.setValue(x);
                  indicatorW.setValue(width);
                }
              }}
              style={styles.segmentItem}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  { color: activeSegment === segment.key ? segmentActiveColor : textMuted },
                  activeSegment === segment.key ? styles.segmentLabelActive : null,
                ]}
              >
                {segment.label}
              </Text>
            </Pressable>
          ))}
          <Animated.View
            style={[
              styles.segmentIndicator,
              { backgroundColor: segmentIndicator, width: indicatorW, transform: [{ translateX: indicatorX }] },
            ]}
          />
        </View>

        <Animated.View
          style={[
            styles.balanceCardWrapper,
            {
              transform: [
                {
                  translateY: cardFloat.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -3],
                  }),
                },
                {
                  scale: cardFloat.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.01],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.balanceCard, { borderColor: cardBorder }]}>
            <ContentBox width="120%" height="120%" style={styles.balancePattern} />
            {isDark ? (
              <LinearGradient
                colors={cardOverlayColors}
                style={StyleSheet.absoluteFillObject}
              />
            ) : null}

            <View style={styles.balanceContent}>
              <View style={styles.balanceTopRow}>
                <Text style={[styles.balanceLabel, { color: cardTextMuted }]}>
                  Estimated Balance
                </Text>
                <Pressable style={[styles.curreencyChip, { backgroundColor: currencyChipBg }]} onPress={onSelectNextCurrency}>
                  <Text style={[styles.currencyChipLabel, { color: currencyChipText }]}>{selectedCurrency}</Text>
                  <Text style={[styles.currencyChipCaret, { color: currencyChipText }]}>▾</Text>
                </Pressable>
              </View>

              <Text style={[styles.balanceValue, { color: cardTextPrimary }]}>
                {isBalanceHidden ? "********" : formatWalletPrimaryBalance(balance.usd, selectedCurrency)}
              </Text>

              <View style={styles.balanceSubRow}>
                <Text style={[styles.balanceSubText, { color: cardTextMuted }]}>
                  {isBalanceHidden ? "= -------" : `= ${balance.btc.toFixed(6)}BTC`}
                </Text>
                <Pressable onPress={() => setIsBalanceHidden((prev) => !prev)}>
                  <HideIcon width={20} height={14} />
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.actionsRow}>
          {ACTIONS.map((action, index) => {
            const Icon = isDark ? action.dark : action.light;
            return (
              <Animated.View
                key={action.key}
                style={[
                  styles.actionItem,
                  {
                    opacity: actionEntrance[index],
                    transform: [
                      {
                        translateY: actionEntrance[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Pressable style={styles.actionPressable} onPress={() => onPressAction(action)}>
                  <View
                    style={[
                      styles.actionCircle,
                      {
                        backgroundColor: actionCircleBg,
                        borderColor: actionCircleBorder,
                      },
                    ]}
                  >
                    {isDark ? (
                      <LinearGradient
                        colors={actionGlowColors}
                        style={StyleSheet.absoluteFillObject}
                      />
                    ) : null}
                    <Icon width={24} height={24} />
                  </View>
                  <Text style={[styles.actionLabel, { color: textPrimary }]}>{action.label}</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.assetHeader}>
          <Text style={[styles.assetTitle, { color: textPrimary }]}>My Assets</Text>
          <View style={[styles.searchBox, { backgroundColor: searchBg, borderColor: searchBorder }]}>
            <SearchIcon width={14} height={14} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search"
              placeholderTextColor={searchPlaceholder}
              style={[styles.searchInput, { color: textPrimary }]}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.assetTableHeader}>
          <Text style={[styles.assetTableHeaderText, { color: textMuted }]}>Coin</Text>
          <Text style={[styles.assetTableHeaderText, styles.assetTableHeaderRight, { color: textMuted }]}>
            Amount
          </Text>
        </View>

        <View style={[styles.assetList, { borderTopColor: rowDivider }]}>
          {filteredCoins.map((coin, index) => {
            const amount = coin.holdings[activeSegment];
            const fiatValue = amount * coin.priceUsd;
            return (
              <Pressable
                key={coin.key}
                onPress={() => router.push("/(drawer)/(tabs)/trade")}
                style={[
                  styles.assetRow,
                ]}
              >
                <View style={styles.assetLeft}>
                  <View style={[styles.coinBadge, { backgroundColor: coin.badgeColor }]}>
                    <Text style={[styles.coinBadgeText, { color: palette.onPrimary }]}>{coin.badgeText}</Text>
                  </View>
                  <View>
                    <Text style={[styles.coinSymbol, { color: textPrimary }]}>{coin.symbol}</Text>
                    <Text style={[styles.coinName, { color: textMuted }]}>{coin.name}</Text>
                  </View>
                </View>
                <View style={styles.assetRight}>
                  <Text style={[styles.assetAmountPrimary, { color: textPrimary }]}>
                    {isBalanceHidden ? "--.--" : formatWalletAssetAmount(amount, coin.symbol)}
                  </Text>
                  <Text style={[styles.assetAmountSecondary, { color: textMuted }]}>
                    {isBalanceHidden
                      ? "$-.--"
                      : `$${fiatValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {filteredCoins.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: textMuted }]}>No assets found.</Text>
            </View>
          ) : null}
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
    height: 210,
  },
  content: {
    paddingHorizontal: Spacing.lg + 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md + 2,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: Typography.size.xl,
    lineHeight: Typography.line.xxxl - 6,
    fontFamily: "Geist-SemiBold",
  },
  menuButton: {
    width: 34,
    height: 28,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  segmentContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    marginBottom: Spacing.lg,
    position: "relative",
  },
  segmentItem: {
    marginRight: Spacing.xl + Spacing.xs,
    paddingBottom: Spacing.md,
  },
  segmentLabel: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.md,
    fontFamily: "Geist-Regular",
  },
  segmentLabelActive: {
    fontFamily: "Geist-SemiBold",
  },
  segmentIndicator: {
    position: "absolute",
    left: 0,
    bottom: -1,
    height: 3,
    borderRadius: Radii.pill,
  },
  balanceCardWrapper: {
    marginBottom: Spacing.lg + Spacing.xs,
  },
  balanceCard: {
    minHeight: 160,
    borderRadius: Radii.xl + 2,
    overflow: "hidden",
    borderWidth: 1,
  },
  balancePattern: {
    position: "absolute",
    right: -22,
    top: -20,
  },
  balanceContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl - 2,
    paddingBottom: Spacing.xl - 2,
    gap: Spacing.md + 2,
  },
  balanceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  balanceLabel: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.md,
    fontFamily: "Geist-Medium",
  },
  curreencyChip: {
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm ,
    height: Spacing.xl ,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs ,
  },
  currencyChipLabel: {
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
    fontFamily: "Geist-Medium",
  },
  currencyChipCaret: {
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs - 2,
    marginTop: 1,
  },
  balanceValue: {
    fontSize: Typography.size.xxl,
    lineHeight: Typography.line.xxxl + 4,
    fontFamily: "Geist-Bold",
    letterSpacing: 0.3,
  },
  balanceSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md - 2,
  },
  balanceSubText: {
    fontSize: Typography.size.xs - 1,
    lineHeight: Typography.line.md,
    fontFamily: "Geist-Medium",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xl + Spacing.xs,
  },
  actionItem: {
    width: "24%",
  },
  actionPressable: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionCircle: {
    width: 58,
    height: 58,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.8,
    overflow: "hidden",
  },
  actionLabel: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.xs,
    fontFamily: "Geist-Medium",
  },
  assetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  assetTitle: {
    fontSize: Typography.size.md,
    lineHeight: Typography.line.lg + 2,
    fontFamily: "Geist-Bold",
  },
  searchBox: {
    width: 138,
    height: 40,
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.md + 2,
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.xs + 1,
    lineHeight: Typography.line.sm,
    fontFamily: "Geist-Regular",
    paddingVertical: 0,
  },
  assetTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs + 2,
  },
  assetTableHeaderText: {
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.lg,
    flex: 1,
    fontFamily: "Geist-Medium",
  },
  assetTableHeaderRight: {
    textAlign: "right",
  },
  assetList: {
    borderTopWidth: 1,
  },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md + 2,
  },
  assetLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  coinBadge: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  coinBadgeText: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm - 2,
    fontFamily: "Geist-Bold",
  },
  coinSymbol: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.md,
    fontFamily: "Geist-Medium",
  },
  coinName: {
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.md,
    fontFamily: "Geist-Regular",
  },
  assetRight: {
    alignItems: "flex-end",
    minWidth: 84,
  },
  assetAmountPrimary: {
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
    fontFamily: "Geist-SemiBold",
  },
  assetAmountSecondary: {
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.sm + 2,
    fontFamily: "Geist-Regular",
  },
  emptyState: {
    paddingVertical: Spacing.xl + Spacing.xs,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: Typography.size.md,
    lineHeight: Typography.line.sm + 2,
    fontFamily: "Geist-Regular",
  },
});
