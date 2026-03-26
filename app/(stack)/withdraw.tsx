import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { TradeSlider } from "@/components/trade-slider";
import { DEPOSIT_ASSETS } from "@/constants/deposit";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";

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

type SheetType = "crypto" | "network" | null;

const parseAmount = (value: string) => {
  const cleaned = value.replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const formatAmount = (value: number, symbol: string) => {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(5)} ${symbol}`;
};

export default function WithdrawScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];

  const [sheetType, setSheetType] = useState<SheetType>(null);
  const [selectedAssetId, setSelectedAssetId] = useState(DEPOSIT_ASSETS[0].id);
  const [selectedNetworkId, setSelectedNetworkId] = useState(DEPOSIT_ASSETS[0].networks[0].id);
  const [walletAddress, setWalletAddress] = useState(DEPOSIT_ASSETS[0].networks[0].address);
  const [amountValue, setAmountValue] = useState("");

  const selectedAsset = useMemo(
    () => DEPOSIT_ASSETS.find((asset) => asset.id === selectedAssetId) ?? DEPOSIT_ASSETS[0],
    [selectedAssetId]
  );

  const selectedNetwork = useMemo(() => {
    return (
      selectedAsset.networks.find((network) => network.id === selectedNetworkId) ??
      selectedAsset.networks[0]
    );
  }, [selectedAsset, selectedNetworkId]);

  useEffect(() => {
    setWalletAddress(selectedNetwork.address);
  }, [selectedNetwork.id, selectedNetwork.address]);

  const pageBackground = isDark ? "#020B09" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = palette.textMuted;
  const fieldBg = isDark ? "#021210" : "#FFFFFF";
  const fieldBorder = isDark ? "#275049" : "#D6D6D6";
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);
  const chipBg = palette.primary;
  const accentColor = palette.primary;

  const amountNumber = parseAmount(amountValue);
  const feeNumber = parseAmount(selectedNetwork.fee);
  const totalWithdraw = amountNumber + feeNumber;

  const onPressCopyAddress = async () => {
    try {
      await Clipboard.setStringAsync(walletAddress);
      Alert.alert("Address copied", walletAddress);
    } catch {
      Alert.alert("Unable to copy", "Please try again.");
    }
  };

  const onSelectAsset = (assetId: string) => {
    const nextAsset = DEPOSIT_ASSETS.find((asset) => asset.id === assetId);
    if (!nextAsset) return;
    setSelectedAssetId(nextAsset.id);
    setSelectedNetworkId(nextAsset.networks[0].id);
    setSheetType(null);
  };

  const onSelectNetwork = (networkId: string) => {
    setSelectedNetworkId(networkId);
    setSheetType(null);
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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Withdraw</Text>
          <View style={styles.menuSpacer} />
        </View>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Select Crypto</Text>
        <Pressable
          style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
          onPress={() => setSheetType("crypto")}
        >
          <View style={styles.fieldLeft}>
            <View style={[styles.coinBadge, { backgroundColor: selectedAsset.badgeColor }]}>
              <Text style={styles.coinBadgeText}>B</Text>
            </View>
            <Text style={[styles.fieldText, { color: textMuted }]}>{selectedAsset.symbol}</Text>
          </View>
          <Ionicons name="chevron-down" size={14} color={textMuted} />
        </Pressable>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Select Network</Text>
        <Pressable
          style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
          onPress={() => setSheetType("network")}
        >
          <Text style={[styles.fieldText, { color: textMuted }]}>
            {selectedNetwork?.name ?? "Select network"}
          </Text>
          <Ionicons name="chevron-down" size={14} color={textMuted} />
        </Pressable>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Wallet Address</Text>
        <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
          <TextInput
            value={walletAddress}
            onChangeText={setWalletAddress}
            placeholder="Enter wallet address"
            placeholderTextColor={textMuted}
            style={[styles.fieldText, styles.addressInput, { color: textMuted }]}
          />
          <Pressable onPress={onPressCopyAddress}>
            <FontAwesome5 name="copy" size={18} color={textPrimary} />
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Wallet Amount</Text>
        <View style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
          <TextInput
            value={amountValue}
            onChangeText={setAmountValue}
            placeholder="Enter amount"
            placeholderTextColor={textMuted}
            keyboardType="decimal-pad"
            style={[styles.fieldText, styles.amountInput, { color: textMuted }]}
          />
        </View>

        <TradeSlider isDark={isDark} accentColor={accentColor} textMuted={textMuted} />

        <View style={styles.metricsSection}>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>Minimum Withdraw</Text>
            <Text style={[styles.metricValue, { color: textPrimary }]}>
              {selectedNetwork.minimumDeposit}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>Maximum Withdraw</Text>
            <Text style={[styles.metricValue, { color: textPrimary }]}>
              {formatAmount(0, selectedAsset.symbol)}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>Total Withdraw</Text>
            <Text style={[styles.metricValue, { color: textPrimary }]}>
              {formatAmount(totalWithdraw, selectedAsset.symbol)}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>Withdraw Fee</Text>
            <Text style={[styles.metricValue, { color: textPrimary }]}>
              {selectedNetwork.fee}
            </Text>
          </View>
        </View>

        <Pressable style={styles.submitButton}>
          <LinearGradient
            colors={palette.gradients.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={[styles.submitText, { color: palette.onPrimary }]}>Submit</Text>
        </Pressable>
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
            <Text style={[styles.modalTitle, { color: textPrimary }]}
            >
              {sheetType === "crypto" ? "Select Crypto" : "Select Network"}
            </Text>
            {(sheetType === "crypto" ? DEPOSIT_ASSETS : selectedAsset.networks).map((item) => {
              const isCrypto = sheetType === "crypto";
              const itemId = item.id;
              const selected = isCrypto ? itemId === selectedAsset.id : itemId === selectedNetwork.id;
              return (
                <Pressable
                  key={itemId}
                  style={[styles.optionRow, { backgroundColor: selected ? withAlpha(chipBg, 0.4) : "transparent" }]}
                  onPress={() => {
                    if (isCrypto) {
                      onSelectAsset(itemId);
                      return;
                    }
                    onSelectNetwork(itemId);
                  }}
                >
                  {isCrypto ? (
                    <View style={styles.fieldLeft}>
                      <View style={[styles.coinBadgeSmall, { backgroundColor: (item as (typeof DEPOSIT_ASSETS)[number]).badgeColor }]}>
                        <Text style={styles.coinBadgeSmallText}>B</Text>
                      </View>
                      <Text style={[styles.optionText, { color: textPrimary }]}>
                        {(item as (typeof DEPOSIT_ASSETS)[number]).symbol}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.optionText, { color: textPrimary }]}>
                      {(item as (typeof selectedAsset.networks)[number]).name}
                    </Text>
                  )}
                  {selected ? <Ionicons name="checkmark" size={20} color={palette.primary} /> : null}
                </Pressable>
              );
            })}
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
    height: 150,
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
    marginBottom: Spacing.xs + 2,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  menuSpacer: {
    width: 34,
    height: 28,
  },
  headerTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.xl,
    lineHeight: Typography.line.lg,
  },
  sectionTitle: {
    fontFamily: "Geist-Bold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
    marginBottom: Spacing.sm,
    marginTop: 4,
  },
  field: {
    height: 50,
    borderRadius: Radii.lg,
    borderWidth: 0.5,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.md + 2,
    marginBottom: Spacing.sm + 2,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  fieldText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  addressInput: {
    flex: 1,
    marginRight: Spacing.md,
  },
  amountInput: {
    flex: 1,
  },
  coinBadge: {
    width: 24,
    height: 24,
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
  metricsSection: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricLabel: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs + 2,
  },
  metricValue: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.md,
  },
  submitButton: {
    marginTop: Spacing.lg,
    borderRadius: Radii.xl,
    paddingVertical: Spacing.md + 4,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  submitText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: Radii.xl + 2,
    borderTopRightRadius: Radii.xl + 2,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md + Spacing.sm,
    gap: Spacing.sm,
  },
  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: Radii.pill,
    backgroundColor: "#75817C",
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontFamily: "Geist-Bold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.sm,
    marginBottom: Spacing.xs,
  },
  optionRow: {
    height: 34,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: {
    fontFamily: "Geist-Medium",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.xs + 2,
  },
  coinBadgeSmall: {
    width: 18,
    height: 18,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  coinBadgeSmallText: {
    color: "#FFFFFF",
    fontFamily: "Geist-Bold",
    fontSize: 10,
    lineHeight: 12,
  },
});
