import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
} from "react-native";
import { IndianRupee, TrendingUp, Calendar, ChevronLeft } from "lucide-react-native";
import { colors } from "../../constants/colors";

const earnings = [
  { date: "Mon", amount: 450, trips: 9 },
  { date: "Tue", amount: 380, trips: 7 },
  { date: "Wed", amount: 520, trips: 11 },
  { date: "Thu", amount: 410, trips: 8 },
  { date: "Fri", amount: 490, trips: 10 },
  { date: "Sat", amount: 610, trips: 13 },
  { date: "Sun", amount: 550, trips: 12 },
];

const maxAmount = Math.max(...earnings.map((e) => e.amount));

export default function RiderEarningsScreen({ navigation }) {
  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Earnings</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <View className="flex-row items-center gap-2 mb-4">
            <Calendar size={20} color={colors.brand[600]} />
            <Text className="font-bold text-slate-900">This Week</Text>
          </View>
          <View className="flex-row items-end justify-between h-32 px-2">
            {earnings.map((day) => {
              const height = (day.amount / maxAmount) * 100;
              return (
                <View key={day.date} className="items-center gap-1">
                  <Text className="text-[10px] font-bold text-slate-700">₹{day.amount}</Text>
                  <View
                    className="w-8 rounded-t-lg bg-indigo-500"
                    style={{ height: Math.max(height, 8) }}
                  />
                  <Text className="text-[10px] text-slate-500">{day.date}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-sm">
          <Text className="font-bold text-slate-900 mb-4">Earnings Breakdown</Text>
          <View className="space-y-4">
            <View className="flex-row items-center justify-between pb-4 border-b border-slate-100">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <TrendingUp size={20} color="#059669" />
                </View>
                <View>
                  <Text className="font-bold text-slate-900">Total Earnings</Text>
                  <Text className="text-xs text-slate-500">All time</Text>
                </View>
              </View>
              <Text className="text-xl font-extrabold text-emerald-600">₹12,580</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  <IndianRupee size={20} color={colors.brand[600]} />
                </View>
                <View>
                  <Text className="font-bold text-slate-900">This Week</Text>
                  <Text className="text-xs text-slate-500">7 days</Text>
                </View>
              </View>
              <Text className="text-xl font-extrabold text-indigo-600">₹3,410</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
