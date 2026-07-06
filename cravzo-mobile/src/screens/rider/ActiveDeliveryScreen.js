import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Linking } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { ChevronLeft, MapPin, Phone, PackageCheck, Navigation, Bike } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getOrderTracking, updateOrderStatus, updateRiderLocation, verifyDeliveryOtp } from "../../services/riderService";

export default function ActiveDeliveryScreen({ navigation, route }) {
  const { orderId } = route.params;
  const [tracking, setTracking] = useState(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [deviceLocation, setDeviceLocation] = useState(null);
  const mapRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setTracking(await getOrderTracking(orderId));
    } catch (err) {
      Alert.alert("Error", "Failed to load delivery details");
    }
  }, [orderId]);

  useEffect(() => {
    load();
    let subscription;
    (async () => {
      try {
        const result = await Location.requestForegroundPermissionsAsync();
        if (result.status !== "granted") {
          setLocationError("Location permission denied. Enable GPS for live tracking.");
          return;
        }
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 25 },
          (l) => {
            updateRiderLocation(l.coords.latitude, l.coords.longitude)
              .catch(() => setLocationError("Failed to sync location"));
          }
        );
      } catch (err) {
        setLocationError("Could not start location tracking");
      }
    })();
    return () => {
      if (subscription) subscription.remove();
    };
  }, [load]);

  const openMap = (point) => {
    if (point?.latitude != null) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`);
    }
  };

  const fitMarkers = () => {
    const coords = [tracking?.restaurant, tracking?.destination].filter(
      (c) => c?.latitude != null && c?.longitude != null
    );
    if (coords.length === 0 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      coords.map((c) => ({ latitude: c.latitude, longitude: c.longitude })),
      { edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }, animated: true }
    );
  };

  useEffect(() => {
    if (tracking && mapRef.current) fitMarkers();
  }, [tracking]);

  const pickedUp = async () => {
    setBusy(true);
    try {
      await updateOrderStatus(orderId, "OUT_FOR_DELIVERY");
      await load();
    } catch (e) {
      Alert.alert("Could not update", e.message || "Try again");
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    setBusy(true);
    try {
      await verifyDeliveryOtp(orderId, otp);
      Alert.alert("Delivered", "Delivery completed successfully");
      navigation.goBack();
    } catch (e) {
      Alert.alert("OTP failed", e.message || "Check OTP and try again");
    } finally {
      setBusy(false);
    }
  };

  if (!tracking) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  const restaurantLoc = tracking?.restaurant?.latitude != null
    ? { latitude: tracking.restaurant.latitude, longitude: tracking.restaurant.longitude }
    : null;

  const destLoc = tracking?.destination?.latitude != null
    ? { latitude: tracking.destination.latitude, longitude: tracking.destination.longitude }
    : null;

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-indigo-950 pt-14 pb-5 px-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-white flex-1">Active delivery</Text>
      </View>

      {locationError ? (
        <View className="mx-4 mt-3 rounded-2xl bg-amber-50 p-3">
          <Text className="text-xs font-medium text-amber-800">{locationError}</Text>
        </View>
      ) : null}

      {/* Inline Map */}
      <View className="h-56 mx-4 mt-3 rounded-3xl overflow-hidden">
        <MapView
          ref={mapRef}
          className="flex-1"
          provider={PROVIDER_GOOGLE}
          initialRegion={(restaurantLoc || destLoc || deviceLocation) ? {
            ...(restaurantLoc || destLoc || deviceLocation),
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          } : undefined}
          showsUserLocation
          showsCompass
          toolbarEnabled={false}
        >
          {restaurantLoc ? (
            <Marker coordinate={restaurantLoc} title={tracking.restaurant?.name || "Pickup"} pinColor="#f59e0b" />
          ) : null}
          {destLoc ? (
            <Marker coordinate={destLoc} title="Dropoff" pinColor="#059669" />
          ) : null}
        </MapView>

        <TouchableOpacity
          onPress={fitMarkers}
          className="absolute top-3 right-3 h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg"
        >
          <Navigation size={18} color={colors.brand[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-5">
        <View className="rounded-3xl bg-white p-5 shadow-sm">
          <Text className="font-extrabold text-slate-900">{tracking.restaurant?.name || "Restaurant"}</Text>
          <Text className="text-sm text-slate-500 mt-1">Pickup point</Text>
          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity onPress={() => openMap(tracking.restaurant)}
              className="flex-1 bg-indigo-600 rounded-2xl py-3 items-center flex-row justify-center gap-2">
              <MapPin color="#fff" size={18} />
              <Text className="text-white font-bold">Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${tracking.restaurant?.phone}`)}
              className="flex-1 bg-emerald-600 rounded-2xl py-3 items-center flex-row justify-center gap-2">
              <Phone color="#fff" size={18} />
              <Text className="text-white font-bold">Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="rounded-3xl bg-white p-5 shadow-sm mt-4">
          <Text className="font-extrabold text-slate-900">{tracking.destination?.fullName || "Customer"}</Text>
          <Text className="text-sm text-slate-500 mt-1">
            {[tracking.destination?.line1, tracking.destination?.city].filter(Boolean).join(", ")}
          </Text>
          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity onPress={() => openMap(tracking.destination)}
              className="flex-1 bg-indigo-600 rounded-2xl py-3 items-center flex-row justify-center gap-2">
              <MapPin color="#fff" size={18} />
              <Text className="text-white font-bold">Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${tracking.destination?.phone}`)}
              className="flex-1 bg-emerald-600 rounded-2xl py-3 items-center flex-row justify-center gap-2">
              <Phone color="#fff" size={18} />
              <Text className="text-white font-bold">Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {tracking.deliveryInstructions ? (
          <View className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <Text className="text-xs font-black uppercase text-amber-700">Customer delivery instructions</Text>
            <Text className="mt-2 text-sm leading-6 text-amber-950">{tracking.deliveryInstructions}</Text>
          </View>
        ) : null}
        {Number(tracking.tipAmount || 0) > 0 ? (
          <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-emerald-50 p-4">
            <Text className="font-bold text-emerald-800">Tip from customer</Text>
            <Text className="text-lg font-black text-emerald-700">₹{Number(tracking.tipAmount).toFixed(0)}</Text>
          </View>
        ) : null}
        {tracking.status === "READY_FOR_PICKUP" ? (
          <TouchableOpacity
            disabled={busy}
            onPress={pickedUp}
            className="mt-4 bg-amber-500 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-extrabold">{busy ? "Updating..." : "Confirm Pickup"}</Text>
          </TouchableOpacity>
        ) : null}

        {tracking.status === "OUT_FOR_DELIVERY" ? (
          <View className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
            <Text className="font-extrabold text-slate-900">Customer Delivery OTP</Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={4}
              className="mt-3 rounded-2xl border border-slate-200 px-4 py-4 text-center text-2xl tracking-[10px]"
              placeholder="4-digit OTP"
              placeholderTextColor={colors.slate[400]}
            />
            <TouchableOpacity
              disabled={busy || otp.length !== 4}
              onPress={complete}
              className="mt-3 bg-emerald-600 rounded-2xl py-4 items-center flex-row justify-center gap-2"
            >
              <PackageCheck color="#fff" size={20} />
              <Text className="text-white font-extrabold">{busy ? "Verifying..." : "Verify & Complete Delivery"}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

