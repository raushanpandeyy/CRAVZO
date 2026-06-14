import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
} from "react-native";
import {
  Store, Clock3, IndianRupee, Users, ChefHat,
  CheckCircle, XCircle, RefreshCw,
} from "lucide-react-native";
import { colors } from "../../constants/colors";

const sampleOrders = [
  { id: "101", customer: "Rahul S.", items: "Butter Chicken, Naan x2", total: 543, time: "10 min ago", status: "New" },
  { id: "102", customer: "Priya M.", items: "Dal Makhani, Roti x3", total: 420, time: "25 min ago", status: "Preparing" },
];

export default function VendorDashboardScreen() {
  const [orders] = useState(sampleOrders);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <ScrollView className="flex-1">
        <View className="bg-indigo-950 pt-16 pb-6 px-4 rounded-b-[28px]">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-14 w-14 rounded-2xl bg-indigo-600 items-center justify-center border-2 border-indigo-400">
                <Store size={28} color="#fff" />
              </View>
              <View>
                <Text className="text-lg font-extrabold text-white">Punjab Grill</Text>
                <Text className="text-sm text-indigo-200">Vendor Dashboard</Text>
              </View>
            </View>
            <View className="bg-emerald-500 rounded-full px-3 py-1">
              <Text className="text-xs font-extrabold text-white">OPEN</Text>
            </View>
          </View>
          <View className="flex-row gap-4 mt-4">
            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-2xl font-extrabold text-white">{orders.filter((o) => o.status === "New").length}</Text>
              <Text className="text-xs text-indigo-200">New Orders</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-2xl font-extrabold text-white">{orders.length}</Text>
              <Text className="text-xs text-indigo-200">Total Today</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-2xl font-extrabold text-white">₹963</Text>
              <Text className="text-xs text-indigo-200">Revenue</Text>
            </View>
          </View>
        </View>

        <View className="px-4 pt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-extrabold text-slate-900">Today's Orders</Text>
            <TouchableOpacity className="flex-row items-center gap-1">
              <RefreshCw size={14} color={colors.brand[600]} />
              <Text className="text-xs font-bold text-indigo-600">Refresh</Text>
            </TouchableOpacity>
          </View>

          {orders.length === 0 ? (
            <View className="items-center justify-center py-16">
              <ChefHat size={48} color="#94a3b8" />
              <Text className="text-base font-bold text-slate-500 mt-4">No orders yet</Text>
              <Text className="text-sm text-slate-400 mt-1">New orders will appear here</Text>
            </View>
          ) : (
            <View className="space-y-4">
              {orders.map((order) => (
                <View key={order.id} className="bg-white rounded-3xl p-4 shadow-sm">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className={`h-10 w-10 rounded-xl items-center justify-center ${order.status === "New" ? "bg-rose-50" : "bg-amber-50"}`}>
                        {order.status === "New" ? (
                          <Clock3 size={20} color="#e11d48" />
                        ) : (
                          <RefreshCw size={20} color="#d97706" />
                        )}
                      </View>
                      <View>
                        <Text className="font-extrabold text-slate-900">{order.customer}</Text>
                        <Text className="text-xs text-slate-500">{order.time}</Text>
                      </View>
                    </View>
                    <View className={`rounded-full px-3 py-1 ${order.status === "New" ? "bg-rose-50" : "bg-amber-50"}`}>
                      <Text className={`text-xs font-extrabold ${order.status === "New" ? "text-rose-600" : "text-amber-600"}`}>
                        {order.status}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm text-slate-700 mt-3">{order.items}</Text>
                  <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <Text className="text-lg font-extrabold text-slate-900">₹{order.total}</Text>
                    <View className="flex-row gap-2">
                      {order.status === "New" ? (
                        <>
                          <TouchableOpacity className="flex-row items-center gap-1 h-9 px-4 rounded-xl bg-rose-500">
                            <XCircle size={14} color="#fff" />
                            <Text className="text-xs font-extrabold text-white">Reject</Text>
                          </TouchableOpacity>
                          <TouchableOpacity className="flex-row items-center gap-1 h-9 px-4 rounded-xl bg-emerald-500">
                            <CheckCircle size={14} color="#fff" />
                            <Text className="text-xs font-extrabold text-white">Accept</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity className="flex-row items-center gap-1 h-9 px-4 rounded-xl bg-indigo-500">
                          <CheckCircle size={14} color="#fff" />
                          <Text className="text-xs font-extrabold text-white">Mark Ready</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
