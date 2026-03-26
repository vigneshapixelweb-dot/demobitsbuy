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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ArrowLeft from "@/assets/icons/arrow-left.svg";
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

type SheetType = "from" | "to" | "coin" | null;

type WalletOption = {
  id: string;
  label: string;
};

const WALLET_OPTIONS: WalletOption[] = [
  { id: "funding", label: "Funding Wallet" },
  { id: "spot", label: "Spot Wallet" },
];

export default function TransferScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];

  const [sheetType, setSheetType] = useState<SheetType>(null);
  const [fromWalletId, setFromWalletId] = useState(WALLET_OPTIONS[0].id);
  const [toWalletId, setToWalletId] = useState(WALLET_OPTIONS[1].id);
  const [selectedAssetId, setSelectedAssetId] = useState(DEPOSIT_ASSETS[0].id);

  const fromWallet = useMemo(
    () => WALLET_OPTIONS.find((wallet) => wallet.id === fromWalletId) ?? WALLET_OPTIONS[0],
    [fromWalletId]
  );

  const toWallet = useMemo(
    () => WALLET_OPTIONS.find((wallet) => wallet.id === toWalletId) ?? WALLET_OPTIONS[1],
    [toWalletId]
  );

  const selectedAsset = useMemo(
    () => DEPOSIT_ASSETS.find((asset) => asset.id === selectedAssetId) ?? DEPOSIT_ASSETS[0],
    [selectedAssetId]
  );

  const pageBackground = isDark ? "#020B09" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = palette.textMuted;
  const fieldBg = isDark ? "#021210" : "#FFFFFF";
  const fieldBorder = isDark ? "#275049" : "#D6D6D6";
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);

  const onSelectWallet = (walletId: string) => {
    if (sheetType === "from") {
      setFromWalletId(walletId);
    }
    if (sheetType === "to") {
      setToWalletId(walletId);
    }
    setSheetType(null);
  };

  const onSelectCoin = (assetId: string) => {
    setSelectedAssetId(assetId);
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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Internal Transfer</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>From</Text>
        <Pressable
          style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
          onPress={() => setSheetType("from")}
        >
          <Text style={[styles.fieldText, { color: textMuted }]}>{fromWallet.label}</Text>
          <Ionicons name="chevron-down" size={14} color={textMuted} />
        </Pressable>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>To</Text>
        <Pressable
          style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
          onPress={() => setSheetType("to")}
        >
          <Text style={[styles.fieldText, { color: textMuted }]}>{toWallet.label}</Text>
          <Ionicons name="chevron-down" size={14} color={textMuted} />
        </Pressable>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Select Crypto</Text>
        <Pressable
          style={[styles.field, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
          onPress={() => setSheetType("coin")}
        >
          <View style={styles.fieldLeft}>
            <View style={[styles.coinBadge, { backgroundColor: selectedAsset.badgeColor }]}
            >
              <Text style={styles.coinBadgeText}>B</Text>
            </View>
            <Text style={[styles.fieldText, { color: textMuted }]}>{selectedAsset.symbol}</Text>
          </View>
          <Ionicons name="chevron-down" size={14} color={textMuted} />
        </Pressable>

        <Pressable style={styles.submitButton}>
          <LinearGradient
            colors={palette.gradients.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={[styles.submitText, { color: palette.onPrimary }]}>Transfer</Text>
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
          <View style={[styles.modalCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: textPrimary }]}
            >
              {sheetType === "coin" ? "Select Crypto" : "Select Wallet"}
            </Text>
            {(sheetType === "coin" ? DEPOSIT_ASSETS : WALLET_OPTIONS).map((item) => {
              if (sheetType === "coin") {
                const asset = item as (typeof DEPOSIT_ASSETS)[number];
                const selected = asset.id === selectedAssetId;
                return (
                  <Pressable
                    key={asset.id}
                    style={[
                      styles.optionRow,
                      { backgroundColor: selected ? withAlpha(palette.primary, 0.18) : "transparent" },
                    ]}
                    onPress={() => onSelectCoin(asset.id)}
                  >
                    <View style={styles.fieldLeft}>
                      <View style={[styles.coinBadgeSmall, { backgroundColor: asset.badgeColor }]}>
                        <Text style={styles.coinBadgeSmallText}>B</Text>
                      </View>
                      <Text style={[styles.optionText, { color: textPrimary }]}>{asset.symbol}</Text>
                    </View>
                    {selected ? <Ionicons name="checkmark" size={20} color={palette.primary} /> : null}
                  </Pressable>
                );
              }

              const wallet = item as WalletOption;
              const selected =
                (sheetType === "from" && wallet.id === fromWalletId) ||
                (sheetType === "to" && wallet.id === toWalletId);
              return (
                <Pressable
                  key={wallet.id}
                  style={[
                    styles.optionRow,
                    { backgroundColor: selected ? withAlpha(palette.primary, 0.18) : "transparent" },
                  ]}
                  onPress={() => onSelectWallet(wallet.id)}
                >
                  <Text style={[styles.optionText, { color: textPrimary }]}>{wallet.label}</Text>
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
  headerSpacer: {
    width: 34,
    height: 34,
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
