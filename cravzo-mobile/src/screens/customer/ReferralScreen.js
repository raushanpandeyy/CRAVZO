import { selectUserState, selectCurrentUser, selectIsLoggedIn } from "../../store/selectors";
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useSelector } from "react-redux";
import { ChevronLeft, Gift, Share2, Users, Wallet, CheckCircle } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getMyReferralStats, applyReferralCode } from "../../services/referralService";

export default function ReferralScreen({ navigation }) {
  const { data: user } = useSelector(selectUserState);

  const [stats, setStats] = useState({
    referralCode: "",
    friendsReferred: 0,
    creditEarned: 0,
    walletBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyReferralStats();
      setStats(data);
    } catch (err) {
      // Fall back to a deterministic client-side code so the screen still works.
      const suffix = (user?.id || "DODAGO").slice(-6).toUpperCase();
      setStats((prev) => ({
        ...prev,
        referralCode: `DODAGO${suffix}`,
      }));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const referralCode = stats.referralCode || "";
  const shareLink = `https://dodago.shop/refer/${referralCode}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Dodago and get ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹100 off your first order! Use my referral code: ${referralCode}\n\nDownload the app: ${shareLink}`,
        title: "Refer a friend to Dodago",
      });
    } catch {}
  };

  const handleApply = async () => {
    const code = applyCode.trim();
    if (!code) {
      Alert.alert("Enter Code", "Please enter a referral code to apply.");
      return;
    }

    setApplying(true);
    try {
      await applyReferralCode(code);
      Alert.alert("Success", "Referral code applied! ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹100 credited to your wallet.");
      setApplyCode("");
      await loadStats();
    } catch (err) {
      Alert.alert("Could not apply code", err.message || "Please try again");
    } finally {
      setApplying(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F4F7FB]">
      <View className="bg-indigo-950 pt-14 pb-5 px-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#fff" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-white">Refer & Earn</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="items-center mb-8">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-4">
            <Gift size={36} color="#dc2626" />
          </View>
          <Text className="text-2xl font-black text-slate-900 text-center">
            Refer a friend & earn ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹100
          </Text>
          <Text className="text-sm text-slate-500 text-center mt-2 leading-5">
            Share your referral code with friends. When they apply it, you both
            get ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹100 in your Dodago wallet!
          </Text>
        </View>

        <View className="rounded-3xl bg-white p-6 shadow-sm mb-6">
          <Text className="text-sm font-bold text-slate-500 mb-2">
            Your Referral Code
          </Text>
          <View className="bg-indigo-50 rounded-2xl border-2 border-dashed border-indigo-300 py-4 px-6 mb-4">
            {loading ? (
              <ActivityIndicator color={colors.indigo[600]} />
            ) : (
              <Text className="text-3xl font-black text-center tracking-[6px] text-indigo-700">
                {referralCode}
              </Text>
            )}
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

        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 mb-2">
              <Users size={20} color="#059669" />
            </View>
            <Text className="text-2xl font-black text-slate-900">
              {stats.friendsReferred}
            </Text>
            <Text className="text-xs text-slate-500 mt-1">Friends referred</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-100 mb-2">
              <Gift size={20} color="#d97706" />
            </View>
            <Text className="text-2xl font-black text-slate-900">
              ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹{stats.creditEarned}
            </Text>
            <Text className="text-xs text-slate-500 mt-1">Credit earned</Text>
          </View>
        </View>

        <View className="rounded-3xl bg-white p-6 shadow-sm mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Wallet size={18} color={colors.brand[700]} />
            <Text className="text-base font-extrabold text-slate-900">
              Apply a referral code
            </Text>
          </View>
          <Text className="text-sm text-slate-500 mb-3 leading-5">
            Got a code from a friend? Apply it to receive ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹100 in your Dodago
            wallet instantly.
          </Text>
          <View className="flex-row gap-2 mb-3">
            <TextInput
              value={applyCode}
              onChangeText={setApplyCode}
              autoCapitalize="characters"
              placeholder="Enter referral code"
              placeholderTextColor={colors.slate[400]}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900"
            />
            <TouchableOpacity
              onPress={handleApply}
              disabled={applying || !applyCode.trim()}
              className="items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {applying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-sm font-extrabold text-white">Apply</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="rounded-3xl bg-indigo-50 p-5">
          <View className="flex-row items-center gap-2 mb-2">
            <CheckCircle size={18} color={colors.indigo[700]} />
            <Text className="text-sm font-bold text-indigo-900">
              Wallet Balance
            </Text>
          </View>
          <Text className="text-3xl font-black text-indigo-900">
            ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹{stats.walletBalance}
          </Text>
          <Text className="text-xs text-indigo-700 mt-1 leading-5">
            Use your wallet balance at checkout to pay for orders.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
