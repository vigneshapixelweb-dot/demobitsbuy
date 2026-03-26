import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ArrowLeft from "@/assets/icons/arrow-left.svg";
import { DEPOSIT_ASSETS, DEPOSIT_NOTE } from "@/constants/deposit";
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

const buildPseudoQrMatrix = (seedText: string, size = 25) => {
  const matrix = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const blocked = Array.from({ length: size }, () => Array.from({ length: size }, () => false));

  const drawFinder = (startX: number, startY: number) => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const px = startX + x;
        const py = startY + y;
        blocked[py][px] = true;
        const outer = x === 0 || x === 6 || y === 0 || y === 6;
        const center = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[py][px] = outer || center;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  for (let i = 8; i < size - 8; i += 1) {
    blocked[6][i] = true;
    blocked[i][6] = true;
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let seed = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    seed = (seed * 31 + seedText.charCodeAt(i)) % 2147483647;
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (blocked[y][x]) continue;
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      matrix[y][x] = seed % 3 === 0;
    }
  }

  return matrix;
};

type SheetType = "crypto" | "network" | null;

export default function DepositScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];

  const [sheetType, setSheetType] = useState<SheetType>(null);
  const [selectedAssetId, setSelectedAssetId] = useState(DEPOSIT_ASSETS[0].id);
  const [selectedNetworkId, setSelectedNetworkId] = useState(DEPOSIT_ASSETS[0].networks[0].id);

  const selectedAsset = useMemo(
    () => DEPOSIT_ASSETS.find((asset) => asset.id === selectedAssetId) ?? DEPOSIT_ASSETS[0],
    [selectedAssetId],
  );

  const selectedNetwork = useMemo(() => {
    return (
      selectedAsset.networks.find((network) => network.id === selectedNetworkId) ??
      selectedAsset.networks[0]
    );
  }, [selectedAsset, selectedNetworkId]);

  const qrMatrix = useMemo(
    () => buildPseudoQrMatrix(`${selectedAsset.symbol}:${selectedNetwork.address}`),
    [selectedAsset.symbol, selectedNetwork.address],
  );

  const pageBackground = isDark ? "#020B09" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = "#75817C";
  const fieldBg = isDark ? "#021210" : "#FFFFFF";
  const fieldBorder = isDark ? "#275049" : "#D6D6D6";
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);
  const downGradient = toGradient(["#00120F", "#025A4A", "#00120F"]);
  const noteBorder = "#DE2E42";
  const qrPixel = "#000505";
  const copyButtonBg = "#1F2222";
  const chipBg = "#0065531A";

  const onPressCopyAddress = async () => {
    try {
      await Clipboard.setStringAsync(selectedNetwork.address);
      Alert.alert("Address copied", selectedNetwork.address);
    } catch {
      Alert.alert("Unable to copy", "Please try again.");
    }
  };

  const onPressDownloadQr = async () => {
    try {
      await Share.share({
        message: `QR seed: ${selectedAsset.symbol}:${selectedNetwork.address}`,
      });
    } catch {
      Alert.alert("Unable to download", "Please try again.");
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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Deposit</Text>
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
          <Text numberOfLines={1} style={[styles.fieldText, styles.addressText, { color: textMuted }]}>
            {selectedNetwork.address}
          </Text>
          <Pressable onPress={onPressCopyAddress}>
            {/* <Ionicons name="copy-outline" size={22} color={textPrimary} /> */}
            <FontAwesome5 name="copy" size={20} color={textPrimary} />
          </Pressable>
        </View>

        <View style={styles.qrRow}>
          <View style={styles.qrBox}>
            <View style={styles.qrFrame}>
              {qrMatrix.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.qrLine}>
                  {row.map((cell, colIndex) => (
                    <View
                      key={`cell-${rowIndex}-${colIndex}`}
                      style={[
                        styles.qrCell,
                        { backgroundColor: cell ? qrPixel : "#FFFFFF" },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.qrActions}>
            <Pressable
              style={[styles.squareButton, { backgroundColor: copyButtonBg }]}
              onPress={onPressCopyAddress}
            >
              <FontAwesome5 name="copy" size={20} color="#ffff" />
            </Pressable>
            <Pressable style={styles.squareButton} onPress={onPressDownloadQr}>
              <LinearGradient colors={downGradient} start={{x: 0, y: 1}} end={{x: 1, y: 0}} style={[StyleSheet.absoluteFillObject, styles.squareButton]} />
              <Ionicons name="download-outline" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View style={styles.metricsSection}>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>Minimum Deposit Limit</Text>
            <Text style={[styles.metricValue, { color: textPrimary }]}>{selectedNetwork.minimumDeposit}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>Deposit Fees</Text>
            <Text style={[styles.metricValue, { color: textPrimary }]}>{selectedNetwork.fee}</Text>
          </View>
        </View>

        <View style={[styles.noteCard, { borderColor: noteBorder, backgroundColor: withAlpha(chipBg, isDark ? 0.16 : 0) }]}>
          <Text style={styles.noteTitle}>Note:</Text>
          <Text style={[styles.noteBody, { color: textPrimary }]}>{DEPOSIT_NOTE}</Text>
        </View>
      </ScrollView>

      <Modal visible={sheetType !== null} transparent animationType="fade" onRequestClose={() => setSheetType(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheetType(null)} />
          <View style={[styles.modalCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: textPrimary }]}>
              {sheetType === "crypto" ? "Select Crypto" : "Select Network"}
            </Text>
            {(sheetType === "crypto" ? DEPOSIT_ASSETS : selectedAsset.networks).map((item) => {
              const isCrypto = sheetType === "crypto";
              const itemId = isCrypto ? item.id : item.id;
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
    borderRadius: Radii.lg ,
    borderWidth: 0.5,
    paddingHorizontal: Spacing.md+2,
    paddingVertical: Spacing.md+2,
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
  addressText: {
    flex: 1,
    marginRight: Spacing.md,
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
  qrRow: {
    marginTop: Spacing.xs,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xl,
  },
  qrBox: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  qrFrame: {
    width: 90,
    height: 90,
    backgroundColor: "#FFFFFF",
    padding: 5,
  },
  qrLine: {
    flexDirection: "row",
  },
  qrCell: {
    width: 3.2,
    height: 3.2,
  },
  qrActions: {
    gap: Spacing.sm,
    alignItems: "center",
    flexDirection: "row",
  },
  squareButton: {
    width: 46,
    height: 46,
    borderRadius: Radii.sm + 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
  noteCard: {
    marginTop: Spacing.md,
    borderWidth: 0.5,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  noteTitle: {
    color: "#DE2E42",
    fontFamily: "Geist-Bold",
    fontSize: Typography.size.xs + 1,
    lineHeight: Typography.line.sm,
  },
  noteBody: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs+1,
    lineHeight: Typography.line.sm + 1,
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
