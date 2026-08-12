import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Card, EmptyState } from "../components/Primitives";
import { ScreenWithHeader } from "../components/RiderChrome";
import { OrderCard } from "../components/OrderCard";
import { colors } from "../constants/colors";
import { getRiderOrders } from "../services/orderService";
import { formatCurrency, formatDistance } from "../utils/formatters";

const todayKey = new Date().toDateString();
const DAY_MS = 24 * 60 * 60 * 1000;

const getCreatedAt = (order) => new Date(order.deliveredAt || order.updatedAt || order.createdAt || Date.now());
const getEarning = (order) => Number(order.deliveryFee || 0) + Number(order.tipAmount || 0) + Number(order.riderCancellationEarning || 0);
const percent = (value, total) => (total > 0 ? `${Math.round((value / total) * 100)}%` : "0%");
const average = (value, count, formatter = (item) => item) => (count > 0 ? formatter(value / count) : "N/A");

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getRiderOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert("Analytics failed", error.message || "Could not load rider analytics.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const assignedOrders = useMemo(() => orders.filter((order) => !order.isAvailable), [orders]);
  const delivered = useMemo(() => assignedOrders.filter((order) => order.status === "DELIVERED"), [assignedOrders]);
  const cancelled = useMemo(() => assignedOrders.filter((order) => order.status === "CANCELLED" || order.status === "REJECTED"), [assignedOrders]);
  const active = useMemo(() => assignedOrders.filter((order) => ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(order.status)), [assignedOrders]);

  const analytics = useMemo(() => {
    const now = Date.now();
    const weekStart = now - 7 * DAY_MS;
    const monthStart = now - 30 * DAY_MS;
    const todayOrders = delivered.filter((order) => getCreatedAt(order).toDateString() === todayKey);
    const weekOrders = delivered.filter((order) => getCreatedAt(order).getTime() >= weekStart);
    const monthOrders = delivered.filter((order) => getCreatedAt(order).getTime() >= monthStart);
    const earnings = delivered.reduce((sum, order) => sum + getEarning(order), 0);
    const tips = delivered.reduce((sum, order) => sum + Number(order.tipAmount || 0), 0);
    const km = delivered.reduce((sum, order) => sum + Number(order.deliveryDistance || 0), 0);
    const accepted = assignedOrders.filter((order) => order.status !== "REJECTED").length;
    const ratedOrders = delivered.filter((order) => Number(order.riderRating || order.rating || 0) > 0);
    const ratingTotal = ratedOrders.reduce((sum, order) => sum + Number(order.riderRating || order.rating || 0), 0);
    const peakBuckets = delivered.reduce((map, order) => {
      const hour = getCreatedAt(order).getHours();
      const label = hour < 11 ? "Morning" : hour < 16 ? "Lunch" : hour < 20 ? "Dinner" : "Late night";
      map[label] = (map[label] || 0) + 1;
      return map;
    }, {});
    const peakHour = Object.entries(peakBuckets).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const areaBuckets = delivered.reduce((map, order) => {
      const area = order.restaurant?.city || order.address?.city || "Unknown";
      map[area] = (map[area] || 0) + 1;
      return map;
    }, {});
    const bestArea = Object.entries(areaBuckets).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const target = 10;
    const targetDone = Math.min(delivered.length, target);

    return {
      todayEarnings: todayOrders.reduce((sum, order) => sum + getEarning(order), 0),
      weekEarnings: weekOrders.reduce((sum, order) => sum + getEarning(order), 0),
      monthEarnings: monthOrders.reduce((sum, order) => sum + getEarning(order), 0),
      lifetimeEarnings: earnings,
      todayOrders: todayOrders.length,
      weekOrders: weekOrders.length,
      monthOrders: monthOrders.length,
      delivered: delivered.length,
      active: active.length,
      cancelled: cancelled.length,
      totalKm: km,
      avgKm: average(km, delivered.length, formatDistance),
      avgEarning: average(earnings, delivered.length, formatCurrency),
      acceptanceRate: percent(accepted, assignedOrders.length),
      cancellationRate: percent(cancelled.length, assignedOrders.length),
      tips,
      avgTip: average(tips, delivered.length, formatCurrency),
      avgRating: ratedOrders.length ? (ratingTotal / ratedOrders.length).toFixed(1) : "N/A",
      peakHour,
      bestArea,
      onlineTime: "N/A",
      pickupTime: "N/A",
      deliveryTime: "N/A",
      targetDone,
      target,
      targetPercent: percent(targetDone, target),
    };
  }, [active.length, assignedOrders, cancelled, delivered]);

  const rows = useMemo(() => [
    { id: "summary", type: "summary" },
    { id: "performance", type: "performance" },
    { id: "charts", type: "charts" },
    { id: "orders", type: "ordersTitle" },
    ...assignedOrders.map((order) => ({ id: order.id, type: "order", order })),
  ], [assignedOrders]);

  const renderItem = useCallback(({ item }) => {
    if (item.type === "summary") {
      return (
        <View style={styles.section}>
          <Text style={styles.title}>Rider Analytics</Text>
          <View style={styles.grid}>
            <Stat label="Today" value={formatCurrency(analytics.todayEarnings)} hint={`${analytics.todayOrders} orders`} tone="primary" />
            <Stat label="This week" value={formatCurrency(analytics.weekEarnings)} hint={`${analytics.weekOrders} orders`} />
            <Stat label="This month" value={formatCurrency(analytics.monthEarnings)} hint={`${analytics.monthOrders} orders`} />
            <Stat label="Lifetime" value={formatCurrency(analytics.lifetimeEarnings)} hint="total earnings" />
            <Stat label="Delivered" value={analytics.delivered} hint="completed orders" />
            <Stat label="Distance" value={formatDistance(analytics.totalKm)} hint={`${analytics.avgKm} avg`} />
          </View>
        </View>
      );
    }

    if (item.type === "performance") {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.grid}>
            <Stat label="Avg earning" value={analytics.avgEarning} hint="per order" />
            <Stat label="Acceptance" value={analytics.acceptanceRate} hint="accepted vs assigned" tone="success" />
            <Stat label="Cancelled" value={analytics.cancelled} hint={`${analytics.cancellationRate} rate`} tone="danger" />
            <Stat label="Tips" value={formatCurrency(analytics.tips)} hint={`${analytics.avgTip} avg`} />
            <Stat label="Rating" value={analytics.avgRating} hint="customer feedback" />
            <Stat label="Online time" value={analytics.onlineTime} hint="needs backend tracking" />
            <Stat label="Pickup time" value={analytics.pickupTime} hint="avg pickup" />
            <Stat label="Delivery time" value={analytics.deliveryTime} hint="avg drop" />
          </View>
        </View>
      );
    }

    if (item.type === "charts") {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <Card style={styles.insightCard}>
            <Insight label="Peak hours" value={analytics.peakHour} />
            <Insight label="Best area" value={analytics.bestArea} />
            <Insight label="Active deliveries" value={analytics.active} />
          </Card>
          <Card style={styles.incentiveCard}>
            <View style={styles.progressTop}><Text style={styles.progressTitle}>Incentive target</Text><Text style={styles.progressValue}>{analytics.targetDone}/{analytics.target}</Text></View>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: analytics.targetPercent }]} /></View>
            <Text style={styles.progressHint}>Complete {analytics.target} deliveries to unlock bonus tracking.</Text>
          </Card>
        </View>
      );
    }

    if (item.type === "ordersTitle") {
      return <Text style={styles.sectionTitle}>Recent orders</Text>;
    }

    return <OrderCard order={item.order} compact onView={() => navigation.navigate("Dashboard")} onChat={(order) => navigation.navigate("Chat", { order })} />;
  }, [analytics, navigation]);

  return (
    <ScreenWithHeader title="Analytics" subtitle="Rider" navigation={navigation}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
                initialNumToRender={5}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={60}
        windowSize={6}
        removeClippedSubviews
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState title="No analytics yet" body="Accepted and completed deliveries will show analytics here." />}
        contentContainerStyle={styles.content}
      />
    </ScreenWithHeader>
  );
}

