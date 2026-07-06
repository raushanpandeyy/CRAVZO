import React from "react";
import { View, Text, TouchableOpacity, Share } from "react-native";
import { useSelector } from "react-redux";
import { ChevronLeft, Gift, Share2, Users } from "lucide-react-native";
import { colors } from "../../constants/colors";

const generateReferralCode = (userId) => {
  if (!userId) return "DODAGO2024";
  const suffix = userId.slice(-6).toUpperCase();
  return `DODAGO${suffix}`;
};

export default function ReferralScreen({ navigation }) {
  const { data: user } = useSelector((state) => state.user);
  const referralCode = generateReferralCode(user?.id);
  const shareLink = `https://dodago.app/refer/${referralCode}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Dodago and get ₹100 off your first order! Use my referral code: ${referralCode}\n\nDownload the app: ${shareLink}`,
        title: "Refer a friend to Dodago",
      });
    } catch {}
  };

  return (
    <View className="flex-1 bg-[#F4F7FB]">
      <View className="bg-indigo-950 pt-14 pb-5 px-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#fff" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-white">Refer & Earn</Text>
      </View>

      <View className="flex-1 px-4 pt-6">
        <View className="items-center mb-8">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-4">
            <Gift size={36} color="#dc2626" />
          </View>
          <Text className="text-2xl font-black text-slate-900 text-center">
            Refer a friend & earn ₹100
          </Text>
          <Text className="text-sm text-slate-500 text-center mt-2 leading-5">
            Share your referral code with friends. When they sign up and place
            their first order, you both get ₹100 credit!
          </Text>
        </View>

        <View className="rounded-3xl bg-white p-6 shadow-sm mb-6">
          <Text className="text-sm font-bold text-slate-500 mb-2">
            Your Referral Code
          </Text>
          <View className="bg-indigo-50 rounded-2xl border-2 border-dashed border-indigo-300 py-4 px-6 mb-4">
            <Text className="text-3xl font-black text-center tracking-[6px] text-indigo-700">
              {referralCode}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleShare}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200"
          >
            <Share2 size={20} color="#fff" />
            <Text className="text-base font-extrabold text-white">
              Share Code
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 mb-2">
              <Users size={20} color="#059669" />
            </View>
            <Text className="text-2xl font-black text-slate-900">0</Text>
            <Text className="text-xs text-slate-500 mt-1">Friends referred</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-100 mb-2">
              <Gift size={20} color="#d97706" />
            </View>
            <Text className="text-2xl font-black text-slate-900">₹0</Text>
            <Text className="text-xs text-slate-500 mt-1">Credit earned</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
