import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { ChevronLeft, Shield } from "lucide-react-native";
import { colors } from "../../constants/colors";

const sections = [
  {
    title: "Information We Collect",
    content: "We collect information you provide directly, such as your name, email address, phone number, delivery address, and payment details. We also automatically collect information about your device and usage of our services."
  },
  {
    title: "How We Use Your Information",
    content: "We use your information to process orders, facilitate deliveries, improve our services, send notifications about your orders, and provide customer support. We may also send promotional communications with your consent."
  },
  {
    title: "Data Sharing",
    content: "We share your information with restaurants to fulfill orders, with delivery partners for pickup and delivery, and with payment processors to handle transactions. We do not sell your personal information to third parties."
  },
  {
    title: "Data Security",
    content: "We implement industry-standard security measures to protect your data, including encryption in transit and at rest, regular security audits, and strict access controls."
  },
  {
    title: "Your Rights",
    content: "You have the right to access, update, or delete your personal information. You can manage your data through your account settings or by contacting our support team."
  },
  {
    title: "Contact",
    content: "For privacy-related inquiries, please contact us at privacy@dodago.shop."
  }
];

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Privacy Policy</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-8">
          <View className="flex-row items-center gap-2 mb-4">
            <Shield size={20} color={colors.brand[600]} />
            <Text className="text-lg font-extrabold text-slate-900">Your Privacy Matters</Text>
          </View>
          <Text className="text-sm text-slate-600 leading-6 mb-6">
            Last updated: January 2026. This Privacy Policy describes how DODAGO collects, uses, and protects your personal information.
          </Text>
          {sections.map((section, i) => (
            <View key={section.title} className={`py-4 ${i < sections.length - 1 ? "border-b border-slate-100" : ""}`}>
              <Text className="font-bold text-slate-900 mb-2">{section.title}</Text>
              <Text className="text-sm text-slate-600 leading-5">{section.content}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
