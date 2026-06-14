import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Star, Clock3, IndianRupee, ChevronLeft, Plus, Minus } from "lucide-react-native";
import { colors } from "../../constants/colors";

const MenuItem = ({ item }) => {
  const [qty, setQty] = useState(0);

  return (
    <View className="flex-row items-center bg-white rounded-3xl p-4 shadow-sm mx-4 mb-3">
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} className="h-16 w-16 rounded-2xl mr-3" resizeMode="cover" />
      ) : null}
      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <View className={`h-3 w-3 rounded-sm ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
          <Text className="font-bold text-slate-900 text-sm" numberOfLines={1}>{item.name}</Text>
        </View>
        <Text className="text-xs text-slate-500 mt-0.5">{item.description}</Text>
        <Text className="text-sm font-extrabold text-slate-900 mt-1">₹{item.price}</Text>
      </View>
      <View className="ml-2">
        {qty === 0 ? (
          <TouchableOpacity onPress={() => setQty(1)}
            className="w-28 h-9 rounded-xl border-2 border-indigo-600 items-center justify-center">
            <Text className="text-sm font-extrabold text-indigo-600">ADD</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-center gap-3 bg-indigo-600 rounded-xl px-3 py-1.5">
            <TouchableOpacity onPress={() => setQty(q => Math.max(0, q - 1))}>
              <Minus size={16} color="#fff" />
            </TouchableOpacity>
            <Text className="text-sm font-extrabold text-white w-5 text-center">{qty}</Text>
            <TouchableOpacity onPress={() => setQty(q => q + 1)}>
              <Plus size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default function RestaurantMenuScreen({ route, navigation }) {
  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm px-4 pt-14 pb-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-extrabold text-slate-900">Restaurant</Text>
            <Text className="text-sm text-slate-500">Menu</Text>
          </View>
        </View>
      </View>
      <ScrollView className="flex-1 pt-4">
        <MenuItem item={{ name: "Sample Dish", price: 199, isVeg: true }} />
        <MenuItem item={{ name: "Sample Non-Veg", price: 299, isVeg: false }} />
      </ScrollView>
    </View>
  );
}
