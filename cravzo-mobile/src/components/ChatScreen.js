import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { Send, ChevronLeft, MessageCircle } from "lucide-react-native";
import { colors } from "../constants/colors";
import { connectSocket, disconnectSocket, joinChatRoom, leaveChatRoom, sendSocketMessage, onSocketMessage } from "../services/chatSocket";
import { apiRequest } from "../services/api";
import { useSelector } from "react-redux";

export default function ChatScreen({ navigation, route }) {
  const { data: user } = useSelector((state) => state.user);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState(null);
  const [chatPartner, setChatPartner] = useState({ name: "Chat", status: "..." });
  const flatListRef = useRef(null);
  const socketRef = useRef(null);

  const { orderId, room: roomType } = route.params || {};

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        let roomEndpoint;
        if (orderId) {
          roomEndpoint = user?.accountType === "vendor"
            ? `/api/chats/orders/${orderId}/vendor`
            : `/api/chats/orders/${orderId}`;
        } else {
          roomEndpoint = "/api/chats/support";
        }

        const res = await apiRequest(roomEndpoint);
        const room = res.data || res;
        if (!mounted) return;

        setRoomId(room.id);
        setChatPartner({
          name: room.name || `Order #${orderId?.slice(-6) || ""}` || "Chat",
          status: "Online",
        });

        const msgRes = await apiRequest(`/api/chats/rooms/${room.id}/messages`);
        setMessages(msgRes.data || []);
      } catch (err) {
        console.error("Chat init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    socketRef.current = connectSocket();
    const cleanupMsg = onSocketMessage((msg) => {
      if (msg.roomId === roomId || !roomId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      mounted = false;
      cleanupMsg();
      disconnectSocket();
    };
  }, [orderId, user?.accountType]);

  // Join room once roomId is available
  useEffect(() => {
    if (roomId) {
      joinChatRoom(roomId);
    }
    return () => {
      if (roomId) leaveChatRoom(roomId);
    };
  }, [roomId]);

  const handleSend = async () => {
    if (!input.trim() || !roomId) return;
    const text = input.trim();
    setInput("");

    const tempMsg = {
      id: `temp-${Date.now()}`,
      text,
      sender: "customer",
      senderId: user?.id,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await apiRequest(`/api/chats/rooms/${roomId}/messages`, {
        method: "POST",
        data: { text },
      });
      sendSocketMessage({ roomId, text, sender: user?.name || "You" });
    } catch (err) {
      console.error("Send message error:", err);
      Alert.alert("Error", "Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user?.id || item.sender === "customer";
    return (
      <View className={`max-w-[80%] ${isMe ? "self-end" : "self-start"}`}>
        <View className={`rounded-2xl px-4 py-3 ${isMe ? "bg-indigo-600" : "bg-slate-100"}`}>
          <Text className={`text-sm ${isMe ? "text-white" : "text-slate-900"}`}>
            {item.text}
          </Text>
        </View>
        <Text className={`text-[10px] text-slate-400 mt-1 ${isMe ? "text-right" : "text-left"}`}>
          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <View className="bg-white shadow-sm pt-14 pb-3 px-4 border-b border-slate-100">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <View className="h-10 w-10 rounded-full bg-indigo-100 items-center justify-center">
            <MessageCircle size={20} color={colors.brand[600]} />
          </View>
          <View>
            <Text className="font-extrabold text-slate-900">{chatPartner.name}</Text>
            <Text className="text-xs text-emerald-600">{chatPartner.status}</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        className="flex-1 px-4"
        data={messages}
        keyExtractor={(item) => item.id || String(Math.random())}
        contentContainerStyle={{ paddingVertical: 16, gap: 8 }}
        renderItem={renderMessage}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View className="px-4 py-3 border-t border-slate-100 bg-white">
        <View className="flex-row items-center gap-2">
          <TextInput
            className="flex-1 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm"
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity onPress={handleSend} className="h-11 w-11 items-center justify-center rounded-full bg-indigo-600">
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
