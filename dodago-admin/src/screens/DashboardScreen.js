import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertTriangle, CheckCircle2, Clock, ShoppingBag,
  TrendingUp, Zap, ChevronRight, MapPin,
} from "lucide-react-native";
import { useAlerts } from "../context/AlertsContext.js";
import { fetchOrders } from "../services/api.js";
import { COLORS, STATUS_COLORS, ORDER_STATUS_LABELS, LIVE_STATUSES } from "../constants/config.js";

const fmtTime  = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtMoney = (n) => `₹${Math.round(Number(n || 0))}`;
const ageMin   = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 60000);

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <View style={{
      flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14,
      borderWidth: 1, borderColor: COLORS.line,
      shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 }, elevation: 2,
    }}>
      <Icon size={20} color={color} />
      <Text style={{ fontSize: 26, fontWeight: "900", color: COLORS.ink, marginTop: 8 }}>{value}</Text>
      <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.muted, marginTop: 2 }}>{label}</Text>
      {sub ? <Text style={{ fontSize: 10, color: COLORS.subtle, marginTop: 1 }}>{sub}</Text> : null}
    </View>
  );
}

function AlertBanner({ alert, onPress }) {
  const isDanger = alert.severity === "danger";
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: isDanger ? "#fef2f2" : "#eff6ff",
        borderLeftWidth: 4,
        borderLeftColor: isDanger ? COLORS.danger : COLORS.primary,
        borderRadius: 14, padding: 14, marginBottom: 8,
        flexDirection: "row", alignItems: "center", gap: 10,
      }}
    >
      {isDanger
        ? <AlertTriangle size={20} color={COLORS.danger} />
        : <Zap           size={20} color={COLORS.primary} />
      }
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "900", color: COLORS.ink, fontSize: 13 }}>{alert.title}</Text>
        <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: "700", marginTop: 1 }} numberOfLines={1}>
          {alert.message}
        </Text>
        <Text style={{ color: COLORS.subtle, fontSize: 11, marginTop: 2 }}>
          {fmtTime(alert.receivedAt)}
          {alert.order?.id ? `  ·  #${alert.order.id.slice(-6).toUpperCase()}` : ""}
        </Text>
      </View>
      <ChevronRight size={16} color={COLORS.subtle} />
    </TouchableOpacity>
  );
}

function OrderRow({ order, onPress }) {
  const sc    = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
  const age   = ageMin(order.createdAt);
  const isOld = age > 20 && LIVE_STATUSES.includes(order.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={{
        backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: isOld ? "#fca5a5" : COLORS.line,
        flexDirection: "row", alignItems: "center", gap: 12,
      }}
    >
      <View style={{
        width: 10, height: 10, borderRadius: 5, backgroundColor: sc.dot,
      }} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontWeight: "900", color: COLORS.ink, fontSize: 13 }}>
            #{order.id?.slice(-6).toUpperCase()}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "900", color: COLORS.ink }}>
            {fmtMoney(order.totalAmount)}
          </Text>
        </View>
        <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: "700", marginTop: 2 }}>
          {order.restaurant?.name || "—"}  ·  {order.customer?.name || "—"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <View style={{
            backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
          }}>
            <Text style={{ color: sc.text, fontSize: 10, fontWeight: "900" }}>
              {ORDER_STATUS_LABELS[order.status]}
            </Text>
          </View>
          <Clock size={11} color={isOld ? COLORS.danger : COLORS.subtle} />
          <Text style={{ fontSize: 11, color: isOld ? COLORS.danger : COLORS.subtle, fontWeight: "700" }}>
            {age}m ago
          </Text>
          {order.rider
            ? <><MapPin size={11} color={COLORS.success} /><Text style={{ fontSize: 11, color: COLORS.success, fontWeight: "700" }}>{order.rider.name}</Text></>
            : null
          }
        </View>
      </View>
      <ChevronRight size={16} color={COLORS.subtle} />
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const { alerts }      = useAlerts();
  const [totals,  setTotals]  = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await fetchOrders({ limit: 8 });
      setTotals(res.data?.totals || null);
      setOrders(res.data?.recentOrders || []);
    } catch (e) {
      console.warn("Dashboard load failed:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const liveOrders  = orders.filter((o) => LIVE_STATUSES.includes(o.status));
  const recentAlerts = alerts.slice(0, 5);
  const dangerAlerts = recentAlerts.filter((a) => a.severity === "danger");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 26, fontWeight: "900", color: COLORS.ink }}>Dashboard</Text>
          <Text style={{ color: COLORS.muted, fontWeight: "700", marginTop: 2 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
          </Text>
        </View>

        {/* Danger alert banner */}
        {dangerAlerts.length > 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate("Notifications")}
            style={{
              backgroundColor: "#fef2f2", borderRadius: 16, padding: 14,
              flexDirection: "row", alignItems: "center", gap: 10,
              marginBottom: 16, borderWidth: 1.5, borderColor: "#fca5a5",
            }}
          >
            <AlertTriangle size={22} color={COLORS.danger} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "900", color: "#991b1b", fontSize: 14 }}>
                {dangerAlerts.length} alert{dangerAlerts.length > 1 ? "s" : ""} need attention
              </Text>
              <Text style={{ color: "#b91c1c", fontSize: 12, fontWeight: "700" }}>
                {dangerAlerts[0].title}
              </Text>
            </View>
            <ChevronRight size={16} color="#dc2626" />
          </TouchableOpacity>
        )}

        {/* Stats */}
        {loading && !totals
          ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} />
          : totals && (
            <>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                <StatCard icon={Zap}         label="Live Orders"     value={totals.liveOrders}      color="#f59e0b" />
                <StatCard icon={TrendingUp}  label="Total Today"     value={totals.totalOrders}     color={COLORS.primary} />
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                <StatCard icon={CheckCircle2} label="Delivered"      value={totals.completedOrders} color={COLORS.success} />
                <StatCard icon={ShoppingBag} label="Pending Vendors" value={totals.pendingVendors}  color="#a855f7" sub={`${totals.pendingRiders} pending riders`} />
              </View>
            </>
          )
        }

        {/* Recent alerts */}
        {recentAlerts.length > 0 && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ fontWeight: "900", color: COLORS.ink, fontSize: 16 }}>Recent Alerts</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
                <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 13 }}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentAlerts.map((a, i) => (
              <AlertBanner
                key={i}
                alert={a}
                onPress={() => a.order?.id && navigation.navigate("OrderDetail", { orderId: a.order.id, order: a.order })}
              />
            ))}
          </>
        )}

        {/* Live orders */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 10 }}>
          <Text style={{ fontWeight: "900", color: COLORS.ink, fontSize: 16 }}>
            Live Orders
            {liveOrders.length > 0 && (
              <Text style={{ color: COLORS.primary }}> ({liveOrders.length})</Text>
            )}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("LiveOrders")}>
            <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 13 }}>See all</Text>
          </TouchableOpacity>
        </View>

        {liveOrders.length === 0 && !loading
          ? <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <CheckCircle2 size={36} color={COLORS.success} />
              <Text style={{ color: COLORS.muted, fontWeight: "800", marginTop: 8 }}>
                All caught up — no live orders
              </Text>
            </View>
          : liveOrders.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                onPress={() => navigation.navigate("OrderDetail", { orderId: o.id, order: o })}
              />
            ))
        }
      </ScrollView>
    </SafeAreaView>
  );
}
