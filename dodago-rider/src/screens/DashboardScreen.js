import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";
import { BatteryWarning, MapPin, Power, X } from "../components/Icons";
import { Card, EmptyState, PrimaryButton } from "../components/Primitives";
import { ScreenWithHeader } from "../components/RiderChrome";
import { OrderCard } from "../components/OrderCard";
import { colors } from "../constants/colors";
import { getRiderOrders, updateOrderStatus, verifyDeliveryOtp } from "../services/orderService";
import { updateRiderLocation, updateRiderStatus } from "../services/riderService";
import { onNewOrder, onOrderStatusUpdate } from "../services/socketService";
import { formatCurrency, formatCustomerAddress, formatDistance, formatRestaurantAddress, openNavigation } from "../utils/formatters";
import { useAuth } from "../services/AuthContext";
import { playAlertSound, stopAlertSound } from "../utils/alertSound";

const ACTIVE_STATUSES = ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"];

const getOrderEarning = (order) => Number(order?.deliveryFee || 0) + Number(order?.tipAmount || 0);

const getRestaurantDistance = (order) =>
  order?.pickupDistance ??
  order?.pickupDistanceKm ??
  order?.distanceToRestaurant ??
  order?.restaurantDistance ??
  order?.distanceFromRider ??
  order?.deliveryDistance;

