import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Linking,
} from "react-native";
import { ChevronLeft, Phone, Mail, MessageCircle, Headphones } from "lucide-react-native";
import { colors } from "../../constants/colors";

export default function ContactsScreen({ navigation }) {
  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Support</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <Text className="text-lg font-extrabold text-slate-900 mb-2">Need Help?</Text>
          <Text className="text-sm text-slate-500 mb-6">
            We're here to support you. Choose a contact method below.
          </Text>
          <View className="space-y-4">
            <TouchableOpacity onPress={() => navigation.navigate("RiderTabs", { screen: "Chat" })}
              className="flex-row items-center gap-4 py-3 border-b border-slate-100">
              <View className="h-12 w-12 rounded-xl bg-indigo-50 items-center justify-center">
                <MessageCircle size={24} color={colors.brand[600]} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-900">Live Chat</Text>
                <Text className="text-sm text-slate-500">Chat with our support team</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL("tel:+919876543210")}
              className="flex-row items-center gap-4 py-3 border-b border-slate-100">
              <View className="h-12 w-12 rounded-xl bg-emerald-50 items-center justify-center">
                <Phone size={24} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-900">Phone</Text>
                <Text className="text-sm text-slate-500">+91 98765 43210</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL("mailto:support@dodago.shop")}
              className="flex-row items-center gap-4 py-3">
              <View className="h-12 w-12 rounded-xl bg-amber-50 items-center justify-center">
                <Mail size={24} color="#d97706" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-900">Email</Text>
                <Text className="text-sm text-slate-500">support@dodago.shop</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-8">
          <View className="flex-row items-center gap-3 mb-3">
            <Headphones size={20} color={colors.brand[600]} />
            <Text className="font-bold text-slate-900">Response Time</Text>
          </View>
          <Text className="text-sm text-slate-600 leading-6">
            Our support team typically responds within 2 hours during business hours (9 AM - 9 PM). 
            For urgent delivery issues, please use the live chat for fastest response.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
