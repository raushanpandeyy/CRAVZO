import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from "react-native";
import { ChevronLeft, Camera, Bike, MapPin, Check } from "lucide-react-native";
import OptimizedImage from "../../components/OptimizedImage";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../constants/colors";
import { getMyProfile } from "../../services/riderService";
import { updateProfile, uploadImage } from "../../services/userService";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/slices/userSlice";
import { normalizeUser } from "../../services/authService";

const VEHICLE_TYPES = ["Bike", "Scooter", "Cycle"];

const mapVehicleTypeToApi = (type) => {
  if (type === "Cycle") return "BICYCLE";
  return "BIKE";
};

const mapVehicleTypeFromApi = (type) => {
  if (type === "BICYCLE") return "Cycle";
  return "Bike";
};

export default function RiderEditProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [vehicleType, setVehicleType] = useState("Bike");
  const [vehicleNumber, setVehicleNumber] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const prof = await getMyProfile();
        setName(prof.name || "");
        setAvatarUrl(prof.avatarUrl || "");
        if (prof.vehicleDetails) {
          setVehicleType(mapVehicleTypeFromApi(prof.vehicleDetails.type));
          setVehicleNumber(prof.vehicleDetails.registrationNumber || "");
        }
      } catch (err) {
        console.error("Load profile error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera roll permission is needed to select a photo");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset.base64) return;

    setSaving(true);
    try {
      const uploadRes = await uploadImage({ dataUrl: `data:${asset.mimeType};base64,${asset.base64}`, folder: "avatars" });
      const url = uploadRes.data?.url || uploadRes.url || uploadRes.secure_url;
      if (url) setAvatarUrl(url);
    } catch (err) {
      Alert.alert("Upload Failed", "Could not upload image");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        vehicleDetails: {
          type: mapVehicleTypeToApi(vehicleType),
          registrationNumber: vehicleNumber.trim() || undefined,
        },
      };
      if (avatarUrl) payload.avatarUrl = avatarUrl;

      const updated = await updateProfile(payload);
      const user = normalizeUser(updated.user || updated);
      dispatch(setUser(user));
      Alert.alert("Success", "Profile updated", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F5F5] items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Edit Profile</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="items-center mb-6">
          <TouchableOpacity onPress={handlePickImage} className="relative">
            {avatarUrl ? (
              <OptimizedImage source={{ uri: avatarUrl }} className="h-24 w-24 rounded-full border-2 border-indigo-200" />
            ) : (
              <View className="h-24 w-24 rounded-full bg-indigo-100 items-center justify-center border-2 border-indigo-200">
                <Bike size={36} color={colors.brand[600]} />
              </View>
            )}
            <View className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-indigo-600 items-center justify-center border-2 border-white">
              <Camera size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text className="text-xs text-slate-500 mt-2">Tap to change photo</Text>
        </View>

        <View className="bg-white rounded-3xl p-5 shadow-sm mb-4">
          <Text className="text-sm font-bold text-slate-700 mb-1">Full Name</Text>
          <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4">
            <TextInput className="flex-1 py-3 text-base font-medium text-slate-900"
              placeholder="Your name" placeholderTextColor="#94a3b8"
              value={name} onChangeText={setName} />
          </View>
        </View>

        <View className="bg-white rounded-3xl p-5 shadow-sm mb-4">
          <Text className="text-lg font-extrabold text-slate-900 mb-4">Vehicle Details</Text>
          <Text className="text-sm font-bold text-slate-700 mb-2">Vehicle Type</Text>
          <View className="flex-row gap-3 mb-4">
            {VEHICLE_TYPES.map((type) => (
              <TouchableOpacity key={type} onPress={() => setVehicleType(type)}
                className={`flex-1 py-3 rounded-xl items-center border-2 ${vehicleType === type ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-slate-50"}`}>
                <Bike size={20} color={vehicleType === type ? colors.brand[600] : colors.slate[500]} />
                <Text className={`text-xs font-bold mt-1 ${vehicleType === type ? "text-indigo-600" : "text-slate-500"}`}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-sm font-bold text-slate-700 mb-1">Vehicle Number</Text>
          <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4">
            <MapPin size={16} color={colors.slate[400]} />
            <TextInput className="flex-1 ml-2 py-3 text-base font-medium text-slate-900"
              placeholder="e.g. DL-01-AB-1234" placeholderTextColor="#94a3b8"
              value={vehicleNumber} onChangeText={setVehicleNumber}
              autoCapitalize="characters" />
          </View>
        </View>

        <TouchableOpacity onPress={handleSave} disabled={saving}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-950 py-4 shadow-lg shadow-indigo-950/20 mb-8">
          <Check size={20} color="#fff" />
          <Text className="font-extrabold text-white">{saving ? "Saving..." : "Save Changes"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
