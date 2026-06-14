import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Star, ChevronLeft, ThumbsUp } from "lucide-react-native";
import { colors } from "../../constants/colors";

const sampleReviews = [
  { id: "1", restaurant: "Punjab Grill", rating: 4, review: "Great food! Butter chicken was amazing. Delivery was on time.", date: "2 days ago", likes: 5 },
  { id: "2", restaurant: "Sagar Ratna", rating: 5, review: "Best dosa in town. Must try the masala dosa!", date: "1 week ago", likes: 12 },
];

export default function ReviewsScreen({ navigation }) {
  const [reviews] = useState(sampleReviews);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">My Reviews</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        {reviews.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Star size={48} color="#94a3b8" />
            <Text className="text-lg font-bold text-slate-900 mt-4">No reviews yet</Text>
            <Text className="text-sm text-slate-500 mt-1">Your reviews will appear here</Text>
          </View>
        ) : (
          <View className="space-y-4">
            {reviews.map((review) => (
              <View key={review.id} className="bg-white rounded-3xl p-5 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-bold text-slate-900">{review.restaurant}</Text>
                  <Text className="text-xs text-slate-400">{review.date}</Text>
                </View>
                <View className="flex-row gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={16} color={star <= review.rating ? "#f59e0b" : "#e2e8f0"}
                      fill={star <= review.rating ? "#f59e0b" : "none"} />
                  ))}
                </View>
                <Text className="text-sm text-slate-700 leading-5">{review.review}</Text>
                <View className="flex-row items-center gap-1 mt-3">
                  <ThumbsUp size={14} color={colors.slate[400]} />
                  <Text className="text-xs text-slate-400">{review.likes}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
