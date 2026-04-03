import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useState } from "react";
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
import ChatIcon from "@/assets/icons/chat.svg";
import { Radii } from "@/constants/radii";
import { Spacing } from "@/constants/spacing";
import { AppColors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/auth-store";
import {
  addTicket,
  fetchTicketList,
  type TicketListItem,
} from "@/services/support/tickets";

const toGradient = (colors: readonly string[]) => colors as [string, string, ...string[]];

export default function SupportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "dark";
  const isDark = colorScheme === "dark";
  const palette = AppColors[colorScheme];
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketFileName, setTicketFileName] = useState("");
  const [ticketFile, setTicketFile] = useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);
  const [titleError, setTitleError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const token = useAuthStore((state) => state.token);

  const pageBackground = isDark ? "#020B09" : "#FFFFFF";
  const textPrimary = isDark ? palette.onPrimary : palette.text;
  const textMuted = palette.textMuted;
  const fieldBg = isDark ? "#021210" : "#FFFFFF";
  const fieldBorder = isDark ? "#275049" : "#D6D6D6";
  const subtleGlow = toGradient(["rgba(255, 255, 255, 0.04)", "rgba(102, 102, 102, 0)"]);
  const dashedBorder = isDark ? "rgba(39,80,73,0.7)" : "rgba(214,214,214,0.9)";
  const dangerText = "#DE2E42";
  const openChat = (ticketId: string) => {
    router.push({ pathname: "/(drawer)/chat", params: { ticketId } });
  };

  useEffect(() => {
    let isActive = true;
    const loadTickets = async () => {
      setIsLoadingTickets(true);
      const result = await fetchTicketList(token ?? undefined);
      if (!isActive) return;
      if (!result.success) {
        setTicketError(result.message ?? "Unable to load tickets.");
        setTickets([]);
      } else {
        setTicketError("");
        setTickets(result.data?.tickets ?? []);
      }
      setIsLoadingTickets(false);
    };
    loadTickets();
    return () => {
      isActive = false;
    };
  }, [token]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const selected = result.assets?.[0];
      if (!selected?.uri) return;
      setTicketFileName(selected.name ?? "document");
      setTicketFile({
        uri: selected.uri,
        name: selected.name ?? "document",
        type: selected.mimeType ?? "application/octet-stream",
      });
    } catch {
      Alert.alert("Upload failed", "Unable to open document picker.");
    }
  };

  const handleSubmitTicket = async () => {
    setHasSubmitted(true);
    const nextTitleError = ticketTitle.trim() ? "" : "Please enter a title.";
    const nextMessageError = ticketMessage.trim() ? "" : "Please enter your message.";
    setTitleError(nextTitleError);
    setMessageError(nextMessageError);
    if (nextTitleError || nextMessageError) return;
    if (isCreating) return;
    setIsCreating(true);
    try {
      const result = await addTicket(token ?? undefined, {
        title: ticketTitle.trim(),
        message: ticketMessage.trim(),
        ticketImage: ticketFile,
      });
      if (!result.success) {
        Alert.alert("Create Ticket", result.message ?? "Unable to create ticket.");
        return;
      }
      const refresh = await fetchTicketList(token ?? undefined);
      if (refresh.success) {
        setTickets(refresh.data?.tickets ?? []);
      }
      Alert.alert("Ticket Created", result.message ?? "Your ticket has been submitted.");
      handleCloseModal();
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateTicket(false);
    setTicketTitle("");
    setTicketMessage("");
    setTicketFileName("");
    setTicketFile(null);
    setTitleError("");
    setMessageError("");
    setHasSubmitted(false);
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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Support</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Pressable
          style={[styles.createTicketButton, { backgroundColor: palette.primary }]}
          onPress={() => {
            setShowCreateTicket(true);
            setHasSubmitted(false);
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color={palette.onPrimary} />
          <Text style={[styles.createTicketText, { color: palette.onPrimary }]}>Create Ticket</Text>
        </Pressable>

        <View style={styles.ticketList}>
          {isLoadingTickets ? (
            <Text style={[styles.ticketHint, { color: textMuted }]}>Loading tickets...</Text>
          ) : null}
          {!isLoadingTickets && ticketError ? (
            <Text style={[styles.ticketHint, { color: dangerText }]}>{ticketError}</Text>
          ) : null}
          {tickets.map((ticket) => (
            <Pressable
              key={ticket.id ?? ticket.ticketId}
              style={[styles.ticketCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}
              onPress={() => openChat(ticket.ticketId)}
            >
              <View style={styles.ticketHeader}>
                <Pressable style={styles.chatButton} onPress={() => openChat(ticket.ticketId)}>
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
                    <Text
                      style={[
                        styles.ticketValue,
                        { color: ticket.status === "Open" ? palette.primary : "#DE2E42" },
                      ]}
                    >
                      {ticket.status}
                    </Text>
                  </View>
                  <View style={[styles.ticketCell, styles.rightCell]}>
                    <Text style={[styles.ticketLabel, { color: textMuted }]}>Created at</Text>
                    <Text style={[styles.ticketValue, { color: textPrimary }]}>{ticket.createdAt}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showCreateTicket}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseModal} />
          <View style={[styles.modalCard, { backgroundColor: fieldBg, borderColor: fieldBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Create Ticket</Text>
              <Pressable
                style={[styles.modalClose, { borderColor: fieldBorder }]}
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={16} color={textPrimary} />
              </Pressable>
            </View>
            <View style={[styles.modalDivider, { borderBottomColor: dashedBorder }]} />

            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalLabel, { color: textPrimary }]}>Title</Text>
              <TextInput
                value={ticketTitle}
                onChangeText={(value) => {
                  setTicketTitle(value);
                  if (titleError && value.trim()) setTitleError("");
                }}
                placeholder="Enter title"
                placeholderTextColor={textMuted}
                style={[styles.modalInput, { backgroundColor: fieldBg, borderColor: fieldBorder, color: textPrimary }]}
              />
              {hasSubmitted && titleError ? (
                <Text style={[styles.errorText, { color: dangerText }]}>{titleError}</Text>
              ) : null}

              <Text style={[styles.modalLabel, { color: textPrimary }]}>Enter your message</Text>
              <TextInput
                value={ticketMessage}
                onChangeText={(value) => {
                  setTicketMessage(value);
                  if (messageError && value.trim()) setMessageError("");
                }}
                placeholder="Type your message"
                placeholderTextColor={textMuted}
                multiline
                style={[
                  styles.modalTextarea,
                  { backgroundColor: fieldBg, borderColor: fieldBorder, color: textPrimary },
                ]}
              />
              {hasSubmitted && messageError ? (
                <Text style={[styles.errorText, { color: dangerText }]}>{messageError}</Text>
              ) : null}

              <Text style={[styles.modalLabel, { color: textPrimary }]}>ID Document</Text>
              <Pressable
                style={[styles.uploadZone, { borderColor: dashedBorder }]}
                onPress={handlePickDocument}
              >
                <Text style={[styles.uploadText, { color: textMuted }]}>
                  Click or drag and drop a file here
                </Text>
                <Text style={[styles.uploadHint, { color: dangerText }]}>
                  Maximum file size up to 10M
                </Text>
                {ticketFileName ? (
                  <Text style={[styles.uploadFileName, { color: textPrimary }]}>
                    {ticketFileName}
                  </Text>
                ) : null}
              </Pressable>

              <Pressable
                style={[styles.submitButton, { backgroundColor: palette.primary }]}
                onPress={handleSubmitTicket}
              >
                <Text style={[styles.submitText, { color: palette.onPrimary }]}>Submit</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    maxHeight: "85%",
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
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDivider: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    marginTop: Spacing.sm,
  },
  modalContent: {
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  modalLabel: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
  },
  modalTextarea: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    textAlignVertical: "top",
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.sm,
  },
  uploadZone: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    gap: 4,
  },
  uploadText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.sm,
  },
  uploadHint: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs - 1,
  },
  uploadFileName: {
    marginTop: Spacing.xs,
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.xs,
  },
  errorText: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.sm,
  },
  submitButton: {
    marginTop: Spacing.sm,
    height: 44,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontFamily: "Geist-SemiBold",
    fontSize: Typography.size.sm,
    lineHeight: Typography.line.sm,
  },
  ticketList: {
    gap: Spacing.sm,
  },
  ticketHint: {
    fontFamily: "Geist-Regular",
    fontSize: Typography.size.xs,
    lineHeight: Typography.line.sm,
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
