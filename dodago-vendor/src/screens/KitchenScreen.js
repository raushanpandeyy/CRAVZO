import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, FlatList, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { Badge, Card, EmptyState, PrimaryButton } from "../components/Primitives";
import { Clock, RefreshCw } from "../components/Icons";
import OrderAlertModal from "../components/OrderAlertModal";
import { getVendorOrders, updateOrderStatus } from "../services/orderService";
import { onNewOrder, onOrderStatusUpdate } from "../services/socketService";

const COLUMNS = [
  { status: "PENDING",          label: "🔔 New",       next: "ACCEPTED",         action: "Accept",       accent: colors.orange,   bg: colors.orangeSoft },
  { status: "ACCEPTED",         label: "✅ Accepted",  next: "PREPARING",        action: "Start Prep",   accent: colors.primary,  bg: colors.primarySoft },
  { status: "PREPARING",        label: "👨‍🍳 Preparing",  next: "READY_FOR_PICKUP", action: "Mark Ready",   accent: colors.warning,  bg: colors.warningSoft },
  { status: "READY_FOR_PICKUP", label: "📦 Ready",     next: null,               action: null,           accent: colors.accent,   bg: colors.accentSoft },
];

const fmtTime  = (v) => new Date(v).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const minsSince= (v) => Math.max(0, Math.floor((Date.now() - new Date(v).getTime()) / 60000));

