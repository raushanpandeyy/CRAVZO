import { useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Send } from "../components/Icons";
import { ScreenWithHeader } from "../components/RiderChrome";
import { colors } from "../constants/colors";

const initialMessages = [
  { id: "welcome", text: "Hi, how can we help you?", sender: "support", time: "10:00 AM" },
];

export default function SupportScreen({ navigation }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const send = () => {
    const value = input.trim();
    if (!value) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((current) => [...current, { id: `${Date.now()}`, text: value, sender: "user", time }, { id: `${Date.now()}-reply`, text: "Our team will get back to you shortly.", sender: "support", time }]);
    setInput("");
  };

  return (
    <ScreenWithHeader title="Support" subtitle="Rider" navigation={navigation}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
        <View style={styles.header}>
          <Text style={styles.title}>Dodago Support</Text>
          <Text style={styles.online}>Online</Text>
        </View>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.sender === "user" && styles.messageRowUser]}>
              <View style={[styles.bubble, item.sender === "user" ? styles.userBubble : styles.supportBubble]}>
                <Text style={styles.message}>{item.text}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.messages}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={9}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === "android"}
        />
        <View style={styles.composer}>
          <TextInput value={input} onChangeText={setInput} placeholder="Type a message" placeholderTextColor="#94a3b8" style={styles.input} />
          <TouchableOpacity activeOpacity={0.85} onPress={send} style={styles.send}><Send size={20} color="#fff" /></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWithHeader>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.primaryDark },
  header: { padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#312e81" },
  title: { color: "#fff", fontSize: 20, fontWeight: "900" },
  online: { color: "#86efac", fontWeight: "900" },
  messages: { padding: 16, paddingBottom: 18, gap: 10 },
  messageRow: { alignItems: "flex-start" },
  messageRowUser: { alignItems: "flex-end" },
  bubble: { maxWidth: "78%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  supportBubble: { backgroundColor: "#1e293b" },
  userBubble: { backgroundColor: colors.primary },
  message: { color: "#fff", fontWeight: "700", lineHeight: 20 },
  time: { color: "#cbd5e1", fontSize: 10, textAlign: "right", marginTop: 5 },
  composer: { flexDirection: "row", gap: 10, padding: 12, paddingBottom: 120, backgroundColor: "#312e81" },
  input: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: "#1e293b", color: "#fff", paddingHorizontal: 16, fontWeight: "700" },
  send: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
