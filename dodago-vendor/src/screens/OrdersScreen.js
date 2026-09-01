import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, FlatList, Modal, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { Badge, Card, EmptyState, PrimaryButton, SectionHeader } from "../components/Primitives";
import { Clock, Package, RefreshCw, X, MessageCircle } from "../components/Icons";
import OrderAlertModal from "../components/OrderAlertModal";
import { getVendorOrders, updateOrderStatus } from "../services/orderService";
import { onNewOrder, onOrderStatusUpdate } from "../services/socketService";

const fmt     = (v) => `Rs ${Math.floor(v || 0)}`;
const fmtTime = (v) => new Date(v).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// Status flow for vendor actions
const NEXT_STATUS = {
  PENDING:          "ACCEPTED",
  ACCEPTED:         "PREPARING",
  PREPARING:        "READY_FOR_PICKUP",
};
const ACTION_LABEL = {
  PENDING:          "Accept Order",
  ACCEPTED:         "Start Preparing",
  PREPARING:        "Mark Ready",
};
const STATUS_META = {
  PENDING:         { tone: "orange",  label: "Pending",         emoji: "🔔" },
  ACCEPTED:        { tone: "primary", label: "Accepted",        emoji: "✅" },
  PREPARING:       { tone: "warning", label: "Preparing",       emoji: "👨‍🍳" },
  READY_FOR_PICKUP:{ tone: "success", label: "Ready",           emoji: "📦" },
  OUT_FOR_DELIVERY:{ tone: "primary", label: "Out for Delivery",emoji: "🛵" },
  DELIVERED:       { tone: "success", label: "Delivered",       emoji: "🎉" },
  CANCELLED:       { tone: "danger",  label: "Cancelled",       emoji: "❌" },
  REJECTED:        { tone: "danger",  label: "Rejected",        emoji: "❌" },
};

const FILTER_TABS = [
  { key: "all",     label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "ACCEPTED",label: "Accepted" },
  { key: "PREPARING",label:"Preparing" },
  { key: "READY_FOR_PICKUP", label: "Ready" },
  { key: "DELIVERED", label: "Delivered" },
];

