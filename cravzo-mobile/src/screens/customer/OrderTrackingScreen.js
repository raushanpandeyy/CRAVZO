import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from "react-native";
import LightweightTrackingMap from "../../components/LightweightTrackingMap";
import { ChevronLeft, Bike, MapPin, Phone, ShieldCheck, Navigation } from "lucide-react-native";
import { getOrderTracking, requestDeliveryOtp } from "../../services/orderService";
import { colors } from "../../constants/colors";

export default function OrderTrackingScreen({ navigation, route }) {
  const { orderId } = route.params;
  const [tracking, setTracking] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(true);


  const load = useCallback(async () => {
    try {
      const data = await getOrderTracking(orderId);
      setTracking(data);
    } catch (e) {
      Alert.alert("Tracking unavailable", e.message || "Please try again");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  const openMap = () => {
    const lat = tracking?.rider?.latitude;
    const lng = tracking?.rider?.longitude;
    if (lat == null || lng == null)
      return Alert.alert("Location pending", "Rider location will appear after pickup.");
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  };

  const getOtp = async () => {
    try {
      const data = await requestDeliveryOtp(orderId);
      setOtp(data.otp);
    } catch (e) {
      Alert.alert("OTP unavailable", e.message || "Try again");
    }
  };


  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#312e81" />
      </View>
    );
  }

  const riderLoc =
    tracking?.rider?.latitude != null
      ? { latitude: tracking.rider.latitude, longitude: tracking.rider.longitude }
      : null;

  const addressLoc =
    tracking?.destination?.latitude != null
      ? { latitude: tracking.destination.latitude, longitude: tracking.destination.longitude }
      : null;

  const restaurantLoc =
    tracking?.restaurant?.latitude != null
      ? { latitude: tracking.restaurant.latitude, longitude: tracking.restaurant.longitude }
      : null;

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-indigo-950 pt-14 pb-5 px-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#fff" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-white">Track order</Text>
      </View>

      <View className="h-72 overflow-hidden bg-indigo-50">
        <LightweightTrackingMap rider={riderLoc} restaurant={restaurantLoc} destination={addressLoc} />
        <View className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-2 shadow-sm">
          <Text className="text-xs font-black text-indigo-950">LIGHTWEIGHT LIVE TRACKING</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-5">
        <View className="rounded-3xl bg-white p-5 shadow-sm">
          <View className="flex-row justify-between">
            <Text className="font-extrabold text-slate-900">
              Order #{orderId.slice(-6)}
            </Text>
            <TouchableOpacity onPress={load}>
              <Text className="text-indigo-600 font-bold text-sm">Refresh</Text>
            </TouchableOpacity>
          </View>
          <Text className="mt-2 text-indigo-700 font-bold">
            {(tracking?.status || "").replaceAll("_", " ")}
          </Text>
          <Text className="mt-1 text-xs text-slate-500">
            Payment: {tracking?.paymentStatus}
          </Text>
        </View>

        <View className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <View className="flex-row items-center gap-3">
            <Bike color="#4f46e5" />
            <View className="flex-1">
              <Text className="font-extrabold text-slate-900">
                {tracking?.rider?.name || "Rider being assigned"}
              </Text>
              <Text className="text-xs text-slate-500">
                Live position refreshes every 10 seconds
              </Text>
            </View>
          </View>
          <View className="mt-4 flex-row gap-3">
            <TouchableOpacity
              onPress={openMap}
              className="flex-1 rounded-2xl bg-indigo-600 py-3 items-center"
            >
              <MapPin size={17} color="#fff" />
              <Text className="text-white font-bold">Open map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!tracking?.rider?.phone}
              onPress={() => Linking.openURL(`tel:${tracking.rider.phone}`)}
              className="flex-1 rounded-2xl bg-emerald-600 py-3 items-center disabled:opacity-60"
            >
              <Phone size={17} color="#fff" />
              <Text className="text-white font-bold">Call rider</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-4 mb-8 rounded-3xl bg-amber-50 p-5">
          <View className="flex-row items-center gap-2">
            <ShieldCheck color="#b45309" />
            <Text className="font-extrabold text-amber-900">Delivery OTP</Text>
          </View>
          <Text className="mt-2 text-sm text-amber-800">
            Share this only after receiving your order.
          </Text>
          {otp ? (
            <Text className="mt-3 text-center text-4xl tracking-[10px] font-extrabold text-amber-900">
              {otp}
            </Text>
          ) : (
            <TouchableOpacity
              onPress={getOtp}
              className="mt-4 rounded-2xl bg-amber-600 py-3 items-center"
            >
              <Text className="text-white font-extrabold">Generate OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}


