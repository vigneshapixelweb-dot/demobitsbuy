import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ArrowLeft from "@/assets/icons/arrow-left.svg";
import DrawerIcon from "@/assets/icons/drawer.svg";
import AccountActivitiesIcon from "@/assets/icons/security/account-activities.svg";
import AntiCodeIcon from "@/assets/icons/security/anticode.svg";
import AuthenticatorAppDark from "@/assets/icons/security/authenticator app_dark.svg";
import AuthenticatorAppLight from "@/assets/icons/security/authenticator app_light.svg";
import CloseIcon from "@/assets/icons/security/close.svg";
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
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];
  const [showProtectModal, setShowProtectModal] = useState(false);

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

  const onPressMenu = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const settings2FA: SettingItem[] = [
    {
      id: "google-auth",
      title: "Google Authenticator",
      description: "BitsBuyss of security using Google Authenticator for withdrawals and security actions.",
      buttonLabel: "Set Up",
      buttonTone: "primary",
      Icon: GoogleAuthIcon,
      onPress: () => Alert.alert("Google Authenticator", "Setup flow coming soon."),
    },
    {
      id: "email-verification",
      title: "Email Verification",
      description: "Verify your email to secure login, password recovery, and withdrawal confirmations.",
      buttonLabel: "Change",
      buttonTone: "primary",
      Icon: EmailIcon,
      onPress: () => Alert.alert("Email Verification", "Update your email verification settings."),
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
      onPress: () => router.push("/(drawer)/kyc-verification"),
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
      onPress: () => Alert.alert("Login Password", "Password change flow coming soon."),
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
      onPress: () => Alert.alert("Account Activity", "Activity log coming soon."),
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
          <Pressable style={styles.iconButton} onPress={onPressMenu}>
            <DrawerIcon width={20} height={20} />
          </Pressable>
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

      <Modal
        visible={showProtectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProtectModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowProtectModal(false)} />
          <View style={[styles.modalCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Protect your Funds</Text>
              <Pressable style={styles.modalClose} onPress={() => setShowProtectModal(false)}>
                <CloseIcon width={22} height={22} />
              </Pressable>
            </View>
            <View style={styles.modalDivider} />
            <Text style={[styles.modalText, { color: textMuted }]}>
              Your account security level is low. Please enable at least one more verification mode.
            </Text>
            <Pressable
              style={[styles.modalOption, { borderColor: fieldBorder }]}
              onPress={() => Alert.alert("Authenticator App", "Open authenticator setup.")}
            >
              <View style={styles.modalOptionLeft}>
                <AuthenticatorAppIcon width={36} height={36} />
                <View>
                  <Text style={[styles.modalOptionTitle, { color: textPrimary }]}>
                    Authenticator App
                  </Text>
                  <Text style={[styles.modalOptionSub, { color: textMuted }]}>
                    (Recommended)
                  </Text>
                </View>
              </View>
              <View style={[styles.modalOptionArrow, { backgroundColor: fieldBorder }]}>
                <Ionicons name="chevron-forward" size={16} color={textPrimary} />
              </View>
            </Pressable>
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
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
    marginBottom: 2,
  },
  alertSubtitle: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  noteCard: {
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  noteTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
    marginBottom: Spacing.xs,
  },
  noteText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
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
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  settingDescription: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 4,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 74,
  },
  actionButtonText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
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
    fontSize: Typography.size.lg,
    lineHeight: Typography.line.lg,
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
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
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
});
