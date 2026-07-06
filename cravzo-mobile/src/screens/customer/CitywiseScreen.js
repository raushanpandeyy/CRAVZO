import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { ChevronLeft, MapPin } from "lucide-react-native";
import { colors } from "../../constants/colors";
import OptimizedImage from "../../components/OptimizedImage";

const cities = [
  { name: "Noida", img: "https://res.cloudinary.com/dxsmdarcp/image/upload/v1739613124/cities/noida.jpg" },
  { name: "Delhi", img: "https://res.cloudinary.com/dxsmdarcp/image/upload/v1739613124/cities/delhi.jpg" },
  { name: "Gurugram", img: "https://res.cloudinary.com/dxsmdarcp/image/upload/v1739613124/cities/gurugram.jpg" },
  { name: "Ghaziabad", img: "https://res.cloudinary.com/dxsmdarcp/image/upload/v1739613124/cities/ghaziabad.jpg" },
  { name: "Faridabad", img: "https://res.cloudinary.com/dxsmdarcp/image/upload/v1739613124/cities/faridabad.jpg" },
  { name: "Lucknow", img: "https://res.cloudinary.com/dxsmdarcp/image/upload/v1739613124/cities/lucknow.jpg" },
  { name: "Jaipur", img: "https://res.cloudinary.com/dxsmdarcp/image/upload/v1739613124/cities/jaipur.jpg" },
  { name: "Mumbai", img: "https://res.cloudinary.com/dxsmdarcp/image/upload/v1739613124/cities/mumbai.jpg" },
];

export default function CitywiseScreen({ navigation }) {
  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">We Deliver Here</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="space-y-4">
          {cities.map((city) => (
            <TouchableOpacity key={city.name}
              onPress={() => navigation.navigate("Search", { query: city.name })}
              className="bg-white rounded-3xl overflow-hidden shadow-sm"
            >
              <OptimizedImage source={{ uri: city.img }} className="w-full h-40" resizeMode="cover" />
              <View className="flex-row items-center gap-2 px-4 py-3">
                <MapPin size={16} color={colors.brand[600]} />
                <Text className="font-bold text-slate-900">{city.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
