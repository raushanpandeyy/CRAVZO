import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import {
  Store, Bike, CheckCircle, XCircle, ChevronLeft, RefreshCw,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getPendingVendors, approveVendor, getPendingRiders, approveRider } from "../../services/adminService";

export default function AdminPendingScreen({ navigation }) {
  const [tab, setTab] = useState("vendors");
  const [vendors, setVendors] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, r] = await Promise.all([getPendingVendors(), getPendingRiders()]);
      setVendors(v);
      setRiders(r);
    } catch (err) {
      console.error("Pending load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id, type) => {
    try {
      if (type === "vendor") {
        await approveVendor(id);
        setVendors((prev) => prev.filter((v) => v.id !== id));
      } else {
        await approveRider(id);
        setRiders((prev) => prev.filter((r) => r.id !== id));
      }
      Alert.alert("Approved", `${type === "vendor" ? "Vendor" : "Rider"} approved successfully`);
    } catch { Alert.alert("Error", "Failed to approve"); }
  };

  const items = tab === "vendors" ? vendors : riders;

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Pending Approvals</Text>
          <TouchableOpacity onPress={load}><RefreshCw size={18} color={colors.brand[600]} /></TouchableOpacity>
        </View>
        <View className="flex-row gap-2 mt-4">
          {["vendors", "riders"].map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              className={`rounded-full px-6 py-2 ${tab === t ? "bg-indigo-600" : "bg-white border border-slate-200"}`}>
              <Text className={`text-xs font-extrabold capitalize ${tab === t ? "text-white" : "text-slate-700"}`}>
                {t} ({t === "vendors" ? vendors.length : riders.length})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        {loading ? (
          <ActivityIndicator size="large" color={colors.brand[600]} style={{ marginTop: 20 }} />
        ) : items.length === 0 ? (
          <View className="items-center py-20">
            {tab === "vendors" ? <Store size={48} color="#94a3b8" /> : <Bike size={48} color="#94a3b8" />}
            <Text className="text-base font-bold text-slate-500 mt-4">No pending {tab}</Text>
            <Text className="text-sm text-slate-400 mt-1">All {tab} have been reviewed</Text>
          </View>
        ) : (
          <View className="space-y-3 pb-8">
            {items.map((item) => (
              <View key={item.id} className="bg-white rounded-3xl p-4 shadow-sm">
                <View className="flex-row items-center gap-3">
                  <View className={`h-12 w-12 rounded-xl items-center justify-center ${tab === "vendors" ? "bg-amber-50" : "bg-emerald-50"}`}>
                    {tab === "vendors" ? <Store size={24} color="#d97706" /> : <Bike size={24} color="#059669" />}
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-900">{item.name || item.user?.name}</Text>
                    <Text className="text-xs text-slate-500">{item.email || item.user?.email}</Text>
                    <Text className="text-xs text-slate-400 mt-0.5">{item.phone || item.user?.phone}</Text>
                  </View>
                  <View className="gap-2">
                    <TouchableOpacity onPress={() => handleApprove(item.id, tab === "vendors" ? "vendor" : "rider")}
                      className="flex-row items-center gap-1 h-9 px-4 rounded-xl bg-emerald-500">
                      <CheckCircle size={14} color="#fff" />
                      <Text className="text-xs font-extrabold text-white">Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {tab === "vendors" && item.restaurant && (
                  <View className="mt-2 pt-2 border-t border-slate-100">
                    <Text className="text-xs text-slate-500">Restaurant: {item.restaurant.name}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
