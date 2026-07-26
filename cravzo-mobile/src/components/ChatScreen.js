import { selectUserState, selectCurrentUser, selectIsLoggedIn } from "../store/selectors";
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from "react-native";
import { Send, ChevronLeft, MessageCircle, ImagePlus } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../constants/colors";
import { connectSocket, disconnectSocket, joinChatRoom, leaveChatRoom, sendSocketMessage, onSocketMessage } from "../services/chatSocket";
import { apiRequest } from "../services/api";
import { useSelector } from "react-redux";
import { explainPermission, permissionMessages } from "../services/permissionNotice";
import { updatePrivacyConsent } from "../services/privacyConsent";

export default function ChatScreen({ navigation, route }) {
  const { data: user } = useSelector(selectUserState);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [chatPartner, setChatPartner] = useState({ name: "Chat", status: "..." });
  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const roomIdRef = useRef(null);

  const { orderId, room: roomType } = route.params || {};

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const roomEndpoint = orderId ? `/api/chats/orders/${orderId}` : "/api/chats/support";

        const res = await apiRequest(roomEndpoint);
        const room = res.data || res;
        if (!mounted) return;

        setRoomId(room.id);
        roomIdRef.current = room.id;
        setChatPartner({
          name: room.name || `Order #${orderId?.slice(-6) || ""}` || "Chat",
          status: "Online",
        });

        const msgRes = await apiRequest(`/api/chats/rooms/${room.id}/messages`);
        setMessages(msgRes.data || []);
      } catch (err) {
        Alert.alert("Chat unavailable", err.message || "Could not open this chat");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    socketRef.current = connectSocket();
    const cleanupMsg = onSocketMessage((payload) => {
      const message = payload?.message || payload;
      if (!message?.roomId || message.roomId !== roomIdRef.current) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        const withoutTemp = payload?.clientId
          ? prev.filter((item) => item.clientId !== payload.clientId)
          : prev;
        return [...withoutTemp, message];
      });
    });

    return () => {
      mounted = false;
      cleanupMsg();
      disconnectSocket();
    };
  }, [orderId]);

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
    const clientId = `temp-${Date.now()}`;
    setInput("");

    const tempMsg = {
      id: clientId,
      clientId,
      roomId,
      text,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    sendSocketMessage({ roomId, text, clientId }, (result) => {
      if (!result?.ok) {
        setMessages((prev) => prev.filter((message) => message.clientId !== clientId));
        Alert.alert("Message not sent", result?.message || "Please try again");
      }
    });
  };
  const handlePickImage = async () => {
    if (!roomId || uploadingImage) return;
    try {
      const shouldAsk = await explainPermission({ title: "Gallery permission", message: permissionMessages.gallery });
      if (!shouldAsk) return;
      updatePrivacyConsent({ media: true });
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Allow photo access to send an image in chat.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.65,
        base64: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.base64) throw new Error("Could not read the selected image");

      setUploadingImage(true);
      const uploadResponse = await apiRequest(`/api/chats/rooms/${roomId}/images`, {
        method: "POST",
        data: { dataUrl: `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}` },
      });
      const uploaded = uploadResponse.data || uploadResponse;
      if (!uploaded?.url) throw new Error("Image upload did not return a URL");

      const clientId = `image-${Date.now()}`;
      setMessages((prev) => [...prev, {
        id: clientId,
        clientId,
        roomId,
        imageUrl: uploaded.url,
        senderId: user?.id,
        createdAt: new Date().toISOString(),
      }]);
      sendSocketMessage({ roomId, imageUrl: uploaded.url, clientId }, (response) => {
        if (!response?.ok) {
          setMessages((prev) => prev.filter((message) => message.clientId !== clientId));
          Alert.alert("Image not sent", response?.message || "Please try again");
        }
      });
    } catch (err) {
      Alert.alert("Image not sent", err.response?.data?.message || err.message || "Please try again");
    } finally {
      setUploadingImage(false);
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
    const isMe = item.senderId === user?.id || item.sender?.id === user?.id || item.sender === "customer";
    return (
      <View className={`max-w-[80%] ${isMe ? "self-end" : "self-start"}`}>
        <View className={`rounded-2xl px-4 py-3 ${isMe ? "bg-indigo-600" : "bg-slate-100"}`}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} className="mb-2 h-48 w-56 rounded-xl" resizeMode="cover" />
          ) : null}
          {item.text ? (
            <Text className={`text-sm ${isMe ? "text-white" : "text-slate-900"}`}>
              {item.text}
            </Text>
          ) : null}
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 16, gap: 8 }}
        renderItem={renderMessage}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View className="px-4 py-3 border-t border-slate-100 bg-white">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={uploadingImage || !roomId}
            className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
          >
            {uploadingImage ? <ActivityIndicator size="small" color={colors.brand[600]} /> : <ImagePlus size={18} color={colors.brand[600]} />}
          </TouchableOpacity>          <TextInput
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

