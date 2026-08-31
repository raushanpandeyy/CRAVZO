import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert, FlatList, Image, RefreshControl,
  ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { Badge, Card, EmptyState, PrimaryButton } from "../components/Primitives";
import { Bell, Clock, IndianRupee, Package, Power, RefreshCw, Store } from "../components/Icons";
import OrderAlertModal from "../components/OrderAlertModal";
import { getVendorOrders, updateOrderStatus } from "../services/orderService";
import { getMyRestaurant, saveRestaurant, updateAvailability } from "../services/vendorService";
import { onNewOrder, onOrderStatusUpdate } from "../services/socketService";
import { useAuth } from "../services/AuthContext";

const fmt   = (v) => `Rs ${Math.floor(v || 0)}`;
const fmtTime = (v) => new Date(v).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

const STATUS_COLOR = {
  PENDING:         { tone: "orange",  label: "Pending" },
  ACCEPTED:        { tone: "primary", label: "Accepted" },
  PREPARING:       { tone: "warning", label: "Preparing" },
  READY_FOR_PICKUP:{ tone: "success", label: "Ready" },
  OUT_FOR_DELIVERY:{ tone: "primary", label: "Out for Delivery" },
  DELIVERED:       { tone: "success", label: "Delivered" },
  CANCELLED:       { tone: "danger",  label: "Cancelled" },
  REJECTED:        { tone: "danger",  label: "Rejected" },
};

