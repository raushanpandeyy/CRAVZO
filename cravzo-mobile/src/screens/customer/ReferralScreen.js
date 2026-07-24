import React, { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, Share, TextInput, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useSelector } from "react-redux";
import { ChevronLeft, Gift, Share2, Users, TicketPercent, ShieldAlert, CheckCircle, Copy } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { selectUserState } from "../../store/selectors";
import { getMyReferralStats, applyReferralCode, buildReferralLink } from "../../services/referralService";

const formatReward = (voucher) => {
  if (voucher?.rewardType === "FREE_DELIVERY") return `Free delivery up to Rs ${Number(voucher.rewardValue || 0)}`;
  if (voucher?.rewardType === "FLAT_DISCOUNT") return `Rs ${Number(voucher.rewardValue || 0)} off`;
  return "Referral reward";
};

const formatDate = (value) => {
  if (!value) return "";
  try { return new Date(value).toLocaleDateString(); } catch { return ""; }
};

export default function ReferralScreen({ navigation }) {
  const { data: user } = useSelector(selectUserState);
  const [stats, setStats] = useState({ referralCode: "", verifiedReferrals: 0, qualifiedReferrals: 0, suspectReferrals: 0, vouchers: [], milestonesConfig: [] });
  const [loading, setLoading] = useState(true);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyReferralStats();
      setStats(data);
    } catch {
      const suffix = (user?.id || "DODAGO").slice(-6).toUpperCase();
      setStats((prev) => ({ ...prev, referralCode: `DODAGO${suffix}` }));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const referralCode = stats.referralCode || "";
  const shareLink = buildReferralLink(referralCode);
  const issuedVouchers = (stats.vouchers || []).filter((v) => v.status === "ISSUED");

  const handleShare = async () => {
    try {
      await Share.share({
        title: "Refer a friend to Dodago",
        message: `Join me on Dodago. Use my referral code: ${referralCode}\n\n${shareLink}`,
      });
    } catch {}
  };

  const handleApply = async () => {
    const code = applyCode.trim().toUpperCase();
    if (!code) return Alert.alert("Enter Code", "Please enter a referral code to apply.");
    setApplying(true);
    try {
      await applyReferralCode(code);
      setApplyCode("");
      await loadStats();
      Alert.alert("Referral applied", "Your referral is linked. Rewards unlock after eligibility checks.");
    } catch (err) {
      Alert.alert("Could not apply code", err.message || "Please try again");
    } finally {
      setApplying(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F4F7FB]">
      <View className="bg-indigo-950 pt-14 pb-5 px-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color="#fff" /></TouchableOpacity>
        <Text className="text-xl font-extrabold text-white">Refer & Earn</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="rounded-3xl bg-white p-6 shadow-sm mb-5">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100"><Gift size={24} color={colors.indigo[700]} /></View>
            <View className="flex-1">
              <Text className="text-xl font-black text-slate-900">Invite friends, unlock vouchers</Text>
              <Text className="text-sm text-slate-500 mt-1">Rewards are issued after verified signups and first paid orders.</Text>
            </View>
          </View>
          <Text className="text-sm font-bold text-slate-500 mb-2">Your Referral Code</Text>
          <View className="bg-indigo-50 rounded-2xl border-2 border-dashed border-indigo-300 py-4 px-4 mb-4">
            {loading ? <ActivityIndicator color={colors.indigo[600]} /> : <Text className="text-3xl font-black text-center tracking-[5px] text-indigo-700">{referralCode}</Text>}
          </View>
          <TouchableOpacity onPress={handleShare} disabled={!referralCode} className="flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 disabled:opacity-50">
            <Share2 size={20} color="#fff" />
            <Text className="text-base font-extrabold text-white">Share Code</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm"><Users size={20} color="#4f46e5" /><Text className="mt-2 text-2xl font-black text-slate-900">{stats.verifiedReferrals || 0}</Text><Text className="text-xs text-slate-500">Verified</Text></View>
          <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm"><CheckCircle size={20} color="#059669" /><Text className="mt-2 text-2xl font-black text-slate-900">{stats.qualifiedReferrals || 0}</Text><Text className="text-xs text-slate-500">Qualified</Text></View>
          <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm"><ShieldAlert size={20} color="#d97706" /><Text className="mt-2 text-2xl font-black text-slate-900">{stats.suspectReferrals || 0}</Text><Text className="text-xs text-slate-500">Review</Text></View>
        </View>

        <View className="rounded-3xl bg-white p-5 shadow-sm mb-5">
          <View className="flex-row items-center gap-2 mb-3"><TicketPercent size={18} color={colors.brand[700]} /><Text className="text-base font-extrabold text-slate-900">Your vouchers</Text></View>
          {issuedVouchers.length ? issuedVouchers.map((voucher) => (
            <View key={voucher.voucherCode} className="mb-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <Text className="text-xs font-black uppercase text-indigo-700">{formatReward(voucher)}</Text>
              <View className="mt-2 flex-row items-center justify-between gap-3">
                <Text className="text-xl font-black tracking-[3px] text-indigo-950">{voucher.voucherCode}</Text>
                <Copy size={18} color={colors.indigo[700]} />
              </View>
              {voucher.expiresAt ? <Text className="mt-1 text-xs text-indigo-700">Expires {formatDate(voucher.expiresAt)}</Text> : null}
            </View>
          )) : <Text className="text-sm text-slate-500">No active vouchers yet.</Text>}
        </View>

        <View className="rounded-3xl bg-white p-5 shadow-sm mb-5">
          <Text className="text-base font-extrabold text-slate-900 mb-3">Apply a friend's referral code</Text>
          <View className="flex-row gap-2">
            <TextInput value={applyCode} onChangeText={setApplyCode} autoCapitalize="characters" placeholder="Enter referral code" placeholderTextColor={colors.slate[400]} className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900" />
            <TouchableOpacity onPress={handleApply} disabled={applying || !applyCode.trim()} className="items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 disabled:opacity-50">
              {applying ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-sm font-extrabold text-white">Apply</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {(stats.milestonesConfig || []).length ? (
          <View className="rounded-3xl bg-indigo-50 p-5">
            <Text className="text-base font-extrabold text-indigo-950 mb-3">Milestones</Text>
            {stats.milestonesConfig.map((tier) => (
              <View key={tier.tier} className="mb-3 rounded-2xl bg-white/80 p-4">
                <Text className="font-black text-slate-900">Tier {tier.tier}: {tier.label || formatReward(tier)}</Text>
                <Text className="mt-1 text-xs text-slate-500">Need {tier.requiredReferrals || tier.threshold || 0} qualified referrals</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
