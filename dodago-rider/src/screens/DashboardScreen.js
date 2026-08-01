import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";
import { BatteryWarning, MapPin, Power, X } from "../components/Icons";
import { Card, EmptyState, PrimaryButton, Screen } from "../components/Primitives";
import { OrderCard } from "../components/OrderCard";
import { colors } from "../constants/colors";
import { getRiderOrders, updateOrderStatus, verifyDeliveryOtp } from "../services/orderService";
import { updateRiderLocation, updateRiderStatus } from "../services/riderService";
import { onNewOrder, onOrderStatusUpdate } from "../services/socketService";
import { formatCurrency, formatCustomerAddress, formatDistance, formatRestaurantAddress, openNavigation } from "../utils/formatters";
import { useAuth } from "../services/AuthContext";

const ACTIVE_STATUSES = ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"];

export default function DashboardScreen({ navigation }) {
  const { user, setUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(Boolean(user?.isOnline));
  const [locationStatus, setLocationStatus] = useState("pending");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [otp, setOtp] = useState("");
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

  const toggleOnline = async () => {
    try {
      const next = !isOnline;
      const result = await updateRiderStatus(next);
      setIsOnline(next);
      setUser((current) => ({ ...current, isOnline: next, ...result }));
      if (!next) locationSub.current?.remove?.();
    } catch (error) {
      Alert.alert("Status failed", error.message || "Could not update rider status.");
    }
  };

  const refresh = () => {
    setRefreshing(true);
    loadOrders({ silent: true });
  };

  const acceptOrder = async (order) => {
    try {
      await updateOrderStatus(order.id, order.status);
      await loadOrders({ silent: true });
    } catch (error) {
      Alert.alert("Accept failed", error.message || "Could not accept order.");
    }
  };

  const rejectOrder = async (order) => {
    try {
      await updateOrderStatus(order.id, "REJECTED");
      await loadOrders({ silent: true });
    } catch (error) {
      Alert.alert("Reject failed", error.message || "Could not reject order.");
    }
  };

  const pickupOrder = async (order) => {
    try {
      await updateOrderStatus(order.id, "OUT_FOR_DELIVERY");
      await loadOrders({ silent: true });
    } catch (error) {
      Alert.alert("Pickup failed", error.message || "Could not update order.");
    }
  };

  const completeWithOtp = async () => {
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
  };

  const renderOrder = ({ item }) => (
    <OrderCard
      order={item}
      onView={setSelectedOrder}
      onAccept={acceptOrder}
      onReject={rejectOrder}
      onPickup={pickupOrder}
      onChat={(order) => navigation.navigate("Chat", { order })}
    />
  );

  return (
    <Screen>
      <FlatList
        data={[...activeOrders, ...availableOrders]}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.hero}>
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
            <Text style={styles.sectionTitle}>Active and available orders</Text>
          </View>
        }
        ListEmptyComponent={!loading ? <EmptyState title={isOnline ? "No orders right now" : "You are offline"} body={isOnline ? "New delivery requests will appear here." : "Go online to receive delivery requests."} /> : null}
        contentContainerStyle={styles.content}
      />

      <Modal visible={Boolean(selectedOrder)} transparent animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        <View style={styles.modalShade}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.close} onPress={() => setSelectedOrder(null)}><X size={22} color={colors.ink} /></TouchableOpacity>
            {selectedOrder ? (
              <>
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
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 110, gap: 14 },
  headerWrap: { gap: 14, marginBottom: 4 },
  hero: { backgroundColor: colors.primary, borderRadius: 24, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { color: "#c7d2fe", fontWeight: "900", textTransform: "uppercase", fontSize: 12 },
  title: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 4 },
  statusButton: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  online: { backgroundColor: colors.accent },
  offline: { backgroundColor: colors.danger },
  statusText: { color: "#fff", fontWeight: "900" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  summaryCard: { flex: 1, minWidth: "45%", padding: 14 },
  summaryLabel: { color: colors.muted, fontWeight: "800", fontSize: 12 },
  summaryValue: { color: colors.ink, fontSize: 20, fontWeight: "900", marginTop: 4 },
  locationCard: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  locationText: { flex: 1, color: colors.ink, fontWeight: "800" },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "900", marginTop: 6 },
  modalShade: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.62)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 12 },
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

