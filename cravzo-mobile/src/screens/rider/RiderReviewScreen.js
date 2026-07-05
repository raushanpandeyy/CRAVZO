import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { Star, ChevronLeft, Send } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { apiRequest } from "../../services/api";

export default function RiderReviewScreen({ navigation, route }) {
  const { orderId } = route.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert("Error", "Please select a rating"); return; }
    setSubmitting(true);
    try {
      await apiRequest("/api/reviews", {
        method: "POST",
        data: { orderId, rating, comment: comment.trim() || undefined, targetType: "RIDER" },
      });
      Alert.alert("Thank You!", "Your review has been submitted.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Error", "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-[#F5F5F5]" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Rate Delivery</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-8">
        <View className="items-center mb-8">
          <View className="h-20 w-20 rounded-full bg-amber-100 items-center justify-center mb-4">
            <Star size={40} color="#f59e0b" />
          </View>
          <Text className="text-xl font-extrabold text-slate-900">How was your delivery?</Text>
          <Text className="text-sm text-slate-500 mt-1">Your feedback helps us improve</Text>
        </View>

        <View className="flex-row justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}
              className="p-2">
              <Star size={36} color={star <= rating ? "#f59e0b" : "#e2e8f0"}
                fill={star <= rating ? "#f59e0b" : "transparent"} />
            </TouchableOpacity>
          ))}
        </View>

        {rating > 0 && (
          <View className="bg-white rounded-3xl p-4 shadow-sm mb-4">
            <Text className="font-bold text-slate-900 mb-2">Add a comment (optional)</Text>
            <TextInput
              className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm min-h-[100px]"
              placeholder="Tell us about your experience..."
              placeholderTextColor="#94a3b8"
              value={comment} onChangeText={setComment}
              multiline textAlignVertical="top" />
          </View>
        )}

        <TouchableOpacity onPress={handleSubmit} disabled={submitting || rating === 0}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200">
          <Send size={18} color="#fff" />
          <Text className="font-extrabold text-white">{submitting ? "Submitting..." : "Submit Review"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
