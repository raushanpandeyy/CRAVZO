import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, Clock, MapPin, AlertTriangle } from "lucide-react-native";
import { fetchOrders } from "../services/api.js";
import { useAlerts } from "../context/AlertsContext.js";
import { COLORS, STATUS_COLORS, ORDER_STATUS_LABELS, LIVE_STATUSES } from "../constants/config.js";

const fmtMoney = (n) => `₹${Math.round(Number(n || 0))}`;
const ageMin   = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 60000);
const fmtTime  = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : null;

const FILTERS = [
  { label: "All Live",          value: "" },
  { label: "Pending",           value: "PENDING" },
  { label: "Accepted",          value: "ACCEPTED" },
  { label: "Preparing",         value: "PREPARING" },
  { label: "Ready",             value: "READY_FOR_PICKUP" },
  { label: "Out for Delivery",  value: "OUT_FOR_DELIVERY" },
];

function OrderCard({ order, onPress }) {
  const sc      = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
  const age     = ageMin(order.createdAt);
  const isLate  = age > 25 && LIVE_STATUSES.includes(order.status);
  const isPending = order.status === "PENDING";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={{
        backgroundColor: "#fff",
        borderRadius: 18, padding: 16, marginBottom: 10,
        borderWidth: 1.5,
        borderColor: isLate ? "#fca5a5" : isPending ? "#fde68a" : COLORS.line,
        shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 }, elevation: 2,
      }}
    >
      {/* Top row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sc.dot }} />
            <Text style={{ fontWeight: "900", color: COLORS.ink, fontSize: 15 }}>
              #{order.id?.slice(-6).toUpperCase()}
            </Text>
            <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: sc.text, fontSize: 10, fontWeight: "900" }}>
                {ORDER_STATUS_LABELS[order.status]}
              </Text>
            </View>
          </View>
          <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: "700", marginTop: 4 }}>
            {order.restaurant?.name || "—"}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontWeight: "900", color: COLORS.ink, fontSize: 16 }}>
            {fmtMoney(order.totalAmount)}
          </Text>
          <Text style={{ color: COLORS.subtle, fontSize: 11, marginTop: 2 }}>
            {order.paymentMethod}
          </Text>
        </View>
      </View>

      {/* Middle row */}
      <View style={{
        flexDirection: "row", gap: 16, marginTop: 10,
        paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.line,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: "900", color: COLORS.subtle, marginBottom: 2 }}>CUSTOMER</Text>
          <Text style={{ fontSize: 12, fontWeight: "800", color: COLORS.ink }}>{order.customer?.name || "—"}</Text>
          <Text style={{ fontSize: 11, color: COLORS.muted }}>{order.customer?.phone || ""}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: "900", color: COLORS.subtle, marginBottom: 2 }}>RIDER</Text>
          {order.rider
            ? <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <MapPin size={11} color={COLORS.success} />
                  <Text style={{ fontSize: 12, fontWeight: "800", color: COLORS.success }}>{order.rider.name}</Text>
                </View>
                <Text style={{ fontSize: 11, color: COLORS.muted }}>{order.rider.phone || ""}</Text>
              </>
            : <Text style={{ fontSize: 12, color: COLORS.subtle, fontWeight: "700" }}>Not assigned</Text>
          }
        </View>
      </View>

      {/* Bottom row — time */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
        {isLate && <AlertTriangle size={13} color={COLORS.danger} />}
        <Clock size={12} color={isLate ? COLORS.danger : COLORS.subtle} />
        <Text style={{ fontSize: 11, color: isLate ? COLORS.danger : COLORS.subtle, fontWeight: "700" }}>
          {isLate ? `⚠ ${age} min ago — may be late` : `Placed ${age} min ago at ${fmtTime(order.createdAt)}`}
        </Text>
        <ChevronRight size={14} color={COLORS.subtle} style={{ marginLeft: "auto" }} />
      </View>
    </TouchableOpacity>
  );
}

export default function LiveOrdersScreen({ navigation }) {
  const { liveOrders: socketOrders } = useAlerts();
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,    setFilter]    = useState("");
  const [error,     setError]     = useState("");

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await fetchOrders({ limit: 50, status: filter || "" });
      let fetched = res.data?.recentOrders || [];
      if (!filter) fetched = fetched.filter((o) => LIVE_STATUSES.includes(o.status));
      setOrders(fetched);
    } catch (e) {
      setError(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Merge socket updates into list
  useEffect(() => {
    if (Object.keys(socketOrders).length === 0) return;
    setOrders((prev) => prev.map((o) =>
      socketOrders[o.id] ? { ...o, ...socketOrders[o.id] } : o
    ));
  }, [socketOrders]);

  const displayed = filter
    ? orders.filter((o) => o.status === filter)
    : orders;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top"]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: COLORS.ink }}>
          Live Orders
        </Text>
        <Text style={{ color: COLORS.muted, fontWeight: "700", fontSize: 13 }}>
          {displayed.length} order{displayed.length !== 1 ? "s" : ""} active
        </Text>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setFilter(f.value)}
            style={{
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
              backgroundColor: filter === f.value ? COLORS.primary : "#fff",
              borderWidth: 1.5, borderColor: filter === f.value ? COLORS.primary : COLORS.line,
            }}
          >
            <Text style={{
              fontWeight: "900", fontSize: 12,
              color: filter === f.value ? "#fff" : COLORS.muted,
            }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error && (
        <View style={{ marginHorizontal: 16, backgroundColor: "#fef2f2", borderRadius: 12, padding: 12, marginBottom: 8 }}>
          <Text style={{ color: "#dc2626", fontWeight: "800", fontSize: 13 }}>{error}</Text>
        </View>
      )}

      {loading
        ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        : <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.primary} />
            }
          >
            {displayed.length === 0
              ? <View style={{ alignItems: "center", paddingTop: 48 }}>
                  <Text style={{ color: COLORS.muted, fontWeight: "800", fontSize: 15 }}>No orders in this status</Text>
                </View>
              : displayed.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    onPress={() => navigation.navigate("OrderDetail", { orderId: o.id, order: o })}
                  />
                ))
            }
          </ScrollView>
      }
    </SafeAreaView>
  );
}
