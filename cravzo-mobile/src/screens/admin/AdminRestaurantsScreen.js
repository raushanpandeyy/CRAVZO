import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from "react-native";
import { Search, Store, Star, MapPin, ChevronRight, X } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getRestaurants, updateRestaurantStatus } from "../../services/adminService";

export default function AdminRestaurantsScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = query ? { search: query } : {};
      const data = await getRestaurants(params);
      setRestaurants(data);
    } catch (err) {
      console.error("Admin restaurants load error:", err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const handleStatusToggle = (restaurant) => {
    const newStatus = restaurant.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    Alert.alert(
      `${newStatus === "ACTIVE" ? "Activate" : "Deactivate"} Restaurant`,
      `${newStatus === "ACTIVE" ? "Activate" : "Deactivate"} ${restaurant.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: newStatus === "ACTIVE" ? "Activate" : "Deactivate",
          style: newStatus === "INACTIVE" ? "destructive" : "default",
          onPress: async () => {
            try {
              await updateRestaurantStatus(restaurant.id, newStatus);
              setRestaurants((prev) => prev.map((r) => r.id === restaurant.id ? { ...r, status: newStatus } : r));
            } catch { Alert.alert("Error", "Failed to update"); }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <Text className="text-xl font-extrabold text-slate-900">Restaurant Management</Text>
        <View className="flex-row items-center bg-slate-50 rounded-xl px-4 h-11 mt-3 border border-slate-200">
          <Search size={16} color="#94a3b8" />
          <TextInput className="flex-1 ml-2 text-sm text-slate-900" placeholder="Search restaurants..."
            placeholderTextColor="#94a3b8"
            value={query} onChangeText={setQuery} onSubmitEditing={load} />
          {query ? <TouchableOpacity onPress={() => { setQuery(""); }}><X size={16} color="#94a3b8" /></TouchableOpacity> : null}
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4 space-y-3 pb-8">
        {loading ? (
          <ActivityIndicator size="large" color={colors.brand[600]} style={{ marginTop: 40 }} />
        ) : restaurants.length === 0 ? (
          <View className="items-center py-20">
            <Text className="text-sm text-slate-500">No restaurants found</Text>
          </View>
        ) : (
          restaurants.map((r) => (
            <TouchableOpacity key={r.id} className="bg-white rounded-3xl p-4 shadow-sm" onPress={() => handleStatusToggle(r)}>
              <View className="flex-row items-center gap-3">
                <View className="h-14 w-14 rounded-2xl bg-amber-50 items-center justify-center">
                  <Store size={26} color="#d97706" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-bold text-slate-900">{r.name}</Text>
                    <View className={`rounded-full px-2 py-0.5 ${r.status === "ACTIVE" ? "bg-emerald-50" : "bg-amber-50"}`}>
                      <Text className={`text-[9px] font-extrabold ${r.status === "ACTIVE" ? "text-emerald-600" : "text-amber-600"}`}>
                        {r.status}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-slate-500 mt-0.5">{r.cuisine || ""}</Text>
                  <View className="flex-row items-center gap-3 mt-1">
                    <View className="flex-row items-center gap-1">
                      <Star size={10} color="#f59e0b" fill="#f59e0b" />
                      <Text className="text-xs font-bold text-slate-700">{r.rating || "0"}</Text>
                    </View>
                    <Text className="text-xs text-slate-400">{r._count?.orders || 0} orders</Text>
                    <View className="flex-row items-center gap-1">
                      <MapPin size={10} color={colors.slate[400]} />
                      <Text className="text-xs text-slate-400">{r.city || ""}</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.slate[400]} />
              </View>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity className="flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200">
          <Text className="font-extrabold text-white">+ Add Restaurant</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
