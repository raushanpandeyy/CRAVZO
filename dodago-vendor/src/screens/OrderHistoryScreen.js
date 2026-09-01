import { useCallback, useState } from "react";
import {
  ActivityIndicator, FlatList, SafeAreaView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { colors } from "../constants/colors";
import { Badge, Card } from "../components/Primitives";
import { getVendorOrderHistory } from "../services/orderService";

const RANGES = [
  { key: "week",    label: "1 Week"   },
  { key: "month",   label: "1 Month"  },
  { key: "6months", label: "6 Months" },
  { key: "year",    label: "1 Year"   },
];

const STATUS_META = {
  PENDING:          { tone: "orange",  label: "Pending"          },
  ACCEPTED:         { tone: "primary", label: "Accepted"         },
  PREPARING:        { tone: "warning", label: "Preparing"        },
  READY_FOR_PICKUP: { tone: "success", label: "Ready"            },
  OUT_FOR_DELIVERY: { tone: "primary", label: "Out for Delivery" },
  DELIVERED:        { tone: "success", label: "Delivered"        },
  CANCELLED:        { tone: "danger",  label: "Cancelled"        },
  REJECTED:         { tone: "danger",  label: "Rejected"         },
};

const fmt     = (v) => `Rs ${Math.floor(Number(v || 0))}`;
const fmtDate = (v) =>
  new Date(v).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });

function OrderHistoryItem({ order }) {
  const meta = STATUS_META[order.status] || { tone: "muted", label: order.status };
  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
          <Text style={styles.orderDate}>{fmtDate(order.createdAt)}</Text>
        </View>
        <Badge label={meta.label} tone={meta.tone} />
      </View>

      <View style={styles.cardMid}>
        <Text style={styles.customerName} numberOfLines={1}>
          👤  {order.customer?.name || "Customer"}
        </Text>
        <Text style={styles.amount}>{fmt(order.totalAmount)}</Text>
      </View>

      {(order.items || []).length > 0 && (
        <Text style={styles.items} numberOfLines={1}>
          📦  {order.items.map((i) => `${i.quantity}× ${i.menuItem?.name}`).join("  ·  ")}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.payMethod}>{order.paymentMethod}</Text>
        <Text style={[
          styles.payStatus,
          { color: order.paymentStatus === "PAID" ? colors.accent : colors.warning },
        ]}>
          {order.paymentStatus}
        </Text>
      </View>
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

  const load = useCallback(async (selectedRange) => {
    setLoading(true);
    setFetched(false);
    try {
      const res = await getVendorOrderHistory({ range: selectedRange, cursor: null });
      const data = res.data || [];
      const meta = res.meta || {};
      setOrders(data);
      setCursor(meta.nextCursor || null);
      setHasMore(Boolean(meta.hasMore));
    } catch {
      // silent
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const res = await getVendorOrderHistory({ range, cursor });
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
    load(r);
  }, [load]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 60 }} />
      </View>

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
        <View style={styles.promptWrap}>
          <Text style={styles.promptIcon}>📋</Text>
          <Text style={styles.promptTitle}>Select a time range</Text>
          <Text style={styles.promptSub}>Tap any filter above to load order history.</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  backBtn:     { fontSize: 15, fontWeight: "800", color: colors.primary },
  headerTitle: { fontSize: 20, fontWeight: "900", color: colors.ink },

  rangeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  chipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:       { fontSize: 13, fontWeight: "800", color: colors.muted },
  chipTextActive: { color: "#fff" },

  list: { padding: 16, gap: 12, paddingBottom: 32 },

  card:    { gap: 8 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId:      { fontSize: 16, fontWeight: "900", color: colors.ink },
  orderDate:    { fontSize: 12, color: colors.muted, fontWeight: "700", marginTop: 2 },
  cardMid:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  customerName: { fontSize: 14, fontWeight: "800", color: colors.ink, flex: 1 },
  amount:       { fontSize: 17, fontWeight: "900", color: colors.primaryDark },
  items:        { fontSize: 12, color: colors.muted, fontWeight: "700" },
  cardFooter:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  payMethod:    { fontSize: 12, color: colors.muted, fontWeight: "700" },
  payStatus:    { fontSize: 12, fontWeight: "900" },

  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  promptWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, marginTop: 60 },
  promptIcon:  { fontSize: 48, marginBottom: 12 },
  promptTitle: { fontSize: 18, fontWeight: "900", color: colors.ink, textAlign: "center" },
  promptSub:   { fontSize: 14, color: colors.muted, fontWeight: "700", textAlign: "center", marginTop: 6, lineHeight: 20 },

  footerLoader: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  footerText:   { color: colors.muted, fontWeight: "700", fontSize: 13 },
});
