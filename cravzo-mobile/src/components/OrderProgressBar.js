import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Package,
  Bike,
  XCircle,
} from "lucide-react-native";

const STATUS_STEPS = [
  {
    key: "PENDING",
    label: "Order Placed",
    sublabel: "Waiting for restaurant",
    icon: Clock,
  },
  {
    key: "ACCEPTED",
    label: "Accepted",
    sublabel: "Restaurant confirmed",
    icon: CheckCircle2,
  },
  {
    key: "PREPARING",
    label: "Preparing",
    sublabel: "Being cooked",
    icon: ChefHat,
  },
  {
    key: "READY_FOR_PICKUP",
    label: "Ready",
    sublabel: "Waiting for rider",
    icon: Package,
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "On the way",
    sublabel: "Rider picked up",
    icon: Bike,
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    sublabel: "Enjoy your meal!",
    icon: CheckCircle2,
  },
];

const normalizeStatus = (status) => {
  if (status === "ON_THE_WAY") return "OUT_FOR_DELIVERY";
  return status;
};

const isCancelled = (status) =>
  status === "CANCELLED" || status === "REJECTED";

const getActiveIndex = (status) => {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
};

export default function OrderProgressBar({ status }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const dotPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    dotPulse.start();
    return () => dotPulse.stop();
  }, [dotAnim]);

  if (isCancelled(status)) {
    return (
      <View className="flex-row items-center gap-3 rounded-2xl bg-red-50 px-4 py-4">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <XCircle size={20} color="#ef4444" />
        </View>
        <View>
          <Text className="text-sm font-black text-red-700">
            Order {status === "REJECTED" ? "Rejected" : "Cancelled"}
          </Text>
          <Text className="text-xs text-red-500">
            {status === "REJECTED"
              ? "This order was rejected by the restaurant."
              : "This order has been cancelled."}
          </Text>
        </View>
      </View>
    );
  }

  const activeIndex = getActiveIndex(normalizeStatus(status));

  return (
    <View className="rounded-2xl bg-indigo-50 p-4">
      <Text className="mb-4 text-xs font-black uppercase tracking-[0.15em] text-indigo-700">
        Order Status
      </Text>

      <View className="relative flex-row items-start justify-between">
        <View className="absolute left-0 right-0 top-4 h-0.5 bg-indigo-100" />
        <View
          className="absolute left-0 top-4 h-0.5 bg-indigo-600"
          style={{
            width:
              activeIndex === 0
                ? "0%"
                : `${(activeIndex / (STATUS_STEPS.length - 1)) * 100}%`,
          }}
        />

        {STATUS_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;
          const isPending = index > activeIndex;

          return (
            <View key={step.key} className="flex-1 items-center gap-1.5">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full border-2 ${
                  isDone
                    ? "border-indigo-600 bg-indigo-600"
                    : isActive
                    ? "border-indigo-600 bg-white shadow-md shadow-indigo-200"
                    : "border-slate-200 bg-white"
                }`}
              >
                {isActive ? (
                  <Animated.View style={{ opacity: pulseAnim }}>
                    <Icon size={16} color="#4f46e5" />
                  </Animated.View>
                ) : (
                  <Icon
                    size={16}
                    color={isDone ? "#ffffff" : "#cbd5e1"}
                  />
                )}
              </View>

              <View className="items-center">
                <Text
                  className={`text-[10px] font-black leading-tight ${
                    isDone
                      ? "text-indigo-600"
                      : isActive
                      ? "text-indigo-900"
                      : "text-slate-300"
                  }`}
                >
                  {step.label}
                </Text>
                {isActive && (
                  <Text className="mt-0.5 text-[9px] font-semibold text-indigo-500 leading-tight">
                    {step.sublabel}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5">
        <Animated.View
          className="h-2 w-2 rounded-full bg-white"
          style={{ opacity: dotAnim }}
        />
        <Text className="text-xs font-black text-white">
          {STATUS_STEPS[activeIndex]?.label} —{" "}
          {STATUS_STEPS[activeIndex]?.sublabel}
        </Text>
      </View>
    </View>
  );
}
