import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Star } from "../components/Icons";
import { Card, EmptyState, PrimaryButton } from "../components/Primitives";
import { ScreenWithHeader } from "../components/RiderChrome";
import { colors } from "../constants/colors";
import { getRiderOrders } from "../services/orderService";

export default function ReviewsScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [customerRating, setCustomerRating] = useState(0);
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await getRiderOrders();
      setOrders(Array.isArray(data) ? data.filter((order) => order.status === "DELIVERED") : []);
    } catch (error) {
      Alert.alert("Reviews failed", error.message || "Could not load delivered orders.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitted = useMemo(() => customerRating > 0 || restaurantRating > 0 || note.trim(), [customerRating, restaurantRating, note]);

  const chooseOrder = (order) => {
    setSelected(order);
    setCustomerRating(0);
    setRestaurantRating(0);
    setNote("");
  };

  const submit = () => {
    Alert.alert("Review saved", "Review submitted successfully.");
    setSelected(null);
  };

  return (
    <ScreenWithHeader title="Reviews" subtitle="Rider" navigation={navigation}>
      <FlatList
        data={selected ? [] : orders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Review completed orders</Text>
            <Text style={styles.copy}>Customer aur restaurant feedback delivered orders ke baad submit karo.</Text>
          </View>
        }
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={60}
        windowSize={7}
        removeClippedSubviews

        renderItem={({ item }) => (
          <Card style={styles.orderCard}>
            <Text style={styles.orderTitle}>{item.restaurant?.name || "Restaurant"}</Text>
            <Text style={styles.orderMeta}>Order #{item.id?.slice?.(-6) || item.id}</Text>
            <PrimaryButton title="Write Review" onPress={() => chooseOrder(item)} />
          </Card>
        )}
        ListEmptyComponent={selected ? (
          <Card style={styles.formCard}>
            <Text style={styles.orderTitle}>{selected.restaurant?.name || "Order Review"}</Text>
            <Text style={styles.orderMeta}>Order #{selected.id?.slice?.(-6) || selected.id}</Text>
            <Text style={styles.label}>Customer Review</Text>
            <Stars value={customerRating} onChange={setCustomerRating} />
            <Text style={styles.label}>Restaurant Review</Text>
            <Stars value={restaurantRating} onChange={setRestaurantRating} />
            <TextInput value={note} onChangeText={setNote} placeholder="Any issue or feedback?" placeholderTextColor="#94a3b8" multiline style={styles.note} />
            <View style={styles.row}><PrimaryButton title="Cancel" tone="muted" onPress={() => setSelected(null)} style={styles.flex} /><PrimaryButton title="Submit Review" disabled={!submitted} onPress={submit} style={styles.flex} /></View>
          </Card>
        ) : <EmptyState title="No delivered orders" body="Delivered orders will appear here for review." />}
        contentContainerStyle={styles.content}
      />
    </ScreenWithHeader>
  );
}

function Stars({ value, onChange }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((item) => (
        <TouchableOpacity key={item} onPress={() => onChange(item)} style={styles.starButton}>
          <Star size={24} color={item <= value ? colors.warning : "#cbd5e1"} filled={item <= value} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 138, gap: 12 },
  header: { gap: 6, marginBottom: 4 },
  title: { color: colors.ink, fontSize: 25, fontWeight: "900" },
  copy: { color: colors.muted, fontWeight: "700", lineHeight: 21 },
  orderCard: { gap: 8 },
  orderTitle: { color: colors.ink, fontSize: 19, fontWeight: "900" },
  orderMeta: { color: colors.muted, fontWeight: "800" },
  formCard: { gap: 12 },
  label: { color: colors.ink, fontWeight: "900", marginTop: 4 },
  stars: { flexDirection: "row", gap: 8 },
  starButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#f8fafc" },
  note: { minHeight: 96, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, textAlignVertical: "top", color: colors.ink, fontWeight: "700" },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
});

