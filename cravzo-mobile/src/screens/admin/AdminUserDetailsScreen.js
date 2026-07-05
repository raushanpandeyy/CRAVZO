import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import {
  User, Mail, Phone, Store, Bike, Shield, ChevronLeft, ShoppingBag, IndianRupee,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getUserDetails, updateUserStatus, getUserOrders } from "../../services/adminService";

export default function AdminUserDetailsScreen({ route, navigation }) {
  const { userId } = route.params || {};
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [u, o] = await Promise.all([
          getUserDetails(userId),
          getUserOrders(userId),
        ]);
        setUser(u);
        setOrders(Array.isArray(o) ? o : []);
      } catch (err) {
        console.error("User details load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleStatusToggle = () => {
    if (!user) return;
    const newStatus = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    Alert.alert(`${newStatus === "ACTIVE" ? "Activate" : "Block"} User`, "Confirm?", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: async () => {
        try {
          await updateUserStatus(userId, newStatus);
          setUser((prev) => ({ ...prev, status: newStatus }));
        } catch { Alert.alert("Error", "Failed"); }
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

  if (!user) {
    return (
      <View className="flex-1 bg-[#F5F5F5] items-center justify-center">
        <Text className="text-sm text-slate-500">User not found</Text>
      </View>
    );
  }

  const role = (user.role || user.accountType || "customer").toLowerCase();
  const roleColors = { customer: "#6366f1", vendor: "#f59e0b", rider: "#10b981", admin: "#ef4444" };
  const RoleIcon = { customer: User, vendor: Store, rider: Bike, admin: Shield }[role] || User;
  const color = roleColors[role] || "#6366f1";

  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const totalEarnings = deliveredOrders.reduce((s, o) => s + (o.deliveryFee || o.total || 0), 0);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">User Details</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="bg-white rounded-3xl p-6 shadow-sm items-center mb-4">
          <View className="h-20 w-20 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: `${color}20` }}>
            <RoleIcon size={36} color={color} />
          </View>
          <Text className="text-xl font-extrabold text-slate-900">{user.name}</Text>
          <View className={`rounded-full px-3 py-1 mt-2 ${user.status === "ACTIVE" ? "bg-emerald-50" : "bg-rose-50"}`}>
            <Text className={`text-xs font-extrabold ${user.status === "ACTIVE" ? "text-emerald-600" : "text-rose-600"}`}>
              {user.status}
            </Text>
          </View>
        </View>

        <View className="bg-white rounded-3xl p-4 shadow-sm mb-4">
          <Text className="font-bold text-slate-900 mb-3">Information</Text>
          <View className="space-y-3">
            <View className="flex-row items-center gap-3">
              <Mail size={16} color={colors.slate[400]} />
              <Text className="text-sm text-slate-700">{user.email || "N/A"}</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Phone size={16} color={colors.slate[400]} />
              <Text className="text-sm text-slate-700">{user.phone || "N/A"}</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Shield size={16} color={colors.slate[400]} />
              <Text className="text-sm text-slate-700 capitalize">{role}</Text>
            </View>
          </View>
        </View>

        {["vendor", "rider"].includes(role) && (
          <View className="bg-white rounded-3xl p-4 shadow-sm mb-4">
            <Text className="font-bold text-slate-900 mb-3">Stats</Text>
            <View className="flex-row gap-4">
              <View className="flex-1 items-center">
                <Text className="text-2xl font-extrabold text-slate-900">{deliveredOrders.length}</Text>
                <Text className="text-xs text-slate-500">Delivered</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-extrabold text-emerald-600">₹{totalEarnings}</Text>
                <Text className="text-xs text-slate-500">Earnings</Text>
              </View>
            </View>
          </View>
        )}

        {orders.length > 0 && (
          <View className="bg-white rounded-3xl p-4 shadow-sm mb-8">
            <Text className="font-bold text-slate-900 mb-3">Recent Orders ({orders.length})</Text>
            {orders.slice(0, 5).map((order) => (
              <View key={order.id} className="flex-row items-center justify-between py-2 border-b border-slate-100">
                <View className="flex-row items-center gap-2">
                  <ShoppingBag size={14} color={colors.slate[400]} />
                  <Text className="text-xs text-slate-700">#{order.id?.slice(-6)}</Text>
                </View>
                <Text className="text-xs font-bold text-slate-900">₹{order.total || order.totalAmount || 0}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity onPress={handleStatusToggle}
          className={`rounded-2xl py-4 items-center mb-8 ${user.status === "ACTIVE" ? "bg-rose-500" : "bg-emerald-500"}`}>
          <Text className="font-extrabold text-white">
            {user.status === "ACTIVE" ? "Block User" : "Activate User"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