const ACTIVE_STATUSES = ["PENDING","ACCEPTED","PREPARING","READY_FOR_PICKUP"];

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [restaurant,  setRestaurant]  = useState(null);
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [toggling,    setToggling]    = useState(false);
  const [alertOrder,  setAlertOrder]  = useState(null);
  const [hoursAlert,  setHoursAlert]  = useState(null); // { type: "closing"|"opening", minutesLeft }
  const [hoursSaving, setHoursSaving] = useState(false);
  const snoozedUntilRef = useRef(0);
  const shownIdsRef = useRef(new Set());

  // ── Load ────────────────────────────────────────────────────────
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [rest, raw] = await Promise.all([getMyRestaurant(), getVendorOrders()]);
      setRestaurant(rest);
      const list = Array.isArray(raw) ? raw : [];
      setOrders(list);
    } catch (err) {
      if (!silent) Alert.alert("Error", err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Socket ──────────────────────────────────────────────────────
  useEffect(() => {
    load();
    const cleanups = [
      onNewOrder((payload) => {
        load({ silent: true });
        // Will surface via the orders refresh — alert shown in next effect
      }),
      onOrderStatusUpdate(() => load({ silent: true })),
    ];
    return () => cleanups.forEach((fn) => fn?.());
  }, [load]);

  // ── Show alert popup for new PENDING orders ─────────────────────
  useEffect(() => {
    const pending = orders.find(
      (o) => o.status === "PENDING" && !shownIdsRef.current.has(o.id)
    );
    if (pending && !alertOrder) {
      shownIdsRef.current.add(pending.id);
      setAlertOrder(pending);
    }
  }, [orders]);

  // ── Smart hours alert ────────────────────────────────────────────
  useEffect(() => {
    if (!restaurant?.openingTime || !restaurant?.closingTime) return;

    const check = () => {
      if (Date.now() < snoozedUntilRef.current) return;

      const now  = new Date();
      const toMins = (hhmm) => {
        const [h, m] = (hhmm || "").split(":").map(Number);
        return isNaN(h) ? null : h * 60 + (m || 0);
      };
      const nowMins    = now.getHours() * 60 + now.getMinutes();
      const closeMins  = toMins(restaurant.closingTime);
      const openMins   = toMins(restaurant.openingTime);

      if (closeMins !== null && restaurant.isOpen) {
        const diff = closeMins - nowMins;
        if (diff > 0 && diff <= 30) {
          setHoursAlert({ type: "closing", minutesLeft: diff });
          return;
        }
      }
      if (openMins !== null && !restaurant.isOpen) {
        const diff = openMins - nowMins;
        if (diff >= 0 && diff <= 15) {
          setHoursAlert({ type: "opening" });
          return;
        }
      }
      setHoursAlert(null);
    };

    check();
    const interval = setInterval(check, 60_000); // check every minute
    return () => clearInterval(interval);
  }, [restaurant]);

  // ── Stats ────────────────────────────────────────────────────────
  const todayStr   = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === todayStr
  );
  const todayRevenue = todayOrders
    .filter((o) => !["CANCELLED","REJECTED"].includes(o.status))
    .reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const activeCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const pendingCount= orders.filter((o) => o.status === "PENDING").length;
  const recentOrders= orders.slice(0, 8);

  // ── Toggle open/close ────────────────────────────────────────────
  const handleToggle = async () => {
    if (!restaurant) return;
    const next = !restaurant.isOpen;
    setToggling(true);
    try {
      await updateAvailability(restaurant.id, { isOpen: next });
      setRestaurant((r) => ({ ...r, isOpen: next }));
    } catch (err) {
      Alert.alert("Failed", err.message || "Could not update status");
    } finally {
      setToggling(false);
    }
  };

  // ── Hours alert actions ──────────────────────────────────────────
  const handleExtendHours = async (extraMins) => {
    if (!restaurant?.id) return;
    const [h, m] = (restaurant.closingTime || "22:00").split(":").map(Number);
    const total  = h * 60 + (m || 0) + extraMins;
    const newH   = String(Math.floor(total / 60) % 24).padStart(2, "0");
    const newM   = String(total % 60).padStart(2, "0");
    const newTime = `${newH}:${newM}`;
    setHoursSaving(true);
    try {
      await saveRestaurant(restaurant.id, { ...restaurant, closingTime: newTime });
      setRestaurant((r) => ({ ...r, closingTime: newTime }));
      setHoursAlert(null);
    } catch (err) {
      Alert.alert("Failed", err.message);
    } finally {
      setHoursSaving(false);
    }
  };

  const handleGoOnline = async () => {
    if (!restaurant?.id) return;
    setHoursSaving(true);
    try {
      await updateAvailability(restaurant.id, { isOpen: true });
      setRestaurant((r) => ({ ...r, isOpen: true }));
      setHoursAlert(null);
    } catch (err) {
      Alert.alert("Failed", err.message);
    } finally {
      setHoursSaving(false);
    }
  };

  // ── Alert handlers ────────────────────────────────────────────────
  const handleAccept = async (order) => {
    await updateOrderStatus(order.id, "ACCEPTED");
    setAlertOrder(null);
    load({ silent: true });
  };

  const handleReject = async (order) => {
    await updateOrderStatus(order.id, "REJECTED");
    setAlertOrder(null);
    load({ silent: true });
  };

  // ── Render order row ──────────────────────────────────────────────
  const renderOrder = ({ item }) => {
    const sc = STATUS_COLOR[item.status] || { tone: "muted", label: item.status };
    return (
      <TouchableOpacity
        style={styles.orderRow}
        onPress={() => navigation.navigate("Orders")}
        activeOpacity={0.7}
      >
        <View style={styles.orderRowLeft}>
          <Text style={styles.orderRowId}>#{item.id.slice(-6)}</Text>
          <Text style={styles.orderRowMeta}>
            {item.customer?.name || "Customer"} · {fmtTime(item.createdAt)}
          </Text>
        </View>
        <View style={styles.orderRowRight}>
          <Text style={styles.orderRowAmt}>{fmt(item.totalAmount)}</Text>
          <Badge label={sc.label} tone={sc.tone} style={styles.orderRowBadge} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load({ silent: true }); }}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={require("../../assets/dodagologo.png")} style={styles.headerLogo} resizeMode="contain" />
            <View>
              <Text style={styles.headerGreet}>Hello, {user?.name?.split(" ")[0] || "Partner"} 👋</Text>
              <Text style={styles.headerSub}>Here's your restaurant summary</Text>
            </View>
          </View>
          {pendingCount > 0 && (
            <View style={styles.bellWrap}>
              <Bell size={22} color={colors.danger} />
              <View style={styles.bellBadge}><Text style={styles.bellBadgeText}>{pendingCount}</Text></View>
            </View>
          )}
        </View>

        {/* ── Restaurant status card ── */}
        <Card style={[styles.statusCard, restaurant?.isOpen ? styles.statusOpen : styles.statusClosed]}>
          <View style={styles.statusLeft}>
            <Store size={28} color={restaurant?.isOpen ? colors.accent : colors.danger} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.restaurantName} numberOfLines={1}>
                {restaurant?.name || "Your Restaurant"}
              </Text>
              <Text style={[styles.statusLabel, { color: restaurant?.isOpen ? colors.accent : colors.danger }]}>
                {restaurant?.isOpen ? "🟢  Open for orders" : "🔴  Closed"}
              </Text>
            </View>
          </View>
          <Switch
            value={Boolean(restaurant?.isOpen)}
            onValueChange={handleToggle}
            disabled={toggling || !restaurant}
            trackColor={{ false: colors.dangerSoft, true: colors.accentSoft }}
            thumbColor={restaurant?.isOpen ? colors.accent : colors.danger}
          />
        </Card>

        {/* ── Smart hours alert banner ── */}
        {hoursAlert && (
          <View style={[
            styles.hoursAlert,
            hoursAlert.type === "closing" ? styles.hoursAlertClosing : styles.hoursAlertOpening,
          ]}>
            <View style={styles.hoursAlertLeft}>
              <Text style={styles.hoursAlertEmoji}>
                {hoursAlert.type === "closing" ? "⏰" : "🕐"}
              </Text>
              <View>
                <Text style={styles.hoursAlertTitle}>
                  {hoursAlert.type === "closing"
                    ? `Closing in ${hoursAlert.minutesLeft} min`
                    : "Opening time is near"}
                </Text>
                <Text style={styles.hoursAlertSub}>
                  {hoursAlert.type === "closing"
                    ? "Extend closing time?"
                    : "Your restaurant should open soon"}
                </Text>
              </View>
            </View>
            <View style={styles.hoursAlertActions}>
              {hoursAlert.type === "closing" ? (
                <>
                  <TouchableOpacity
                    style={styles.hoursAlertBtn}
                    onPress={() => handleExtendHours(30)}
                    disabled={hoursSaving}
                  >
                    <Text style={styles.hoursAlertBtnText}>+30m</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.hoursAlertBtn}
                    onPress={() => handleExtendHours(60)}
                    disabled={hoursSaving}
                  >
                    <Text style={styles.hoursAlertBtnText}>+1h</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.hoursAlertBtn}
                  onPress={handleGoOnline}
                  disabled={hoursSaving}
                >
                  <Text style={styles.hoursAlertBtnText}>Go Online</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.hoursAlertDismiss}
                onPress={() => {
                  snoozedUntilRef.current = Date.now() + 10 * 60 * 1000; // snooze 10 min
                  setHoursAlert(null);
                }}
              >
                <Text style={styles.hoursAlertDismissText}>Snooze</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Stats grid ── */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.primarySoft }]}>
              <Package size={20} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{todayOrders.length}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.accentSoft }]}>
              <IndianRupee size={20} color={colors.accent} />
            </View>
            <Text style={styles.statValue}>{fmt(todayRevenue)}</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.warningSoft }]}>
              <Clock size={20} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active Orders</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.orangeSoft }]}>
              <Bell size={20} color={colors.orange} />
            </View>
            <Text style={[styles.statValue, pendingCount > 0 && { color: colors.danger }]}>
              {pendingCount}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>
        </View>

        {/* ── Quick actions ── */}
        <View style={styles.quickRow}>
          <PrimaryButton
            title="📋  All Orders"
            tone="primary"
            onPress={() => navigation.navigate("Orders")}
            style={styles.quickBtn}
          />
          <PrimaryButton
            title="🍳  Kitchen"
            tone="dark"
            onPress={() => navigation.navigate("Kitchen")}
            style={styles.quickBtn}
          />
        </View>

        {/* ── Recent orders ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => load({ silent: true })} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <RefreshCw size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <Card style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading orders…</Text>
            </Card>
          ) : recentOrders.length === 0 ? (
            <EmptyState
              icon="🍽️"
              title="No orders yet"
              body="New orders will appear here in real time."
            />
          ) : (
            <Card style={styles.ordersCard}>
              {recentOrders.map((item, i) => (
                <View key={item.id}>
                  {renderOrder({ item })}
                  {i < recentOrders.length - 1 && <View style={styles.rowDivider} />}
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>

      {/* ── New order alert modal ── */}
      <OrderAlertModal
        order={alertOrder}
        onAccept={handleAccept}
        onReject={handleReject}
        onDismiss={() => setAlertOrder(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 32, gap: 16 },

  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: 12 },
  headerLogo:  { width: 42, height: 42, borderRadius: 12 },
  headerGreet: { fontSize: 17, fontWeight: "900", color: colors.ink },
  headerSub:   { fontSize: 12, color: colors.muted, fontWeight: "700", marginTop: 1 },
  bellWrap:    { position: "relative", padding: 4 },
  bellBadge:   { position: "absolute", top: 0, right: 0, backgroundColor: colors.danger, borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  bellBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },

  statusCard:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  statusOpen:   { borderColor: "#6ee7b7" },
  statusClosed: { borderColor: "#fca5a5" },
  statusLeft:   { flexDirection: "row", alignItems: "center", flex: 1 },
  restaurantName:{ fontSize: 16, fontWeight: "900", color: colors.ink, maxWidth: 200 },
  statusLabel:  { fontSize: 13, fontWeight: "800", marginTop: 2 },

  statsGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard:    { flex: 1, minWidth: "45%", alignItems: "center", gap: 6, paddingVertical: 18 },
  statIcon:    { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  statValue:   { fontSize: 24, fontWeight: "900", color: colors.ink },
  statLabel:   { fontSize: 11, fontWeight: "800", color: colors.muted, textAlign: "center" },

  quickRow:    { flexDirection: "row", gap: 10 },
  quickBtn:    { flex: 1 },

  section:     { gap: 10 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle:{ fontSize: 18, fontWeight: "900", color: colors.ink },

  loadingCard: { alignItems: "center", paddingVertical: 24 },
  loadingText: { color: colors.muted, fontWeight: "700" },

  ordersCard:  { padding: 0, overflow: "hidden" },
  orderRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, gap: 12 },
  orderRowLeft:{ flex: 1 },
  orderRowId:  { fontSize: 15, fontWeight: "900", color: colors.ink },
  orderRowMeta:{ fontSize: 12, color: colors.muted, fontWeight: "700", marginTop: 2 },
  orderRowRight:{ alignItems: "flex-end", gap: 4 },
  orderRowAmt: { fontSize: 14, fontWeight: "900", color: colors.ink },
  orderRowBadge:{ },
  rowDivider:  { height: 1, backgroundColor: colors.line, marginHorizontal: 14 },

  // ── Smart hours alert ──
  hoursAlert:        { borderRadius: 16, padding: 14, gap: 10, borderWidth: 1 },
  hoursAlertClosing: { backgroundColor: "#fffbeb", borderColor: "#fde68a" },
  hoursAlertOpening: { backgroundColor: colors.accentSoft, borderColor: "#6ee7b7" },
  hoursAlertLeft:    { flexDirection: "row", alignItems: "center", gap: 10 },
  hoursAlertEmoji:   { fontSize: 28 },
  hoursAlertTitle:   { fontSize: 15, fontWeight: "900", color: colors.ink },
  hoursAlertSub:     { fontSize: 12, color: colors.muted, fontWeight: "700", marginTop: 1 },
  hoursAlertActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  hoursAlertBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: colors.primary,
  },
  hoursAlertBtnText:     { color: "#fff", fontWeight: "900", fontSize: 13 },
  hoursAlertDismiss:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "#f1f5f9" },
  hoursAlertDismissText: { color: colors.muted, fontWeight: "800", fontSize: 13 },
});
