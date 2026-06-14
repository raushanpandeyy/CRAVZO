import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Search, MapPin, Utensils, X } from "lucide-react-native";
import { colors } from "../../constants/colors";

export default function RestaurantListScreen() {
  const [query, setQuery] = useState("");

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="px-4 pt-16 pb-2 bg-white shadow-sm">
        <View className="flex-row items-center bg-white rounded-xl border border-slate-200 px-4 h-12 shadow-sm">
          <Search size={18} color={colors.accent.coral} />
          <TextInput
            className="flex-1 ml-3 text-sm font-semibold text-slate-900"
            placeholder='Search for dishes or restaurants...'
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="items-center justify-center py-20">
          <Utensils size={40} color="#94a3b8" />
          <Text className="mt-3 text-sm font-semibold text-slate-500">
            Search for restaurants and dishes
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
