import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ArrowLeft from "@/assets/icons/arrow-left.svg";
import ChatIcon from "@/assets/icons/chat.svg";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";

const toGradient = (colors: readonly string[]) => colors as [string, string, ...string[]];

type Ticket = {
  id: string;
  ticketId: string;
  subject: string;
  status: "Closed" | "Open";
  createdAt: string;
};

export default function SupportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];

  const pageBackground = isDark ? "#020B09" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = palette.textMuted;
  const fieldBg = isDark ? "#021210" : "#FFFFFF";
  const fieldBorder = isDark ? "#275049" : "#D6D6D6";
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);
  const dashedBorder = isDark ? "rgba(39,80,73,0.7)" : "rgba(214,214,214,0.9)";

  const tickets: Ticket[] = [
    {
      id: "1",
      ticketId: "TY6489586",
      subject: "How to use KYC Process",
      status: "Closed",
      createdAt: "2024-10-23, 13:07:22",
    },
    {
      id: "2",
      ticketId: "TY6489586",
      subject: "How to use KYC Process",
      status: "Closed",
      createdAt: "2024-10-23, 13:07:22",
    },
    {
      id: "3",
      ticketId: "TY6489586",
      subject: "How to use KYC Process",
      status: "Closed",
      createdAt: "2024-10-23, 13:07:22",
    },
    {
      id: "4",
      ticketId: "TY6489586",
      subject: "How to use KYC Process",
      status: "Closed",
      createdAt: "2024-10-23, 13:07:22",
    },
  ];

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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Support</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Pressable
          style={[styles.createTicketButton, { backgroundColor: palette.primary }]}
          onPress={() => Alert.alert("Create Ticket", "Create ticket flow coming soon.")}
        >
          <Ionicons name="add-circle-outline" size={20} color={palette.onPrimary} />
          <Text style={[styles.createTicketText, { color: palette.onPrimary }]}>Create Ticket</Text>
        </Pressable>

        <View style={styles.ticketList}>
          {tickets.map((ticket) => (
            <View
              key={ticket.id}
              style={[styles.ticketCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
            >
              <View style={styles.ticketHeader}>
                <Pressable style={styles.chatButton} onPress={() => Alert.alert("Chat", "Opening chat...")}>
                  <ChatIcon width={20} height={20} />
                  <Text style={[styles.chatText, { color: textPrimary }]}>Chat</Text>
                </Pressable>
              </View>

              <View style={[styles.ticketDivider, { borderBottomColor: dashedBorder }]} />

              <View style={styles.ticketRows}>
                <View style={styles.ticketRow}>
                  <View style={styles.ticketCell}>
                    <Text style={[styles.ticketLabel, { color: textMuted }]}>Ticket ID</Text>
                    <Text style={[styles.ticketValue, { color: textPrimary }]}>{ticket.ticketId}</Text>
                  </View>
                  <View style={[styles.ticketCell, styles.rightCell]}>
                    <Text style={[styles.ticketLabel, { color: textMuted }]}>Subject</Text>
                    <Text style={[styles.ticketValue, { color: textPrimary }]}>{ticket.subject}</Text>
                  </View>
                </View>

                <View style={styles.ticketRow}>
                  <View style={styles.ticketCell}>
                    <Text style={[styles.ticketLabel, { color: textMuted }]}>Status</Text>
                    <Text style={[styles.ticketValue, { color: "#DE2E42" }]}>{ticket.status}</Text>
                  </View>
                  <View style={[styles.ticketCell, styles.rightCell]}>
                    <Text style={[styles.ticketLabel, { color: textMuted }]}>Created at</Text>
                    <Text style={[styles.ticketValue, { color: textPrimary }]}>{ticket.createdAt}</Text>
                  </View>
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
  headerSpacer: {
    width: 34,
    height: 28,
  },
  headerTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.xl,
    lineHeight: Typography.line.lg,
  },
  createTicketButton: {
    height: 48,
    borderRadius: Radii.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  createTicketText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.md,
    lineHeight: Typography.line.md,
  },
  ticketList: {
    gap: Spacing.sm,
  },
  ticketCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chatText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  ticketDivider: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    marginHorizontal: -Spacing.md,
    marginBottom: Spacing.sm,
  },
  ticketRows: {
    gap: Spacing.xs,
  },
  ticketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ticketCell: {
    flex: 1,
    gap: 2,
  },
  rightCell: {
    alignItems: "flex-end",
  },
  ticketLabel: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.xs,
  },
  ticketValue: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
});