function Stat({ label, value, hint, tone = "default" }) {
  return (
    <Card style={[styles.stat, tone === "primary" && styles.statPrimary, tone === "success" && styles.statSuccess, tone === "danger" && styles.statDanger]}>
      <Text style={styles.label}>{label}</Text>
      <Text numberOfLines={1} style={styles.value}>{value}</Text>
      <Text numberOfLines={1} style={styles.hint}>{hint}</Text>
    </Card>
  );
}

function Insight({ label, value }) {
  return (
    <View style={styles.insightRow}>
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={styles.insightValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 138, gap: 12 },
  section: { gap: 12 },
  title: { color: colors.ink, fontSize: 26, fontWeight: "900" },
  sectionTitle: { color: colors.ink, fontWeight: "900", fontSize: 18, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { flex: 1, minWidth: "45%", padding: 14, gap: 3 },
  statPrimary: { backgroundColor: colors.primarySoft, borderColor: "#dbeafe" },
  statSuccess: { backgroundColor: colors.accentSoft, borderColor: "#bbf7d0" },
  statDanger: { backgroundColor: colors.dangerSoft, borderColor: "#fecdd3" },
  label: { color: colors.muted, fontWeight: "900", fontSize: 12 },
  value: { color: colors.ink, fontSize: 20, fontWeight: "900", marginTop: 2 },
  hint: { color: colors.subtle, fontWeight: "800", fontSize: 11 },
  insightCard: { gap: 12 },
  insightRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingBottom: 10 },
  insightLabel: { color: colors.muted, fontWeight: "900" },
  insightValue: { color: colors.ink, fontWeight: "900", flexShrink: 1, textAlign: "right" },
  incentiveCard: { gap: 10, backgroundColor: colors.primaryDark },
  progressTop: { flexDirection: "row", justifyContent: "space-between" },
  progressTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  progressValue: { color: "#fff", fontWeight: "900" },
  progressTrack: { height: 10, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: "#22c55e" },
  progressHint: { color: "#c7d2fe", fontWeight: "700", lineHeight: 19 },
});





