import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogOut, MessageCircle } from "./Icons";
import { colors } from "../constants/colors";
import { useAuth } from "../services/AuthContext";
import { disconnectSocket } from "../services/socketService";

const logo = require("../../assets/dodagologo.png");

export function RiderHeader({ title = "Dashboard", subtitle = "Rider", navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    disconnectSocket();
    await logout();
  };

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 12) + 8 }]}> 
      <View style={styles.inner}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation?.navigate?.("Dashboard")} style={styles.logoButton}>
          <Image source={logo} style={styles.logo} />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation?.navigate?.("Dashboard")} style={styles.titlePill}>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text numberOfLines={1} style={styles.title}>{title || user?.name || "Dashboard"}</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation?.navigate?.("Chat")} style={styles.iconButton}>
          <MessageCircle size={20} color={colors.primaryDark} />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={19} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ScreenWithHeader({ title, subtitle, navigation, children, style }) {
  return (
    <View style={styles.screen}>
      <RiderHeader title={title} subtitle={subtitle} navigation={navigation} />
      <View style={[styles.body, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  wrap: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
    zIndex: 10,
  },
  inner: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingBottom: 10, maxWidth: 420, width: "100%", alignSelf: "center" },
  logoButton: { width: 42, height: 42, borderRadius: 14, overflow: "hidden", backgroundColor: "#fff" },
  logo: { width: "100%", height: "100%" },
  titlePill: { flex: 1, minHeight: 44, borderRadius: 18, backgroundColor: "#f3f6fb", justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: "#eef2ff" },
  subtitle: { color: colors.muted, fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  title: { marginTop: 2, color: colors.ink, fontSize: 15, fontWeight: "900" },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e0e7ff" },
  logoutButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center" },
  body: { flex: 1 },
});

