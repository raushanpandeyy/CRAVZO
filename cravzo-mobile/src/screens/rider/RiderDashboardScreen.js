import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image,
} from "react-native";
import {
  Bike, Clock3, IndianRupee, Star, MapPin,
  ChevronRight, CheckCircle, XCircle,
} from "lucide-react-native";
import { colors } from "../../constants/colors";

const sampleDeliveries = [
  { id: "1", restaurant: "Punjab Grill", customer: "Rahul S.", address: "Sector 62, Noida", amount: 45, status: "Available", distance: "2.3 km", time: "25 min" },
  { id: "2", restaurant: "Domino's", customer: "Priya M.", address: "Sector 44, Noida", amount: 55, status: "Available", distance: "3.1 km", time: "30 min" },
];

export default function RiderDashboardScreen() {
  const [deliveries] = useState(sampleDeliveries);
  const [isOnline, setIsOnline] = useState(false);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <ScrollView className="flex-1">
        <View className="bg-indigo-950 pt-16 pb-6 px-4 rounded-b-[28px]">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-14 w-14 rounded-full bg-indigo-600 items-center justify-center border-2 border-indigo-400">
                <Bike size={28} color="#fff" />
              </View>
              <View>
                <Text className="text-lg font-extrabold text-white">Rider Dashboard</Text>
                <Text className="text-sm text-indigo-200">Raushan Kumar</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsOnline(!isOnline)}
              className={`rounded-full px-4 py-2 ${isOnline ? "bg-emerald-500" : "bg-slate-500"}`}
            >
              <Text className="text-xs font-extrabold text-white">{isOnline ? "ONLINE" : "OFFLINE"}</Text>
            </TouchableOpacity>
          </View>
          {isOnline ? (
            <View className="flex-row gap-4 mt-4">
              <View className="flex-1 bg-white/10 rounded-xl p-3">
                <Text className="text-2xl font-extrabold text-white">₹0</Text>
                <Text className="text-xs text-indigo-200">Today's Earnings</Text>
              </View>
              <View className="flex-1 bg-white/10 rounded-xl p-3">
                <Text className="text-2xl font-extrabold text-white">0</Text>
                <Text className="text-xs text-indigo-200">Deliveries</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View className="px-4 pt-6">
          <Text className="text-lg font-extrabold text-slate-900 mb-4">
            {isOnline ? "Available Orders" : "Go Online to see orders"}
          </Text>

          {isOnline && deliveries.length === 0 ? (
            <View className="items-center justify-center py-10">
              <Bike size={48} color="#94a3b8" />
              <Text className="text-base font-bold text-slate-500 mt-4">No orders available</Text>
              <Text className="text-sm text-slate-400 mt-1">New orders will appear here</Text>
            </View>
          ) : isOnline ? (
            <View className="space-y-4">
              {deliveries.map((del) => (
                <TouchableOpacity key={del.id} className="bg-white rounded-3xl p-4 shadow-sm">
                  <View className="flex-row items-start gap-3">
                    <View className="h-12 w-12 rounded-2xl bg-amber-50 items-center justify-center">
                      <Bike size={24} color="#d97706" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-extrabold text-slate-900">{del.restaurant}</Text>
                      <Text className="text-xs text-slate-500 mt-0.5">{del.customer} • {del.distance}</Text>
                      <View className="flex-row items-center gap-2 mt-2">
                        <View className="flex-row items-center gap-1">
                          <MapPin size={12} color={colors.slate[400]} />
                          <Text className="text-xs text-slate-400" numberOfLines={1}>{del.address}</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-3 mt-2">
                        <View className="flex-row items-center gap-1 bg-emerald-50 rounded-full px-2 py-0.5">
                          <IndianRupee size={10} color="#059669" />
                          <Text className="text-xs font-extrabold text-emerald-700">{del.amount}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Clock3 size={10} color={colors.slate[400]} />
                          <Text className="text-xs text-slate-500">{del.time}</Text>
                        </View>
                      </View>
                    </View>
                    <View className="gap-2">
                      <TouchableOpacity className="h-9 w-20 items-center justify-center rounded-xl bg-emerald-500">
                        <Text className="text-xs font-extrabold text-white">Accept</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-20">
              <Bike size={64} color="#cbd5e1" />
              <Text className="text-lg font-bold text-slate-400 mt-4">You're Offline</Text>
              <Text className="text-sm text-slate-300 mt-1 text-center px-8">
                Tap "ONLINE" to start receiving nearby delivery orders
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
