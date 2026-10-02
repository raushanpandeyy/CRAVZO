import React from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Shield, Wifi, WifiOff, Bell, Trash2, RefreshCw } from "lucide-react-native";
import { useAuth } from "../context/AuthContext.js";
import { useAlerts } from "../context/AlertsContext.js";
import { isConnected } from "../services/socketService.js";
import { connectSocket, disconnectSocket } from "../services/socketService.js";
import { COLORS } from "../constants/config.js";
import { API_BASE_URL } from "../constants/config.js";

function Row({ icon: Icon, label, sub, onPress, danger }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: "row", alignItems: "center", gap: 14,
        paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: COLORS.line,
      }}
    >
      <View style={{
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: danger ? "#fef2f2" : "#f1f5f9",
        alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={18} color={danger ? COLORS.danger : COLORS.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "800", color: danger ? COLORS.danger : COLORS.ink, fontSize: 14 }}>{label}</Text>
        {sub && <Text style={{ color: COLORS.subtle, fontSize: 12, fontWeight: "700", marginTop: 1 }}>{sub}</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { clearAlerts, alerts } = useAlerts();
  const [connected, setConnected] = React.useState(isConnected());

  React.useEffect(() => {
    const id = setInterval(() => setConnected(isConnected()), 3000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () =>
    Alert.alert("Sign out?", "You will need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);

  const handleReconnect = () => {
    disconnectSocket();
    setTimeout(() => { connectSocket(); setConnected(isConnected()); }, 500);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top"]}>
      <ScrollView>
        {/* Profile card */}
        <View style={{
          margin: 16, backgroundColor: COLORS.primaryDark, borderRadius: 20, padding: 20,
          flexDirection: "row", alignItems: "center", gap: 14,
        }}>
          <View style={{
            width: 52, height: 52, borderRadius: 16,
            backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={26} color="#fff" />
          </View>
          <View>
            <Text style={{ fontWeight: "900", color: "#fff", fontSize: 17 }}>{user?.name || "Admin"}</Text>
            <Text style={{ color: "#a5b4fc", fontWeight: "700", fontSize: 13, marginTop: 2 }}>{user?.email || ""}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ade80" }} />
              <Text style={{ color: "#86efac", fontSize: 11, fontWeight: "800" }}>Admin</Text>
            </View>
          </View>
        </View>

        {/* Connection status */}
        <View style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: COLORS.line }}>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 10,
            padding: 14, backgroundColor: connected ? "#f0fdf4" : "#fef2f2",
            borderBottomWidth: 1, borderBottomColor: COLORS.line,
          }}>
            {connected
              ? <Wifi size={18} color={COLORS.success} />
              : <WifiOff size={18} color={COLORS.danger} />
            }
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "900", color: connected ? COLORS.success : COLORS.danger, fontSize: 13 }}>
                {connected ? "Real-time connected" : "Disconnected"}
              </Text>
              <Text style={{ color: COLORS.subtle, fontSize: 11, fontWeight: "700" }}>
                {API_BASE_URL}
              </Text>
            </View>
            {!connected && (
              <TouchableOpacity
                onPress={handleReconnect}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}
              >
                <RefreshCw size={13} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>Reconnect</Text>
              </TouchableOpacity>
            )}
          </View>

          <Row
            icon={Bell}
            label="Alert History"
            sub={`${alerts.length} stored alert${alerts.length !== 1 ? "s" : ""}`}
          />
          <Row
            icon={Trash2}
            label="Clear Alert History"
            sub="Remove all stored notifications"
            onPress={() => Alert.alert("Clear alerts?", "", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: clearAlerts },
            ])}
          />
        </View>

        {/* Sign out */}
        <View style={{ marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: COLORS.line }}>
          <Row icon={LogOut} label="Sign Out" sub="Sign out of admin session" onPress={handleLogout} danger />
        </View>

        <Text style={{ textAlign: "center", color: COLORS.subtle, fontWeight: "700", fontSize: 12, marginTop: 24 }}>
          Dodago Admin · v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
