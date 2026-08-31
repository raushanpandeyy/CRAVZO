/**
 * ChatScreen — vendor ↔ customer chat for a specific order.
 *
 * Route params: { orderId, orderNumber }
 * Backend: GET /api/v1/chats/orders/:orderId/vendor  → get/create room
 *          GET /api/v1/chats/rooms/:roomId/messages  → fetch history
 *          POST /api/v1/chats/rooms/:roomId/messages → send message
 * Real-time: socket events  chat:message  on the room
 */
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useRef, useState } from "react";
import { colors } from "../constants/colors";
import { Send, ArrowLeft, MessageCircle } from "../components/Icons";
import {
  getChatMessages,
  getOrderChatRoom,
  sendChatMessage,
} from "../services/vendorService";
import { getSocket } from "../services/socketService";
import { useAuth } from "../services/AuthContext";

const fmt = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { day: "numeric", month: "short" }) +
    " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function ChatScreen({ route, navigation }) {
  const { orderId, orderNumber } = route.params || {};
  const { user } = useAuth();

  const [roomId,   setRoomId]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [closed,   setClosed]   = useState(false);

  const listRef    = useRef(null);
  const socketClean = useRef(null);

  // ── Load room + messages ─────────────────────────────────────────
  const loadRoom = useCallback(async () => {
    try {
      const room = await getOrderChatRoom(orderId);
      setRoomId(room.id);
      setClosed(room.status === "CLOSED");

      const msgs = await getChatMessages(room.id);
      const list = Array.isArray(msgs) ? msgs : (msgs?.messages || []);
      setMessages(list.reverse()); // oldest first
    } catch (err) {
      Alert.alert("Error", err.message || "Could not load chat");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { loadRoom(); }, [loadRoom]);

  // ── Socket: listen for new messages ─────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    let active = true;

    getSocket().then((s) => {
      if (!active) return;

      // Join the room channel
      s.emit("chat:join", { roomId });

      const handler = (msg) => {
        if (msg.roomId !== roomId) return;
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Scroll to bottom
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

  // Scroll to bottom when messages first load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [loading]);

  // ── Send message ─────────────────────────────────────────────────
  const handleSend = async () => {
    const content = text.trim();
    if (!content || !roomId || sending) return;

    setText("");
    setSending(true);

    // Optimistic insert
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
      // Replace temp with real message
      setMessages((prev) =>
        prev.map((m) => (m.id === temp.id ? { ...saved, _pending: false } : m))
      );
    } catch (err) {
      // Remove temp on failure
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setText(content); // restore text
      Alert.alert("Send failed", err.message || "Could not send message");
    } finally {
      setSending(false);
    }
  };

  // ── Render one message bubble ────────────────────────────────────
  const renderMessage = ({ item }) => {
    const isMe = item.senderRole === "VENDOR";
    return (
      <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>C</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
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
            <MessageCircle size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              Order #{orderNumber || orderId?.slice(-6) || "------"}
            </Text>
            <Text style={styles.headerSub}>
              {closed ? "🔒  Chat closed" : "Customer chat"}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        {/* Messages list */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading chat…</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyBody}>
              Send the customer a message about their order.
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

        {/* Input bar */}
        {closed ? (
          <View style={styles.closedBar}>
            <Text style={styles.closedText}>
              🔒  Chat closed — order completed or cancelled
            </Text>
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message…"
              placeholderTextColor={colors.subtle}
              multiline
              maxLength={1000}
              returnKeyType="default"
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
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  flex:    { flex: 1 },
  center:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },

  // ── Header ──
  header: {
    flexDirection:   "row",
    alignItems:      "center",
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
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "900", color: colors.ink },
  headerSub:   { fontSize: 12, color: colors.muted, fontWeight: "700", marginTop: 1 },

  // ── Messages ──
  messageList: { padding: 16, gap: 10, paddingBottom: 8 },

  bubbleRow:   { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "85%" },
  bubbleRowMe: { alignSelf: "flex-end", flexDirection: "row-reverse" },

  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "900", color: colors.primary },

  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "100%",
    gap: 4,
  },
  bubbleMe:   {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  bubbleText:    { fontSize: 15, color: colors.ink, lineHeight: 21, fontWeight: "600" },
  bubbleTextMe:  { color: "#fff" },
  bubbleTime:    { fontSize: 11, color: colors.subtle, fontWeight: "700" },
  bubbleTimeMe:  { color: "rgba(255,255,255,0.65)", textAlign: "right" },

  // ── Empty ──
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: colors.ink },
  emptyBody:  { color: colors.muted, textAlign: "center", lineHeight: 20, fontWeight: "600" },
  loadingText:{ color: colors.muted, fontWeight: "700", marginTop: 8 },

  // ── Input bar ──
  inputBar: {
    flexDirection:  "row",
    alignItems:     "flex-end",
    paddingHorizontal: 12,
    paddingVertical:    10,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: "#f8fafc",
    fontWeight: "600",
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.45, shadowOpacity: 0, elevation: 0 },

  // ── Closed bar ──
  closedBar: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#f1f5f9",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    alignItems: "center",
  },
  closedText: { color: colors.muted, fontWeight: "800", fontSize: 13 },
});
