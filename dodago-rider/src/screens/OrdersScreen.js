import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { EmptyState, Screen, Card } from "../components/Primitives";
import { OrderCard } from "../components/OrderCard";
import { colors } from "../constants/colors";
import { getRiderOrders } from "../services/orderService";
import { formatCurrency, formatDistance } from "../utils/formatters";

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getRiderOrders();
      setOrders(Array.isArray(data) ? data.filter((order) => !order.isAvailable) : []);
    } catch (error) {
      Alert.alert("Orders failed", error.message || "Could not load orders.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const delivered = useMemo(() => orders.filter((order) => order.status === "DELIVERED"), [orders]);
  const summary = useMemo(() => ({
    earnings: delivered.reduce((sum, order) => sum + Number(order.deliveryFee || 0) + Number(order.tipAmount || 0), 0),
    km: delivered.reduce((sum, order) => sum + Number(order.deliveryDistance || 0), 0),
    delivered: delivered.length,
    active: orders.filter((order) => order.status === "OUT_FOR_DELIVERY").length,
  }), [delivered, orders]);

  return (
    <Screen>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} compact onView={(order) => navigation.navigate("Dashboard", { orderId: order.id })} onChat={(order) => navigation.navigate("Chat", { order })} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Orders and Earnings</Text>
            <View style={styles.grid}>
              <Card style={styles.stat}><Text style={styles.label}>Earnings</Text><Text style={styles.value}>{formatCurrency(summary.earnings)}</Text></Card>
              <Card style={styles.stat}><Text style={styles.label}>Delivered</Text><Text style={styles.value}>{summary.delivered}</Text></Card>
              <Card style={styles.stat}><Text style={styles.label}>Total Km</Text><Text style={styles.value}>{formatDistance(summary.km)}</Text></Card>
              <Card style={styles.stat}><Text style={styles.label}>Active</Text><Text style={styles.value}>{summary.active}</Text></Card>
            </View>
            <Text style={styles.sectionTitle}>Recent orders</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState title="No assigned orders yet" body="Accepted and completed deliveries will show here." />}
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 110, gap: 12 },
  header: { gap: 14, marginBottom: 4 },
  title: { color: colors.ink, fontSize: 26, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { flex: 1, minWidth: "45%", padding: 14 },
  label: { color: colors.muted, fontWeight: "800", fontSize: 12 },
  value: { color: colors.ink, fontSize: 20, fontWeight: "900", marginTop: 4 },
  sectionTitle: { color: colors.ink, fontWeight: "900", fontSize: 18 },
});
