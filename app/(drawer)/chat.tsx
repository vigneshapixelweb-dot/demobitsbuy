import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";

import ArrowLeft from "@/assets/icons/arrow-left.svg";
import SupportLogo from "@/assets/icons/support/logo.svg";
import SendIcon from "@/assets/icons/support/chat send.svg";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/auth-store";
import {
  markUserRead,
  sendTicketMessage,
  type TicketMessage,
  viewTicket,
} from "@/services/support/tickets";

const toGradient = (colors: readonly string[]) => colors as [string, string, ...string[]];

export default function ChatScreen() {
  const router = useRouter();
  const { ticketId } = useLocalSearchParams<{ ticketId?: string }>();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const token = useAuthStore((state) => state.token);
  const profile = useAuthStore((state) => state.profile);
  const resolvedTicketId = Array.isArray(ticketId) ? ticketId[0] : ticketId;

  const pageBackground = isDark ? "#020B09" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = palette.textMuted;
  const fieldBg = isDark ? "#021210" : "#FFFFFF";
  const fieldBorder = isDark ? "#275049" : "#D6D6D6";
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);
  const bubbleIncoming = isDark ? "#051815" : "#F4F6F6";
  const bubbleOutgoing = palette.primary;
  const avatarUri = profile?.avatarUrl ?? null;
  const avatarInitial =
    (profile?.fullName || profile?.nickname || profile?.username || "U").trim().charAt(0).toUpperCase() || "U";
  const isSvgAvatar = avatarUri ? avatarUri.toLowerCase().includes(".svg") : false;

  useEffect(() => {
    if (!avatarUri || isSvgAvatar) return;
    Image.prefetch(avatarUri).catch(() => {});
  }, [avatarUri, isSvgAvatar]);

  useEffect(() => {
    if (!resolvedTicketId) {
      setMessages([]);
      return;
    }
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      const result = await viewTicket(token ?? undefined, resolvedTicketId);
      if (!isActive) return;
      if (result.success && result.data?.messages) {
        setMessages(result.data.messages);
      } else {
        setMessages([]);
      }
      setIsLoading(false);
    };
    load();
    markUserRead(token ?? undefined, resolvedTicketId);
    return () => {
      isActive = false;
    };
  }, [resolvedTicketId, token]);

  const handleSend = async () => {
    const content = message.trim();
    if (!content || !resolvedTicketId || sendBusy) return;
    setSendBusy(true);
    try {
      const result = await sendTicketMessage(token ?? undefined, {
        message: content,
        ticketId: resolvedTicketId,
      });
      if (result.success) {
        if (result.data?.messages && result.data.messages.length > 0) {
          setMessages(result.data.messages);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `local-${Date.now()}`,
              type: "outgoing",
              text: content,
              time: "Now",
            },
          ]);
        }
        setMessage("");
      }
    } finally {
      setSendBusy(false);
    }
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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable style={styles.iconButton} onPress={() => router.push("/support")}>
              <ArrowLeft width={24} height={24} color={textMuted} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>Chat</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={[styles.supportCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
          >
            <View style={styles.supportLeft}>
              <View style={[styles.supportIconWrap, { borderColor: fieldBorder }]}
              >
                <SupportLogo width={24} height={24} />
              </View>
              <View>
                <Text style={[styles.supportTitle, { color: textPrimary }]}
                >
                  BitsBuys Support
                </Text>
                <Text style={[styles.supportSubtitle, { color: textMuted }]}
                >
                  How to use KYC Process?
                </Text>
              </View>
            </View>
            <View style={styles.supportRight}>
              <Text style={[styles.supportLabel, { color: textMuted }]}>Ticket ID</Text>
              <Text style={[styles.supportValue, { color: palette.primary }]}
              >
                {resolvedTicketId ?? "#364856845"}
              </Text>
            </View>
          </View>

          <View style={styles.chatList}>
            {isLoading ? (
              <Text style={[styles.chatHint, { color: textMuted }]}>Loading messages...</Text>
            ) : null}
            {messages.map((item, index) => {
              const isOutgoing = item.type === "outgoing";
              return (
                <View
                  key={item.id ?? index}
                  style={[styles.messageRow, isOutgoing ? styles.rowRight : styles.rowLeft]}
                >
                  {!isOutgoing ? (
                    <View style={[styles.avatar, { borderColor: fieldBorder }]}
                    >
                      <SupportLogo width={18} height={18} />
                    </View>
                  ) : null}
                  <View style={styles.messageColumn}>
                    <View
                      style={[
                        styles.messageBubble,
                        {
                          backgroundColor: isOutgoing ? bubbleOutgoing : bubbleIncoming,
                          borderColor: fieldBorder,
                        },
                        isOutgoing ? styles.outgoingBubble : styles.incomingBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          { color: isOutgoing ? palette.onPrimary : textPrimary },
                        ]}
                      >
                        {item.text}
                      </Text>
                    </View>
                    <Text style={[styles.messageTime, { color: textMuted }]}>{item.time}</Text>
                  </View>
                  {isOutgoing ? (
                    <View style={[styles.avatar, { borderColor: fieldBorder }]}>
                      {avatarUri ? (
                        isSvgAvatar ? (
                          <SvgUri uri={avatarUri} width={26} height={26} />
                        ) : (
                          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        )
                      ) : (
                        <Text style={styles.avatarInitial}>{avatarInitial}</Text>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.inputBar}>
          <View style={[styles.inputWrap, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
          >
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Enter your message"
              placeholderTextColor={textMuted}
              style={[styles.input, { color: textPrimary }]}
            />
          </View>
          <Pressable
            style={[styles.sendButton, { backgroundColor: palette.primary }]}
            onPress={handleSend}
            disabled={sendBusy}
          >
            <SendIcon width={44} height={44} />
          </Pressable>
        </View>
      </KeyboardAvoidingView> 
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
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
    paddingBottom: Spacing.xl * 2,
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
    fontSize: Typography.size.lg,
    lineHeight: Typography.line.lg,
  },
  supportCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  supportLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  supportIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  supportTitle: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  supportSubtitle: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.sm,
  },
  supportRight: {
    alignItems: "flex-end",
  },
  supportLabel: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.sm,
  },
  supportValue: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  chatList: {
    gap: Spacing.md,
  },
  chatHint: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.sm,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  rowLeft: {
    justifyContent: "flex-start",
  },
  rowRight: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(4, 24, 21, 0.9)",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.xs,
    color: "#FFFFFF",
  },
  messageColumn: {
    maxWidth: "78%",
  },
  messageBubble: {
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  incomingBubble: {
    borderTopLeftRadius: Radii.sm,
    borderTopRightRadius: Radii.lg,
    borderBottomLeftRadius: Radii.sm,
    borderBottomRightRadius: Radii.lg,
  },
  outgoingBubble: {
    borderTopLeftRadius: Radii.md,
    borderTopRightRadius: Radii.sm,
    borderBottomLeftRadius: Radii.md,
    borderBottomRightRadius: Radii.sm,
  },
  messageText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  messageTime: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs - 1,
    lineHeight: Typography.line.sm,
    marginTop: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    justifyContent: "center",
  },
  input: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
});
