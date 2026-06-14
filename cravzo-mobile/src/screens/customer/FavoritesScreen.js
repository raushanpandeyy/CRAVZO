import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Heart, Star, Clock3, ChevronLeft } from "lucide-react-native";
import { colors } from "../../constants/colors";

const sampleFavorites = [
  { id: "1", name: "Punjab Grill", cuisine: "North Indian • Punjabi", rating: "4.5", deliveryTime: "25-35 min", imageUrl: null },
  { id: "2", name: "Sagar Ratna", cuisine: "South Indian • Healthy", rating: "4.3", deliveryTime: "20-30 min", imageUrl: null },
];

export default function FavoritesScreen({ navigation }) {
  const [favorites] = useState(sampleFavorites);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">My Favourites</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        {favorites.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Heart size={48} color="#94a3b8" />
            <Text className="text-lg font-bold text-slate-900 mt-4">No favourites yet</Text>
            <Text className="text-sm text-slate-500 mt-1">Save your favourite restaurants here</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {favorites.map((fav) => (
              <TouchableOpacity key={fav.id} className="bg-white rounded-3xl overflow-hidden shadow-sm">
                <View className="h-32 bg-slate-100 items-center justify-center">
                  <Text className="text-4xl font-black text-indigo-200">{fav.name[0]}</Text>
                </View>
                <View className="p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-slate-900">{fav.name}</Text>
                    <TouchableOpacity className="h-8 w-8 items-center justify-center rounded-full bg-rose-50">
                      <Heart size={16} color={colors.rose[500]} fill={colors.rose[500]} />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-xs text-slate-500 mt-1">{fav.cuisine}</Text>
                  <View className="flex-row items-center gap-4 mt-2">
                    <View className="flex-row items-center gap-1 bg-emerald-600 rounded-full px-2 py-0.5">
                      <Star size={10} color="#fff" fill="#fff" />
                      <Text className="text-[10px] font-black text-white">{fav.rating}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Clock3 size={12} color={colors.brand[700]} />
                      <Text className="text-xs font-bold text-slate-700">{fav.deliveryTime}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
