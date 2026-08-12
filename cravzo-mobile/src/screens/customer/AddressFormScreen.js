import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ChevronLeft, MapPin, Check, Navigation } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { addAddress, updateAddress } from "../../services/addressService";
import { getCurrentAddress } from "../../services/locationAddressService";
import { explainPermission, permissionMessages } from "../../services/permissionNotice";
import { updatePrivacyConsent } from "../../services/privacyConsent";

const emptyForm = {
  label: "HOME",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  latitude: null,
  longitude: null,
};

export default function AddressFormScreen({ navigation, route }) {
  const editAddress = route.params?.address;
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingCurrentAddress, setIsPickingCurrentAddress] = useState(false);

  useEffect(() => {
    if (editAddress) {
      setForm({
        label: editAddress.label || "HOME",
        fullName: editAddress.fullName || "",
        phone: editAddress.phone || "",
        line1: editAddress.line1 || "",
        line2: editAddress.line2 || "",
        city: editAddress.city || "",
        state: editAddress.state || "",
        postalCode: editAddress.postalCode || "",
        latitude: editAddress.latitude ?? null,
        longitude: editAddress.longitude ?? null,
      });
    }
  }, [editAddress]);

  useEffect(() => {
    if (route.params?.pickedLocation) {
      const loc = route.params.pickedLocation;
      setForm((prev) => ({
        ...prev,
        line1: loc.line1 || loc.displayName || prev.line1,
        line2: loc.line2 || prev.line2,
        city: loc.city || prev.city,
        state: loc.state || prev.state,
        postalCode: loc.postalCode || prev.postalCode,
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));
      navigation.setParams({ pickedLocation: undefined });
    }
  }, [route.params?.pickedLocation]);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const applyPickedAddress = useCallback((loc) => {
    setForm((prev) => ({
      ...prev,
      line1: loc.line1 || loc.displayName || prev.line1,
      line2: loc.line2 || prev.line2,
      city: loc.city || prev.city,
      state: loc.state || prev.state,
      postalCode: loc.postalCode || prev.postalCode,
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
  }, []);

  const handleUseCurrentAddress = useCallback(async () => {
    try {
      const shouldAsk = await explainPermission({ title: "Location permission", message: permissionMessages.location });
      if (!shouldAsk) return;
      setIsPickingCurrentAddress(true);
      updatePrivacyConsent({ location: true });
      const loc = await getCurrentAddress();
      applyPickedAddress(loc);
    } catch (err) {
      Alert.alert("Location unavailable", err.message || "Could not pick your current address.");
    } finally {
      setIsPickingCurrentAddress(false);
    }
  }, [applyPickedAddress]);

  const handlePickOnMap = () => {
    navigation.navigate("AddressMapPicker", { returnRoute: "AddressForm" });
  };

  const handleSave = async () => {
    if (!form.line1 || !form.city) {
      Alert.alert("Missing Fields", "Please fill in address line and city.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        label: form.label || "HOME",
        fullName: form.fullName,
        phone: form.phone,
        line1: form.line1,
        line2: form.line2 || null,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        latitude: form.latitude,
        longitude: form.longitude,
      };
      if (editAddress) {
        await updateAddress(editAddress.id, payload);
      } else {
        await addAddress(payload);
      }
      Alert.alert("Saved", "Address saved successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to save address.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F5F5F5]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          >
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">
            {editAddress ? "Edit Address" : "Add Address"}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" keyboardShouldPersistTaps="handled">
        <View className="rounded-3xl bg-white p-6 shadow-sm space-y-4">
          <TextInput
            placeholder="Label (Home / Work / Other)"
            placeholderTextColor={colors.slate[500]}
            value={form.label}
            onChangeText={(t) => handleChange("label", t)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
          />
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={colors.slate[500]}
            value={form.fullName}
            onChangeText={(t) => handleChange("fullName", t)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
          />
          <TextInput
            placeholder="Phone Number"
            placeholderTextColor={colors.slate[500]}
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(t) => handleChange("phone", t)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
          />
          <TextInput
            placeholder="House / Flat / Building"
            placeholderTextColor={colors.slate[500]}
            value={form.line1}
            onChangeText={(t) => handleChange("line1", t)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
          />
          <TextInput
            placeholder="Landmark (optional)"
            placeholderTextColor={colors.slate[500]}
            value={form.line2}
            onChangeText={(t) => handleChange("line2", t)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
          />
          <View className="flex-row gap-3">
            <TextInput
              placeholder="City"
              placeholderTextColor={colors.slate[500]}
              value={form.city}
              onChangeText={(t) => handleChange("city", t)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
            />
            <TextInput
              placeholder="State"
              placeholderTextColor={colors.slate[500]}
              value={form.state}
              onChangeText={(t) => handleChange("state", t)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
            />
          </View>
          <TextInput
            placeholder="Postal Code"
            placeholderTextColor={colors.slate[500]}
            keyboardType="number-pad"
            value={form.postalCode}
            onChangeText={(t) => handleChange("postalCode", t)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
          />

          {form.latitude != null && form.longitude != null ? (
            <View className="flex-row items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
              <Check size={16} color="#059669" />
              <Text className="text-sm text-emerald-700">
                Coordinates set: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
              </Text>
            </View>
          ) : null}

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleUseCurrentAddress}
              disabled={isPickingCurrentAddress}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 disabled:bg-slate-300"
            >
              {isPickingCurrentAddress ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Navigation size={18} color="#fff" />
              )}
              <Text className="font-bold text-white">
                {isPickingCurrentAddress ? "Picking..." : "Current"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePickOnMap}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/50 py-4"
            >
              <MapPin size={18} color={colors.brand[600]} />
              <Text className="font-bold text-indigo-600">Map</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className="rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200 items-center justify-center"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-base font-extrabold text-white">
                {editAddress ? "Update Address" : "Save Address"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
