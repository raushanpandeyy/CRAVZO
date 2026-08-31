/**
 * SupportScreen — vendor can chat with admin support OR use phone/email fallback.
 *
 * Backend: GET /api/v1/chats/support → get/create SUPPORT room
 *          GET /api/v1/chats/rooms/:roomId/messages
 *          POST /api/v1/chats/rooms/:roomId/messages
 * Real-time: socket event  chat:message
 */
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useRef, useState } from "react";
import { colors } from "../constants/colors";
import { ArrowLeft, Headphones, MessageCircle, Send } from "../components/Icons";
import {
  getChatMessages,
  getSupportRoom,
  sendChatMessage,
} from "../services/vendorService";
import { getSocket } from "../services/socketService";
import { useAuth } from "../services/AuthContext";

const SUPPORT_PHONE  = "+91 9984185916";
const SUPPORT_EMAIL  = "yushpandey3@gmail.com";
const SUPPORT_HOURS  = "Mon–Sat, 9 AM – 8 PM IST";

const fmt = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    d.toLocaleDateString([], { day: "numeric", month: "short" }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

export default function SupportScreen({ navigation }) {
  const { user } = useAuth();

  const [tab,      setTab]      = useState("chat"); // "chat" | "contact"
  const [roomId,   setRoomId]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);

  const listRef      = useRef(null);
  const socketClean  = useRef(null);

  // ── Load support room ────────────────────────────────────────────
  const loadRoom = useCallback(async () => {
    try {
      const room = await getSupportRoom();
      setRoomId(room.id);
      const msgs = await getChatMessages(room.id);
      const list = Array.isArray(msgs) ? msgs : (msgs?.messages || []);
      setMessages(list.reverse()); // oldest first
    } catch (err) {
      Alert.alert("Error", err.message || "Could not load support chat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoom(); }, [loadRoom]);

  // ── Socket ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    let active = true;

    getSocket().then((s) => {
      if (!active) return;
      s.emit("chat:join", { roomId });

      const handler = (msg) => {
        if (msg.roomId !== roomId) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      };
      s.on("chat:message", handler);

      socketClean.current = () => {
        s.off("chat:message", handler);
        s.emit("chat:leave", { roomId });
      };
    }).catch(() => {});

    return () => {
      active = false;
      socketClean.current?.();
      socketClean.current = null;
    };
  }, [roomId]);

  useEffect(() => {
    if (messages.length > 0)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }, [loading]);

  // ── Send ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = text.trim();
    if (!content || !roomId || sending) return;

    setText("");
    setSending(true);

    const temp = {
      id:        `temp-${Date.now()}`,
      content,
      senderId:  user?.sub || user?.id,
      senderRole:"VENDOR",
      createdAt: new Date().toISOString(),
      _pending:  true,
    };
    setMessages((prev) => [...prev, temp]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const saved = await sendChatMessage(roomId, content);
      setMessages((prev) =>
        prev.map((m) => (m.id === temp.id ? { ...saved, _pending: false } : m))
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setText(content);
      Alert.alert("Send failed", err.message || "Could not send message");
    } finally {
      setSending(false);
    }
  };

  // ── Render bubble ────────────────────────────────────────────────
  const renderMessage = ({ item }) => {
    const isMe = item.senderRole === "VENDOR";
    return (
      <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {!isMe && (
            <Text style={styles.bubbleSender}>Support Team</Text>
          )}
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
            {fmt(item.createdAt)}{item._pending ? "  ·  sending…" : ""}
          </Text>
        </View>
      </View>
    );
  };

  // ── Contact tab ──────────────────────────────────────────────────
  const ContactTab = () => (
    <ScrollView contentContainerStyle={styles.contactContent}>
      <View style={styles.contactCard}>
        <Text style={styles.contactCardTitle}>📞  Call Us</Text>
        <Text style={styles.contactHours}>{SUPPORT_HOURS}</Text>
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`)}
        >
          <Text style={styles.contactBtnText}>{SUPPORT_PHONE}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactCardTitle}>✉️  Email Us</Text>
        <Text style={styles.contactSub}>
          We typically respond within 24 hours on business days.
        </Text>
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Vendor Support Request`)}
        >
          <Text style={styles.contactBtnText}>{SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactCardTitle}>⚖️  Grievance Officer</Text>
        <Text style={styles.contactSub}>
          For escalations under DPDP Act 2023:
        </Text>
        <Text style={styles.contactDetail}>Raushan Pandey</Text>
        <TouchableOpacity
          style={[styles.contactBtn, { marginTop: 4 }]}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        >
          <Text style={styles.contactBtnText}>{SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ── UI ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={colors.ink} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerIconWrap}>
            <Headphones size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Customer Support</Text>
            <Text style={styles.headerSub}>{SUPPORT_HOURS}</Text>
          </View>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "chat" && styles.tabBtnActive]}
          onPress={() => setTab("chat")}
        >
          <MessageCircle size={15} color={tab === "chat" ? colors.primary : colors.muted} />
          <Text style={[styles.tabLabel, tab === "chat" && styles.tabLabelActive]}>
            Live Chat
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "contact" && styles.tabBtnActive]}
          onPress={() => setTab("contact")}
        >
          <Headphones size={15} color={tab === "contact" ? colors.primary : colors.muted} />
          <Text style={[styles.tabLabel, tab === "contact" && styles.tabLabelActive]}>
            Contact Info
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "contact" ? (
        <ContactTab />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Connecting to support…</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>🎧</Text>
              <Text style={styles.emptyTitle}>Start a conversation</Text>
              <Text style={styles.emptyBody}>
                Send us a message and our support team will respond shortly.
              </Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: false })
              }
            />
          )}

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Describe your issue…"
              placeholderTextColor={colors.subtle}
              multiline
              maxLength={1000}
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Send size={20} color="#fff" strokeWidth={2.5} />
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.bg },
  flex:  { flex: 1 },
  center:{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "900", color: colors.ink },
  headerSub:   { fontSize: 12, color: colors.muted, fontWeight: "700", marginTop: 1 },

  // ── Tabs ──
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 2, borderBottomColor: "transparent",
    marginBottom: -1,
  },
  tabBtnActive:  { borderBottomColor: colors.primary },
  tabLabel:      { fontSize: 14, fontWeight: "800", color: colors.muted },
  tabLabelActive:{ color: colors.primary },

  // ── Messages ──
  messageList: { padding: 16, gap: 10, paddingBottom: 8 },

  bubbleRow:   { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "85%", marginVertical: 2 },
  bubbleRowMe: { alignSelf: "flex-end", flexDirection: "row-reverse" },

  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "900", color: colors.accent },

  bubble: {
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
    maxWidth: "100%", gap: 2,
  },
  bubbleMe:   { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: {
    backgroundColor: colors.card, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: colors.line,
  },
  bubbleSender:  { fontSize: 11, fontWeight: "900", color: colors.accent, marginBottom: 2 },
  bubbleText:    { fontSize: 15, color: colors.ink, lineHeight: 21, fontWeight: "600" },
  bubbleTextMe:  { color: "#fff" },
  bubbleTime:    { fontSize: 11, color: colors.subtle, fontWeight: "700" },
  bubbleTimeMe:  { color: "rgba(255,255,255,0.65)", textAlign: "right" },

  // ── Empty ──
  emptyEmoji:  { fontSize: 48 },
  emptyTitle:  { fontSize: 18, fontWeight: "900", color: colors.ink },
  emptyBody:   { color: colors.muted, textAlign: "center", lineHeight: 20, fontWeight: "600" },
  loadingText: { color: colors.muted, fontWeight: "700", marginTop: 8 },

  // ── Input ──
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.card,
    borderTopWidth: 1, borderTopColor: colors.line,
    gap: 10,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    borderRadius: 22, borderWidth: 1.5, borderColor: colors.line,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: colors.ink, backgroundColor: "#f8fafc", fontWeight: "600",
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: colors.primary, shadowOpacity: 0.35,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.45, shadowOpacity: 0, elevation: 0 },

  // ── Contact tab ──
  contactContent: { padding: 16, gap: 14 },
  contactCard: {
    backgroundColor: colors.card, borderRadius: 18,
    borderWidth: 1, borderColor: colors.line,
    padding: 18, gap: 6,
    shadowColor: "#0f172a", shadowOpacity: 0.05,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  contactCardTitle: { fontSize: 16, fontWeight: "900", color: colors.ink, marginBottom: 2 },
  contactHours:     { fontSize: 13, color: colors.muted, fontWeight: "700" },
  contactSub:       { fontSize: 13, color: colors.muted, fontWeight: "600", lineHeight: 19 },
  contactDetail:    { fontSize: 15, fontWeight: "800", color: colors.ink },
  contactBtn: {
    marginTop: 8, paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: colors.primarySoft, borderRadius: 12,
    alignItems: "center",
  },
  contactBtnText: { color: colors.primary, fontWeight: "900", fontSize: 14 },
});
