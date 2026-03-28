import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SecurityModals from "@/app/(drawer)/screens/security-modals";
import ArrowLeft from "@/assets/icons/arrow-left.svg";
import AccountActivitiesIcon from "@/assets/icons/security/account-activities.svg";
import AntiCodeIcon from "@/assets/icons/security/anticode.svg";
import AuthenticatorAppDark from "@/assets/icons/security/authenticator app_dark.svg";
import AuthenticatorAppLight from "@/assets/icons/security/authenticator app_light.svg";
import DeleteAccountIcon from "@/assets/icons/security/delete_account.svg";
import EmailIcon from "@/assets/icons/security/email.svg";
import GoogleAuthIcon from "@/assets/icons/security/google_auth.svg";
import KycIcon from "@/assets/icons/security/kyc.svg";
import LoginPasswordIcon from "@/assets/icons/security/login-password.svg";
import SecurityLevelIcon from "@/assets/icons/security/security_level.svg";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";

const toGradient = (colors: readonly string[]) => colors as [string, string, ...string[]];
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

const buildPseudoQrMatrix = (seedText: string, size = 23) => {
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

type SettingItem = {
  id: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonTone: "primary" | "danger";
  Icon: React.ComponentType<{ width?: number; height?: number }>;
  onPress: () => void;
};

export default function SecurityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];
  const [showProtectModal, setShowProtectModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showLoginPasswordModal, setShowLoginPasswordModal] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const inputsRef = useRef<Array<TextInput | null>>([]);

  const pageBackground = isDark ? "#020B09" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = palette.textMuted;
  const fieldBg = isDark ? "#021210" : "#FFFFFF";
  const fieldBorder = isDark ? "#275049" : "#D6D6D6";
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);
  const alertBorder = "#DE2E42";
  const alertBg = isDark ? withAlpha("#DE2E42", 0.08) : "#FFF3F4";
  const noteBorder = "#F3BA2F";
  const noteBg = isDark ? withAlpha("#F3BA2F", 0.12) : "#FFF8E6";
  const AuthenticatorAppIcon = isDark ? AuthenticatorAppDark : AuthenticatorAppLight;
  const walletAddress = "4ff6re2484fs8eFD5fsS458s2wca";
  const verificationEmail = "jakeperalta@gmail.com";

  const qrMatrix = useMemo(() => buildPseudoQrMatrix(walletAddress), [walletAddress]);

  useEffect(() => {
    if (!showOtpModal || secondsLeft === 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showOtpModal, secondsLeft]);

  const openOtpModal = () => {
    setShowOtpModal(true);
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpError("");
    setSecondsLeft(RESEND_SECONDS);
  };

  const focusInput = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const handleOtpChange = (value: string, index: number) => {
    if (otpError) setOtpError("");
    if (!value) {
      const next = [...otp];
      next[index] = "";
      setOtp(next);
      return;
    }

    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) return;

    const next = [...otp];
    if (cleaned.length > 1) {
      const chars = cleaned.split("");
      for (let i = 0; i < OTP_LENGTH; i += 1) {
        next[i] = chars[i] ?? "";
      }
      setOtp(next);
      const focusIndex = Math.min(cleaned.length, OTP_LENGTH) - 1;
      if (focusIndex >= 0) {
        focusInput(focusIndex);
      }
      return;
    }

    next[index] = cleaned;
    setOtp(next);
    if (index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key !== "Backspace") return;
    if (otp[index]) {
      const next = [...otp];
      next[index] = "";
      setOtp(next);
      return;
    }
    if (index > 0) {
      focusInput(index - 1);
      const next = [...otp];
      next[index - 1] = "";
      setOtp(next);
    }
  };

  const handleOtpSubmit = () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }
    setOtpError("");
    Alert.alert("OTP Submitted", "Verification submitted.");
  };

  const handleOtpResend = () => {
    if (secondsLeft !== 0) return;
    setSecondsLeft(RESEND_SECONDS);
    Alert.alert("OTP Sent", "A new code has been sent.");
  };

  const resendLabel = secondsLeft === 0 ? "Send Code" : `Send Code (${secondsLeft}s)`;

  const onCopyWallet = async () => {
    try {
      await Clipboard.setStringAsync(walletAddress);
      Alert.alert("Copied", "Wallet address copied.");
    } catch {
      Alert.alert("Unable to copy", "Please try again.");
    }
  };

  const settings2FA: SettingItem[] = [
    {
      id: "google-auth",
      title: "Google Authenticator",
      description: "BitsBuyss of security using Google Authenticator for withdrawals and security actions.",
      buttonLabel: "Set Up",
      buttonTone: "primary",
      Icon: GoogleAuthIcon,
      onPress: openOtpModal,
    },
    {
      id: "email-verification",
      title: "Email Verification",
      description: "Verify your email to secure login, password recovery, and withdrawal confirmations.",
      buttonLabel: "Change",
      buttonTone: "primary",
      Icon: EmailIcon,
      onPress: () => setShowVerificationModal(true),
    },
  ];

  const identitySettings: SettingItem[] = [
    {
      id: "kyc",
      title: "KYC Verification",
      description: "Please submit your KYC for better use and usability.",
      buttonLabel: "View",
      buttonTone: "primary",
      Icon: KycIcon,
      onPress: () => router.push("/(drawer)/verifyaccount"),
    },
  ];

  const advancedSettings: SettingItem[] = [
    {
      id: "anti-phishing",
      title: "Anti-Phishing Code",
      description: "Create a personalized code that will appear in all BitsBuyss emails to protect you from phishing attempts.",
      buttonLabel: "Set Up",
      buttonTone: "primary",
      Icon: AntiCodeIcon,
      onPress: () => Alert.alert("Anti-Phishing Code", "Setup flow coming soon."),
    },
    {
      id: "login-password",
      title: "Login Password",
      description: "Improve your account safety by updating to a stronger password.",
      buttonLabel: "Change",
      buttonTone: "primary",
      Icon: LoginPasswordIcon,
      onPress: () => setShowLoginPasswordModal(true),
    },
  ];

  const deviceSettings: SettingItem[] = [
    {
      id: "account-activity",
      title: "Account Activity",
      description: "View recent login attempts, device information, and security events for better account monitoring.",
      buttonLabel: "View",
      buttonTone: "primary",
      Icon: AccountActivitiesIcon,
      onPress: () => router.push("/(drawer)/account-activity"),
    },
    {
      id: "delete-account",
      title: "Delete Account",
      description: "Permanently delete your BitsBuys account. Once deleted, it cannot be recovered.",
      buttonLabel: "Delete",
      buttonTone: "danger",
      Icon: DeleteAccountIcon,
      onPress: () =>
        Alert.alert("Delete Account", "Are you sure you want to delete your account?", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive" },
        ]),
    },
  ];

  const renderSetting = (item: SettingItem) => {
    const buttonBg = item.buttonTone === "danger" ? "#DE2E42" : palette.primary;
    const buttonTextColor = palette.onPrimary;
    return (
      <View key={item.id} style={[styles.settingCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
      >
        <View style={styles.settingRow}>
          <View style={styles.settingIconWrap}>
            <item.Icon width={42} height={42} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: textPrimary }]}>{item.title}</Text>
            <Text style={[styles.settingDescription, { color: textMuted }]}>{item.description}</Text>
          </View>
          <Pressable
            style={[styles.actionButton, { backgroundColor: buttonBg }]}
            onPress={item.onPress}
          >
            <Text style={[styles.actionButtonText, { color: buttonTextColor }]}
            >
              {item.buttonLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: pageBackground }]}
    >
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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Security</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Pressable
          style={[styles.alertCard, { borderColor: alertBorder, backgroundColor: alertBg }]}
          onPress={() => setShowProtectModal(true)}
        >
          <SecurityLevelIcon width={40} height={40} />
          <View style={styles.alertTextWrap}>
            <Text style={[styles.alertTitle, { color: textPrimary }]}>
              You Security Level : Low
            </Text>
            <Text style={[styles.alertSubtitle, { color: textMuted }]}>
              Protect your funds by improving account security
            </Text>
          </View>
        </Pressable>

        <View style={[styles.noteCard, { borderColor: noteBorder, backgroundColor: noteBg }]}
        >
          <Text style={[styles.noteTitle, { color: noteBorder }]}>Note:</Text>
          <Text style={[styles.noteText, { color: textMuted }]}
          >
            For your security, withdrawals will be temporarily unavailable for 24 hours after
            changing security settings
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Two-Factor Authentication (2FA)</Text>
        <View style={styles.sectionList}>{settings2FA.map(renderSetting)}</View>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Identity Verification</Text>
        <View style={styles.sectionList}>{identitySettings.map(renderSetting)}</View>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Advanced Security Settings</Text>
        <View style={styles.sectionList}>{advancedSettings.map(renderSetting)}</View>

        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Devices & Account Activities</Text>
        <View style={styles.sectionList}>{deviceSettings.map(renderSetting)}</View>
      </ScrollView>

      <SecurityModals
        showOtpModal={showOtpModal}
        showProtectModal={showProtectModal}
        showVerificationModal={showVerificationModal}
        showLoginPasswordModal={showLoginPasswordModal}
        setShowOtpModal={setShowOtpModal}
        setShowProtectModal={setShowProtectModal}
        setShowVerificationModal={setShowVerificationModal}
        setShowLoginPasswordModal={setShowLoginPasswordModal}
        fieldBg={fieldBg}
        fieldBorder={fieldBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        noteBorder={noteBorder}
        noteBg={noteBg}
        palette={palette}
        qrMatrix={qrMatrix}
        walletAddress={walletAddress}
        verificationEmail={verificationEmail}
        onCopyWallet={onCopyWallet}
        otp={otp}
        handleOtpChange={handleOtpChange}
        handleOtpKeyPress={handleOtpKeyPress}
        inputsRef={inputsRef}
        otpError={otpError}
        resendLabel={resendLabel}
        secondsLeft={secondsLeft}
        handleOtpResend={handleOtpResend}
        handleOtpSubmit={handleOtpSubmit}
        openOtpModal={openOtpModal}
        AuthenticatorAppIcon={AuthenticatorAppIcon}
        styles={styles}
      />
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
  headerSpacer: {
    width: 34,
    height: 28,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md -1,
    lineHeight: Typography.line.md,
    marginBottom: 2,
  },
  alertSubtitle: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  noteCard: {
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  noteTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm - 1,
    lineHeight: Typography.line.sm -1,
    marginBottom: Spacing.xs,
  },
  noteText: { 
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  sectionTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.lg,
    lineHeight: Typography.line.lg,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  settingCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  settingIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
    gap: 6,
  },
  settingTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md -1,
    lineHeight: Typography.line.md -2,
  },
  settingDescription: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 4,
    borderRadius: Radii.sm,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 74,
  },
  actionButtonText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  centeredModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
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
  modalText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
    marginBottom: Spacing.md,
  },
  modalOption: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  modalOptionTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  modalOptionSub: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  modalOptionArrow: {
    width: 32,
    height: 32,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  otpCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    maxHeight: "88%",
  },
  otpCardScroll: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  verificationCardScroll: {
    paddingBottom: Spacing.xs,
  },
  qrCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  qrFrame: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: Radii.lg,
    marginBottom: Spacing.md,
  },
  qrRow: {
    flexDirection: "row",
  },
  qrCell: {
    width: 5,
    height: 5,
  },
  walletTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
    marginBottom: Spacing.xs,
  },
  walletField: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  walletValue: {
    flex: 1,
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
    marginRight: Spacing.sm,
  },
  walletNote: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  otpRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  otpInput: {
    width: 38,
    height: 46,
    borderRadius: Radii.lg,
    borderWidth: 1,
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
  },
  errorText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
    marginBottom: Spacing.sm,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  resendText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  resendLink: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  verificationText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  verificationEmail: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  verificationOtpRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  verificationOtpInput: {
    width: 44,
    height: 48,
    borderRadius: Radii.lg,
    borderWidth: 1,
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
  },
  verificationLink: {
    alignSelf: "flex-end",
    marginBottom: Spacing.md,
  },
  verificationButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  verificationButton: {
    flex: 1,
    height: 48,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  verificationButtonText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  passwordModalCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    maxHeight: "92%",
    width: "100%",
  },
  passwordCardScroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  passwordNoteCard: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  passwordNoteTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.xs+1,
    lineHeight: Typography.line.xs+1,
    marginBottom: Spacing.xs,
  },
  passwordNoteText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  passwordLabel: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  passwordField: {
    borderWidth: 0.5,
    borderRadius: Radii.lg,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  passwordInput: {
    flex: 1,
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  passwordActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  passwordActionButton: {
    flex: 1,
    height: 52,
    borderRadius: Radii.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  passwordActionText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  passwordError: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
    color: "#DE2E42",
    marginTop: Spacing.xs,
  },
  submitButton: {
    height: 48,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  submitText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
});
