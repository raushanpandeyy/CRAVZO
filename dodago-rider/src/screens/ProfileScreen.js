import { Alert, StyleSheet, Text, View } from "react-native";
import { Bike, LogOut, Mail, Phone, Star } from "../components/Icons";
import { Card, PrimaryButton, Screen } from "../components/Primitives";
import { colors } from "../constants/colors";
import { useAuth } from "../services/AuthContext";
import { disconnectSocket } from "../services/socketService";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      disconnectSocket();
      await logout();
    } catch (error) {
      Alert.alert("Logout failed", error.message || "Please try again.");
    }
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.avatar}><Bike size={32} color="#fff" /></View>
        <Text style={styles.name}>{user?.name || "Rider"}</Text>
        <Text style={styles.role}>Dodago delivery partner</Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.row}><Mail size={18} color={colors.primary} /><Text style={styles.value}>{user?.email || "Email not added"}</Text></View>
        <View style={styles.row}><Phone size={18} color={colors.primary} /><Text style={styles.value}>{user?.phone || "Phone not added"}</Text></View>
        <View style={styles.row}><Star size={18} color={colors.primary} /><Text style={styles.value}>Reviews available in web dashboard</Text></View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Rider app includes</Text>
        <Text style={styles.bullet}>Online/offline status and live location sync</Text>
        <Text style={styles.bullet}>Accept, reject, pickup and OTP delivery completion</Text>
        <Text style={styles.bullet}>Order chat, earnings, delivery km and profile</Text>
      </Card>

      <PrimaryButton title="Logout" tone="danger" onPress={handleLogout} style={styles.logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 16 },
  hero: { backgroundColor: colors.primary, borderRadius: 24, padding: 22, alignItems: "center" },
  avatar: { width: 70, height: 70, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  name: { marginTop: 12, color: "#fff", fontSize: 24, fontWeight: "900" },
  role: { marginTop: 4, color: "#c7d2fe", fontWeight: "800" },
  card: { gap: 14 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  value: { color: colors.ink, fontWeight: "800", flex: 1 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  bullet: { color: colors.muted, lineHeight: 22, fontWeight: "700" },
  logout: { marginTop: 4 },
});

