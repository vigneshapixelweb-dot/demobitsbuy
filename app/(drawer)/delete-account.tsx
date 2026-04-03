import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ArrowLeft from "@/assets/icons/arrow-left.svg";
import CheckIcon from "@/assets/icons/check.svg";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/auth-store";
import { requestDeleteAccountOtp, verifyDeleteAccountOtp } from "@/services/auth/delete-account";

const toGradient = (colors: readonly string[]) => colors as [string, string, ...string[]];

const REASONS = [
  "I don't understand cryptocurrency and don't want to trade anymore.",
  "There's suspicious account activity, I would like to disable login for the account.",
  "I have another account already, so I want to delete this account.",
  "I don't want to use ZaxTrader anymore.",
  "Others",
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];
  const token = useAuthStore((state) => state.token);
  const email = useAuthStore((state) => state.email);

  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);

  const resetForm = useCallback(() => {
    setSelectedReasons([]);
    setOtherReason("");
    setAcknowledged(false);
    setOtpCode("");
    setOtpError("");
    setIsBusy(false);
    setOtpRequested(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => resetForm();
    }, [resetForm])
  );

  const pageBackground = isDark ? "#020B09" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = palette.textMuted;
  const fieldBg = isDark ? "#021210" : "#FFFFFF";
  const fieldBorder = isDark ? "#275049" : "#D6D6D6";
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);
  const noteBorder = "#DE2E42";
  const noteBg = isDark ? "rgba(222, 46, 66, 0.08)" : "#FFF3F4";

  const canSubmit = useMemo(() => {
    if (!acknowledged) return false;
    if (selectedReasons.length === 0) return false;
    if (selectedReasons.includes("Others") && !otherReason.trim()) return false;
    return true;
  }, [acknowledged, selectedReasons, otherReason]);

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert("Delete Account", "Please complete all required fields.");
      return;
    }
    if (!otpRequested) {
      const ok = await handleSendOtp();
      if (ok) {
        setOtpRequested(true);
      }
      return;
    }
    if (!otpCode.trim()) {
      setOtpError("Please enter the OTP code.");
      return;
    }
    if (!email) {
      Alert.alert("Delete Account", "Missing email. Please login again.");
      return;
    }
    setOtpError("");
    setIsBusy(true);
    const reasonText = selectedReasons.includes("Others")
      ? `${otherReason}`.trim()
      : selectedReasons.join(", ");
    verifyDeleteAccountOtp({
      email,
      code: otpCode.trim(),
      deleteReason: reasonText,
      token: token ?? undefined,
    }).then((result) => {
      setIsBusy(false);
      if (!result.success) {
        setOtpError(result.message ?? "Unable to delete account.");
        return;
      }
      Alert.alert(
        "Delete Account",
        result.message ?? "Your account deletion request has been submitted.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    });
  };

  const handleSendOtp = async () => {
    setOtpError("");
    setIsBusy(true);
    const result = await requestDeleteAccountOtp(token ?? undefined);
    setIsBusy(false);
    if (!result.success) {
      setOtpError(result.message ?? "Unable to send OTP.");
      return false;
    }
    Alert.alert("Delete Account", result.message ?? "OTP sent to your email.");
    return true;
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: pageBackground }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {isDark ? (
        <View pointerEvents="none" style={styles.topGlow}>
          <LinearGradient colors={subtleGlow} style={StyleSheet.absoluteFillObject} />
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <ArrowLeft width={24} height={24} color={textMuted} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Delete Account</Text>
          <View style={styles.headerSpacer} />
          </View>

        <Text style={[styles.introText, { color: textPrimary }]}>
          By continuing, you confirm that you have read and agree to the following:
        </Text>

        <View style={[styles.rulesCard, { borderColor: fieldBorder, backgroundColor: fieldBg }]}>
          <Text style={[styles.ruleText, { color: textPrimary }]}>
            1. Once an account is deleted, it cannot be reactivated.
          </Text>
          <Text style={[styles.ruleText, { color: textPrimary }]}>
            2. Please ensure that you have withdrawn assets before proceeding with account deletion.
            You are responsible for transferring any remaining funds.
          </Text>
          <Text style={[styles.ruleText, { color: textPrimary }]}>
            3. Please also make sure that all pending trades are completed before deleting your account.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>
          Account has been disabled due to:
        </Text>

        <View style={[styles.reasonCard, { borderColor: fieldBorder, backgroundColor: fieldBg }]}>
          {REASONS.map((reason) => {
            const selected = selectedReasons.includes(reason);
            return (
              <Pressable
                key={reason}
                style={styles.reasonRow}
                onPress={() => toggleReason(reason)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: selected ? palette.primary : fieldBorder,
                      backgroundColor: selected ? palette.primary : "transparent",
                    },
                  ]}
                >
                  {selected ? <CheckIcon width={12} height={12} color={palette.onPrimary} /> : null}
                </View>
                <Text style={[styles.reasonText, { color: textMuted }]}>{reason}</Text>
              </Pressable>
            );
          })}

          {selectedReasons.includes("Others") ? (
            <TextInput
              value={otherReason}
              onChangeText={setOtherReason}
              placeholder="Please tell us why"
              placeholderTextColor={textMuted}
              style={[
                styles.otherInput,
                { borderColor: fieldBorder, backgroundColor: fieldBg, color: textPrimary },
              ]}
            />
          ) : null}
        </View>

        <Pressable
          style={styles.ackRow}
          onPress={() => setAcknowledged((prev) => !prev)}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: acknowledged ? palette.primary : fieldBorder,
                backgroundColor: acknowledged ? palette.primary : "transparent",
              },
            ]}
          >
            {acknowledged ? <CheckIcon width={12} height={12} color={palette.onPrimary} /> : null}
          </View>
          <Text style={[styles.ackText, { color: textPrimary }]}>
            I fully understand and agree to the above.
          </Text>
        </Pressable>

        {otpRequested ? (
          <>
            <View style={styles.otpRow}>
              <TextInput
                value={otpCode}
                onChangeText={(value) => {
                  setOtpCode(value);
                  if (otpError) setOtpError("");
                }}
                placeholder="Enter OTP"
                placeholderTextColor={textMuted}
                keyboardType="number-pad"
                style={[
                  styles.otpInput,
                  { borderColor: fieldBorder, backgroundColor: fieldBg, color: textPrimary },
                ]}
              />
              <Pressable style={styles.otpButton} onPress={handleSendOtp} disabled={isBusy}>
                <Text style={[styles.otpButtonText, { color: palette.accent }]}>Resend OTP</Text>
              </Pressable>
            </View>
            {otpError ? (
              <Text style={[styles.errorText, { color: noteBorder }]}>{otpError}</Text>
            ) : null}
          </>
        ) : null}

        <Pressable
          style={[
            styles.deleteButton,
            { backgroundColor: palette.primary, opacity: canSubmit && !isBusy ? 1 : 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit || isBusy}
        >
          <Text style={[styles.deleteButtonText, { color: palette.onPrimary }]}>
            {otpRequested ? "Confirm Delete" : "Delete Account"}
          </Text>
        </Pressable>

        <View style={[styles.noteCard, { borderColor: noteBorder, backgroundColor: noteBg }]}>
          <Text style={[styles.noteTitle, { color: noteBorder }]}>Note:</Text>
          <Text style={[styles.noteText, { color: textMuted }]}>
            Please do not deposit any assets to a deleted account. If you do, your funds will be lost,
            and we will not be able to retrieve them.
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  headerSpacer: { width: 34, height: 28 },
  introText: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
    marginBottom: Spacing.md,
    fontFamily: "Geist-SemiBold"
  },
  rulesCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  ruleText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  sectionTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
    marginBottom: Spacing.sm,
  },
  reasonCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reasonText: {
    flex: 1,
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  otherInput: {
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.size.sm,
  },
  otpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  otpInput: {
    flex: 1,
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.size.sm,
  },
  otpButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  otpButtonText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
  },
  errorText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
    marginBottom: Spacing.sm,
  },
  ackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  ackText: {
    flex: 1,
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  deleteButtonText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
  },
  noteCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  noteTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm - 1,
    lineHeight: Typography.line.sm - 1,
  },
  noteText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
});
