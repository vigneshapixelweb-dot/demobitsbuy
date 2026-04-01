import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ArrowLeft from "@/assets/icons/arrow-left.svg";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/auth-store";
import { fetchLoginActivity } from "@/services/auth/login-activity";

const toGradient = (colors: readonly string[]) => colors as [string, string, ...string[]];

type TabKey = "login" | "security";

type ActivityRecord = {
  id: string;
  device: string;
  dateTime: string;
  location: string;
  ipAddress: string;
  source: string;
  actionLabel: string;
  actionColor: string;
};

export default function AccountActivityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];
  const [activeTab, setActiveTab] = useState<TabKey>("login");
  const token = useAuthStore((state) => state.token);
  const [loginActivityData, setLoginActivityData] = useState<ActivityRecord[]>([]);

  const pageBackground = isDark ? "#020B09" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = palette.textMuted;
  const fieldBg = isDark ? "#021210" : "#FFFFFF";
  const fieldBorder = isDark ? "#275049" : "#D6D6D6";
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);

  useEffect(() => {
    if (!token) return;
    let isActive = true;
    const load = async () => {
      const result = await fetchLoginActivity(token, 0, 10);
      if (!isActive || !result.success || !result.data) return;
      const mapped: ActivityRecord[] = result.data.activity.map((item) => ({
        id: String(item.id),
        device: item.logged_in_browser || item.logged_in_device || "Unknown Device",
        dateTime: item.created_at,
        location: item.logged_in_location || "Unknown",
        ipAddress: item.logged_in_ip || "Unknown",
        source: item.logged_in_os || "Unknown Platform",
        actionLabel: item.status === 1 ? "Login" : "Logout",
        actionColor: item.status === 1 ? palette.primary : "#DE2E42",
      }));
      setLoginActivityData(mapped);
    };
    load();
    return () => {
      isActive = false;
    };
  }, [token, palette.primary]);

  const securityActivity: ActivityRecord[] = [
    {
      id: "security-1",
      device: "Password Changed",
      dateTime: "2024-10-23, 11:25:48",
      location: "India",
      ipAddress: "103.116.149.10",
      source: "Security Settings",
      actionLabel: "View",
      actionColor: palette.primary,
    },
    {
      id: "security-2",
      device: "2FA Updated",
      dateTime: "2024-10-21, 08:12:31",
      location: "India",
      ipAddress: "103.116.149.10",
      source: "Authenticator App",
      actionLabel: "View",
      actionColor: palette.primary,
    },
  ];

  const records = useMemo(
    () => (activeTab === "login" ? loginActivityData : securityActivity),
    [activeTab, loginActivityData, securityActivity],
  );

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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Account Activity</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.tabsWrap, { borderBottomColor: fieldBorder }]}>
          <Pressable style={styles.tabButton} onPress={() => setActiveTab("login")}>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "login" ? textPrimary : textMuted },
              ]}
            >
              Login Activity
            </Text>
            {activeTab === "login" ? (
              <View style={[styles.tabUnderline, { backgroundColor: palette.primary }]} />
            ) : null}
          </Pressable>

          <Pressable style={styles.tabButton} onPress={() => setActiveTab("security")}>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "security" ? textPrimary : textMuted },
              ]}
            >
              Security Activity
            </Text>
            {activeTab === "security" ? (
              <View style={[styles.tabUnderline, { backgroundColor: palette.primary }]} />
            ) : null}
          </Pressable>
        </View>

        <View style={styles.cardList}>
          {records.map((item) => (
            <View
              key={item.id}
              style={[styles.activityCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
            >
              <View style={styles.detailRow}>
                <View style={styles.detailCell}>
                  <Text style={[styles.detailLabel, { color: textMuted }]}>Device</Text>
                  <Text style={[styles.detailValue, { color: textPrimary }]}>{item.device}</Text>
                </View>
                <View style={[styles.detailCell, styles.alignRight]}>
                  <Text style={[styles.detailLabel, { color: textMuted }]}>Date & Time</Text>
                  <Text style={[styles.detailValue, { color: textPrimary }]}>{item.dateTime}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailCell}>
                  <Text style={[styles.detailLabel, { color: textMuted }]}>Location</Text>
                  <Text style={[styles.detailValue, { color: textPrimary }]}>{item.location}</Text>
                </View>
                <View style={[styles.detailCell, styles.alignRight]}>
                  <Text style={[styles.detailLabel, { color: textMuted }]}>IP Address</Text>
                  <Text style={[styles.detailValue, { color: textPrimary }]}>{item.ipAddress}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, styles.lastDetailRow]}>
                <View style={styles.detailCell}>
                  <Text style={[styles.detailLabel, { color: textMuted }]}>Source</Text>
                  <Text style={[styles.detailValue, { color: textPrimary }]}>{item.source}</Text>
                </View>
                <View style={[styles.detailCell, styles.alignRight]}>
                  <Text style={[styles.detailLabel, { color: textMuted }]}>Action</Text>
                  <Pressable
                    onPress={() => Alert.alert(item.actionLabel, `${item.actionLabel} action clicked.`)}
                  >
                    <Text style={[styles.detailValue, { color: item.actionColor }]}>
                      {item.actionLabel}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
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
    height: 180,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl + Spacing.md,
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
  headerSpacer: {
    width: 34,
    height: 28,
  },
  headerTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.lg + 2,
    lineHeight: Typography.line.lg - 2,
  },
  tabsWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    marginBottom: Spacing.md,
  },
  tabButton: {
    marginRight: Spacing.md + 2,
    paddingBottom: 6,
  },
  tabText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.md - 1,
    lineHeight: Typography.line.md - 1,
  },
  tabUnderline: {
    width: "100%",
    height: 3,
    borderRadius: Radii.pill,
    marginTop: 4,
  },
  cardList: {
    gap: Spacing.sm,
  },
  activityCard: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs + 2,
  },
  lastDetailRow: {
    marginBottom: 0,
  },
  detailCell: {
    flex: 1,
    gap: 2,
  },
  alignRight: {
    alignItems: "flex-end",
  },
  detailLabel: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs + 1,
    lineHeight: Typography.line.xs + 2,
  },
  detailValue: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm + 1,
    lineHeight: Typography.line.sm + 2,
  },
});
