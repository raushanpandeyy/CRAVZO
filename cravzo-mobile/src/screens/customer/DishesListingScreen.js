import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { Search, ChevronLeft, ChevronRight } from "lucide-react-native";
import { colors } from "../../constants/colors";
import {
  burger, dosa, biryaniplate, momos, cake, chinese, indianthali,
  rolls, parathe, Chaat, icecream, Snacks, southindian, salad, northindian,
} from "../../constants/images";

const dishes = [
  { name: "Burger", image: burger }, { name: "Dosa", image: dosa },
  { name: "Biryani", image: biryaniplate }, { name: "Momos", image: momos },
  { name: "Desserts", image: cake }, { name: "Chinese", image: chinese },
  { name: "Thali", image: indianthali }, { name: "Rolls", image: rolls },
  { name: "Paratha", image: parathe }, { name: "Chaat", image: Chaat },
  { name: "Ice Cream", image: icecream }, { name: "Snacks", image: Snacks },
  { name: "South Indian", image: southindian }, { name: "Salad", image: salad },
  { name: "North Indian", image: northindian },
];

export default function DishesListingScreen({ navigation }) {
  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <View>
            <Text className="text-xs font-bold text-indigo-700">Explore</Text>
            <Text className="text-xl font-extrabold text-slate-900">Dishes</Text>
          </View>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="flex-row flex-wrap gap-4">
          {dishes.map((dish) => (
            <TouchableOpacity key={dish.name}
              onPress={() => navigation.navigate("DishScreen", { dishName: dish.name })}
              className="w-[46%] bg-white rounded-3xl p-4 shadow-sm items-center min-h-[160px]"
            >
              <Image source={{ uri: dish.image }} className="h-24 w-24 rounded-full" resizeMode="cover" />
              <Text className="mt-3 font-bold text-slate-900 text-center">{dish.name}</Text>
              <View className="flex-row items-center gap-1 mt-1">
                <Text className="text-xs text-indigo-600">Find restaurants</Text>
                <ChevronRight size={12} color={colors.brand[600]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
