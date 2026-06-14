import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Image,
} from "react-native";
import { Plus, Pencil, Trash2, Circle, ChevronLeft } from "lucide-react-native";
import { colors } from "../../constants/colors";

const sampleItems = [
  { id: "1", name: "Butter Chicken", price: 299, category: "Main Course", isVeg: false, available: true },
  { id: "2", name: "Dal Makhani", price: 199, category: "Main Course", isVeg: true, available: true },
  { id: "3", name: "Naan", price: 45, category: "Breads", isVeg: true, available: true },
  { id: "4", name: "Gulab Jamun", price: 89, category: "Desserts", isVeg: true, available: false },
];

const categories = ["All", "Main Course", "Breads", "Desserts"];

export default function VendorMenuScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [items] = useState(sampleItems);

  const filtered = activeCategory === "All" ? items : items.filter((i) => i.category === activeCategory);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Manage Menu</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}
              className={`rounded-full px-5 py-2 ${activeCategory === cat ? "bg-indigo-600" : "bg-white border border-slate-200"}`}>
              <Text className={`text-xs font-extrabold ${activeCategory === cat ? "text-white" : "text-slate-700"}`}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="space-y-3">
          {filtered.map((item) => (
            <View key={item.id} className="bg-white rounded-3xl p-4 shadow-sm">
              <View className="flex-row items-center gap-3">
                <View className={`h-3 w-3 rounded-sm ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                <View className="flex-1">
                  <Text className="font-bold text-slate-900">{item.name}</Text>
                  <Text className="text-sm text-slate-500">₹{item.price}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity className="h-8 w-8 items-center justify-center rounded-full bg-indigo-50">
                    <Pencil size={14} color={colors.brand[600]} />
                  </TouchableOpacity>
                  <TouchableOpacity className="h-8 w-8 items-center justify-center rounded-full bg-rose-50">
                    <Trash2 size={14} color={colors.red[600]} />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <Text className="text-xs text-slate-500">{item.category}</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-slate-500">Available</Text>
                  <Switch value={item.available} trackColor={{ false: "#e2e8f0", true: "#bbf7d0" }}
                    thumbColor={item.available ? "#22c55e" : "#94a3b8"} />
                </View>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity className="flex-row items-center justify-center gap-2 mt-6 mb-8 rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200">
          <Plus size={20} color="#fff" />
          <Text className="font-extrabold text-white">Add New Item</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
