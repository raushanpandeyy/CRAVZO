import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform,
} from "react-native";
import { Send, ChevronLeft, MessageCircle } from "lucide-react-native";
import { colors } from "../constants/colors";

const sampleMessages = [
  { id: "1", text: "Hi! I'm outside your location.", sender: "rider", time: "7:25 PM" },
  { id: "2", text: "Okay, I'm coming down.", sender: "customer", time: "7:26 PM" },
  { id: "3", text: "Please bring change for ₹500.", sender: "customer", time: "7:27 PM" },
  { id: "4", text: "Sure, I have change.", sender: "rider", time: "7:27 PM" },
];

export default function ChatScreen({ navigation, route }) {
  const [messages] = useState(sampleMessages);
  const [input, setInput] = useState("");

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <View className="bg-white shadow-sm pt-14 pb-3 px-4 border-b border-slate-100">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <View className="h-10 w-10 rounded-full bg-indigo-100 items-center justify-center">
            <MessageCircle size={20} color={colors.brand[600]} />
          </View>
          <View>
            <Text className="font-extrabold text-slate-900">Rider Vikram</Text>
            <Text className="text-xs text-emerald-600">Online</Text>
          </View>
        </View>
      </View>

      <FlatList
        className="flex-1 px-4"
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 16, gap: 8 }}
        renderItem={({ item }) => (
          <View className={`max-w-[80%] ${item.sender === "customer" ? "self-end" : "self-start"}`}>
            <View className={`rounded-2xl px-4 py-3 ${item.sender === "customer" ? "bg-indigo-600" : "bg-slate-100"}`}>
              <Text className={`text-sm ${item.sender === "customer" ? "text-white" : "text-slate-900"}`}>
                {item.text}
              </Text>
            </View>
            <Text className={`text-[10px] text-slate-400 mt-1 ${item.sender === "customer" ? "text-right" : "text-left"}`}>
              {item.time}
            </Text>
          </View>
        )}
      />

      <View className="px-4 py-3 border-t border-slate-100 bg-white">
        <View className="flex-row items-center gap-2">
          <TextInput
            className="flex-1 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm"
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity className="h-11 w-11 items-center justify-center rounded-full bg-indigo-600">
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
