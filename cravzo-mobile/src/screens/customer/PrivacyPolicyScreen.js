import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ChevronLeft, Shield } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { clearPrivacyConsent } from "../../services/privacyConsent";

const sections = [
  {
    title: "Personal Data We Collect",
    content:
      "Name, email, phone, delivery addresses, profile photo, order details, payment status, support chats, ratings/reviews, device identifiers, app diagnostics, push token, approximate or precise location when you allow it, and images you choose to upload.",
  },
  {
    title: "Purpose of Processing",
    content:
      "We use data to create and secure your account, process orders, route deliveries, show nearby restaurants, process payments/refunds, provide support, prevent fraud/abuse, send order updates, improve reliability, and comply with law.",
  },
  {
    title: "Cookies, Local Storage & Similar Tech",
    content:
      "The mobile app stores login tokens, cart, consent choices, notification token, feedback prompts, and preferences on your device. Web builds may use browser local storage/cookies for the same purposes. Essential storage is needed for the service; marketing consent is optional.",
  },
  {
    title: "Permissions",
    content:
      "Location, notifications, camera, and gallery are optional device permissions. The app asks for the purpose before requesting OS permission. You can deny permissions and change them later from device settings or app profile controls.",
  },
  {
    title: "Sharing",
    content:
      "We share necessary order and delivery data with restaurants, riders, payment processors, cloud hosting, notification providers, support tools, and authorities where legally required. We do not sell your personal data.",
  },
  {
    title: "Your DPDP Rights",
    content:
      "You may request access to information about processing, correction, updating, erasure, grievance redressal, withdrawal of consent, and nomination of another person to exercise rights in case of death or incapacity.",
  },
  {
    title: "Children",
    content:
      "Users under 18 should use Dodago only with verifiable parent or legal guardian consent. Dodago does not knowingly run targeted advertising or behavioural monitoring directed at children.",
  },
  {
    title: "Retention & Deletion",
    content:
      "We keep personal data only while needed for orders, account support, security, accounting, tax, dispute resolution, and legal obligations. You can request deletion from your profile; some records may be retained where law requires.",
  },
  {
    title: "Security",
    content:
      "We use access controls, authentication, encryption in transit, operational safeguards, monitoring, and restricted staff access to protect personal data.",
  },
  {
    title: "Grievance Officer",
    content:
      "Name: Raushan Pandey. Contact: +91 9984185916. Email: yushpandey3@gmail.com. Alternate contact: +91 8527879902 (Yash Chauhan). Include your registered email or phone and a short description of your request. We aim to respond within 30 days as required under India's Digital Personal Data Protection Act, 2023.",
  },
];

export default function PrivacyPolicyScreen({ navigation }) {
  const handleResetConsent = () => {
    Alert.alert(
      "Reset privacy consent?",
      "Dodago will ask you to review and save the privacy consent notice again after you log in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            clearPrivacyConsent();
            Alert.alert("Consent reset", "You will see the privacy consent notice again.");
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white px-4 pb-4 pt-14 shadow-sm">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Privacy Policy</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mb-4 rounded-3xl bg-white p-6 shadow-sm">
          <View className="mb-4 flex-row items-center gap-2">
            <Shield size={20} color={colors.brand[600]} />
            <Text className="text-lg font-extrabold text-slate-900">DPDP Privacy Notice</Text>
          </View>
          <Text className="mb-4 text-sm leading-6 text-slate-600">
            Last updated: 24 July 2026. This notice explains how Dodago collects, uses, shares, stores, and protects customer personal data under India's Digital Personal Data Protection Act, 2023.
          </Text>
          {sections.map((section, i) => (
            <View key={section.title} className={`py-4 ${i < sections.length - 1 ? "border-b border-slate-100" : ""}`}>
              <Text className="mb-2 font-bold text-slate-900">{section.title}</Text>
              <Text className="text-sm leading-5 text-slate-600">{section.content}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={handleResetConsent} className="mb-8 rounded-2xl bg-indigo-600 py-4">
          <Text className="text-center text-sm font-extrabold text-white">Review Consent Again</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
