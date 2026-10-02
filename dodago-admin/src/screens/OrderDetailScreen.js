import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Platform, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import {
  ChevronLeft, Phone, MapPin, User, Store,
  Bike, Clock, Package, AlertTriangle, CheckCircle2,
  IndianRupee, RefreshCw,
} from "lucide-react-native";
import { useAlerts } from "../context/AlertsContext.js";
import { fetchOrders } from "../services/api.js";
import { COLORS, STATUS_COLORS, ORDER_STATUS_LABELS } from "../constants/config.js";

const fmtMoney  = (n) => `₹${Math.round(Number(n || 0))}`;
const fmtTime   = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : null;
const fmtDate   = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : null;
const callPhone = (phone) => Linking.openURL(`tel:${phone}`);

const TIMELINE = [
  { key: "createdAt",    label: "Order Placed",       status: "PENDING" },
  { key: "acceptedAt",   label: "Accepted",            status: "ACCEPTED" },
  { key: "preparingAt",  label: "Preparing",           status: "PREPARING" },
  { key: "pickedUpAt",   label: "Picked Up",           status: "OUT_FOR_DELIVERY" },
  { key: "deliveredAt",  label: "Delivered",           status: "DELIVERED" },
  { key: "cancelledAt",  label: "Cancelled",           status: "CANCELLED" },
];

