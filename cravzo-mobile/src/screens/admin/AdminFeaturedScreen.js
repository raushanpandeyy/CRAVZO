import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Switch,
} from "react-native";
import { Star, Trash2, ChevronLeft, Plus, X } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { apiRequest } from "../../services/api";

export default function AdminFeaturedScreen({ navigation }) {
  const [featured, setFeatured] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [featRes, adsRes] = await Promise.all([
        apiRequest("/api/public/featured-restaurants"),
        apiRequest("/api/public/ads"),
      ]);
      setFeatured(featRes.data || []);
      setAds(adsRes.data || []);
    } catch (err) {
      console.error("Featured load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const removeFeatured = async (id) => {
    try {
      await apiRequest(`/api/public/featured-restaurants/${id}`, { method: "DELETE" });
      setFeatured((prev) => prev.filter((f) => f.id !== id));
    } catch { Alert.alert("Error", "Failed to remove"); }
  };

  const removeAd = async (id) => {
    try {
      await apiRequest(`/api/public/ads/${id}`, { method: "DELETE" });
      setAds((prev) => prev.filter((a) => a.id !== id));
    } catch { Alert.alert("Error", "Failed to remove"); }
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
          <Text className="text-xl font-extrabold text-slate-900">Featured & Ads</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="font-bold text-slate-900 mb-3">Featured Restaurants</Text>
        <View className="space-y-3 mb-6">
          {featured.length === 0 ? (
            <View className="bg-white rounded-3xl p-4 items-center">
              <Text className="text-sm text-slate-400">No featured restaurants</Text>
            </View>
          ) : featured.map((f) => (
            <View key={f.id} className="bg-white rounded-3xl p-4 shadow-sm flex-row items-center gap-3">
              <View className="h-14 w-14 rounded-2xl bg-indigo-100 items-center justify-center">
                <Text className="text-xl font-black text-indigo-600">{f.restaurant?.name?.[0] || "R"}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-900">{f.restaurant?.name || "Restaurant"}</Text>
                <Text className="text-xs text-slate-500">Order: {f.order || 0}</Text>
              </View>
              <TouchableOpacity onPress={() => removeFeatured(f.id)}
                className="h-8 w-8 rounded-full bg-rose-50 items-center justify-center">
                <Trash2 size={14} color={colors.red[600]} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text className="font-bold text-slate-900 mb-3">Promotional Ads</Text>
        <View className="space-y-3 mb-8">
          {ads.length === 0 ? (
            <View className="bg-white rounded-3xl p-4 items-center">
              <Text className="text-sm text-slate-400">No ads</Text>
            </View>
          ) : ads.map((ad) => (
            <View key={ad.id} className="bg-white rounded-3xl overflow-hidden shadow-sm">
              <Image source={{ uri: ad.imageUrl }} className="w-full h-32" resizeMode="cover" />
              <View className="p-3 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-bold text-slate-900">{ad.title || "Ad"}</Text>
                  <Text className="text-xs text-slate-500">{ad.link || ""}</Text>
                </View>
                <TouchableOpacity onPress={() => removeAd(ad.id)}
                  className="h-8 w-8 rounded-full bg-rose-50 items-center justify-center">
                  <Trash2 size={14} color={colors.red[600]} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
