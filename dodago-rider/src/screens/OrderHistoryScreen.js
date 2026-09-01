import { useCallback, useState } from "react";
import {
  ActivityIndicator, FlatList, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { ScreenWithHeader } from "../components/RiderChrome";
import { Card } from "../components/Primitives";
import { colors } from "../constants/colors";
import { getRiderOrderHistory } from "../services/orderService";
import { formatCurrency, formatDistance } from "../utils/formatters";

const RANGES = [
  { key: "week",    label: "1 Week"   },
  { key: "month",   label: "1 Month"  },
  { key: "6months", label: "6 Months" },
  { key: "year",    label: "1 Year"   },
];

const STATUS_COLOR = {
  DELIVERED:        { bg: "#ecfdf5", text: "#065f46" },
  CANCELLED:        { bg: "#fef2f2", text: "#991b1b" },
  REJECTED:         { bg: "#fef2f2", text: "#991b1b" },
  OUT_FOR_DELIVERY: { bg: "#eff6ff", text: "#1d4ed8" },
  ACCEPTED:         { bg: "#eef2ff", text: "#3730a3" },
  PREPARING:        { bg: "#fffbeb", text: "#92400e" },
  READY_FOR_PICKUP: { bg: "#f0fdf4", text: "#166534" },
  PENDING:          { bg: "#fff7ed", text: "#9a3412" },
};

const fmtDate = (v) =>
  new Date(v).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });

function OrderHistoryItem({ order }) {
  const sc = STATUS_COLOR[order.status] || { bg: "#f1f5f9", text: "#475569" };
  const earning = formatCurrency(
    Number(order.deliveryFee || 0) + Number(order.tipAmount || 0)
  );
  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
          <Text style={styles.orderDate}>{fmtDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>
            {order.status.replaceAll("_", " ")}
          </Text>
        </View>
      </View>

      <Text style={styles.restaurantName} numberOfLines={1}>
        🏪  {order.restaurant?.name || "Restaurant"}
      </Text>

      <View style={styles.cardBottom}>
        <Text style={styles.earning}>{earning}</Text>
        <Text style={styles.distance}>{formatDistance(order.deliveryDistance)}</Text>
      </View>

      {(order.items || []).length > 0 && (
        <Text style={styles.items} numberOfLines={1}>
          {order.items.map((i) => `${i.quantity}× ${i.menuItem?.name}`).join("  ·  ")}
        </Text>
      )}
    </Card>
  );
}

export default function OrderHistoryScreen({ navigation }) {
  const [range,       setRange]       = useState("week");
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor,      setCursor]      = useState(null);
  const [hasMore,     setHasMore]     = useState(false);
  const [fetched,     setFetched]     = useState(false);

  const load = useCallback(async (selectedRange, resetCursor = true) => {
    setLoading(true);
    setFetched(false);
    try {
      const res = await getRiderOrderHistory({
        range: selectedRange,
        cursor: resetCursor ? null : cursor,
      });
      const data = res.data || [];
      const meta = res.meta || {};
      setOrders(data);
      setCursor(meta.nextCursor || null);
      setHasMore(Boolean(meta.hasMore));
    } catch (e) {
      // silent — show empty state
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [cursor]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const res = await getRiderOrderHistory({ range, cursor });
      const data = res.data || [];
      const meta = res.meta || {};
      setOrders((prev) => [...prev, ...data]);
      setCursor(meta.nextCursor || null);
      setHasMore(Boolean(meta.hasMore));
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [range, cursor, hasMore, loadingMore]);

  const selectRange = useCallback((r) => {
    setRange(r);
    setOrders([]);
    setCursor(null);
    setHasMore(false);
    setFetched(false);
    load(r, true);
  }, [load]);

  return (
    <ScreenWithHeader title="Order History" subtitle="Rider" navigation={navigation}>
      {/* ── Range filter chips ── */}
      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.chip, range === r.key && styles.chipActive]}
            onPress={() => selectRange(r.key)}
          >
            <Text style={[styles.chipText, range === r.key && styles.chipTextActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!fetched && !loading ? (
        /* ── Initial prompt ── */
        <View style={styles.promptWrap}>
          <Text style={styles.promptIcon}>📋</Text>
          <Text style={styles.promptTitle}>Select a time range</Text>
          <Text style={styles.promptSub}>Tap any filter above to load your order history.</Text>
        </View>
      ) : loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderHistoryItem order={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.footerText}>Loading more…</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.promptWrap}>
              <Text style={styles.promptIcon}>🗂️</Text>
              <Text style={styles.promptTitle}>No orders found</Text>
              <Text style={styles.promptSub}>No orders in this time range.</Text>
            </View>
          }
        />
      )}
    </ScreenWithHeader>
  );
}

const styles = StyleSheet.create({
  rangeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  chipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  chipText: { fontSize: 13, fontWeight: "800", color: colors.muted },
  chipTextActive: { color: "#fff" },

  list: { padding: 16, gap: 12, paddingBottom: 120 },

  card: { gap: 8 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId:   { fontSize: 16, fontWeight: "900", color: colors.ink },
  orderDate: { fontSize: 12, color: colors.muted, fontWeight: "700", marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  restaurantName: { fontSize: 14, fontWeight: "800", color: colors.ink },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earning:  { fontSize: 18, fontWeight: "900", color: colors.accent },
  distance: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primaryDark,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  items: { fontSize: 12, color: colors.muted, fontWeight: "700" },

  centerWrap:  { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  promptWrap:  { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, marginTop: 60 },
  promptIcon:  { fontSize: 48, marginBottom: 12 },
  promptTitle: { fontSize: 18, fontWeight: "900", color: colors.ink, textAlign: "center" },
  promptSub:   { fontSize: 14, color: colors.muted, fontWeight: "700", textAlign: "center", marginTop: 6, lineHeight: 20 },

  footerLoader: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  footerText:   { color: colors.muted, fontWeight: "700", fontSize: 13 },
});
