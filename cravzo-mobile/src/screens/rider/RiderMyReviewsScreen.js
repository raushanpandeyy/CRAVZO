import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { ChevronLeft, Star } from "lucide-react-native";
import { useSelector } from "react-redux";
import { colors } from "../../constants/colors";
import { getRiderRatings } from "../../services/riderRatingService";

const Stars = ({ rating }) => (
  <View className="flex-row gap-1">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star key={index} size={15} color="#f59e0b" fill={index < rating ? "#f59e0b" : "transparent"} />
    ))}
  </View>
);

export default function RiderMyReviewsScreen({ navigation }) {
  const user = useSelector((state) => state.user.data);
  const [data, setData] = useState({ averageRating: null, totalRatings: 0, ratings: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadRatings = useCallback(async () => {
    if (!user?.id) return;
    try {
      setData(await getRiderRatings(user.id));
      setError("");
    } catch (err) {
      setError(err.message || "Could not load your ratings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { loadRatings(); }, [loadRatings]);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white px-4 pb-4 pt-14 shadow-sm">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-extrabold text-slate-900">Customer Reviews</Text>
            <Text className="text-xs text-slate-500">Ratings received after completed deliveries</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color={colors.brand[600]} /></View>
      ) : (
        <FlatList
          data={data.ratings || []}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRatings(); }} />}
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          ListHeaderComponent={(
            <View className="mb-2 rounded-3xl bg-indigo-950 p-5">
              <Text className="text-xs font-bold uppercase text-indigo-200">Overall rating</Text>
              <View className="mt-2 flex-row items-end gap-2">
                <Text className="text-4xl font-black text-white">{data.averageRating ?? "New"}</Text>
                {data.averageRating ? <Text className="pb-1 text-sm text-indigo-200">/ 5</Text> : null}
              </View>
              <Text className="mt-1 text-sm text-indigo-200">{data.totalRatings || 0} verified delivery ratings</Text>
            </View>
          )}
          ListEmptyComponent={(
            <View className="flex-1 items-center justify-center py-16">
              <Star size={48} color={colors.slate[300]} />
              <Text className="mt-4 text-lg font-bold text-slate-500">No customer ratings yet</Text>
              {error ? <Text className="mt-2 text-center text-sm text-rose-600">{error}</Text> : <Text className="mt-1 text-sm text-slate-400">Ratings appear after delivered orders.</Text>}
            </View>
          )}
          renderItem={({ item }) => (
            <View className="rounded-3xl bg-white p-4 shadow-sm">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="font-black text-slate-900">{item.user?.name || "Customer"}</Text>
                  <Text className="mt-1 text-xs text-slate-400">Order #{item.orderId?.slice(-6)}</Text>
                </View>
                <Stars rating={item.rating} />
              </View>
              {item.comment ? <Text className="mt-3 text-sm leading-6 text-slate-700">{item.comment}</Text> : null}
              <Text className="mt-3 text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString("en-IN")}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}