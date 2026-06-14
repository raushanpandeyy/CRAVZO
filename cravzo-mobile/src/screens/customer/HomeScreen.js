import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { Star, Clock3, IndianRupee, Smartphone, Search } from "lucide-react-native";
import { colors } from "../../constants/colors";
import {
  burger,
  dosa,
  biryaniplate,
  momos,
  cake,
  chinese,
  indianthali,
  rolls,
  parathe,
  Chaat,
  icecream,
  Snacks,
  southindian,
  salad,
  northindian,
} from "../../constants/images";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const categories = [
  { name: "Burger", image: burger },
  { name: "Dosa", image: dosa },
  { name: "Biryani", image: biryaniplate },
  { name: "Momos", image: momos },
  { name: "Desserts", image: cake },
  { name: "Chinese", image: chinese },
  { name: "Thali", image: indianthali },
  { name: "Rolls", image: rolls },
  { name: "Paratha", image: parathe },
  { name: "Chaat", image: Chaat },
  { name: "Ice Cream", image: icecream },
  { name: "Snacks", image: Snacks },
  { name: "South Indian", image: southindian },
  { name: "Salad", image: salad },
  { name: "North Indian", image: northindian },
];

const PromoCarousel = () => {
  return (
    <View className="w-full h-80 bg-gradient-to-br from-indigo-100 to-indigo-200 items-center justify-center">
      <Text className="text-xl font-black text-indigo-400">CRAVZO</Text>
      <Text className="text-xs font-semibold text-indigo-400 mt-1">
        Affordable food delivery
      </Text>
    </View>
  );
};

export default function HomeScreen() {
  const [query, setQuery] = useState("");

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="relative">
        <TouchableOpacity className="absolute right-4 top-14 z-50">
          <View className="flex-row items-center gap-1 rounded-full bg-indigo-600 px-3 py-1">
            <Smartphone size={12} color="#fff" />
            <Text className="text-[10px] font-extrabold text-white">App</Text>
          </View>
        </TouchableOpacity>
      </View>

      <PromoCarousel />

      <View className="px-4 pt-3 pb-1">
        <View className="flex-row items-center bg-white rounded-xl border-2 border-[#ff6b5f] px-4 h-14">
          <Search size={20} color="#ff6b5f" />
          <TextInput
            className="flex-1 ml-3 text-[15px] font-semibold text-slate-900"
            placeholder="Search"
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <View className="py-3 border-b border-indigo-100">
        <View className="px-4 mb-2">
          <Text className="text-base font-bold text-indigo-700">
            Eat what you love
          </Text>
          <Text className="text-xs font-semibold text-indigo-400">
            Categories
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4"
          contentContainerStyle={{ gap: 12 }}
        >
          {categories.map((cat) => (
            <TouchableOpacity key={cat.name} className="items-center min-w-[65px]">
              <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 border-2 border-indigo-200">
                <Image
                  source={{ uri: cat.image }}
                  className="h-10 w-10"
                  resizeMode="contain"
                />
              </View>
              <Text className="mt-1 text-[9px] font-bold text-indigo-700">
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="py-4">
        <View className="px-4 mb-3">
          <Text className="text-base font-bold text-indigo-700">
            Nearby Restaurants
          </Text>
          <Text className="text-xs font-semibold text-indigo-400">
            Fast delivery
          </Text>
        </View>
        <View className="space-y-3 px-4">
          <View className="rounded-xl bg-slate-100 p-4">
            <Text className="text-sm text-slate-500">
              No nearby restaurants
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
