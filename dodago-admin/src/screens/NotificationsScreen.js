import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertTriangle, Bell, Trash2, CheckCheck, Zap, ChevronRight } from "lucide-react-native";
import { useAlerts } from "../context/AlertsContext.js";
import { COLORS } from "../constants/config.js";

const fmtTime = (ms) => {
  if (!ms) return "";
  const d = new Date(ms);
  const now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  if (diffMin < 1)   return "Just now";
  if (diffMin < 60)  return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const TYPE_ICONS = {
  ORDER_NOT_ACCEPTED: { icon: AlertTriangle, color: COLORS.danger },
  ORDER_STATUS_CHANGED: { icon: Zap,          color: COLORS.primary },
  ORDER_CREATED:        { icon: Bell,         color: "#10b981" },
};

export default function NotificationsScreen({ navigation }) {
  const { alerts, unreadCount, markAllRead, clearAlerts } = useAlerts();

  const handleClear = () =>
    Alert.alert("Clear all alerts?", "This will remove all alert history.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear",  style: "destructive", onPress: clearAlerts },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top"]}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
      }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "900", color: COLORS.ink }}>Alerts</Text>
          {unreadCount > 0 && (
            <Text style={{ color: COLORS.danger, fontWeight: "800", fontSize: 13, marginTop: 1 }}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllRead}
              style={{
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: "#eff6ff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7,
              }}
            >
              <CheckCheck size={14} color={COLORS.primary} />
              <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 12 }}>Mark read</Text>
            </TouchableOpacity>
          )}
          {alerts.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center",
              }}
            >
              <Trash2 size={16} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {alerts.length === 0
        ? <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Bell size={44} color={COLORS.line} />
            <Text style={{ color: COLORS.muted, fontWeight: "800", fontSize: 15, marginTop: 12 }}>
              No alerts yet
            </Text>
            <Text style={{ color: COLORS.subtle, fontWeight: "700", fontSize: 13, marginTop: 4 }}>
              Alerts will appear here in real time
            </Text>
          </View>
        : <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            {alerts.map((alert, i) => {
              const isDanger = alert.severity === "danger";
              const { icon: Icon, color } = TYPE_ICONS[alert.type] || TYPE_ICONS.ORDER_STATUS_CHANGED;
              const isUnread = !alert.read;

              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.82}
                  onPress={() =>
                    alert.order?.id &&
                    navigation.navigate("OrderDetail", { orderId: alert.order.id, order: alert.order })
                  }
                  style={{
                    backgroundColor: isUnread ? (isDanger ? "#fef2f2" : "#eff6ff") : "#fff",
                    borderRadius: 16, padding: 14, marginBottom: 8,
                    borderWidth: 1,
                    borderColor: isDanger ? (isUnread ? "#fca5a5" : "#fee2e2") : (isUnread ? "#bfdbfe" : COLORS.line),
                    flexDirection: "row", alignItems: "flex-start", gap: 12,
                  }}
                >
                  <View style={{
                    width: 38, height: 38, borderRadius: 12,
                    backgroundColor: color + "18",
                    alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={18} color={color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontWeight: "900", color: COLORS.ink, fontSize: 13, flex: 1 }}>
                        {alert.title}
                      </Text>
                      {isUnread && (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                      )}
                    </View>
                    <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: "700", marginTop: 2 }}>
                      {alert.message}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <Text style={{ fontSize: 11, color: COLORS.subtle, fontWeight: "700" }}>
                        {fmtTime(alert.receivedAt)}
                      </Text>
                      {alert.order?.id && (
                        <>
                          <Text style={{ color: COLORS.line }}>·</Text>
                          <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: "900" }}>
                            #{alert.order.id.slice(-6).toUpperCase()}
                          </Text>
                        </>
                      )}
                      {alert.order?.restaurant?.name && (
                        <>
                          <Text style={{ color: COLORS.line }}>·</Text>
                          <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: "700" }} numberOfLines={1}>
                            {alert.order.restaurant.name}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  {alert.order?.id && <ChevronRight size={14} color={COLORS.subtle} style={{ marginTop: 2 }} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
      }
    </SafeAreaView>
  );
}
