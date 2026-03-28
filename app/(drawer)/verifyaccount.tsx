import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import UploadIcon from "@/assets/icons/image_upload.svg";
import CloseIcon from "@/assets/icons/security/close.svg";
import AdvanceKycDark from "@/assets/icons/verifyaccount/advancekyc_dark.svg";
import AdvanceKycLight from "@/assets/icons/verifyaccount/advancekyc_light.svg";
import BasicKycDark from "@/assets/icons/verifyaccount/basickyc_dark.svg";
import BasicKycLight from "@/assets/icons/verifyaccount/basickyc_light.svg";
import UnverifiedDark from "@/assets/icons/verifyaccount/unverified_dark.svg";
import UnverifiedLight from "@/assets/icons/verifyaccount/unverified_light.svg";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";

const toGradient = (colors: readonly string[]) => colors as [string, string, ...string[]];

type TierRow = {
  label: string;
  value: string;
};

type VerificationTier = {
  id: string;
  title: string;
  subtitle: string;
  rows: TierRow[];
  actionLabel: string;
  Icon: React.ComponentType<{ width?: number; height?: number }>;
  onPress: () => void;
};

export default function VerifyAccountScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];
  const [showBasicModal, setShowBasicModal] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [draftExpiryDate, setDraftExpiryDate] = useState(new Date());
  const [frontDocumentName, setFrontDocumentName] = useState("");
  const [backDocumentName, setBackDocumentName] = useState("");
  const [advancedDocumentName, setAdvancedDocumentName] = useState("");

  const pageBackground = isDark ? "#020B09" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = palette.textMuted;
  const fieldBg = isDark ? "#021210" : "#FFFFFF";
  const fieldBorder = isDark ? "#275049" : "#D6D6D6";
  const dashedBorder = isDark ? "rgba(39,80,73,0.7)" : "rgba(214,214,214,0.8)";
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);

  const formattedExpiryDate = useMemo(() => {
    if (!expiryDate) return "DD/MM/YYYY";
    const day = `${expiryDate.getDate()}`.padStart(2, "0");
    const month = `${expiryDate.getMonth() + 1}`.padStart(2, "0");
    const year = expiryDate.getFullYear();
    return `${day}/${month}/${year}`;
  }, [expiryDate]);

  const tiers: VerificationTier[] = [
    {
      id: "unverified",
      title: "Unverified",
      subtitle: "(No KYC Needed)",
      rows: [
        { label: "Deposit Crypto", value: "Unlimited" },
        { label: "Withdraw Crypto Limited", value: "1.5 BTC Daily" },
      ],
      actionLabel: "Complete with Register",
      Icon: isDark ? UnverifiedDark : UnverifiedLight,
      onPress: () => Alert.alert("Register", "Complete registration to unlock more features."),
    },
    {
      id: "basic",
      title: "Basic KYC",
      subtitle: "(No KYC Needed)",
      rows: [
        { label: "Fiat Deposit & Withdraw Limits", value: "$30K Daily" },
        { label: "Crypto Deposit Limit", value: "Unlimited" },
        { label: "Crypto Withdraw Limit", value: "5 BTC Daily" },
        { label: "Review Time", value: "4-5 Business Days" },
      ],
      actionLabel: "Verify Now",
      Icon: isDark ? BasicKycDark : BasicKycLight,
      onPress: () => setShowBasicModal(true),
    },
    {
      id: "advanced",
      title: "Advanced KYC",
      subtitle: "(Verify+)",
      rows: [
        { label: "Fiat Deposit & Withdraw Limits", value: "$30K Daily" },
        { label: "Crypto Deposit Limit", value: "Unlimited" },
        { label: "Crypto Withdraw Limit", value: "5 BTC Daily" },
        { label: "Review Time", value: "4-5 Business Days" },
      ],
      actionLabel: "Verify Now",
      Icon: isDark ? AdvanceKycDark : AdvanceKycLight,
      onPress: () => setShowAdvancedModal(true),
    },
  ];

  const handleDateValueChange = (_event: DateTimePickerChangeEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setDraftExpiryDate(selectedDate);
    }
  };

  const openDatePicker = () => {
    setDraftExpiryDate(expiryDate ?? new Date());
    setShowDatePicker(true);
  };

  const pickDocument = async (onPick: (fileName: string) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;
      const selected = result.assets?.[0];
      if (!selected?.name) return;
      onPick(selected.name);
    } catch {
      Alert.alert("Upload failed", "Unable to open file picker. Please try again.");
    }
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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Verify Account</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={[styles.title, { color: textPrimary }]}>Verify Your Personal Account</Text>
        <Text style={[styles.subtitle, { color: textMuted }]}>
          Click verify now to complete your verification and gain access to more features.
        </Text>

        <View style={styles.tierList}>
          {tiers.map((tier) => (
            <View
              key={tier.id}
              style={[styles.tierCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
            >
              <View style={styles.tierHeader}>
                <View style={styles.tierIcon}>
                  <tier.Icon width={32} height={32} />
                </View>
                <View style={styles.tierHeaderText}>
                  <Text style={[styles.tierTitle, { color: textPrimary }]}>{tier.title}</Text>
                  <Text style={[styles.tierSubtitle, { color: textMuted }]}>{tier.subtitle}</Text>
                </View>
              </View>

              <View style={styles.tierDetails}>
                {tier.rows.map((row) => (
                  <View key={`${tier.id}-${row.label}`} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: textMuted }]}>{row.label}</Text>
                    <Text style={[styles.detailValue, { color: textPrimary }]}>{row.value}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.dashedDivider, { borderBottomColor: dashedBorder }]} />

              <Pressable style={styles.actionRow} onPress={tier.onPress}>
                <Text style={[styles.actionText, { color: palette.primary }]}>{tier.actionLabel}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showBasicModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDatePicker(false);
          setShowBasicModal(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setShowDatePicker(false);
              setShowBasicModal(false);
            }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={24}
            style={styles.modalKeyboardWrap}
          >
            <View style={[styles.modalCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
              <ScrollView
                contentContainerStyle={styles.modalContentScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textPrimary }]}>Basic KYC</Text>
                  <Pressable style={styles.modalClose} onPress={() => setShowBasicModal(false)}>
                    <CloseIcon width={22} height={22} />
                  </Pressable>
                </View>
                <View style={styles.modalDivider} />

                <Text style={[styles.modalSectionTitle, { color: textPrimary }]}>KYC Verification</Text>
                <Text style={[styles.modalBody, { color: textMuted }]}>
                  KYC (Know Your Customer) verification confirms the identity of users before
                  accessing platform services. It helps prevent fraud and ensures a safe and secure
                  trading environment.
                </Text>

                <Text style={[styles.modalLabel, { color: textPrimary }]}>Document Number</Text>
                <View style={[styles.inputField, { borderColor: fieldBorder, backgroundColor: fieldBg }]}>
                  <Text style={[styles.inputPlaceholder, { color: textMuted }]}>Select</Text>
                  <Ionicons name="chevron-down" size={18} color={textMuted} />
                </View>

                <Text style={[styles.modalLabel, { color: textPrimary }]}>Expire Date</Text>
                <Pressable
                  style={[styles.inputField, { borderColor: fieldBorder, backgroundColor: fieldBg }]}
                  onPress={openDatePicker}
                >
                  <Text style={[styles.inputPlaceholder, { color: textMuted }]}>
                    {formattedExpiryDate}
                  </Text>
                  <CalendarIcon width={18} height={18} />
                </Pressable>

                {showDatePicker ? (
                  <View
                    style={[
                      styles.datePickerInlineCard,
                      { backgroundColor: fieldBg, borderColor: fieldBorder },
                    ]}
                  >
                    <DateTimePicker
                      value={draftExpiryDate}
                      mode="date"
                      display="spinner"
                      onValueChange={handleDateValueChange}
                    />
                    <View style={styles.datePickerActions}>
                      <Pressable
                        style={[
                          styles.datePickerAction,
                          { borderColor: fieldBorder, backgroundColor: fieldBg },
                        ]}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={[styles.datePickerActionText, { color: textMuted }]}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.datePickerAction,
                          { backgroundColor: palette.primary, borderColor: palette.primary },
                        ]}
                        onPress={() => {
                          setExpiryDate(draftExpiryDate);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={[styles.datePickerActionText, { color: palette.onPrimary }]}>Done</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                <Text style={[styles.modalLabel, { color: textPrimary }]}>ID Front Document</Text>
                <Pressable
                  style={[styles.uploadField, { borderColor: fieldBorder, backgroundColor: fieldBg }]}
                  onPress={() => pickDocument(setFrontDocumentName)}
                >
                  <UploadIcon width={34} height={34} />
                  <Text
                    style={[styles.uploadText, { color: frontDocumentName ? textPrimary : textMuted }]}
                    numberOfLines={1}
                  >
                    {frontDocumentName || "Click to choose files"}
                  </Text>
                </Pressable>

                <Text style={[styles.modalLabel, { color: textPrimary }]}>ID Back Document</Text>
                <Pressable
                  style={[styles.uploadField, { borderColor: fieldBorder, backgroundColor: fieldBg }]}
                  onPress={() => pickDocument(setBackDocumentName)}
                >
                  <UploadIcon width={34} height={34} />
                  <Text
                    style={[styles.uploadText, { color: backDocumentName ? textPrimary : textMuted }]}
                    numberOfLines={1}
                  >
                    {backDocumentName || "Click to choose files"}
                  </Text>
                </Pressable>

                <View style={styles.modalActions}>
                  <Pressable
                    style={[
                      styles.modalButton,
                      { borderColor: fieldBorder, backgroundColor: fieldBg },
                    ]}
                    onPress={() => {
                      setShowDatePicker(false);
                      setShowBasicModal(false);
                    }}
                  >
                    <Text style={[styles.modalButtonText, { color: textMuted }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, { backgroundColor: palette.primary }]}
                    onPress={() => {
                      setShowDatePicker(false);
                      setShowBasicModal(false);
                      Alert.alert("Submitted", "Basic KYC submitted.");
                    }}
                  >
                    <Text style={[styles.modalButtonText, { color: palette.onPrimary }]}>Confirm</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={showAdvancedModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdvancedModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowAdvancedModal(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={24}
            style={styles.modalKeyboardWrap}
          >
            <View style={[styles.modalCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
              <ScrollView
                contentContainerStyle={styles.modalContentScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  Advance KYC Verification
                </Text>
                <Pressable style={styles.modalClose} onPress={() => setShowAdvancedModal(false)}>
                  <CloseIcon width={22} height={22} />
                </Pressable>
              </View>
              <View style={styles.modalDivider} />

              <Text style={[styles.modalLabel, { color: textPrimary }]}>Address</Text>
              <TextInput
                placeholder="Address"
                placeholderTextColor={textMuted}
                style={[
                  styles.textInput,
                  { borderColor: fieldBorder, backgroundColor: fieldBg, color: textPrimary },
                ]}
              />

              <Text style={[styles.modalLabel, { color: textPrimary }]}>Upload Document</Text>
              <Pressable
                style={[styles.uploadField, { borderColor: fieldBorder, backgroundColor: fieldBg }]}
                onPress={() => pickDocument(setAdvancedDocumentName)}
              >
                <UploadIcon width={34} height={34} />
                <Text
                  style={[
                    styles.uploadText,
                    { color: advancedDocumentName ? textPrimary : textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {advancedDocumentName || "Click to choose files"}
                </Text>
              </Pressable>

              <View style={styles.modalActions}>
                <Pressable
                  style={[
                    styles.modalButton,
                    { borderColor: fieldBorder, backgroundColor: fieldBg },
                  ]}
                  onPress={() => setShowAdvancedModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: textMuted }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: palette.primary }]}
                  onPress={() => {
                    setShowAdvancedModal(false);
                    Alert.alert("Submitted", "Advanced KYC submitted.");
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: palette.onPrimary }]}>Confirm</Text>
                </Pressable>
              </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
    height: 180,
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
    marginBottom: Spacing.lg,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    width: 34,
    height: 28,
  },
  headerTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.xl,
    lineHeight: Typography.line.lg,
  },
  title: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.lg,
    lineHeight: Typography.line.lg,
    marginBottom: Spacing.xs,
  },
  subtitle: {   
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
    marginBottom: Spacing.lg,
  },
  tierList: {
    gap: Spacing.lg,
  },
  tierCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  tierIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  tierHeaderText: {
    gap: 4,
  },
  tierTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md -1,
    lineHeight: Typography.line.md -2,
  },
  tierSubtitle: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  tierDetails: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.xs,
  },
  detailLabel: {
    flex: 1,
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  detailValue: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    marginBottom: Spacing.sm,
  },
  actionRow: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  actionText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm-1,
    lineHeight: Typography.line.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    maxHeight: "88%",
  },
  modalKeyboardWrap: {
    width: "100%",
  },
  modalContentScroll: {
    paddingBottom: Spacing.xs,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDivider: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderBottomColor: "rgba(117,129,124,0.45)",
    marginVertical: Spacing.md,
  },
  modalSectionTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
    marginBottom: Spacing.sm,
  },
  modalBody: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
    marginBottom: Spacing.md,
  },
  modalLabel: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  inputField: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 48,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  inputPlaceholder: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  textInput: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    height: 48,
    paddingHorizontal: Spacing.md,
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  uploadField: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  uploadText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: Radii.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  datePickerInlineCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  datePickerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  datePickerAction: {
    flex: 1,
    borderRadius: Radii.lg,
    borderWidth: 1,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerActionText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
});
