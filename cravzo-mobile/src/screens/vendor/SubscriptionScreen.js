import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { ChevronLeft, Crown, CheckCircle, IndianRupee, TrendingUp } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { apiRequest } from "../../services/api";

export default function SubscriptionScreen({ navigation }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("/api/subscriptions/plans");
        const data = res.data || res.plans || [];
        setPlans(data.length > 0 ? data : fallbackPlans);

        const profileRes = await apiRequest("/api/restaurants/mine");
        const profileData = profileRes.data || profileRes.restaurant || profileRes;
        const rest = Array.isArray(profileData) ? profileData[0] || null : profileData;
        if (rest?.subscriptionPlan) setCurrentPlan(rest.subscriptionPlan);
      } catch {
        setPlans(fallbackPlans);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubscribe = async (planId) => {
    setSubscribing(true);
    try {
      await apiRequest("/api/subscriptions/subscribe", { method: "POST", data: { planId } });
      Alert.alert("Success", "Subscription updated successfully!");
      setCurrentPlan(planId);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to subscribe");
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

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
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id || currentPlan === plan.name;
            return (
            <View key={plan.id || plan.name}
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
                {(plan.features || []).map((f, i) => (
                  <View key={i} className="flex-row items-center gap-2">
                    <CheckCircle size={16} color="#059669" />
                    <Text className="text-sm text-slate-700">{f}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => isCurrent ? null : handleSubscribe(plan.id)}
                disabled={isCurrent || subscribing}
                className={`mt-6 rounded-2xl py-3 items-center ${isCurrent ? "bg-emerald-100" : plan.popular ? "bg-indigo-600" : "bg-slate-100"}`}>
                <Text className={`font-extrabold ${isCurrent ? "text-emerald-700" : plan.popular ? "text-white" : "text-slate-900"}`}>
                  {isCurrent ? "Current Plan" : subscribing ? "Subscribing..." : "Subscribe"}
                </Text>
              </TouchableOpacity>
            </View>
          );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const fallbackPlans = [
  { id: "free", name: "Free", price: "₹0", period: "forever", features: ["Basic listing", "Up to 20 orders/month", "Standard support"], popular: false },
  { id: "pro", name: "Pro", price: "₹999", period: "/month", features: ["Priority listing", "Unlimited orders", "Dedicated support", "Analytics dashboard", "Promotional tools"], popular: true },
  { id: "enterprise", name: "Enterprise", price: "Custom", period: "", features: ["Everything in Pro", "API access", "White-label option", "Account manager", "Custom integrations"], popular: false },
];