export default function OrdersScreen({ navigation }) {
  const [orders,      setOrders]      = useState([]);
  const [filter,      setFilter]      = useState("all");
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [updating,    setUpdating]    = useState("");
  const [alertOrder,  setAlertOrder]  = useState(null);
  const shownIdsRef = useRef(new Set());

  // ── Load ────────────────────────────────────────────────────────
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await getVendorOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!silent) Alert.alert("Error", err.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const cleanups = [
      onNewOrder(() => load({ silent: true })),
      onOrderStatusUpdate(() => load({ silent: true })),
    ];
    return () => cleanups.forEach((fn) => fn?.());
  }, [load]);

  // ── New pending alert ─────────────────────────────────────────
  useEffect(() => {
    const pending = orders.find(
      (o) => o.status === "PENDING" && !shownIdsRef.current.has(o.id)
    );
    if (pending && !alertOrder) {
      shownIdsRef.current.add(pending.id);
      setAlertOrder(pending);
    }
  }, [orders]);

  // ── Filtered list ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  // ── Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    pending:  orders.filter((o) => o.status === "PENDING").length,
    active:   orders.filter((o) => ["ACCEPTED","PREPARING","READY_FOR_PICKUP"].includes(o.status)).length,
    done:     orders.filter((o) => o.status === "DELIVERED").length,
  }), [orders]);

  // ── Status advance ────────────────────────────────────────────
  const advance = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(order.id);
    try {
      await updateOrderStatus(order.id, next);
      load({ silent: true });
      setSelected((s) => s?.id === order.id ? { ...s, status: next } : s);
    } catch (err) {
      Alert.alert("Failed", err.message || "Could not update order");
    } finally {
      setUpdating("");
    }
  };

  const reject = async (order) => {
    Alert.alert("Reject Order", "Are you sure you want to reject this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject", style: "destructive",
        onPress: async () => {
          setUpdating(order.id);
          try {
            await updateOrderStatus(order.id, "REJECTED");
            load({ silent: true });
            setSelected(null);
          } catch (err) {
            Alert.alert("Failed", err.message);
          } finally { setUpdating(""); }
        },
      },
    ]);
  };

  // ── Render order card ─────────────────────────────────────────
  const renderItem = useCallback(({ item }) => {
    const meta = STATUS_META[item.status] || { tone: "muted", label: item.status, emoji: "•" };
    const canAdvance = Boolean(NEXT_STATUS[item.status]);
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => setSelected(item)}
        activeOpacity={0.75}
      >
        <View style={styles.orderTop}>
          <View>
            <Text style={styles.orderId}>#{item.id.slice(-6)}</Text>
            <Text style={styles.orderTime}>{fmtTime(item.createdAt)}</Text>
          </View>
          <Badge label={`${meta.emoji}  ${meta.label}`} tone={meta.tone} />
        </View>

        <View style={styles.orderMid}>
          <Text style={styles.orderCustomer} numberOfLines={1}>
            👤 {item.customer?.name || "Customer"}
          </Text>
          <Text style={styles.orderAmt}>{fmt(item.totalAmount)}</Text>
        </View>

        {item.items?.length > 0 && (
          <Text style={styles.orderItems} numberOfLines={1}>
            📦 {item.items.map((i) => `${i.quantity}× ${i.menuItem?.name}`).join("  ·  ")}
          </Text>
        )}

        {canAdvance && (
          <PrimaryButton
            title={ACTION_LABEL[item.status]}
            tone={item.status === "PENDING" ? "success" : "primary"}
            onPress={() => advance(item)}
            loading={updating === item.id}
            style={styles.advanceBtn}
          />
        )}
      </TouchableOpacity>
    );
  }, [updating]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity onPress={() => load({ silent: true })} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <RefreshCw size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* ── Mini stats ── */}
      <View style={styles.miniStats}>
        <View style={[styles.miniStat, { backgroundColor: colors.orangeSoft }]}>
          <Text style={[styles.miniStatVal, { color: colors.orange }]}>{stats.pending}</Text>
          <Text style={styles.miniStatLbl}>Pending</Text>
        </View>
        <View style={[styles.miniStat, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.miniStatVal, { color: colors.primary }]}>{stats.active}</Text>
          <Text style={styles.miniStatLbl}>Active</Text>
        </View>
        <View style={[styles.miniStat, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.miniStatVal, { color: colors.accent }]}>{stats.done}</Text>
          <Text style={styles.miniStatLbl}>Delivered</Text>
        </View>
      </View>

      {/* ── Filter tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Orders list ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load({ silent: true }); }}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.list}
        style={styles.flatList}
        ListEmptyComponent={
          !loading
            ? <EmptyState icon="📋" title="No orders" body={filter === "all" ? "Orders will appear here in real time." : `No ${filter.toLowerCase()} orders.`} />
            : <View style={styles.loadingWrap}><Text style={styles.loadingText}>Loading…</Text></View>
        }
      />

      {/* ── Order detail modal ── */}
      <Modal
        visible={Boolean(selected)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalShade}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order #{selected?.id?.slice(-6)}</Text>
              <TouchableOpacity onPress={() => setSelected(null)} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
                <X size={22} color={colors.ink} />
              </TouchableOpacity>
            </View>

            {selected ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
                {/* Status + amount */}
                <View style={styles.detailRow}>
                  <Badge
                    label={`${STATUS_META[selected.status]?.emoji}  ${STATUS_META[selected.status]?.label || selected.status}`}
                    tone={STATUS_META[selected.status]?.tone || "muted"}
                  />
                  <Text style={styles.detailAmt}>{fmt(selected.totalAmount)}</Text>
                </View>

                {/* Customer */}
                <Card style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>👤  Customer</Text>
                  <Text style={styles.detailCardValue}>{selected.customer?.name || "—"}</Text>
                  {selected.customer?.phone
                    ? <Text style={styles.detailCardSub}>{selected.customer.phone}</Text>
                    : null}
                </Card>

                {/* Address */}
                {selected.address && (
                  <Card style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>📍  Delivery Address</Text>
                    <Text style={styles.detailCardValue}>
                      {[selected.address.line1, selected.address.line2, selected.address.city].filter(Boolean).join(", ")}
                    </Text>
                  </Card>
                )}

                {/* Items */}
                <Card style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>📦  Items ({selected.items?.length || 0})</Text>
                  {(selected.items || []).map((item, i) => (
                    <View key={i} style={styles.detailItem}>
                      <View style={styles.detailItemQtyBadge}>
                        <Text style={styles.detailItemQty}>{item.quantity}</Text>
                      </View>
                      <Text style={styles.detailItemName} numberOfLines={1}>{item.menuItem?.name || "Item"}</Text>
                      <Text style={styles.detailItemPrice}>{fmt(item.totalPrice)}</Text>
                    </View>
                  ))}
                  {selected.restaurantInstructions ? (
                    <Text style={styles.detailNote}>📝 {selected.restaurantInstructions}</Text>
                  ) : null}
                </Card>

                {/* Payment */}
                <Card style={styles.detailCard}>
                  <View style={styles.detailPayRow}>
                    <Text style={styles.detailCardTitle}>💳  Payment</Text>
                    <Text style={styles.detailCardValue}>{selected.paymentMethod}</Text>
                  </View>
                  <View style={styles.detailPayRow}>
                    <Text style={styles.detailCardSub}>Status</Text>
                    <Badge
                      label={selected.paymentStatus || "—"}
                      tone={selected.paymentStatus === "PAID" ? "success" : "warning"}
                    />
                  </View>
                </Card>

                {/* Notes */}
                {selected.notes ? (
                  <Card style={[styles.detailCard, { backgroundColor: colors.warningSoft, borderColor: "#fde68a" }]}>
                    <Text style={styles.detailCardTitle}>📝  Customer Note</Text>
                    <Text style={styles.detailCardValue}>{selected.notes}</Text>
                  </Card>
                ) : null}

                {/* Action buttons */}
                {NEXT_STATUS[selected.status] && (
                  <PrimaryButton
                    title={ACTION_LABEL[selected.status]}
                    tone={selected.status === "PENDING" ? "success" : "primary"}
                    onPress={() => advance(selected)}
                    loading={updating === selected.id}
                    style={styles.detailActionBtn}
                  />
                )}
                {selected.status === "PENDING" && (
                  <PrimaryButton
                    title="Reject Order"
                    tone="danger"
                    onPress={() => reject(selected)}
                    loading={updating === selected.id}
                    style={{ marginTop: 8 }}
                  />
                )}
                {/* Chat with customer */}
                <PrimaryButton
                  title="💬  Chat with Customer"
                  tone="outline"
                  onPress={() => navigation.navigate("Chat", {
                    orderId: selected.id,
                    orderNumber: selected.id?.slice(-6),
                  })}
                  style={{ marginTop: 8 }}
                />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ── Alert popup ── */}
      <OrderAlertModal
        order={alertOrder}
        onAccept={async (o) => { await updateOrderStatus(o.id, "ACCEPTED"); setAlertOrder(null); load({ silent: true }); }}
        onReject={async (o) => { await updateOrderStatus(o.id, "REJECTED"); setAlertOrder(null); load({ silent: true }); }}
        onDismiss={() => setAlertOrder(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: colors.ink },

  miniStats: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  miniStat:  { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: "center" },
  miniStatVal:{ fontSize: 22, fontWeight: "900" },
  miniStatLbl:{ fontSize: 11, fontWeight: "800", color: colors.muted, marginTop: 2 },

  tabs: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  tab:  { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: colors.line },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText:   { fontSize: 13, fontWeight: "800", color: colors.muted },
  tabTextActive: { color: "#fff" },

  list: { padding: 16, paddingTop: 4, gap: 12, paddingBottom: 32 },
  flatList: { flex: 1 },
  loadingWrap: { padding: 32, alignItems: "center" },
  loadingText: { color: colors.muted, fontWeight: "700" },

  orderCard: { backgroundColor: colors.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.line, gap: 10, shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  orderTop:  { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  orderId:   { fontSize: 16, fontWeight: "900", color: colors.ink },
  orderTime: { fontSize: 12, color: colors.muted, fontWeight: "700", marginTop: 2 },
  orderMid:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderCustomer: { fontSize: 14, fontWeight: "800", color: colors.ink, flex: 1 },
  orderAmt:  { fontSize: 16, fontWeight: "900", color: colors.primaryDark },
  orderItems:{ fontSize: 12, color: colors.muted, fontWeight: "700" },
  advanceBtn:{ marginTop: 4 },

  modalShade: { flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "flex-end" },
  modalCard:  { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "88%", paddingBottom: 24 },
  modalHandle:{ width: 44, height: 5, borderRadius: 999, backgroundColor: "#e2e8f0", alignSelf: "center", marginTop: 12, marginBottom: 4 },
  modalHeader:{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  modalTitle: { fontSize: 20, fontWeight: "900", color: colors.ink },
  modalBody:  { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },

  detailRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailAmt:  { fontSize: 22, fontWeight: "900", color: colors.primaryDark },
  detailCard: { gap: 8 },
  detailCardTitle: { fontSize: 12, fontWeight: "900", color: colors.muted, textTransform: "uppercase" },
  detailCardValue: { fontSize: 15, fontWeight: "800", color: colors.ink },
  detailCardSub:   { fontSize: 13, color: colors.muted, fontWeight: "700" },
  detailItem:  { flexDirection: "row", alignItems: "center", gap: 10 },
  detailItemQtyBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center" },
  detailItemQty:  { color: "#fff", fontWeight: "900", fontSize: 12 },
  detailItemName: { flex: 1, fontSize: 14, color: colors.ink, fontWeight: "700" },
  detailItemPrice:{ fontSize: 13, color: colors.muted, fontWeight: "800" },
  detailNote:     { fontSize: 13, color: colors.warning, fontWeight: "700", fontStyle: "italic" },
  detailPayRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailActionBtn:{ marginTop: 4 },
});
