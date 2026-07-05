import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { ChevronLeft, Crown, CheckCircle, IndianRupee, TrendingUp } from "lucide-react-native";
import { colors } from "../../constants/colors";

const plans = [
  {
    name: "Free", price: "₹0", period: "forever",
    features: ["Basic listing", "Up to 20 orders/month", "Standard support"],
    popular: false,
  },
  {
    name: "Pro", price: "₹999", period: "/month",
    features: ["Priority listing", "Unlimited orders", "Dedicated support", "Analytics dashboard", "Promotional tools"],
    popular: true,
  },
  {
    name: "Enterprise", price: "Custom", period: "",
    features: ["Everything in Pro", "API access", "White-label option", "Account manager", "Custom integrations"],
    popular: false,
  },
];

export default function SubscriptionScreen({ navigation }) {
  return (
    <View className="flex-1">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Subscription</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="items-center mb-6">
          <Crown size={40} color={colors.brand[600]} />
          <Text className="text-2xl font-extrabold text-slate-900 mt-2">Choose Your Plan</Text>
          <Text className="text-sm text-slate-500 mt-1">Unlock more features for your restaurant</Text>
        </View>
        <View className="space-y-4">
          {plans.map((plan) => (
            <View key={plan.name}
              className={`bg-white rounded-3xl p-6 shadow-sm border-2 ${plan.popular ? "border-indigo-500" : "border-transparent"}`}>
              {plan.popular && (
                <View className="bg-indigo-600 rounded-full px-3 py-1 self-start mb-2">
                  <Text className="text-xs font-extrabold text-white">Most Popular</Text>
                </View>
              )}
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-extrabold text-slate-900">{plan.name}</Text>
                <View className="flex-row items-baseline">
                  <Text className="text-2xl font-extrabold text-indigo-600">{plan.price}</Text>
                  <Text className="text-xs text-slate-500">{plan.period}</Text>
                </View>
              </View>
              <View className="mt-4 space-y-3">
                {plan.features.map((f) => (
                  <View key={f} className="flex-row items-center gap-2">
                    <CheckCircle size={16} color="#059669" />
                    <Text className="text-sm text-slate-700">{f}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity className={`mt-6 rounded-2xl py-3 items-center ${plan.popular ? "bg-indigo-600" : "bg-slate-100"}`}>
                <Text className={`font-extrabold ${plan.popular ? "text-white" : "text-slate-900"}`}>
                  {plan.name === "Free" ? "Current Plan" : "Subscribe"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
