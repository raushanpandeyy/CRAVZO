import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { ChevronLeft, Heart, Shield, Truck, Star } from "lucide-react-native";
import { colors } from "../../constants/colors";

export default function AboutUsScreen({ navigation }) {
  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">About DODAGO</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <Text className="text-2xl font-extrabold text-indigo-700 mb-2">Our Story</Text>
          <Text className="text-sm text-slate-600 leading-6">
            DODAGO was born from a simple idea: great food should be accessible to everyone, everywhere. 
            We connect food lovers with their favorite local restaurants, ensuring every craving is satisfied 
            with just a few taps.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-4 mb-4">
          {[
            { icon: Heart, label: "Quality Food", desc: "Carefully curated restaurants", color: "#ef4444" },
            { icon: Truck, label: "Fast Delivery", desc: "30 min average delivery", color: "#f59e0b" },
            { icon: Shield, label: "Secure Payments", desc: "100% secure transactions", color: "#10b981" },
            { icon: Star, label: "Top Rated", desc: "Best dining experiences", color: "#6366f1" },
          ].map((item) => (
            <View key={item.label} className="w-[47%] bg-white rounded-2xl p-4 shadow-sm items-center">
              <View className="h-12 w-12 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: `${item.color}15` }}>
                <item.icon size={24} color={item.color} />
              </View>
              <Text className="font-bold text-slate-900 text-sm">{item.label}</Text>
              <Text className="text-xs text-slate-500 text-center mt-1">{item.desc}</Text>
            </View>
          ))}
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-sm mb-8">
          <Text className="font-bold text-slate-900 mb-3">Our Mission</Text>
          <Text className="text-sm text-slate-600 leading-6">
            To revolutionize food delivery by empowering local restaurants, creating earning opportunities 
            for delivery partners, and delivering joy to every customer. We believe in building a community 
            where everyone wins.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
