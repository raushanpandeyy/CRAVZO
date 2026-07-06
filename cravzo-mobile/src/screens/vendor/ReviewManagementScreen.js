import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, Modal,
} from "react-native";
import { ChevronLeft, Star, MessageSquare, Send, X } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getRestaurantReviews, replyToReview, getMyRestaurant } from "../../services/vendorService";

const REVIEWER_PHOTOS = {
  1: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
  2: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
  3: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100",
  4: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
};

export default function ReviewManagementScreen({ navigation }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);

  const load = async () => {
    try {
      const rest = await getMyRestaurant();
      if (!rest?.id) return;
      setRestaurantId(rest.id);
      const data = await getRestaurantReviews(rest.id);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load reviews error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openReply = (review) => {
    setReplyingTo(review);
    setReplyText("");
    setShowReplyModal(true);
  };

  const handleSubmit = async () => {
    if (!replyText.trim()) { Alert.alert("Error", "Reply cannot be empty"); return; }
    setSubmitting(true);
    try {
      await replyToReview(replyingTo.id, replyText.trim());
      setShowReplyModal(false);
      setReplyingTo(null);
      load();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to submit reply");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F5F5] items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Reviews & Ratings</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6 pb-8">
        {reviews.length === 0 ? (
          <View className="items-center pt-16">
            <MessageSquare size={48} color={colors.slate[300]} />
            <Text className="text-lg font-bold text-slate-400 mt-4">No reviews yet</Text>
            <Text className="text-sm text-slate-400 mt-1">Reviews from customers will appear here</Text>
          </View>
        ) : (
          reviews.map((r) => (
            <View key={r.id} className="bg-white rounded-3xl p-4 shadow-sm mb-4">
              <View className="flex-row items-center gap-3 mb-3">
                <Image source={{ uri: r.user?.avatar || REVIEWER_PHOTOS[(r.userId % 4) + 1] }}
                  className="h-10 w-10 rounded-full bg-slate-200" />
                <View className="flex-1">
                  <Text className="font-bold text-slate-900">{r.user?.name || "Customer"}</Text>
                  <View className="flex-row items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} fill={i < r.rating ? "#f59e0b" : "none"} color={i < r.rating ? "#f59e0b" : "#cbd5e1"} />
                    ))}
                    <Text className="text-xs text-slate-400 ml-1">{new Date(r.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>
              </View>
              {r.comment ? <Text className="text-sm text-slate-700 mb-3">{r.comment}</Text> : null}

              {r.reply ? (
                <View className="bg-indigo-50 rounded-2xl p-3 border-l-4 border-indigo-400">
                  <View className="flex-row items-center gap-2 mb-1">
                    <MessageSquare size={14} color={colors.indigo[600]} />
                    <Text className="text-xs font-bold text-indigo-700">Your Reply</Text>
                  </View>
                  <Text className="text-sm text-slate-700">{r.reply}</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={() => openReply(r)}
                  className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-slate-300">
                  <MessageSquare size={14} color={colors.slate[500]} />
                  <Text className="text-xs font-bold text-slate-500">Reply to Review</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={showReplyModal} onRequestClose={() => setShowReplyModal(false)}>
        <View className="flex-1 bg-black/50">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setShowReplyModal(false)} />
          <View className="bg-white rounded-t-3xl">
            <View className="px-5 pt-4 pb-8">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-black text-slate-900">Reply to Review</Text>
                <TouchableOpacity onPress={() => setShowReplyModal(false)} className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <X size={18} color={colors.slate[700]} />
                </TouchableOpacity>
              </View>
              {replyingTo?.comment ? (
                <View className="bg-slate-50 rounded-2xl p-4 mb-4">
                  <Text className="text-sm text-slate-600 italic">"{replyingTo.comment}"</Text>
                  <View className="flex-row items-center gap-1 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} fill={i < replyingTo.rating ? "#f59e0b" : "none"} color={i < replyingTo.rating ? "#f59e0b" : "#cbd5e1"} />
                    ))}
                  </View>
                </View>
              ) : null}
              <TextInput value={replyText} onChangeText={setReplyText}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm min-h-[100]"
                placeholder="Write your reply..." multiline textAlignVertical="top" />
              <TouchableOpacity onPress={handleSubmit} disabled={submitting}
                className="flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 mt-4">
                <Send size={18} color="#fff" />
                <Text className="font-extrabold text-white">{submitting ? "Sending..." : "Send Reply"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