export default function DashboardScreen({ navigation }) {
  const { user, setUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(Boolean(user?.isOnline));
  const [locationStatus, setLocationStatus] = useState("pending");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderRequest, setOrderRequest] = useState(null);
  const [requestCountdown, setRequestCountdown] = useState(30);
  const [otp, setOtp] = useState("");
  const dismissedRequestsRef = useRef(new Set());
  const locationSub = useRef(null);
  const isOnlineRef = useRef(Boolean(user?.isOnline));

  const syncLocation = useCallback(async (coords) => {
    if (!isOnlineRef.current || !coords) return;
    try {
      setLocationStatus("syncing");
      await updateRiderLocation(coords.latitude, coords.longitude, {
        accuracy: coords.accuracy,
        heading: coords.heading,
        speed: coords.speed,
        timestamp: Date.now(),
      });
      setLocationStatus("synced");
    } catch {
      setLocationStatus("error");
    }
  }, []);

  const startLocationWatch = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      setLocationStatus("denied");
      return;
    }
    locationSub.current?.remove?.();
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 12000, distanceInterval: 30 },
      (position) => syncLocation(position.coords)
    );
  }, [syncLocation]);

  useEffect(() => {
    if (isOnline) startLocationWatch().catch(() => setLocationStatus("error"));
    return () => locationSub.current?.remove?.();
  }, [isOnline, startLocationWatch]);

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await getRiderOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert("Orders failed", error.message || "Could not load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const cleanups = [
      onNewOrder(() => loadOrders({ silent: true })),
      onOrderStatusUpdate(() => loadOrders({ silent: true })),
    ];
    return () => cleanups.forEach((fn) => fn?.());
  }, [loadOrders]);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  const availableOrders = useMemo(() => orders.filter((order) => order.isAvailable), [orders]);
  const activeOrders = useMemo(() => orders.filter((order) => !order.isAvailable && ACTIVE_STATUSES.includes(order.status)), [orders]);
  const deliveredOrders = useMemo(() => orders.filter((order) => order.status === "DELIVERED"), [orders]);
  const deliveredKm = useMemo(() => deliveredOrders.reduce((sum, order) => sum + Number(order.deliveryDistance || 0), 0), [deliveredOrders]);
  const dashboardOrders = useMemo(() => [...activeOrders, ...availableOrders], [activeOrders, availableOrders]);
  const activeFocusOrder = activeOrders[0] || null;
  const requestOrderId = orderRequest?.id;

  useEffect(() => {
    if (!isOnline) {
      setOrderRequest(null);
      return;
    }

    const nextRequest = availableOrders.find((order) => !dismissedRequestsRef.current.has(order.id));
    if (nextRequest && nextRequest.id !== requestOrderId) {
      setOrderRequest(nextRequest);
    }
  }, [availableOrders, isOnline, requestOrderId]);

  useEffect(() => {
    if (!orderRequest) return;
    setRequestCountdown(30);
    const timer = setInterval(() => {
      setRequestCountdown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [orderRequest?.id]);

  // Auto-dismiss the popup when the 30-second countdown expires.
  useEffect(() => {
    if (requestCountdown === 0 && orderRequest) {
      stopAlertSound();
      if (orderRequest?.id) dismissedRequestsRef.current.add(orderRequest.id);
      setOrderRequest(null);
    }
  }, [requestCountdown, orderRequest]);

  // Play alert sound + vibration when a new order popup appears, stop when it clears.
  useEffect(() => {
    if (orderRequest) {
      playAlertSound();
    } else {
      stopAlertSound();
    }
    // Always stop on unmount (e.g. rider navigates away mid-alert).
    return () => { stopAlertSound(); };
  }, [orderRequest?.id]);

  const toggleOnline = useCallback(async () => {
    try {
      const next = !isOnline;
      const result = await updateRiderStatus(next);
      setIsOnline(next);
      setUser((current) => ({ ...current, isOnline: next, ...result }));
      if (!next) locationSub.current?.remove?.();
    } catch (error) {
      Alert.alert("Status failed", error.message || "Could not update rider status.");
    }
  }, [isOnline, setUser]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadOrders({ silent: true });
  }, [loadOrders]);

  const acceptOrder = useCallback(async (order) => {
    try {
      stopAlertSound();
      await updateOrderStatus(order.id, "ACCEPTED");
      setOrderRequest((current) => current?.id === order.id ? null : current);
      await loadOrders({ silent: true });
    } catch (error) {
      Alert.alert("Accept failed", error.message || "Could not accept order.");
    }
  }, [loadOrders]);

  const rejectOrder = useCallback(async (order) => {
    try {
      stopAlertSound();
      await updateOrderStatus(order.id, "REJECTED");
      dismissedRequestsRef.current.add(order.id);
      setOrderRequest((current) => current?.id === order.id ? null : current);
      await loadOrders({ silent: true });
    } catch (error) {
      Alert.alert("Reject failed", error.message || "Could not reject order.");
    }
  }, [loadOrders]);

  const pickupOrder = useCallback(async (order) => {
    try {
      await updateOrderStatus(order.id, "OUT_FOR_DELIVERY");
      await loadOrders({ silent: true });
    } catch (error) {
      Alert.alert("Pickup failed", error.message || "Could not update order.");
    }
  }, [loadOrders]);

  const completeWithOtp = useCallback(async () => {
    if (!selectedOrder || otp.length !== 4) return;
    try {
      await verifyDeliveryOtp(selectedOrder.id, otp);
      setOtp("");
      setSelectedOrder(null);
      await loadOrders({ silent: true });
      Alert.alert("Delivered", "Order completed successfully.");
    } catch (error) {
      Alert.alert("OTP failed", error.message || "Could not verify OTP.");
    }
  }, [loadOrders, otp, selectedOrder]);

  const openChat = useCallback((order) => navigation.navigate("Chat", { order }), [navigation]);

  const renderOrder = useCallback(({ item }) => (
    <OrderCard
      order={item}
      onView={setSelectedOrder}
      onAccept={acceptOrder}
      onReject={rejectOrder}
      onPickup={pickupOrder}
      onChat={openChat}
    />
  ), [acceptOrder, openChat, pickupOrder, rejectOrder]);
  return (
    <ScreenWithHeader title="Home" subtitle="Rider" navigation={navigation}>
      <FlatList
        data={dashboardOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
                initialNumToRender={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.hero}>
              <View style={styles.heroAccent} />
              <View>
                <Text style={styles.eyebrow}>Rider Console</Text>
                <Text style={styles.title}>Hi {user?.name || "Rider"}</Text>
              </View>
              <TouchableOpacity style={[styles.statusButton, isOnline ? styles.online : styles.offline]} onPress={toggleOnline}>
                <Power size={18} color="#fff" />
                <Text style={styles.statusText}>{isOnline ? "Online" : "Offline"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.summaryGrid}>
              <Card style={styles.summaryCard}><Text style={styles.summaryLabel}>Available</Text><Text style={styles.summaryValue}>{availableOrders.length}</Text></Card>
              <Card style={styles.summaryCard}><Text style={styles.summaryLabel}>Active</Text><Text style={styles.summaryValue}>{activeOrders.length}</Text></Card>
              <Card style={styles.summaryCard}><Text style={styles.summaryLabel}>Delivered</Text><Text style={styles.summaryValue}>{deliveredOrders.length}</Text></Card>
              <Card style={styles.summaryCard}><Text style={styles.summaryLabel}>Km</Text><Text style={styles.summaryValue}>{formatDistance(deliveredKm)}</Text></Card>
            </View>
            <Card style={styles.locationCard}>
              <MapPin size={18} color={colors.primary} />
              <Text style={styles.locationText}>Location: {locationStatus}</Text>
              <BatteryWarning size={18} color={colors.warning} />
            </Card>
            {activeFocusOrder ? (
              <Card style={styles.activeMission}>
                <View style={styles.missionTop}>
                  <View>
                    <Text style={styles.missionEyebrow}>Current delivery</Text>
                    <Text numberOfLines={1} style={styles.missionTitle}>{activeFocusOrder.restaurant?.name || "Active order"}</Text>
                  </View>
                  <Text style={styles.missionMoney}>{formatCurrency(getOrderEarning(activeFocusOrder))}</Text>
                </View>
                <View style={styles.missionRoute}>
                  <MapPin size={17} color={colors.primaryDark} />
                  <Text numberOfLines={2} style={styles.missionAddress}>
                    {activeFocusOrder.status === "OUT_FOR_DELIVERY" ? formatCustomerAddress(activeFocusOrder.address) : formatRestaurantAddress(activeFocusOrder.restaurant)}
                  </Text>
                </View>
                <View style={styles.missionActions}>
                  <PrimaryButton title="Navigate" tone="dark" onPress={() => openNavigation(activeFocusOrder.status === "OUT_FOR_DELIVERY" ? activeFocusOrder.address : activeFocusOrder.restaurant, activeFocusOrder.status === "OUT_FOR_DELIVERY" ? formatCustomerAddress(activeFocusOrder.address) : formatRestaurantAddress(activeFocusOrder.restaurant))} style={styles.flex} />
                  <PrimaryButton title="Chat" onPress={() => openChat(activeFocusOrder)} style={styles.flex} />
                </View>
              </Card>
            ) : null}
            <Text style={styles.sectionTitle}>Active and available orders</Text>
          </View>
        }
        ListEmptyComponent={!loading ? <EmptyState title={isOnline ? "No orders right now" : "You are offline"} body={isOnline ? "New delivery requests will appear here." : "Go online to receive delivery requests."} /> : null}
        contentContainerStyle={styles.content}
      />

      <Modal visible={Boolean(orderRequest)} transparent animationType="slide" hardwareAccelerated statusBarTranslucent onRequestClose={() => { stopAlertSound(); setOrderRequest(null); }}>
        <View style={styles.requestShade}>
          <View style={styles.requestCard}>

            {/* ── Red alert header ── */}
            <View style={styles.requestHeader}>
              <View style={styles.requestHeaderLeft}>
                <Text style={styles.requestHeaderEyebrow}>🔔  New Delivery Request</Text>
                <Text numberOfLines={1} style={styles.requestHeaderTitle}>
                  {orderRequest?.restaurant?.name || "Restaurant"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.requestClose}
                onPress={() => {
                  stopAlertSound();
                  if (orderRequest?.id) dismissedRequestsRef.current.add(orderRequest.id);
                  setOrderRequest(null);
                }}
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* ── Countdown bar ── */}
            <View style={styles.countdownTrack}>
              <View style={[styles.countdownFill, { width: `${Math.max(0, Math.min(100, (requestCountdown / 30) * 100))}%` }]} />
            </View>
            <Text style={styles.countdownText}>Auto-dismiss in {requestCountdown}s</Text>

            {/* ── Earnings + distance stats ── */}
            <View style={styles.requestStats}>
              <View style={styles.requestStatEarn}>
                <Text style={styles.requestStatLabel}>💰  You Earn</Text>
                <Text style={styles.requestStatEarnValue}>{formatCurrency(getOrderEarning(orderRequest))}</Text>
                <Text style={styles.requestStatHint}>
                  Delivery fee{Number(orderRequest?.tipAmount || 0) > 0 ? " + tip" : ""}
                </Text>
              </View>
              <View style={styles.requestStatDist}>
                <Text style={styles.requestStatLabel}>📍  Pickup Distance</Text>
                <Text style={styles.requestStatDistValue}>{formatDistance(getRestaurantDistance(orderRequest))}</Text>
                <Text style={styles.requestStatHint}>From your location</Text>
              </View>
            </View>

            {/* ── Pickup address ── */}
            <View style={styles.requestAddressBox}>
              <View style={styles.requestAddressRow}>
                <View style={styles.requestAddressDot} />
                <View style={styles.requestAddressTextWrap}>
                  <Text style={styles.requestAddressLabel}>PICKUP FROM</Text>
                  <Text numberOfLines={2} style={styles.requestAddressText}>
                    {formatRestaurantAddress(orderRequest?.restaurant)}
                  </Text>
                </View>
              </View>
              <View style={styles.requestAddressDivider} />
              <View style={styles.requestAddressRow}>
                <View style={[styles.requestAddressDot, styles.requestAddressDotDrop]} />
                <View style={styles.requestAddressTextWrap}>
                  <Text style={styles.requestAddressLabel}>DELIVER TO</Text>
                  <Text numberOfLines={2} style={styles.requestAddressText}>
                    {formatCustomerAddress(orderRequest?.address)}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Accept / Reject buttons ── */}
            <View style={styles.requestActions}>
              <PrimaryButton
                title="✕  Reject"
                tone="muted"
                onPress={() => rejectOrder(orderRequest)}
                style={styles.flex}
              />
              <PrimaryButton
                title="✓  Accept"
                tone="success"
                onPress={() => acceptOrder(orderRequest)}
                style={[styles.flex, styles.requestAcceptBtn]}
              />
            </View>

          </View>
        </View>
      </Modal>

            <Modal visible={Boolean(selectedOrder)} transparent animationType="slide" hardwareAccelerated statusBarTranslucent onRequestClose={() => setSelectedOrder(null)}>
        <View style={styles.modalShade}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.close} onPress={() => setSelectedOrder(null)}><X size={22} color={colors.ink} /></TouchableOpacity>
            {selectedOrder ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                <Text style={styles.modalBadge}>{selectedOrder.status?.replaceAll?.("_", " ")}</Text>
                <Text style={styles.modalTitle}>{selectedOrder.restaurant?.name || "Order"}</Text>
                <View style={styles.modalStats}>
                  <Card style={styles.modalStat}><Text style={styles.summaryLabel}>Delivery km</Text><Text style={styles.summaryValue}>{formatDistance(selectedOrder.deliveryDistance)}</Text></Card>
                  <Card style={styles.modalStat}><Text style={styles.summaryLabel}>Earning</Text><Text style={styles.summaryValue}>{formatCurrency(Number(selectedOrder.deliveryFee || 0) + Number(selectedOrder.tipAmount || 0))}</Text></Card>
                </View>
                <Text style={styles.addressTitle}>Pickup</Text>
                <Text style={styles.addressText}>{formatRestaurantAddress(selectedOrder.restaurant)}</Text>
                <Text style={styles.addressTitle}>Drop</Text>
                <Text style={styles.addressText}>{selectedOrder.status === "OUT_FOR_DELIVERY" ? formatCustomerAddress(selectedOrder.address) : "Customer address unlocks after pickup."}</Text>
                <View style={styles.modalActions}>
                  <PrimaryButton title="Navigate Pickup" tone="dark" onPress={() => openNavigation(selectedOrder.restaurant, formatRestaurantAddress(selectedOrder.restaurant))} style={styles.flex} />
                  {selectedOrder.status === "OUT_FOR_DELIVERY" ? <PrimaryButton title="Navigate Drop" onPress={() => openNavigation(selectedOrder.address, formatCustomerAddress(selectedOrder.address))} style={styles.flex} /> : null}
                </View>
                {selectedOrder.status === "OUT_FOR_DELIVERY" ? (
                  <View style={styles.otpRow}>
                    <TextInput value={otp} onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 4))} keyboardType="number-pad" maxLength={4} placeholder="OTP" style={styles.otpInput} />
                    <PrimaryButton title="Complete" tone="success" disabled={otp.length !== 4} onPress={completeWithOtp} style={styles.flex} />
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScreenWithHeader>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 138, gap: 14 },
  headerWrap: { gap: 14, marginBottom: 4 },
  hero: { overflow: "hidden", backgroundColor: colors.primaryDark, borderRadius: 26, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", shadowColor: colors.primaryDark, shadowOpacity: 0.22, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
  heroAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 6, backgroundColor: colors.accent },
  eyebrow: { color: "#c7d2fe", fontWeight: "900", textTransform: "uppercase", fontSize: 12 },
  title: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 4 },
  statusButton: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 11, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  online: { backgroundColor: colors.accent },
  offline: { backgroundColor: colors.danger },
  statusText: { color: "#fff", fontWeight: "900" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  summaryCard: { flex: 1, minWidth: "45%", padding: 15, borderColor: "#eef2ff", shadowOpacity: 0.08 },
  summaryLabel: { color: colors.muted, fontWeight: "800", fontSize: 12 },
  summaryValue: { color: colors.ink, fontSize: 22, fontWeight: "900", marginTop: 4 },
  locationCard: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 13, borderColor: "#dbeafe", backgroundColor: "#f8fbff" },
  locationText: { flex: 1, color: colors.ink, fontWeight: "800" },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "900", marginTop: 6 },
  activeMission: { gap: 13, borderColor: "#c7d2fe", backgroundColor: "#ffffff" },
  missionTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  missionEyebrow: { color: colors.primary, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  missionTitle: { marginTop: 3, color: colors.ink, fontSize: 20, fontWeight: "900", maxWidth: 220 },
  missionMoney: { color: colors.accent, fontSize: 20, fontWeight: "900" },
  missionRoute: { flexDirection: "row", gap: 9, alignItems: "flex-start", borderRadius: 18, backgroundColor: colors.primarySoft, padding: 12 },
  missionAddress: { flex: 1, color: colors.primaryDark, fontWeight: "800", lineHeight: 19 },
  missionActions: { flexDirection: "row", gap: 10 },
  requestShade: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.75)", justifyContent: "center", padding: 16 },
  requestCard: { borderRadius: 28, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#0f172a", shadowOpacity: 0.32, shadowRadius: 30, shadowOffset: { width: 0, height: 18 }, elevation: 16 },

  // Red alert header
  requestHeader: { backgroundColor: colors.danger, padding: 18, paddingBottom: 16, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  requestHeaderLeft: { flex: 1, minWidth: 0 },
  requestHeaderEyebrow: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  requestHeaderTitle: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 4 },
  requestClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },

  // Countdown
  countdownTrack: { height: 5, backgroundColor: "#fee2e2", overflow: "hidden" },
  countdownFill: { height: "100%", backgroundColor: colors.danger },
  countdownText: { color: colors.muted, fontSize: 11, fontWeight: "800", textAlign: "right", paddingHorizontal: 16, paddingTop: 5 },

  // Stats row
  requestStats: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  requestStatEarn: { flex: 1, borderRadius: 18, backgroundColor: "#ecfdf5", padding: 14, borderWidth: 1, borderColor: "#6ee7b7" },
  requestStatDist: { flex: 1, borderRadius: 18, backgroundColor: "#eef2ff", padding: 14, borderWidth: 1, borderColor: "#c7d2fe" },
  requestStatLabel: { color: colors.muted, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  requestStatEarnValue: { color: "#065f46", fontSize: 26, fontWeight: "900", marginTop: 4 },
  requestStatDistValue: { color: colors.primaryDark, fontSize: 26, fontWeight: "900", marginTop: 4 },
  requestStatHint: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 2 },

  // Address box — pickup + drop
  requestAddressBox: { marginHorizontal: 16, marginTop: 14, borderRadius: 18, backgroundColor: "#f8fafc", padding: 14, borderWidth: 1, borderColor: "#e2e8f0", gap: 10 },
  requestAddressRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  requestAddressDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent, marginTop: 3 },
  requestAddressDotDrop: { backgroundColor: colors.danger },
  requestAddressDivider: { height: 1, backgroundColor: "#e2e8f0", marginLeft: 22 },
  requestAddressTextWrap: { flex: 1, minWidth: 0 },
  requestAddressLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.6 },
  requestAddressText: { color: colors.ink, fontWeight: "700", lineHeight: 19, marginTop: 2 },

  // Action buttons
  requestActions: { flexDirection: "row", gap: 10, padding: 16, paddingTop: 14 },
  requestAcceptBtn: { shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },  modalShade: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.62)", justifyContent: "flex-end", paddingHorizontal: 10, paddingBottom: 112 },
  modalCard: { maxHeight: "72%", backgroundColor: "#fff", borderRadius: 28, paddingHorizontal: 20, paddingTop: 14, shadowColor: "#0f172a", shadowOpacity: 0.22, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  modalContent: { gap: 12, paddingBottom: 20 },
  close: { alignSelf: "flex-end", padding: 4 },
  modalBadge: { alignSelf: "flex-start", color: colors.primary, backgroundColor: "#eef2ff", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, fontWeight: "900" },
  modalTitle: { fontSize: 24, fontWeight: "900", color: colors.ink },
  modalStats: { flexDirection: "row", gap: 10 },
  modalStat: { flex: 1, padding: 12 },
  addressTitle: { color: colors.ink, fontWeight: "900", marginTop: 4 },
  addressText: { color: colors.muted, lineHeight: 20 },
  modalActions: { flexDirection: "row", gap: 10 },
  otpRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  otpInput: { width: 94, minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: 14, textAlign: "center", fontSize: 20, fontWeight: "900", letterSpacing: 4 },
  flex: { flex: 1 },
});





















