import { selectUserState } from "../store/selectors";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Keyboard,
} from "react-native";
import { Send, ChevronLeft, MessageCircle, ImagePlus, Navigation, MapPin } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { MIN_BOTTOM_BAR_PADDING, MIN_DEVICE_NAV_GAP } from "../constants/layout";
import { connectSocket, disconnectSocket, joinChatRoom, leaveChatRoom, sendSocketMessage, onSocketMessage } from "../services/chatSocket";
import { apiRequest } from "../services/api";
import { useSelector } from "react-redux";
import { explainPermission, permissionMessages } from "../services/permissionNotice";
import { updatePrivacyConsent } from "../services/privacyConsent";
import { getCurrentAddress } from "../services/locationAddressService";

const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=";
const getMapUrl = (text = "") => text.match(/https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=[^\s]+/)?.[0] || "";

export default function ChatScreen({ navigation, route }) {
  const { data: user } = useSelector(selectUserState);
  const insets = useSafeAreaInsets();
  const inputBottomPadding = Math.max(insets.bottom + MIN_DEVICE_NAV_GAP, MIN_BOTTOM_BAR_PADDING);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [chatPartner, setChatPartner] = useState({ name: "Chat", status: "..." });
  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const roomIdRef = useRef(null);

  const { mode, orderId: routeOrderId } = route.params || {};
  const isSupportChat = mode === "support";
  const orderId = isSupportChat ? null : routeOrderId;

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setMessages([]);
    setRoomId(null);
    roomIdRef.current = null;
    setChatPartner({ name: isSupportChat ? "Support Chat" : "Chat", status: "..." });

    const init = async () => {
      try {
        const roomEndpoint = orderId ? `/api/chats/orders/${orderId}` : "/api/chats/support";

        const res = await apiRequest(roomEndpoint);
        const room = res.data || res;
        if (!mounted) return;

        setRoomId(room.id);
        roomIdRef.current = room.id;
        setChatPartner({
          name: room.name || (isSupportChat ? "Support Chat" : `Order #${orderId?.slice(-6) || ""}`) || "Chat",
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
  }, [isSupportChat, orderId]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    });
    return () => showSub.remove();
  }, []);

  useEffect(() => {
    if (roomId) {
      joinChatRoom(roomId);
    }
    return () => {
      if (roomId) leaveChatRoom(roomId);
    };
  }, [roomId]);

  const sendViaSocket = useCallback((payload) => new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, timeout: true, message: "Chat connection timed out" });
    }, 6000);

    const sent = sendSocketMessage(payload, (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result || { ok: false, message: "Message not sent" });
    });

    if (!sent) {
      settled = true;
      clearTimeout(timer);
      resolve({ ok: false, disconnected: true, message: "Chat connection unavailable" });
    }
  }), []);

  const queueOutgoingMessage = useCallback(async ({ text = "", imageUrl = "", clientIdPrefix = "temp" }) => {
    if (!roomId) return;
    const clientId = `${clientIdPrefix}-${Date.now()}`;
    const tempMsg = {
      id: clientId,
      clientId,
      roomId,
      text: text || null,
      imageUrl: imageUrl || null,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const socketResult = await sendViaSocket({ roomId, text, imageUrl, clientId });
      if (socketResult?.ok) {
        if (socketResult.message) {
          setMessages((prev) => prev.map((message) => (message.clientId === clientId ? socketResult.message : message)));
        }
        return;
      }

      if (socketResult?.disconnected || socketResult?.timeout) {
        const response = await apiRequest(`/api/chats/rooms/${roomId}/messages`, {
          method: "POST",
          data: { text: text || undefined, imageUrl: imageUrl || undefined },
        });
        const saved = response.data || response;
        setMessages((prev) => prev.map((message) => (message.clientId === clientId ? saved : message)));
        return;
      }

      throw new Error(socketResult?.message || "Please try again");
    } catch (err) {
      setMessages((prev) => prev.filter((message) => message.clientId !== clientId));
      Alert.alert("Message not sent", err.response?.data?.message || err.message || "Please try again");
    }
  }, [roomId, sendViaSocket, user?.id]);

  const handleSend = async () => {
    if (!input.trim() || !roomId) return;
    const text = input.trim();
    setInput("");
    await queueOutgoingMessage({ text });
  };

  const handleShareLocation = async () => {
    if (!roomId || sharingLocation) return;
    try {
      const shouldAsk = await explainPermission({ title: "Location permission", message: permissionMessages.location });
      if (!shouldAsk) return;
      setSharingLocation(true);
      updatePrivacyConsent({ location: true });
      const loc = await getCurrentAddress();
      const mapUrl = `${GOOGLE_MAPS_URL}${loc.latitude},${loc.longitude}`;
      const label = [loc.line1, loc.line2, loc.city].filter(Boolean).join(", ");
      await queueOutgoingMessage({
        text: `My current location${label ? `: ${label}` : ""}\n${mapUrl}`,
        clientIdPrefix: "location",
      });
    } catch (err) {
      Alert.alert("Location not shared", err.message || "Could not get your current location.");
    } finally {
      setSharingLocation(false);
    }
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

      await queueOutgoingMessage({ imageUrl: uploaded.url, clientIdPrefix: "image" });
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
    const mapUrl = getMapUrl(item.text || "");
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
          {mapUrl ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(mapUrl)}
              className={`mt-3 flex-row items-center justify-center gap-2 rounded-xl px-3 py-2 ${isMe ? "bg-white/20" : "bg-white"}`}
            >
              <MapPin size={15} color={isMe ? "#fff" : colors.brand[600]} />
              <Text className={`text-xs font-black ${isMe ? "text-white" : "text-indigo-700"}`}>Open location</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text className={`text-[10px] text-slate-400 mt-1 ${isMe ? "text-right" : "text-left"}`}>
          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
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
        contentContainerStyle={{ paddingTop: 16, paddingBottom: inputBottomPadding + 24, gap: 8 }}
        renderItem={renderMessage}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={9}
        removeClippedSubviews={Platform.OS === "android"}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
      />

      <View className="border-t border-slate-100 bg-white px-4 pt-3" style={{ paddingBottom: inputBottomPadding }}>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={handleShareLocation}
            disabled={sharingLocation || !roomId}
            className="h-11 w-11 items-center justify-center rounded-full bg-emerald-50"
          >
            {sharingLocation ? <ActivityIndicator size="small" color="#059669" /> : <Navigation size={18} color="#059669" />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={uploadingImage || !roomId}
            className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
          >
            {uploadingImage ? <ActivityIndicator size="small" color={colors.brand[600]} /> : <ImagePlus size={18} color={colors.brand[600]} />}
          </TouchableOpacity>
          <TextInput
            className="flex-1 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm"
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            onFocus={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 250)}
          />
          <TouchableOpacity onPress={handleSend} disabled={!roomId || !input.trim()} className="h-11 w-11 items-center justify-center rounded-full bg-indigo-600 disabled:bg-slate-300">
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
