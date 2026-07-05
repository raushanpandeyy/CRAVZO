import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Switch,
  ActivityIndicator, Alert, Image,
} from "react-native";
import {
  Store, Clock, CreditCard, MapPin, ImagePlus, Edit,
  CheckCircle, ChevronRight, LogOut, User, Save, Phone,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../constants/colors";
import { getMyRestaurant, createRestaurant, updateRestaurant, uploadImage } from "../../services/vendorService";
import { clearSession } from "../../services/authService";
import { useDispatch } from "react-redux";
import { clearUser } from "../../store/slices/userSlice";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const emptyProfile = {
  name: "",
  description: "",
  cuisine: "",
  phone: "",
  imageUrl: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  latitude: null,
  longitude: null,
  isOpen: true,
  openingTime: "09:00",
  closingTime: "22:00",
  openDays: [...DAYS_OF_WEEK],
  bankDetails: {
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
  },
};

function VerifiedBadge({ restaurant }) {
  if (!restaurant) return null;
  const fields = [restaurant.name, restaurant.cuisine, restaurant.phone, restaurant.imageUrl, restaurant.addressLine1, restaurant.city, restaurant.state, restaurant.postalCode];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);
  const complete = pct >= 85;
  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
      <View className="flex-row items-center gap-2 mb-3">
        {complete ? (
          <>
            <CheckCircle size={18} color="#059669" />
            <Text className="text-sm font-extrabold text-emerald-700">Verified Partner</Text>
          </>
        ) : (
          <>
            <Store size={18} color="#d97706" />
            <Text className="text-sm font-extrabold text-amber-700">Profile Incomplete</Text>
          </>
        )}
      </View>
      <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <View className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
      </View>
      <Text className="text-xs text-slate-500 mt-1">{pct}% complete ({filled}/{fields.length})</Text>
    </View>
  );
}

