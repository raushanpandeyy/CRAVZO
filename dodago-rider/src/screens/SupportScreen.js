import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList,
  KeyboardAvoidingView, Platform, SafeAreaView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Send } from "../components/Icons";
import { RiderHeader } from "../components/RiderChrome";
import { colors } from "../constants/colors";
import { getChatMessages, getSupportChatRoom } from "../services/chatService";
import { joinChatRoom, leaveChatRoom, onSocketMessage, sendSocketMessage } from "../services/socketService";
import { useAuth } from "../services/AuthContext";

const sendWithAck = (payload) =>
  new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, message: "Connection timed out" });
    }, 6000);
    sendSocketMessage(payload, (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result || { ok: false, message: "Message not sent" });
    }).catch((err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok: false, message: err.message || "Unavailable" });
    });
  });

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function SupportScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [room,     setRoom]     = useState(null);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const flatListRef = useRef(null);
  const roomIdRef   = useRef(null);

  const loadChat = useCallback(async () => {
    setLoading(true);
    try {
      const chatRoom = await getSupportChatRoom();
      setRoom(chatRoom);
      roomIdRef.current = chatRoom.id;
      await joinChatRoom(chatRoom.id);
      const data = await getChatMessages(chatRoom.id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert("Support unavailable", err.message || "Could not open support chat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let activeRoomId = null;
    loadChat().then(() => { activeRoomId = roomIdRef.current; });
    return () => { if (activeRoomId) leaveChatRoom(activeRoomId); };
  }, [loadChat]);

  useEffect(() =>
    onSocketMessage((payload) => {
      const msg = payload?.message || payload;
      if (!msg?.roomId || msg.roomId !== roomIdRef.current) return;
      setMessages((current) => {
        if (current.some((m) => m.id === msg.id)) return current;
        const without = payload?.clientId
          ? current.filter((m) => m.clientId !== payload.clientId)
          : current;
        return [...without, msg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }),
  []);

  const send = async () => {
    const value = input.trim();
    if (!value || !room?.id) return;
    setInput("");
    const clientId = `support-${Date.now()}`;
    const temp = {
      id: clientId, clientId, roomId: room.id,
      senderId: user?.id,
      sender: user ? { id: user.id, name: user.name, role: user.role } : null,
      text: value,
      createdAt: new Date().toISOString(),
    };
    setMessages((c) => [...c, temp]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

    const result = await sendWithAck({ roomId: room.id, text: value, clientId });
    if (result?.ok) {
      if (result.message) {
        setMessages((c) => c.map((m) => m.clientId === clientId ? result.message : m));
      }
      return;
    }
    setMessages((c) => c.filter((m) => m.clientId !== clientId));
    Alert.alert("Message failed", result?.message || "Could not send message.");
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === user?.id || item.sender?.id === user?.id;
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleSupport]}>
          {!isMe && (
            <Text style={styles.senderName}>
              {item.sender?.name || item.senderName || "Support"}
            </Text>
          )}
          <Text style={styles.bubbleText}>{item.text || item.message}</Text>
          <Text style={styles.bubbleTime}>{fmtTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <RiderHeader title="Support" subtitle="Rider" navigation={navigation} />

      {/* Sub-header */}
      <View style={styles.subHeader}>
        <Text style={styles.subTitle}>Dodago Support</Text>
        <Text style={styles.subOnline}>Online</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={styles.loadingText}>Connecting to support…</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, i) => item.id || `${i}`}
            renderItem={renderItem}
            contentContainerStyle={styles.messages}
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            windowSize={9}
            removeClippedSubviews={Platform.OS === "android"}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  Send a message to start chatting with support.
                </Text>
              </View>
            }
          />
        )}

        {/* Composer — sits above navbar */}
        <View style={[
          styles.composer,
          { paddingBottom: Math.max(insets.bottom + 10, 14) },
        ]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={send}
            disabled={!input.trim() || !room?.id}
            style={[styles.send, (!input.trim() || !room?.id) && styles.sendDisabled]}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.primaryDark },
  flex:    { flex: 1 },
  center:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },

  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#312e81",
  },
  subTitle:  { color: "#fff", fontSize: 18, fontWeight: "900" },
  subOnline: { color: "#86efac", fontWeight: "900", fontSize: 13 },

  loadingText: { color: "#cbd5e1", fontWeight: "700", marginTop: 8 },

  messages: { padding: 16, gap: 10, paddingBottom: 8 },

  messageRow:   { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "85%" },
  messageRowMe: { alignSelf: "flex-end", flexDirection: "row-reverse" },

  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#4f46e5",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "100%",
    gap: 3,
  },
  bubbleSupport: { backgroundColor: "#1e293b", borderBottomLeftRadius: 4 },
  bubbleMe:      { backgroundColor: colors.primary, borderBottomRightRadius: 4 },

  senderName: { color: "#a5b4fc", fontWeight: "900", fontSize: 11, marginBottom: 2 },
  bubbleText: { color: "#fff", fontWeight: "700", lineHeight: 20, fontSize: 15 },
  bubbleTime: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    textAlign: "right",
    marginTop: 3,
  },

  emptyWrap: { padding: 32, alignItems: "center" },
  emptyText: { color: "#94a3b8", fontWeight: "700", textAlign: "center", lineHeight: 20 },

  composer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#312e81",
    borderTopWidth: 1,
    borderTopColor: "#3730a3",
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#1e293b",
    color: "#fff",
    paddingHorizontal: 16,
    fontWeight: "700",
  },
  send: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.45 },
});
