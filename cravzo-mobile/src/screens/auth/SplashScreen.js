import React, { useEffect } from "react";
import { View, Text, Image } from "react-native";
import { cravzologo } from "../../constants/images";

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View className="flex-1 bg-indigo-950 items-center justify-center">
      <Image source={{ uri: cravzologo }} className="h-20 w-20 rounded-2xl mb-4" resizeMode="cover" />
      <Text className="text-3xl font-bold text-white tracking-widest">DODAGO</Text>
      <Text className="text-sm text-indigo-200 mt-2">Affordable food delivery</Text>
    </View>
  );
}
