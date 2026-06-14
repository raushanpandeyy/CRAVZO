import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
} from "react-native";
import {
  Users, Store, IndianRupee, ShoppingBag,
  TrendingUp, TrendingDown, ChevronRight,
} from "lucide-react-native";
import { colors } from "../../constants/colors";

const stats = [
  { icon: Users, label: "Total Users", value: "12,450", change: "+12%", up: true, color: "#6366f1" },
  { icon: Store, label: "Restaurants", value: "342", change: "+8%", up: true, color: "#f59e0b" },
  { icon: ShoppingBag, label: "Total Orders", value: "8,230", change: "+18%", up: true, color: "#10b981" },
  { icon: IndianRupee, label: "Revenue", value: "₹4.2L", change: "+15%", up: true, color: "#ef4444" },
];

const recentOrders = [
  { id: "O1001", customer: "Rahul S.", restaurant: "Punjab Grill", amount: 543, status: "Delivered" },
  { id: "O1002", customer: "Priya M.", restaurant: "Sagar Ratna", amount: 320, status: "Preparing" },
  { id: "O1003", customer: "Amit K.", restaurant: "Domino's", amount: 499, status: "Pending" },
];

export default function AdminDashboardScreen() {
  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <ScrollView className="flex-1">
        <View className="bg-indigo-950 pt-16 pb-6 px-4 rounded-b-[28px]">
          <Text className="text-2xl font-extrabold text-white">Admin Dashboard</Text>
          <Text className="text-sm text-indigo-200 mt-1">Platform Overview</Text>
        </View>

        <View className="px-4 -mt-4">
          <View className="flex-row flex-wrap gap-3">
            {stats.map((stat) => (
              <View key={stat.label} className="w-[48%] bg-white rounded-3xl p-4 shadow-sm">
                <View className={`h-10 w-10 items-center justify-center rounded-xl mb-3`} style={{ backgroundColor: `${stat.color}15` }}>
                  <stat.icon size={20} color={stat.color} />
                </View>
                <Text className="text-2xl font-extrabold text-slate-900">{stat.value}</Text>
                <Text className="text-xs text-slate-500 mt-1">{stat.label}</Text>
                <View className="flex-row items-center gap-1 mt-1">
                  {stat.up ? <TrendingUp size={12} color="#059669" /> : <TrendingDown size={12} color="#dc2626" />}
                  <Text className={`text-xs font-bold ${stat.up ? "text-emerald-600" : "text-red-600"}`}>
                    {stat.change}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-extrabold text-slate-900">Recent Orders</Text>
              <TouchableOpacity className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-indigo-600">View All</Text>
                <ChevronRight size={14} color={colors.brand[600]} />
              </TouchableOpacity>
            </View>
            <View className="bg-white rounded-3xl overflow-hidden shadow-sm">
              {recentOrders.map((order, i) => (
                <TouchableOpacity key={order.id}
                  className={`flex-row items-center gap-4 px-4 py-4 ${i < recentOrders.length - 1 ? "border-b border-slate-100" : ""}`}>
                  <View className="h-10 w-10 rounded-xl bg-indigo-50 items-center justify-center">
                    <ShoppingBag size={18} color={colors.brand[600]} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-900">{order.customer}</Text>
                    <Text className="text-xs text-slate-500">{order.restaurant}</Text>
                  </View>
                  <Text className="font-bold text-slate-900">₹{order.amount}</Text>
                  <View className={`rounded-full px-2.5 py-0.5 ${
                    order.status === "Delivered" ? "bg-emerald-50" :
                    order.status === "Preparing" ? "bg-amber-50" : "bg-slate-100"
                  }`}>
                    <Text className={`text-[10px] font-extrabold ${
                      order.status === "Delivered" ? "text-emerald-600" :
                      order.status === "Preparing" ? "text-amber-600" : "text-slate-500"
                    }`}>{order.status}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="flex-row gap-3 mt-6 mb-8">
            <TouchableOpacity className="flex-1 bg-white rounded-3xl p-4 shadow-sm items-center">
              <Users size={24} color={colors.brand[600]} />
              <Text className="font-extrabold text-slate-900 mt-2">Users</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-white rounded-3xl p-4 shadow-sm items-center">
              <Store size={24} color="#f59e0b" />
              <Text className="font-extrabold text-slate-900 mt-2">Restaurants</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-white rounded-3xl p-4 shadow-sm items-center">
              <ShoppingBag size={24} color="#10b981" />
              <Text className="font-extrabold text-slate-900 mt-2">Orders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