export default function KitchenScreen() {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating,   setUpdating]   = useState("");
  const [alertOrder, setAlertOrder] = useState(null);
  const shownIdsRef = useRef(new Set());
  const tickRef     = useRef(null);
  const [, forceUpdate] = useState(0); // for live minute counter

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
    // Tick every 30s to refresh the "X min ago" display
    tickRef.current = setInterval(() => forceUpdate((n) => n + 1), 30000);
    return () => {
      cleanups.forEach((fn) => fn?.());
      clearInterval(tickRef.current);
    };
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

  // ── Active kitchen orders ──────────────────────────────────────
  const activeStatuses = COLUMNS.map((c) => c.status);
  const kitchenOrders = useMemo(
    () => orders.filter((o) => activeStatuses.includes(o.status)),
    [orders]
  );

  // ── Advance status ─────────────────────────────────────────────
  const advance = async (order, next) => {
    if (!next) return;
    setUpdating(order.id);
    try {
      await updateOrderStatus(order.id, next);
      load({ silent: true });
    } catch (err) {
      Alert.alert("Failed", err.message || "Could not update order");
    } finally {
      setUpdating("");
    }
  };

  // ── Urgency: orders > 15 min old ─────────────────────────────
  const isUrgent = (order) => minsSince(order.createdAt) > 15;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Kitchen Display</Text>
          <Text style={styles.headerSub}>{kitchenOrders.length} active order{kitchenOrders.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity onPress={() => load({ silent: true })} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <RefreshCw size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* ── Column headers ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colHeaders}
      >
        {COLUMNS.map((col) => {
          const count = orders.filter((o) => o.status === col.status).length;
          return (
            <View key={col.status} style={[styles.colHeader, { borderColor: col.accent }]}>
              <Text style={[styles.colLabel, { color: col.accent }]}>{col.label}</Text>
              <View style={[styles.colCount, { backgroundColor: col.accent }]}>
                <Text style={styles.colCountText}>{count}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Kanban board ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading kitchen orders…</Text>
        </View>
      ) : kitchenOrders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState icon="🍳" title="Kitchen is clear" body="No active orders at the moment." />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.board}
          style={styles.boardScroll}
          snapToInterval={300}
          decelerationRate="fast"
        >
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            return (
              <View key={col.status} style={[styles.column, { borderTopColor: col.accent }]}>
                {/* Column title */}
                <View style={[styles.columnTitleRow, { backgroundColor: col.bg }]}>
                  <Text style={[styles.columnTitle, { color: col.accent }]}>{col.label}</Text>
                  <Text style={[styles.columnCount, { color: col.accent }]}>{colOrders.length}</Text>
                </View>

                <FlatList
                  data={colOrders}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.colList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.colEmpty}>
                      <Text style={styles.colEmptyText}>No orders</Text>
                    </View>
                  }
                  renderItem={({ item }) => {
                    const mins    = minsSince(item.createdAt);
                    const urgent  = isUrgent(item);
                    return (
                      <View style={[styles.ticket, urgent && styles.ticketUrgent]}>
                        {/* Ticket header */}
                        <View style={styles.ticketHeader}>
                          <Text style={styles.ticketId}>#{item.id.slice(-6)}</Text>
                          <View style={styles.ticketTimeRow}>
                            <Clock size={12} color={urgent ? colors.danger : colors.muted} />
                            <Text style={[styles.ticketTime, urgent && { color: colors.danger }]}>
                              {fmtTime(item.createdAt)} · {mins}m
                            </Text>
                          </View>
                        </View>

                        {/* Customer */}
                        <Text style={styles.ticketCustomer} numberOfLines={1}>
                          {item.customer?.name || "Customer"}
                        </Text>

                        {/* Items */}
                        <View style={styles.ticketItems}>
                          {(item.items || []).map((it, i) => (
                            <View key={i} style={styles.ticketItem}>
                              <View style={styles.ticketItemQty}>
                                <Text style={styles.ticketItemQtyText}>{it.quantity}</Text>
                              </View>
                              <Text style={styles.ticketItemName} numberOfLines={1}>
                                {it.menuItem?.name || "Item"}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {/* Restaurant instructions */}
                        {item.restaurantInstructions ? (
                          <Text style={styles.ticketNote} numberOfLines={2}>
                            📝 {item.restaurantInstructions}
                          </Text>
                        ) : null}

                        {/* Amount */}
                        <Text style={styles.ticketAmt}>
                          Rs {Math.floor(item.totalAmount || 0)}
                        </Text>

                        {/* Action button */}
                        {col.action && (
                          <PrimaryButton
                            title={col.action}
                            tone={col.status === "PENDING" ? "success" : "primary"}
                            onPress={() => advance(item, col.next)}
                            loading={updating === item.id}
                            style={styles.ticketBtn}
                          />
                        )}
                        {col.status === "PENDING" && (
                          <PrimaryButton
                            title="Reject"
                            tone="muted"
                            onPress={async () => {
                              setUpdating(item.id);
                              try {
                                await updateOrderStatus(item.id, "REJECTED");
                                load({ silent: true });
                              } catch (e) {
                                Alert.alert("Failed", e.message);
                              } finally { setUpdating(""); }
                            }}
                            loading={updating === item.id}
                            style={[styles.ticketBtn, { marginTop: 6 }]}
                          />
                        )}
                      </View>
                    );
                  }}
                />
              </View>
            );
          })}
        </ScrollView>
      )}

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
  safe:    { flex: 1, backgroundColor: colors.bg },

  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: colors.ink },
  headerSub:   { fontSize: 13, color: colors.muted, fontWeight: "700", marginTop: 2 },

  colHeaders: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  colHeader:  { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1.5 },
  colLabel:   { fontSize: 13, fontWeight: "900" },
  colCount:   { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  colCountText:{ color: "#fff", fontWeight: "900", fontSize: 12 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.muted, fontWeight: "700" },
  emptyWrap:   { flex: 1, padding: 24 },

  boardScroll: { flex: 1 },
  board:   { paddingHorizontal: 12, paddingBottom: 32, gap: 12, alignItems: "stretch" },
  column:  { width: 280, flex: 1, borderTopWidth: 3, borderRadius: 20, backgroundColor: "#fff", shadowColor: "#0f172a", shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  columnTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10 },
  columnTitle: { fontSize: 14, fontWeight: "900" },
  columnCount: { fontSize: 14, fontWeight: "900" },
  colList:  { padding: 10, gap: 10 },
  colEmpty: { padding: 20, alignItems: "center" },
  colEmptyText: { color: colors.subtle, fontWeight: "700", fontSize: 13 },

  ticket:       { backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 8 },
  ticketUrgent: { borderColor: colors.danger, borderWidth: 2 },
  ticketHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ticketId:     { fontSize: 16, fontWeight: "900", color: colors.ink },
  ticketTimeRow:{ flexDirection: "row", alignItems: "center", gap: 4 },
  ticketTime:   { fontSize: 11, fontWeight: "800", color: colors.muted },
  ticketCustomer:{ fontSize: 13, fontWeight: "800", color: colors.muted },
  ticketItems:  { gap: 5 },
  ticketItem:   { flexDirection: "row", alignItems: "center", gap: 8 },
  ticketItemQty:{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center" },
  ticketItemQtyText: { color: "#fff", fontWeight: "900", fontSize: 11 },
  ticketItemName:    { flex: 1, fontSize: 13, color: colors.ink, fontWeight: "700" },
  ticketNote:  { fontSize: 11, color: colors.warning, fontWeight: "700", fontStyle: "italic" },
  ticketAmt:   { fontSize: 14, fontWeight: "900", color: colors.primaryDark, textAlign: "right" },
  ticketBtn:   { marginTop: 2 },
});
