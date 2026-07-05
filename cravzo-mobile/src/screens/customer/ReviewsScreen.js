import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Star, ChevronLeft, Trash2 } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getMyReviews, deleteReview } from "../../services/reviewService";

const Stars = ({ rating }) => (
  <View className="flex-row gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={16}
        color={star <= rating ? "#fbbf24" : "#e2e8f0"}
        fill={star <= rating ? "#fbbf24" : "none"}
      />
    ))}
  </View>
);

export default function ReviewsScreen({ navigation }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyReviews();
      setReviews(data);
    } catch (requestError) {
      setError(requestError?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = (reviewId) => {
    Alert.alert("Delete Review", "Are you sure you want to delete this review?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setMessage("");
            setError("");
            await deleteReview(reviewId);
            setReviews((prev) => prev.filter((r) => r.id !== reviewId));
            setMessage("Review deleted successfully.");
          } catch (requestError) {
            setError(requestError?.message || "Failed to delete review");
          }
        },
      },
    ]);
  };

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
        {message ? (
          <View className="rounded-2xl bg-emerald-50 px-4 py-3 mb-4">
            <Text className="text-sm text-emerald-700">{message}</Text>
          </View>
        ) : null}
        {error ? (
          <View className="rounded-2xl bg-red-50 px-4 py-3 mb-4">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View className="space-y-4">
            {[1, 2, 3].map((i) => (
              <View key={i} className="bg-white rounded-3xl p-5 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="h-5 w-40 rounded-full bg-slate-200" />
                  <View className="h-3 w-20 rounded-full bg-slate-200" />
                </View>
                <View className="flex-row gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <View key={s} className="h-4 w-4 rounded-full bg-slate-200" />
                  ))}
                </View>
                <View className="h-4 w-full rounded-full bg-slate-200" />
              </View>
            ))}
          </View>
        ) : reviews.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Star size={48} color="#94a3b8" />
            <Text className="text-lg font-bold text-slate-900 mt-4">No reviews yet</Text>
            <Text className="text-sm text-slate-500 mt-1">Your reviews will appear here</Text>
          </View>
        ) : (
          <View className="space-y-4">
            {reviews.map((review) => (
              <View key={review.id} className="bg-white rounded-3xl p-5 shadow-sm">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-4">
                    <Text className="font-bold text-slate-900 text-base">
                      {review.restaurant?.name || "Restaurant"}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-0.5">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(review.id)}
                    className="h-9 w-9 items-center justify-center rounded-full bg-red-50"
                  >
                    <Trash2 size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
                <View className="mt-3">
                  <Stars rating={review.rating} />
                </View>
                <Text className="mt-3 text-sm text-slate-700 leading-5">
                  {review.comment || "No written comment added."}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
