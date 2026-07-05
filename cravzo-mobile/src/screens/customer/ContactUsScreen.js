import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { ChevronLeft, Mail, Phone, Globe } from "lucide-react-native";
import { colors } from "../../constants/colors";

export default function ContactUsScreen({ navigation }) {
  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Contact Us</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <Text className="text-lg font-extrabold text-slate-900 mb-2">Get in Touch</Text>
          <Text className="text-sm text-slate-500 mb-6">
            Have a question, feedback, or need help? We're here for you.
          </Text>
          <View className="space-y-4">
            <TouchableOpacity onPress={() => Linking.openURL("mailto:support@dodago.shop")}
              className="flex-row items-center gap-4 py-3 border-b border-slate-100">
              <View className="h-10 w-10 rounded-xl bg-indigo-50 items-center justify-center">
                <Mail size={20} color={colors.brand[600]} />
              </View>
              <View>
                <Text className="font-bold text-slate-900">Email</Text>
                <Text className="text-sm text-slate-500">support@dodago.shop</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL("tel:+919876543210")}
              className="flex-row items-center gap-4 py-3 border-b border-slate-100">
              <View className="h-10 w-10 rounded-xl bg-emerald-50 items-center justify-center">
                <Phone size={20} color="#059669" />
              </View>
              <View>
                <Text className="font-bold text-slate-900">Phone</Text>
                <Text className="text-sm text-slate-500">+91 98765 43210</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL("https://dodago.shop")}
              className="flex-row items-center gap-4 py-3">
              <View className="h-10 w-10 rounded-xl bg-amber-50 items-center justify-center">
                <Globe size={20} color="#d97706" />
              </View>
              <View>
                <Text className="font-bold text-slate-900">Website</Text>
                <Text className="text-sm text-slate-500">www.dodago.shop</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-8">
          <Text className="font-bold text-slate-900 mb-2">Response Time</Text>
          <Text className="text-sm text-slate-500">
            We typically respond within 24 hours during business days. For urgent issues, please use the support chat in your account.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
