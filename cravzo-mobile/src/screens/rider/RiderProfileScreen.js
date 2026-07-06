import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import OptimizedImage from "../../components/OptimizedImage";
import {
  Bike, Star, IndianRupee, MessageCircle,
  ChevronRight, LogOut, User,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getMyProfile } from "../../services/riderService";
import { getRiderOrders } from "../../services/riderService";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../store/slices/userSlice";

const menuItems = [
  { icon: Star, label: "Reviews", color: "#f59e0b", screen: "RiderMyReviews" },
  { icon: IndianRupee, label: "Earnings", color: "#10b981", screen: "Earnings" },
  { icon: MessageCircle, label: "Support Chat", color: "#8b5cf6", screen: "Contacts" },
  { icon: Bike, label: "Delivery History", color: "#6366f1", screen: "DeliveryHistory" },
];

const editItem = { icon: Bike, label: "Edit Profile", color: colors.brand[600], screen: "RiderEditProfile" };

export default function RiderProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [prof, orderRes] = await Promise.all([
          getMyProfile(),
          getRiderOrders(),
        ]);
        setProfile(prof);
        setOrders(orderRes.orders || []);
      } catch (err) {
        console.error("Rider profile load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => {
        dispatch(logoutUser());
      }},
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F5F5] items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  const p = profile || {};
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const totalEarnings = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

  return (
    <ScrollView className="flex-1 bg-[#F5F5F5]">
      <View className="bg-indigo-950 pt-16 pb-8 px-4 rounded-b-[28px]">
        <View className="items-center">
          <View className="h-20 w-20 rounded-full bg-amber-500 items-center justify-center mb-3 border-2 border-amber-300 overflow-hidden">
            {p.avatarUrl ? (
              <OptimizedImage source={{ uri: p.avatarUrl }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <User size={32} color="#fff" />
            )}
          </View>
          <Text className="text-xl font-extrabold text-white">{p.name || "Rider"}</Text>
          <Text className="text-sm text-indigo-200 mt-1">{p.email || ""}</Text>
          <View className="flex-row items-center gap-1 mt-2 bg-amber-500/20 rounded-full px-3 py-1">
            <Bike size={12} color="#fbbf24" />
            <Text className="text-xs font-bold text-amber-300">Rider</Text>
          </View>
        </View>
        <View className="flex-row gap-4 mt-6">
          <View className="flex-1 bg-white/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-extrabold text-white">{p.rating || "0"}</Text>
            <Text className="text-xs text-indigo-200">Rating</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-extrabold text-white">{deliveredCount}</Text>
            <Text className="text-xs text-indigo-200">Deliveries</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-xl p-3 items-center">
            <Text className="text-2xl font-extrabold text-white">₹{totalEarnings}</Text>
            <Text className="text-xs text-indigo-200">Earned</Text>
          </View>
        </View>
      </View>
      <View className="px-4 -mt-4">
        <View className="bg-white rounded-3xl p-2 shadow-sm">
          {menuItems.map((item, i) => (
            <TouchableOpacity key={item.label} onPress={() => navigation.navigate(item.screen)}
              className={`flex-row items-center gap-4 px-4 py-4 ${i < menuItems.length - 1 ? "border-b border-slate-100" : ""}`}>
              <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}15` }}>
                <item.icon size={20} color={item.color} />
              </View>
              <Text className="flex-1 font-bold text-slate-900">{item.label}</Text>
              <ChevronRight size={18} color={colors.slate[400]} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity key={editItem.label} onPress={() => navigation.navigate(editItem.screen)}
          className="flex-row items-center gap-4 bg-white rounded-3xl px-4 py-4 mt-4 shadow-sm"
          style={{ borderLeftWidth: 3, borderLeftColor: colors.brand[600] }}>
          <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${editItem.color}15` }}>
            <editItem.icon size={20} color={editItem.color} />
          </View>
          <Text className="flex-1 font-bold text-slate-900">{editItem.label}</Text>
          <ChevronRight size={18} color={colors.slate[400]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} className="flex-row items-center gap-4 bg-white rounded-3xl p-4 shadow-sm mt-4 mb-8">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
            <LogOut size={20} color={colors.red[600]} />
          </View>
          <Text className="font-extrabold text-rose-600">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