export default function VendorProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const [restaurant, setRestaurant] = useState(null);
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyRestaurant();
      setRestaurant(data);
      if (data) {
        setForm({
          name: data.name || "",
          description: data.description || "",
          cuisine: data.cuisine || "",
          phone: data.phone || "",
          imageUrl: data.imageUrl || "",
          addressLine1: data.addressLine1 || "",
          addressLine2: data.addressLine2 || "",
          city: data.city || "",
          state: data.state || "",
          postalCode: data.postalCode || "",
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          isOpen: data.isOpen ?? true,
          openingTime: data.openingTime || "09:00",
          closingTime: data.closingTime || "22:00",
          openDays: data.openDays?.length ? data.openDays : [...DAYS_OF_WEEK],
          bankDetails: {
            accountHolderName: data.bankDetails?.accountHolderName || "",
            bankName: data.bankDetails?.bankName || "",
            accountNumber: data.bankDetails?.accountNumber || "",
            ifsc: data.bankDetails?.ifsc || "",
          },
        });
      }
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBankChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value },
    }));
  };

  const toggleOpenDay = (day) => {
    setForm((prev) => ({
      ...prev,
      openDays: prev.openDays.includes(day)
        ? prev.openDays.filter((d) => d !== day)
        : [...prev.openDays, day],
    }));
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera roll permission is needed to select a photo");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    setUploadingImage(true);
    try {
      const uploadRes = await uploadImage({ dataUrl: `data:${asset.mimeType};base64,${asset.base64}`, folder: "restaurants" });
      const url = uploadRes.data?.url || uploadRes.url || uploadRes.secure_url;
      if (url) setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      Alert.alert("Upload Failed", "Could not upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setError("GPS not available on this device.");
      return;
    }
    setError("");
    setMessage("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setMessage(`Location captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => {
        setError("Could not get location. Allow GPS permission and try again.");
        setMessage("");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleSave = async () => {
    setMessage("");
    setError("");
    if (!form.name || !form.cuisine || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.postalCode) {
      setError("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        cuisine: form.cuisine,
        phone: form.phone,
        imageUrl: form.imageUrl || null,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || null,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        isOpen: form.isOpen,
        openingTime: form.openingTime,
        closingTime: form.closingTime,
        openDays: form.openDays,
        latitude: form.latitude ?? null,
        longitude: form.longitude ?? null,
        bankDetails: form.bankDetails.accountHolderName || form.bankDetails.bankName
          ? form.bankDetails
          : null,
      };
      const saved = restaurant?.id
        ? await updateRestaurant(restaurant.id, payload)
        : await createRestaurant(payload);
      setRestaurant(saved);
      setMessage(restaurant ? "Restaurant updated successfully!" : "Restaurant created successfully!");
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => {
        clearSession();
        dispatch(clearUser());
      }},
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      <View className="bg-indigo-950 pt-16 pb-8 px-4 rounded-b-[28px]">
        <View className="items-center">
          <View className="h-20 w-20 rounded-2xl bg-indigo-600 items-center justify-center mb-3 border-2 border-indigo-400">
            {form.imageUrl ? (
              <Image source={{ uri: form.imageUrl }} className="h-20 w-20 rounded-2xl" />
            ) : (
              <Store size={36} color="#fff" />
            )}
          </View>
          <Text className="text-xl font-extrabold text-white">{form.name || "Restaurant"}</Text>
          <Text className="text-sm text-indigo-200 mt-1">{restaurant?.email || ""}</Text>
          <View className="flex-row items-center gap-1 mt-2 bg-white/10 rounded-full px-3 py-1">
            <Store size={12} color="#a5b4fc" />
            <Text className="text-xs font-bold text-indigo-200">Vendor</Text>
          </View>
        </View>
      </View>

      <View className="px-4 -mt-4">
        <VerifiedBadge restaurant={restaurant} />

        {message ? (
          <View className="bg-emerald-50 rounded-2xl px-4 py-3 mb-3">
            <Text className="text-sm text-emerald-700">{message}</Text>
          </View>
        ) : null}
        {error ? (
          <View className="bg-red-50 rounded-2xl px-4 py-3 mb-3">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        ) : null}

        {/* Restaurant Basics */}
        <View className="bg-white rounded-3xl p-5 shadow-sm mb-4">
          <View className="flex-row items-center gap-2 mb-5">
            <Edit size={18} color={colors.slate[700]} />
            <Text className="text-lg font-extrabold text-slate-900">Restaurant Basics</Text>
          </View>

          <View className="gap-4">
            <View>
              <Text className="text-sm font-semibold text-slate-700 mb-2">Restaurant Name *</Text>
              <TextInput
                value={form.name}
                onChangeText={(v) => handleInputChange("name", v)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                placeholder="Dodago Kitchen"
                placeholderTextColor={colors.slate[400]}
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-slate-700 mb-2">Cuisine *</Text>
              <TextInput
                value={form.cuisine}
                onChangeText={(v) => handleInputChange("cuisine", v)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                placeholder="North Indian"
                placeholderTextColor={colors.slate[400]}
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-slate-700 mb-2">Phone Number *</Text>
              <TextInput
                value={form.phone}
                onChangeText={(v) => handleInputChange("phone", v)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor={colors.slate[400]}
                keyboardType="phone-pad"
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-slate-700 mb-2">Description</Text>
              <TextInput
                value={form.description}
                onChangeText={(v) => handleInputChange("description", v)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 min-h-[80px]"
                placeholder="Describe your restaurant..."
                placeholderTextColor={colors.slate[400]}
                multiline
                numberOfLines={3}
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-slate-700 mb-2">Restaurant Image</Text>
              {form.imageUrl ? (
                <Image source={{ uri: form.imageUrl }} className="w-full h-40 rounded-2xl mb-2" />
              ) : null}
              <TouchableOpacity
                onPress={handlePickImage}
                className="flex-row items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3"
              >
                <ImagePlus size={16} color={colors.slate[600]} />
                <Text className="text-sm font-medium text-slate-700">
                  {uploadingImage ? "Uploading..." : "Upload Restaurant Image"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Address */}
        <View className="bg-white rounded-3xl p-5 shadow-sm mb-4">
          <View className="flex-row items-center gap-2 mb-5">
            <MapPin size={18} color={colors.slate[700]} />
            <Text className="text-lg font-extrabold text-slate-900">Restaurant Address</Text>
            <Text className="ml-auto text-xs text-slate-400">Required for customers</Text>
          </View>

          <TouchableOpacity
            onPress={handleGPS}
            className="flex-row items-center justify-between bg-indigo-50 rounded-2xl p-3 mb-4"
          >
            <View className="flex-1">
              <Text className="text-sm font-bold text-indigo-900">Set Location from GPS</Text>
              <Text className="text-xs text-indigo-600 mt-0.5">
                {form.latitude && form.longitude
                  ? `✓ Set (${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)})`
                  : "Not set — customers won't find you"}
              </Text>
            </View>
            <View className="bg-indigo-600 rounded-xl px-4 py-2">
              <Text className="text-sm font-bold text-white">Use GPS</Text>
            </View>
          </TouchableOpacity>

          <View className="gap-3">
            <TextInput
              value={form.addressLine1}
              onChangeText={(v) => handleInputChange("addressLine1", v)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              placeholder="Address Line 1 *"
              placeholderTextColor={colors.slate[400]}
            />
            <TextInput
              value={form.addressLine2}
              onChangeText={(v) => handleInputChange("addressLine2", v)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              placeholder="Address Line 2"
              placeholderTextColor={colors.slate[400]}
            />
            <View className="flex-row gap-3">
              <TextInput
                value={form.city}
                onChangeText={(v) => handleInputChange("city", v)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                placeholder="City *"
                placeholderTextColor={colors.slate[400]}
              />
              <TextInput
                value={form.state}
                onChangeText={(v) => handleInputChange("state", v)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                placeholder="State *"
                placeholderTextColor={colors.slate[400]}
              />
            </View>
            <TextInput
              value={form.postalCode}
              onChangeText={(v) => handleInputChange("postalCode", v)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              placeholder="Postal Code *"
              placeholderTextColor={colors.slate[400]}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Business Hours */}
        <View className="bg-white rounded-3xl p-5 shadow-sm mb-4">
          <View className="flex-row items-center gap-2 mb-5">
            <Clock size={18} color={colors.slate[700]} />
            <Text className="text-lg font-extrabold text-slate-900">Business Hours</Text>
          </View>

          <View className="flex-row gap-3 mb-5">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-slate-700 mb-2">Opening Time</Text>
              <TextInput
                value={form.openingTime}
                onChangeText={(v) => handleInputChange("openingTime", v)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                placeholder="09:00"
                placeholderTextColor={colors.slate[400]}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-slate-700 mb-2">Closing Time</Text>
              <TextInput
                value={form.closingTime}
                onChangeText={(v) => handleInputChange("closingTime", v)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                placeholder="22:00"
                placeholderTextColor={colors.slate[400]}
              />
            </View>
          </View>

          <Text className="text-sm font-semibold text-slate-700 mb-3">Open Days</Text>
          <View className="flex-row flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <TouchableOpacity
                key={day}
                onPress={() => toggleOpenDay(day)}
                className={`px-4 py-2 rounded-full ${form.openDays.includes(day) ? "bg-indigo-600" : "bg-slate-100"}`}
              >
                <Text className={`text-sm font-medium ${form.openDays.includes(day) ? "text-white" : "text-slate-600"}`}>
                  {day.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-xs text-slate-500 mt-2">Selected: {form.openDays.length} days</Text>
        </View>

        {/* Bank Details */}
        <View className="bg-white rounded-3xl p-5 shadow-sm mb-4">
          <View className="flex-row items-center gap-2 mb-5">
            <CreditCard size={18} color={colors.slate[700]} />
            <Text className="text-lg font-extrabold text-slate-900">Bank Details</Text>
          </View>

          <View className="gap-3">
            <TextInput
              value={form.bankDetails.accountHolderName}
              onChangeText={(v) => handleBankChange("accountHolderName", v)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              placeholder="Account Holder Name"
              placeholderTextColor={colors.slate[400]}
            />
            <TextInput
              value={form.bankDetails.bankName}
              onChangeText={(v) => handleBankChange("bankName", v)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              placeholder="Bank Name"
              placeholderTextColor={colors.slate[400]}
            />
            <View className="flex-row gap-3">
              <TextInput
                value={form.bankDetails.accountNumber}
                onChangeText={(v) => handleBankChange("accountNumber", v)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                placeholder="Account Number"
                placeholderTextColor={colors.slate[400]}
                keyboardType="numeric"
              />
              <TextInput
                value={form.bankDetails.ifsc}
                onChangeText={(v) => handleBankChange("ifsc", v)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                placeholder="IFSC Code"
                placeholderTextColor={colors.slate[400]}
              />
            </View>
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="flex-row items-center justify-center gap-2 bg-indigo-600 rounded-2xl py-3.5 active:opacity-80 disabled:opacity-60 mb-4"
        >
          <Save size={16} color="#fff" />
          <Text className="text-sm font-extrabold text-white">
            {saving ? "Saving..." : restaurant ? "Save Restaurant Profile" : "Create Restaurant"}
          </Text>
        </TouchableOpacity>

        {/* Profile menu items */}
        <View className="bg-white rounded-3xl p-2 shadow-sm mb-4">
          {[
            { icon: Clock, label: "Business Hours" },
            { icon: CreditCard, label: "Earnings & Reports", color: "#10b981" },
            { icon: User, label: "Reviews", color: "#6366f1" },
            { icon: Phone, label: "Support Chat", color: "#8b5cf6" },
            { icon: MapPin, label: "Delivery Area", color: "#ef4444" },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              className={`flex-row items-center gap-4 px-4 py-4 ${i < arr.length - 1 ? "border-b border-slate-100" : ""}`}
              onPress={() => {
                if (item.label === "Support Chat") navigation.navigate("Chat");
                else if (item.label === "Earnings & Reports") navigation.navigate("Earnings");
                else if (item.label === "Delivery Area") navigation.navigate("DeliveryArea");
                else Alert.alert(item.label, "Coming soon");
              }}
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color || "#f59e0b"}15` }}>
                <item.icon size={20} color={item.color || "#f59e0b"} />
              </View>
              <Text className="flex-1 font-bold text-slate-900">{item.label}</Text>
              <ChevronRight size={18} color={colors.slate[400]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center gap-4 bg-white rounded-3xl p-4 shadow-sm mb-8"
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
            <LogOut size={20} color={colors.red[600]} />
          </View>
          <Text className="font-extrabold text-rose-600">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
