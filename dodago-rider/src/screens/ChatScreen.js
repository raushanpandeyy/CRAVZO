import { useEffect, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Send } from "../components/Icons";
import { Screen, Card } from "../components/Primitives";
import { colors } from "../constants/colors";
import { getChatMessages, getOrderChatRoom, sendChatMessage } from "../services/chatService";
import { joinChatRoom, leaveChatRoom, onSocketMessage } from "../services/socketService";

export default function ChatScreen({ route }) {
  const order = route.params?.order;
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!order?.id) return undefined;
    getOrderChatRoom(order.id).then(async (chatRoom) => {
      if (!mounted) return;
      setRoom(chatRoom);
      await joinChatRoom(chatRoom.id);
      const data = await getChatMessages(chatRoom.id);
      if (mounted) setMessages(data);
    }).catch((error) => Alert.alert("Chat failed", error.message || "Could not open chat."));
    return () => {
      mounted = false;
      if (room?.id) leaveChatRoom(room.id);
    };
  }, [order?.id]);

  useEffect(() => onSocketMessage((message) => {
    if (message.roomId === room?.id) setMessages((current) => [...current, message]);
  }), [room?.id]);

  const send = async () => {
    const value = text.trim();
    if (!value || !room?.id) return;
    setText("");
    try {
      const sent = await sendChatMessage(room.id, value);
      setMessages((current) => [...current, sent]);
    } catch (error) {
      Alert.alert("Message failed", error.message || "Could not send message.");
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
        <View style={styles.header}>
          <Text style={styles.title}>Customer Chat</Text>
          <Text style={styles.subtitle}>Order #{order?.id?.slice(-6) || ""}</Text>
        </View>
        <FlatList
          data={messages}
          keyExtractor={(item, index) => item.id || `${index}`}
          renderItem={({ item }) => (
            <Card style={styles.messageCard}>
              <Text style={styles.sender}>{item.sender?.name || item.senderName || "Message"}</Text>
              <Text style={styles.message}>{item.text || item.message}</Text>
            </Card>
          )}
          contentContainerStyle={styles.messages}
        />
        <View style={styles.composer}>
          <TextInput value={text} onChangeText={setText} placeholder="Type message" style={styles.input} />
          <TouchableOpacity onPress={send} style={styles.send}><Send size={20} color="#fff" /></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.line },
  title: { fontSize: 22, fontWeight: "900", color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 2, fontWeight: "700" },
  messages: { padding: 16, gap: 10, paddingBottom: 18 },
  messageCard: { padding: 12 },
  sender: { color: colors.primary, fontWeight: "900", fontSize: 12 },
  message: { color: colors.ink, marginTop: 4, fontSize: 15, lineHeight: 21 },
  composer: { flexDirection: "row", gap: 10, padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: colors.line },
  input: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, backgroundColor: "#fff" },
  send: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});