function SectionCard({ title, icon: Icon, children, color }) {
  return (
    <View style={{
      backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: COLORS.line,
      shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 }, elevation: 2,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: color + "20", alignItems: "center", justifyContent: "center" }}>
          <Icon size={17} color={color} />
        </View>
        <Text style={{ fontWeight: "900", color: COLORS.ink, fontSize: 15 }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({ label, value, onPress, highlight }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
      <Text style={{ color: COLORS.muted, fontWeight: "700", fontSize: 13 }}>{label}</Text>
      <TouchableOpacity disabled={!onPress} onPress={onPress}>
        <Text style={{
          fontWeight: "900", fontSize: 13,
          color: onPress ? COLORS.primary : (highlight ? COLORS.danger : COLORS.ink),
          textDecorationLine: onPress ? "underline" : "none",
        }}>
          {value || "—"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function FeeRow({ label, value, highlight }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
      <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: "700" }}>{label}</Text>
      <Text style={{ fontWeight: "800", fontSize: 12, color: highlight ? COLORS.success : COLORS.ink }}>
        {value}
      </Text>
    </View>
  );
}

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId, order: initialOrder } = route.params || {};
  const { liveOrders } = useAlerts();

  const [order,     setOrder]     = useState(initialOrder || null);
  const [loading,   setLoading]   = useState(!initialOrder);
  const [mapReady,  setMapReady]  = useState(false);
  const mapRef = useRef(null);

  // Fetch full order details
  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res  = await fetchOrders({ limit: 50 });
      const found = res.data?.recentOrders?.find((o) => o.id === orderId);
      if (found) setOrder(found);
    } catch (e) {
      console.warn("Failed to load order:", e.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { if (!initialOrder) loadOrder(); }, [loadOrder, initialOrder]);

  // Merge live socket updates
  useEffect(() => {
    if (orderId && liveOrders[orderId]) {
      setOrder((prev) => prev ? { ...prev, ...liveOrders[orderId] } : liveOrders[orderId]);
    }
  }, [liveOrders, orderId]);

  const riderLocation = liveOrders[orderId]?.riderLocation || null;

  // Map region
  const restaurantLat = order?.restaurant?.latitude  || order?.address?.latitude;
  const restaurantLng = order?.restaurant?.longitude || order?.address?.longitude;
  const hasMap = riderLocation || (restaurantLat && restaurantLng);

  const mapRegion = riderLocation
    ? { latitude: riderLocation.latitude, longitude: riderLocation.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : restaurantLat
    ? { latitude: restaurantLat, longitude: restaurantLng, latitudeDelta: 0.03, longitudeDelta: 0.03 }
    : null;

  if (loading && !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: COLORS.muted, fontWeight: "800" }}>Order not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
          <Text style={{ color: COLORS.primary, fontWeight: "900" }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top"]}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: COLORS.line,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={20} color={COLORS.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "900", color: COLORS.ink, fontSize: 17 }}>
            #{order.id?.slice(-6).toUpperCase()}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: "700" }}>
            {fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}
          </Text>
        </View>
        <View style={{ backgroundColor: sc.bg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ color: sc.text, fontWeight: "900", fontSize: 12 }}>
            {ORDER_STATUS_LABELS[order.status]}
          </Text>
        </View>
        <TouchableOpacity
          onPress={loadOrder}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" }}
        >
          <RefreshCw size={16} color={COLORS.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Map — rider location */}
        {hasMap && (
          <View style={{
            height: 220, borderRadius: 18, overflow: "hidden",
            marginBottom: 12, borderWidth: 1, borderColor: COLORS.line,
          }}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_DEFAULT}
              style={{ flex: 1 }}
              region={mapRegion}
              onMapReady={() => setMapReady(true)}
              showsUserLocation={false}
            >
              {riderLocation && (
                <Marker
                  coordinate={{ latitude: riderLocation.latitude, longitude: riderLocation.longitude }}
                  title="Rider"
                  description={order.rider?.name || "Delivery Partner"}
                  pinColor={COLORS.primary}
                />
              )}
              {restaurantLat && (
                <Marker
                  coordinate={{ latitude: restaurantLat, longitude: restaurantLng }}
                  title="Restaurant"
                  description={order.restaurant?.name || "Restaurant"}
                  pinColor="#f59e0b"
                />
              )}
            </MapView>
            {riderLocation && (
              <View style={{
                position: "absolute", top: 10, left: 10,
                backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
              }}>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>
                  🔵 Live Rider Location · Updated {fmtTime(riderLocation.updatedAt)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Customer */}
        <SectionCard title="Customer" icon={User} color="#3b82f6">
          <InfoRow label="Name"  value={order.customer?.name} />
          <InfoRow
            label="Phone" value={order.customer?.phone}
            onPress={order.customer?.phone ? () => callPhone(order.customer.phone) : null}
          />
          {order.address && (
            <InfoRow
              label="Address"
              value={[order.address.line1, order.address.city].filter(Boolean).join(", ")}
            />
          )}
          {order.deliveryInstructions && (
            <View style={{ backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, marginTop: 6 }}>
              <Text style={{ color: "#166534", fontSize: 12, fontWeight: "700" }}>
                📋 {order.deliveryInstructions}
              </Text>
            </View>
          )}
        </SectionCard>

        {/* Restaurant */}
        <SectionCard title="Restaurant" icon={Store} color="#f59e0b">
          <InfoRow label="Name"   value={order.restaurant?.name} />
          <InfoRow
            label="Vendor Phone"
            value={order.restaurant?.vendor?.phone}
            onPress={order.restaurant?.vendor?.phone ? () => callPhone(order.restaurant.vendor.phone) : null}
          />
          <InfoRow label="Vendor" value={order.restaurant?.vendor?.name} />
          {order.restaurantInstructions && (
            <View style={{ backgroundColor: "#fff7ed", borderRadius: 10, padding: 10, marginTop: 6 }}>
              <Text style={{ color: "#92400e", fontSize: 12, fontWeight: "700" }}>
                📋 {order.restaurantInstructions}
              </Text>
            </View>
          )}
        </SectionCard>

        {/* Rider */}
        <SectionCard title="Delivery Rider" icon={Bike} color={COLORS.success}>
          {order.rider
            ? <>
                <InfoRow label="Name" value={order.rider.name} />
                <InfoRow
                  label="Phone" value={order.rider.phone}
                  onPress={order.rider.phone ? () => callPhone(order.rider.phone) : null}
                />
                {riderLocation && (
                  <View style={{ backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, marginTop: 6 }}>
                    <Text style={{ color: "#166534", fontSize: 12, fontWeight: "700" }}>
                      📍 Live: {riderLocation.latitude.toFixed(5)}, {riderLocation.longitude.toFixed(5)}
                    </Text>
                    {riderLocation.speed != null && (
                      <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>
                        Speed: {Math.round((riderLocation.speed || 0) * 3.6)} km/h
                      </Text>
                    )}
                  </View>
                )}
              </>
            : <Text style={{ color: COLORS.muted, fontWeight: "700" }}>No rider assigned yet</Text>
          }
        </SectionCard>

        {/* Order Items */}
        <SectionCard title="Order Items" icon={Package} color={COLORS.primary}>
          {(order.items || []).map((item, i) => (
            <View key={i} style={{
              flexDirection: "row", justifyContent: "space-between",
              paddingVertical: 6,
              borderBottomWidth: i < order.items.length - 1 ? 1 : 0,
              borderBottomColor: COLORS.line,
            }}>
              <Text style={{ flex: 1, color: COLORS.ink, fontWeight: "800", fontSize: 13 }}>
                {item.quantity}× {item.menuItem?.name || "Item"}
                {item.size ? ` (${item.size})` : ""}
              </Text>
              <Text style={{ color: COLORS.muted, fontWeight: "700", fontSize: 13 }}>
                {fmtMoney(item.totalPrice)}
              </Text>
            </View>
          ))}
        </SectionCard>

        {/* Payment breakdown */}
        <SectionCard title="Payment" icon={IndianRupee} color="#10b981">
          <FeeRow label="Subtotal"       value={fmtMoney(order.subtotal)} />
          <FeeRow label="Delivery Fee"   value={fmtMoney(order.deliveryFee)} />
          <FeeRow label="Packaging"      value={fmtMoney(order.packagingFee)} />
          <FeeRow label="Platform Fee"   value={fmtMoney(order.platformFee)} />
          {Number(order.gatewayFee)  > 0 && <FeeRow label="Gateway Fee"    value={fmtMoney(order.gatewayFee)} />}
          {Number(order.codCharge)   > 0 && <FeeRow label="COD Charge"     value={fmtMoney(order.codCharge)} />}
          {Number(order.tipAmount)   > 0 && <FeeRow label="Tip"            value={fmtMoney(order.tipAmount)} />}
          {Number(order.discount)    > 0 && <FeeRow label="Discount"       value={`-${fmtMoney(order.discount)}`} highlight />}
          {Number(order.promoCodeDiscount) > 0 && (
            <FeeRow label={`Promo (${order.promoCode})`} value={`-${fmtMoney(order.promoCodeDiscount)}`} highlight />
          )}
          <View style={{ height: 1, backgroundColor: COLORS.line, marginVertical: 8 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontWeight: "900", color: COLORS.ink, fontSize: 15 }}>Total</Text>
            <Text style={{ fontWeight: "900", color: COLORS.ink, fontSize: 15 }}>{fmtMoney(order.totalAmount)}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <View style={{ flex: 1, backgroundColor: "#f8fafc", borderRadius: 10, padding: 8, alignItems: "center" }}>
              <Text style={{ fontSize: 10, color: COLORS.muted, fontWeight: "700" }}>Method</Text>
              <Text style={{ fontWeight: "900", color: COLORS.ink, fontSize: 13, marginTop: 2 }}>{order.paymentMethod}</Text>
            </View>
            <View style={{
              flex: 1, borderRadius: 10, padding: 8, alignItems: "center",
              backgroundColor: order.paymentStatus === "PAID" ? "#f0fdf4" : "#fff7ed",
            }}>
              <Text style={{ fontSize: 10, color: COLORS.muted, fontWeight: "700" }}>Status</Text>
              <Text style={{
                fontWeight: "900", fontSize: 13, marginTop: 2,
                color: order.paymentStatus === "PAID" ? COLORS.success : "#d97706",
              }}>
                {order.paymentStatus}
              </Text>
            </View>
          </View>
          {order.deliveryDistance && (
            <Text style={{ color: COLORS.subtle, fontSize: 11, fontWeight: "700", marginTop: 8, textAlign: "center" }}>
              Distance: {order.deliveryDistance} km
            </Text>
          )}
        </SectionCard>

        {/* Timeline */}
        <SectionCard title="Timeline" icon={Clock} color="#6366f1">
          {TIMELINE.filter((t) => order[t.key] || order.status === t.status).map((t, i) => {
            const time = order[t.key];
            const isCurrent = order.status === t.status;
            return (
              <View key={t.key} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <View style={{ alignItems: "center" }}>
                  <View style={{
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: time ? COLORS.primary : isCurrent ? "#fde68a" : COLORS.line,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {time && <CheckCircle2 size={12} color="#fff" />}
                  </View>
                  {i < TIMELINE.length - 1 && (
                    <View style={{ width: 2, height: 18, backgroundColor: time ? COLORS.primary : COLORS.line, marginTop: 2 }} />
                  )}
                </View>
                <View style={{ flex: 1, paddingTop: 1 }}>
                  <Text style={{ fontWeight: "900", color: time ? COLORS.ink : COLORS.subtle, fontSize: 13 }}>
                    {t.label}
                    {isCurrent && !time && (
                      <Text style={{ color: "#d97706" }}> (current)</Text>
                    )}
                  </Text>
                  {time && (
                    <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: "700" }}>
                      {fmtDate(time)} {fmtTime(time)}
                    </Text>
                  )}
                  {t.key === "cancelledAt" && order.cancelledByRole && (
                    <Text style={{ color: COLORS.danger, fontSize: 11, fontWeight: "700" }}>
                      By {order.cancelledByRole}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </SectionCard>

        {/* Refund info */}
        {order.refundStatus && (
          <SectionCard title="Refund" icon={AlertTriangle} color={COLORS.danger}>
            <InfoRow label="Status"    value={order.refundStatus} highlight={order.refundStatus !== "REFUNDED"} />
            <InfoRow label="Amount"    value={order.refundAmount ? fmtMoney(order.refundAmount) : null} />
            <InfoRow label="Initiated" value={fmtTime(order.refundInitiatedAt)} />
          </SectionCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
