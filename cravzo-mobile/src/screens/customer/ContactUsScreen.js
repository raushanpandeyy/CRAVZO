import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { ChevronLeft, Mail, Phone, Globe } from "lucide-react-native";
import { colors } from "../../constants/colors";

const ContactRow = ({ icon: Icon, label, value, hint, color, onPress }) => (
  <TouchableOpacity onPress={onPress} className="flex-row items-center gap-4 py-3 border-b border-slate-100">
    <View className="h-10 w-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${color}15` }}>
      <Icon size={20} color={color} />
    </View>
    <View className="flex-1">
      <Text className="font-bold text-slate-900">{label}</Text>
      <Text className="text-sm text-slate-700 font-semibold">{value}</Text>
      {hint ? <Text className="text-xs text-slate-400 mt-0.5">{hint}</Text> : null}
    </View>
  </TouchableOpacity>
);

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

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero */}
        <View className="bg-indigo-700 rounded-3xl p-6 mb-4">
          <Text className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-1">We are here to help</Text>
          <Text className="text-2xl font-black text-white mb-2">Get in Touch</Text>
          <Text className="text-sm text-indigo-100 leading-5">
            Have a question, feedback, or need help with your order? Reach us through any of the channels below.
          </Text>
        </View>

        {/* Contact details */}
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <Text className="text-base font-extrabold text-slate-900 mb-4">Contact Details</Text>
          <ContactRow
            icon={Mail}
            label="Email Support"
            value="yushpandey3@gmail.com"
            hint="General support and grievance requests"
            color="#4f46e5"
            onPress={() => Linking.openURL("mailto:yushpandey3@gmail.com?subject=Dodago%20Support%20Request")}
          />
          <ContactRow
            icon={Phone}
            label="Raushan Pandey"
            value="+91 9984185916"
            hint="Primary support · Mon–Sat 9 AM–9 PM"
            color="#059669"
            onPress={() => Linking.openURL("tel:+919984185916")}
          />
          <ContactRow
            icon={Phone}
            label="Yash Chauhan"
            value="+91 8527879902"
            hint="Secondary support · Mon–Sat 10 AM–6 PM"
            color="#059669"
            onPress={() => Linking.openURL("tel:+918527879902")}
          />
          <ContactRow
            icon={Globe}
            label="Website"
            value="www.dodago.shop"
            hint=""
            color="#d97706"
            onPress={() => Linking.openURL("https://dodago.shop")}
          />
        </View>

        {/* Support hours */}
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <Text className="font-extrabold text-slate-900 mb-3">Support Hours</Text>
          <Text className="text-sm text-slate-600 mb-1">Monday – Friday: 9:00 AM – 9:00 PM</Text>
          <Text className="text-sm text-slate-600">Saturday – Sunday: 10:00 AM – 6:00 PM</Text>
        </View>

        {/* Grievance Officer */}
        <View className="bg-indigo-50 rounded-3xl p-6 shadow-sm mb-4 border border-indigo-100">
          <Text className="font-extrabold text-indigo-900 mb-3">Grievance Officer</Text>
          <Text className="text-sm text-indigo-800 font-bold mb-1">Name: Raushan Pandey</Text>
          <TouchableOpacity onPress={() => Linking.openURL("tel:+919984185916")}>
            <Text className="text-sm text-indigo-700 font-bold mb-1">Contact: +91 9984185916</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("mailto:yushpandey3@gmail.com")}>
            <Text className="text-sm text-indigo-700 font-bold mb-3">Email: yushpandey3@gmail.com</Text>
          </TouchableOpacity>
          <Text className="text-xs text-indigo-600 leading-5">
            As per India's Digital Personal Data Protection Act, 2023, you may submit grievances related to personal data processing. We aim to respond within 30 days of receipt.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}
