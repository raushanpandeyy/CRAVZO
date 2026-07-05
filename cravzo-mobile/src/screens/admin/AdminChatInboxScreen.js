import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import {
  MessageCircle, ChevronRight, ChevronLeft, User, Store, RefreshCw,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { apiRequest } from "../../services/api";

export default function AdminChatInboxScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/chats/admin/rooms");
      setRooms(res.data || []);
    } catch (err) {
      console.error("Chat inbox load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Support Inbox</Text>
          <TouchableOpacity onPress={load}><RefreshCw size={18} color={colors.brand[600]} /></TouchableOpacity>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        {loading ? (
          <ActivityIndicator size="large" color={colors.brand[600]} style={{ marginTop: 20 }} />
        ) : rooms.length === 0 ? (
          <View className="items-center py-20">
            <MessageCircle size={48} color="#94a3b8" />
            <Text className="text-base font-bold text-slate-500 mt-4">No conversations</Text>
            <Text className="text-sm text-slate-400 mt-1">Support requests will appear here</Text>
          </View>
        ) : (
          <View className="space-y-3 pb-8">
            {rooms.map((room) => (
              <TouchableOpacity key={room.id}
                onPress={() => navigation.navigate("AdminChat", { roomId: room.id, title: room.name })}
                className="bg-white rounded-3xl p-4 shadow-sm">
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 rounded-xl bg-indigo-50 items-center justify-center">
                    <MessageCircle size={22} color={colors.brand[600]} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-bold text-slate-900">{room.name || "Chat"}</Text>
                      <Text className="text-[10px] text-slate-400">
                        {room.lastMessageAt ? new Date(room.lastMessageAt).toLocaleDateString() : ""}
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                      {room.lastMessage || "No messages yet"}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View className="rounded-full px-2 py-0.5 bg-slate-100">
                        <Text className="text-[9px] font-bold text-slate-600 capitalize">{room.type || "support"}</Text>
                      </View>
                      {room.unread > 0 && (
                        <View className="rounded-full px-2 py-0.5 bg-rose-500">
                          <Text className="text-[9px] font-bold text-white">{room.unread} new</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.slate[400]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
