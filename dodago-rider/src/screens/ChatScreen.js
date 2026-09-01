import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Send } from "../components/Icons";
import { Card } from "../components/Primitives";
import { ScreenWithHeader } from "../components/RiderChrome";
import { colors } from "../constants/colors";
import { getChatMessages, getOrderChatRoom, getSupportChatRoom } from "../services/chatService";
import { joinChatRoom, leaveChatRoom, onSocketMessage, sendSocketMessage } from "../services/socketService";
import { useAuth } from "../services/AuthContext";

const sendWithAck = (payload) => new Promise((resolve) => {
  let settled = false;
  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    resolve({ ok: false, message: "Chat connection timed out" });
  }, 6000);

  sendSocketMessage(payload, (result) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    resolve(result || { ok: false, message: "Message not sent" });
  }).catch((error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    resolve({ ok: false, message: error.message || "Chat connection unavailable" });
  });
});

export default function ChatScreen({ route, navigation }) {
  const order = route.params?.order;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const roomIdRef = useRef(null);

  const loadChat = useCallback(async () => {
    setLoading(true);
    try {
      const chatRoom = order?.id ? await getOrderChatRoom(order.id) : await getSupportChatRoom();
      setRoom(chatRoom);
      roomIdRef.current = chatRoom.id;
      await joinChatRoom(chatRoom.id);
      const data = await getChatMessages(chatRoom.id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert("Chat failed", error.message || "Could not open chat.");
    } finally {
      setLoading(false);
    }
  }, [order?.id]);

  useEffect(() => {
    let activeRoomId = null;
    loadChat().then(() => {
      activeRoomId = roomIdRef.current;
    });
    return () => {
      if (activeRoomId) leaveChatRoom(activeRoomId);
    };
  }, [loadChat]);

  useEffect(() => onSocketMessage((payload) => {
    const message = payload?.message || payload;
    if (!message?.roomId || message.roomId !== roomIdRef.current) return;
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current;
      const withoutTemp = payload?.clientId ? current.filter((item) => item.clientId !== payload.clientId) : current;
      return [...withoutTemp, message];
    });
  }), []);

  const send = async () => {
    const value = text.trim();
    if (!value || !room?.id) return;
    setText("");
    const clientId = `rider-${Date.now()}`;
    const tempMessage = {
      id: clientId,
      clientId,
      roomId: room.id,
      senderId: user?.id,
      sender: user ? { id: user.id, name: user.name, role: user.role } : null,
      text: value,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, tempMessage]);
    const result = await sendWithAck({ roomId: room.id, text: value, clientId });
    if (result?.ok) {
      if (result.message) {
        setMessages((current) => current.map((item) => (item.clientId === clientId ? result.message : item)));
      }
      return;
    }
    setMessages((current) => current.filter((item) => item.clientId !== clientId));
    Alert.alert("Message failed", result?.message || "Could not send message.");
  };

  const isOrderChat = Boolean(order?.id);

  return (
    <ScreenWithHeader title="Chat" subtitle="Rider" navigation={navigation}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 92 : 80}
        style={styles.wrap}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{isOrderChat ? "Customer Chat" : "Dodago Support"}</Text>
          <Text style={styles.subtitle}>{isOrderChat ? `Order #${order.id?.slice(-6) || ""}` : "Support room"}</Text>
        </View>
        {loading ? (
          <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item.id || `${index}`}
            renderItem={({ item }) => {
              const isMe = item.senderId === user?.id || item.sender?.id === user?.id;
              return (
                <Card style={[styles.messageCard, isMe ? styles.myMessage : styles.theirMessage]}>
                  <Text style={[styles.sender, isMe && styles.mySender]}>{isMe ? "You" : item.sender?.name || item.senderName || "Message"}</Text>
                  <Text style={[styles.message, isMe && styles.myMessageText]}>{item.text || item.message}</Text>
                </Card>
              );
            }}
            contentContainerStyle={styles.messages}
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={50}
            windowSize={9}
            removeClippedSubviews={Platform.OS === "android"}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled"
          />
        )}
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom + 12, 18) }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type message"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <TouchableOpacity onPress={send} disabled={!room?.id || !text.trim()} style={[styles.send, (!room?.id || !text.trim()) && styles.sendDisabled]}><Send size={20} color="#fff" /></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWithHeader>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.line },
  title: { fontSize: 22, fontWeight: "900", color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 2, fontWeight: "700" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  messages: { padding: 16, gap: 10, paddingBottom: 18 },
  messageCard: { maxWidth: "82%", padding: 12 },
  myMessage: { alignSelf: "flex-end", backgroundColor: colors.primary },
  theirMessage: { alignSelf: "flex-start" },
  sender: { color: colors.primary, fontWeight: "900", fontSize: 12 },
  mySender: { color: "#dbeafe" },
  message: { color: colors.ink, marginTop: 4, fontSize: 15, lineHeight: 21 },
  myMessageText: { color: "#fff" },
  composer: { flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingTop: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: colors.line },
  input: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, backgroundColor: "#fff", color: colors.ink },
  send: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  sendDisabled: { backgroundColor: colors.subtle },
});