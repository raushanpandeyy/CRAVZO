import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from "react-native";
import LightweightTrackingMap from "../../components/LightweightTrackingMap";
import PressableScale from "../../components/PressableScale";
import { ChevronLeft, Bike, MapPin, Phone, ShieldCheck, Navigation, Clock3, Route } from "lucide-react-native";
import { getOrderTracking, requestDeliveryOtp } from "../../services/orderService";
import { colors } from "../../constants/colors";
import { connectSocket, onOrderStatusUpdate, onRiderLocationUpdate } from "../../services/chatSocket";

const formatStatus = (status) => (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const formatEta = (seconds) => {
  if (!seconds) return "ETA waiting";
  const minutes = Math.max(1, Math.round(Number(seconds) / 60));
  return `${minutes} min`;
};
const formatDistance = (km) => km ? `${Number(km).toFixed(1)} km` : "Distance waiting";
const buildAddress = (destination = {}) => [destination.line1, destination.line2, destination.city, destination.state, destination.postalCode].filter(Boolean).join(", ");
const getFreshness = (updatedAt) => {
  if (!updatedAt) return "Location waiting";
  const age = Math.max(0, Math.round((Date.now() - new Date(updatedAt).getTime()) / 60000));
  if (age < 1) return "Live location";
  if (age <= 3) return `Updated ${age} min ago`;
  return `Last update ${age} min ago`;
};
export default function OrderTrackingScreen({ navigation, route }) {
  const orderId = route?.params?.orderId || route?.params?.id || null;
  const [tracking, setTracking] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(true);


  const load = useCallback(async () => {
    try {
      if (!orderId) return;
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

  useEffect(() => {
    if (!orderId) return;
    connectSocket();
    const offStatus = onOrderStatusUpdate((payload = {}) => {
      const updatedOrder = payload.order || payload.data || payload;
      const updatedOrderId = updatedOrder.id || payload.orderId;
      if (updatedOrderId === orderId) setTracking((current) => ({ ...(current || {}), ...updatedOrder }));
    });
    const offLocation = onRiderLocationUpdate((payload = {}) => {
      if (payload.orderId && payload.orderId !== orderId) return;
      const rider = payload.rider || payload.location || payload;
      setTracking((current) => ({ ...(current || {}), rider: { ...(current?.rider || {}), ...rider } }));
    });
    return () => {
      offStatus?.();
      offLocation?.();
    };
  }, [orderId]);

  const openMap = () => {
    const lat = tracking?.rider?.latitude;
    const lng = tracking?.rider?.longitude;
    if (lat == null || lng == null)
      return Alert.alert("Location pending", "Rider location will appear after pickup.");
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  };

  const getOtp = async () => {
    try {
      if (!orderId) return;
      const data = await requestDeliveryOtp(orderId);
      setOtp(data.otp);
    } catch (e) {
      Alert.alert("OTP unavailable", e.message || "Try again");
    }
  };


  if (!orderId) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <Text className="text-center text-lg font-black text-slate-900">Order tracking unavailable</Text>
        <Text className="mt-2 text-center text-sm text-slate-500">Open tracking from an active order.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-5 rounded-2xl bg-indigo-600 px-5 py-3">
          <Text className="font-bold text-white">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <PressableScale onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <ChevronLeft color="#fff" />
        </PressableScale>
        <Text className="text-xl font-extrabold text-white">Track order</Text>
      </View>

      <View className="h-80 overflow-hidden bg-indigo-50">
        <LightweightTrackingMap rider={riderLoc} restaurant={restaurantLoc} destination={addressLoc} />
        <View className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-2 shadow-sm">
          <Text className="text-xs font-black text-indigo-950">LIGHTWEIGHT LIVE TRACKING</Text>
        </View>
      </View>
      <ScrollView className="-mt-8 flex-1 px-4 pt-0" contentContainerStyle={{ paddingBottom: 28 }}>
        <View className="rounded-3xl border border-white bg-white p-5 shadow-xl shadow-slate-300/50">
          <View className="flex-row justify-between">
            <Text className="font-extrabold text-slate-900">
              Order #{orderId?.slice?.(-6) || ""}
            </Text>
            <PressableScale onPress={load} className="rounded-full bg-indigo-50 px-3 py-1.5">
              <Text className="text-indigo-600 font-black text-sm">Refresh</Text>
            </PressableScale>
          </View>
          <Text className="mt-2 text-indigo-700 font-bold">
            {formatStatus(tracking?.status)}
          </Text>
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-indigo-50 p-3">
              <Clock3 size={16} color={colors.indigo[700]} />
              <Text className="mt-1 font-black text-indigo-950">{formatEta(tracking?.route?.durationSeconds)}</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-emerald-50 p-3">
              <Route size={16} color="#059669" />
              <Text className="mt-1 font-black text-emerald-950">{formatDistance(tracking?.route?.distanceKm || tracking?.deliveryDistance)}</Text>
            </View>
          </View>
          <Text className="mt-3 text-xs text-slate-500">Payment: {formatStatus(tracking?.paymentStatus)}</Text>
        </View>

        <View className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <View className="flex-row items-center gap-3">
            <Bike color="#4f46e5" />
            <View className="flex-1">
              <Text className="font-extrabold text-slate-900">
                {tracking?.rider?.name || "Rider being assigned"}
              </Text>
              <Text className="text-xs text-slate-500">
                {getFreshness(tracking?.rider?.updatedAt)}
              </Text>
            </View>
          </View>
          <View className="mt-4 flex-row gap-3">
            <PressableScale
              onPress={openMap}
              className="flex-1 rounded-2xl bg-indigo-600 py-3 items-center shadow-lg shadow-indigo-200"
            >
              <MapPin size={17} color="#fff" />
              <Text className="text-white font-bold">Open map</Text>
            </PressableScale>
            <PressableScale
              disabled={!tracking?.rider?.phone}
              onPress={() => Linking.openURL(`tel:${tracking.rider.phone}`)}
              className="flex-1 rounded-2xl bg-emerald-600 py-3 items-center shadow-lg shadow-emerald-200 disabled:opacity-60"
            >
              <Phone size={17} color="#fff" />
              <Text className="text-white font-bold">Call rider</Text>
            </PressableScale>
          </View>
        </View>

        <View className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <Text className="text-xs font-black uppercase text-slate-500">Route details</Text>
          <Text className="mt-3 font-black text-slate-950">{tracking?.restaurant?.name || "Restaurant"}</Text>
          <Text className="mt-1 text-sm text-slate-500">{buildAddress(tracking?.destination) || "Delivery address"}</Text>
          {tracking?.deliveryInstructions ? <Text className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">{tracking.deliveryInstructions}</Text> : null}
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
            <PressableScale
              onPress={getOtp}
              className="mt-4 rounded-2xl bg-amber-600 py-3 items-center shadow-lg shadow-amber-200"
            >
              <Text className="text-white font-extrabold">Generate OTP</Text>
            </PressableScale>
          )}
        </View>
      </ScrollView>
    </View>
  );
}








