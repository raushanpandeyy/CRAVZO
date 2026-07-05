import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import {
  User,
  Mail,
  Phone,
  Camera,
  Bell,
  Save,
  MapPin,
  Heart,
  Star,
  CreditCard,
  MessageCircle,
  Info,
  Shield,
  ChevronRight,
  LogOut,
  Calendar,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getProfile, updateProfile } from "../../services/userService";
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from "../../services/notificationService";
import { useDispatch, useSelector } from "react-redux";
import { setUser, clearUser, setShowAuthModal } from "../../store/slices/userSlice";
import { normalizeUser, clearSession } from "../../services/authService";
import { storage } from "../../services/storage";

const menuItems = [
  { icon: MapPin, label: "Addresses", color: "#4f46e5", screen: "Addresses" },
  { icon: Heart, label: "Favourites", color: "#f43f5e", screen: "Favorites" },
  { icon: Star, label: "Reviews", color: "#f59e0b", screen: "Reviews" },
  { icon: CreditCard, label: "Payments", color: "#10b981", screen: "PaymentMethods" },
  { icon: MessageCircle, label: "Support Chat", color: "#8b5cf6", screen: "CustomerChat" },
];

const infoItems = [
  { icon: Info, label: "About Us", screen: "AboutUs" },
  { icon: Phone, label: "Contact Us", screen: "ContactUs" },
  { icon: Shield, label: "Privacy Policy", screen: "PrivacyPolicy" },
];

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isLoggedIn } = useSelector((state) => state.user);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", avatarUrl: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    storage.getString("dodagoNotifGranted") === "true"
  );
  const [togglingNotif, setTogglingNotif] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError("");
    try {
      const user = await getProfile();
      setProfile(user);
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
      });
      dispatch(setUser(normalizeUser(user)));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [dispatch, isLoggedIn]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarTap = () => {
    Alert.alert("Change Profile Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: () =>
          Alert.alert(
            "Coming Soon",
            "Camera capture requires expo-image-picker. Install it to enable this feature."
          ),
      },
      {
        text: "Choose from Gallery",
        onPress: () =>
          Alert.alert(
            "Coming Soon",
            "Gallery picker requires expo-image-picker. Install it to enable this feature."
          ),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const updatedUser = await updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        avatarUrl: form.avatarUrl || null,
      });
      setProfile(updatedUser);
      setForm({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        avatarUrl: updatedUser.avatarUrl || "",
      });
      dispatch(setUser(normalizeUser(updatedUser)));
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async (value) => {
    setTogglingNotif(true);
    setMessage("");
    setError("");
    try {
      if (value) {
        const token = await registerForPushNotifications();
        if (token) {
          setNotificationsEnabled(true);
          setMessage("Notifications enabled successfully.");
        } else {
          setError("Failed to enable notifications. Check device permissions.");
          setNotificationsEnabled(false);
        }
      } else {
        await unregisterPushNotifications();
        setNotificationsEnabled(false);
        setMessage("Notifications disabled.");
      }
    } catch (err) {
      setError(err.message || "Failed to toggle notifications");
      setNotificationsEnabled(!value);
    } finally {
      setTogglingNotif(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          clearSession();
          dispatch(clearUser());
        },
      },
    ]);
  };

  if (!isLoggedIn) {
    return (
      <View className="flex-1 bg-[#F4F7FB] items-center justify-center px-6">
        <View className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm items-center">
          <View className="h-16 w-16 rounded-2xl bg-indigo-50 items-center justify-center mb-4">
            <User size={32} color={colors.brand[600]} />
          </View>
          <Text className="text-xl font-extrabold text-slate-900 mb-2">
            Login Required
          </Text>
          <Text className="text-sm text-slate-500 text-center leading-6 mb-6">
            Please log in or create an account to manage your profile.
          </Text>
          <TouchableOpacity
            onPress={() => dispatch(setShowAuthModal(true))}
            className="bg-indigo-600 rounded-2xl py-3.5 px-8 w-full items-center active:opacity-80"
          >
            <Text className="text-sm font-extrabold text-white">
              Login / Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const previewAvatar = form.avatarUrl || null;
  const initialLetter = (form.name || "U").charAt(0).toUpperCase();

  if (loading) {
    return (
      <View className="flex-1 bg-[#F4F7FB] items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#F4F7FB]">
      <View className="bg-indigo-950 pt-16 pb-10 px-4 rounded-b-[28px]">
        <View className="items-center">
          <TouchableOpacity onPress={handleAvatarTap} className="relative mb-3">
            {previewAvatar ? (
              <Image
                source={{ uri: previewAvatar }}
                className="h-20 w-20 rounded-full border-2 border-indigo-400"
              />
            ) : (
              <View className="h-20 w-20 rounded-full bg-indigo-600 items-center justify-center border-2 border-indigo-400">
                <Text className="text-3xl font-extrabold text-white">
                  {initialLetter}
                </Text>
              </View>
            )}
            <View className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-amber-400 items-center justify-center border-2 border-indigo-950">
              <Camera size={12} color="#1e1b4b" />
            </View>
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-white">
            {form.name || "User"}
          </Text>
          <Text className="text-sm text-indigo-200 mt-1">{form.email || ""}</Text>
          <View className="flex-row items-center gap-1 mt-2 bg-white/10 rounded-full px-3 py-1">
            <User size={12} color="#a5b4fc" />
            <Text className="text-xs font-bold text-indigo-200">
              {profile?.role || "CUSTOMER"}
            </Text>
          </View>
        </View>
      </View>

      <View className="px-4 -mt-4">
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

        <View className="bg-white rounded-3xl p-5 shadow-sm">
          <Text className="text-lg font-extrabold text-slate-900">
            Personal Details
          </Text>
          <Text className="text-sm text-slate-500 mt-1">
            Keep your details up to date.
          </Text>

          <View className="mt-5 gap-4">
            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">
                Full Name
              </Text>
              <View className="flex-row items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <User size={16} color={colors.slate[400]} />
                <TextInput
                  value={form.name}
                  onChangeText={(v) => handleFieldChange("name", v)}
                  className="flex-1 text-sm text-slate-900"
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.slate[400]}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">
                Email
              </Text>
              <View className="flex-row items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <Mail size={16} color={colors.slate[400]} />
                <TextInput
                  value={form.email}
                  onChangeText={(v) => handleFieldChange("email", v)}
                  className="flex-1 text-sm text-slate-900"
                  placeholder="Enter your email"
                  placeholderTextColor={colors.slate[400]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">
                Phone Number
              </Text>
              <View className="flex-row items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <Phone size={16} color={colors.slate[400]} />
                <TextInput
                  value={form.phone}
                  onChangeText={(v) => handleFieldChange("phone", v)}
                  className="flex-1 text-sm text-slate-900"
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.slate[400]}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="flex-row items-center justify-center gap-2 bg-indigo-600 rounded-2xl py-3.5 mt-5 active:opacity-80 disabled:opacity-60"
          >
            <Save size={16} color="#fff" />
            <Text className="text-sm font-extrabold text-white">
              {saving ? "Saving..." : "Save Profile"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-3xl p-5 shadow-sm mt-4">
          <Text className="text-lg font-extrabold text-slate-900">
            Account Info
          </Text>
          <View className="mt-3 gap-3">
            <View className="flex-row items-center gap-3">
              <User size={16} color={colors.slate[500]} />
              <Text className="text-sm text-slate-600">
                <Text className="font-medium text-slate-700">Role: </Text>
                {profile?.role || "CUSTOMER"}
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Shield size={16} color={colors.slate[500]} />
              <Text className="text-sm text-slate-600">
                <Text className="font-medium text-slate-700">Status: </Text>
                {profile?.status || "ACTIVE"}
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Calendar size={16} color={colors.slate[500]} />
              <Text className="text-sm text-slate-600">
                <Text className="font-medium text-slate-700">Joined: </Text>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Recently"}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-3xl p-5 shadow-sm mt-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <Bell size={20} color={colors.brand[600]} />
              </View>
              <View>
                <Text className="font-bold text-slate-900">Notifications</Text>
                <Text className="text-xs text-slate-500">
                  Receive order updates
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              disabled={togglingNotif}
              trackColor={{ false: "#e2e8f0", true: "#bbf7d0" }}
              thumbColor={notificationsEnabled ? "#22c55e" : "#94a3b8"}
            />
          </View>
        </View>

        <View className="bg-white rounded-3xl p-2 shadow-sm mt-4">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => {
                if (item.screen) {
                  navigation.navigate(item.screen);
                } else {
                  Alert.alert(item.label, "Coming soon");
                }
              }}
              className={`flex-row items-center gap-4 px-4 py-4 ${
                index < menuItems.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <item.icon size={20} color={item.color} />
              </View>
              <Text className="flex-1 font-bold text-slate-900">
                {item.label}
              </Text>
              <ChevronRight size={18} color={colors.slate[400]} />
            </TouchableOpacity>
          ))}
        </View>

        <View className="bg-white rounded-3xl p-2 shadow-sm mt-4">
          {infoItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => navigation.navigate(item.screen)}
              className={`flex-row items-center gap-4 px-4 py-4 ${
                index < infoItems.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <item.icon size={20} color={colors.slate[600]} />
              </View>
              <Text className="flex-1 font-bold text-slate-900">
                {item.label}
              </Text>
              <ChevronRight size={18} color={colors.slate[400]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center gap-4 bg-white rounded-3xl p-4 shadow-sm mt-4 mb-8"
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
