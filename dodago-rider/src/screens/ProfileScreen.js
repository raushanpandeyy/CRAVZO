import { useEffect, useMemo, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Bike, ClipboardList, Mail, MessageCircle, Phone, Star, User } from "../components/Icons";
import { Card, PrimaryButton } from "../components/Primitives";
import { ScreenWithHeader } from "../components/RiderChrome";
import { colors } from "../constants/colors";
import { useAuth } from "../services/AuthContext";
import { disconnectSocket } from "../services/socketService";
import { getProfile, updateProfile } from "../services/userService";

const logo = require("../../assets/dodagologo.png");

const buildForm = (user = {}) => ({
  name: user.name || "",
  email: user.email || "",
  phone: user.phone || "",
  bankDetails: {
    accountHolderName: user.bankDetails?.accountHolderName || "",
    bankName: user.bankDetails?.bankName || "",
    accountNumber: user.bankDetails?.accountNumber || "",
    ifsc: user.bankDetails?.ifsc || "",
  },
  vehicleDetails: {
    type: user.vehicleDetails?.type || "BICYCLE",
    registrationNumber: user.vehicleDetails?.registrationNumber || "",
  },
});

export default function ProfileScreen({ navigation }) {
  const { user, setUser, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState(buildForm(user));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const initials = useMemo(() => (form.name || "Rider").slice(0, 1).toUpperCase(), [form.name]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getProfile().then((loaded) => {
      if (!mounted) return;
      setProfile(loaded);
      setForm(buildForm(loaded));
      setUser((current) => ({ ...current, ...loaded }));
    }).catch(() => {}).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [setUser]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateNested = (section, key, value) => setForm((current) => ({ ...current, [section]: { ...current[section], [key]: value } }));

  const save = async () => {
    try {
      setSaving(true);
      const updated = await updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        bankDetails: form.bankDetails.accountHolderName || form.bankDetails.bankName || form.bankDetails.accountNumber || form.bankDetails.ifsc ? form.bankDetails : null,
        vehicleDetails: {
          type: form.vehicleDetails.type,
          registrationNumber: form.vehicleDetails.type === "BIKE" ? form.vehicleDetails.registrationNumber || null : null,
        },
      });
      setProfile(updated);
      setUser((current) => ({ ...current, ...updated }));
      Alert.alert("Saved", "Rider profile updated successfully.");
    } catch (error) {
      Alert.alert("Save failed", error.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      disconnectSocket();
      await logout();
    } catch (error) {
      Alert.alert("Logout failed", error.message || "Please try again.");
    }
  };

  return (
    <ScreenWithHeader title="Profile" subtitle="Rider" navigation={navigation}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image source={logo} style={styles.logo} />
          <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
          <View style={styles.heroText}>
            <Text style={styles.name}>{form.name || "Rider Profile"}</Text>
            <Text numberOfLines={1} style={styles.role}>{profile?.email || "Keep your rider account updated."}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={save} disabled={saving || loading} style={styles.saveButton}>
            <Text style={styles.saveText}>{saving ? "Saving" : "Save"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickGrid}>
          <QuickLink icon={ClipboardList} label="Order History" onPress={() => navigation.navigate("OrderHistory")} />
          <QuickLink icon={ClipboardList} label="Analytics" onPress={() => navigation.navigate("Orders")} />
          <QuickLink icon={Star} label="Reviews" onPress={() => navigation.navigate("Reviews")} />
          <QuickLink icon={MessageCircle} label="Support" onPress={() => navigation.navigate("Support")} />
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Legal & Help</Text>
          <View style={styles.legalGrid}>
            <QuickLink icon={User} label="About" onPress={() => navigation.navigate("About")} />
            <QuickLink icon={Phone} label="Contact" onPress={() => navigation.navigate("ContactUs")} />
            <QuickLink icon={Mail} label="Privacy" onPress={() => navigation.navigate("Privacy")} />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Rider Details</Text>
          <Field icon={User} placeholder="Full Name" value={form.name} onChangeText={(value) => update("name", value)} />
          <Field icon={Mail} placeholder="Email" value={form.email} keyboardType="email-address" autoCapitalize="none" onChangeText={(value) => update("email", value)} />
          <Field icon={Phone} placeholder="Phone" value={form.phone} keyboardType="phone-pad" onChangeText={(value) => update("phone", value.replace(/\D/g, "").slice(0, 10))} />
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>Role: {profile?.role || "RIDER"}</Text>
            <Text style={styles.statusText}>Status: {profile?.status || "PENDING"}</Text>
            <Text style={styles.statusText}>Availability: {profile?.isOnline ? "Online" : "Offline"}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          <Field placeholder="Account Holder Name" value={form.bankDetails.accountHolderName} onChangeText={(value) => updateNested("bankDetails", "accountHolderName", value)} />
          <Field placeholder="Bank Name" value={form.bankDetails.bankName} onChangeText={(value) => updateNested("bankDetails", "bankName", value)} />
          <Field placeholder="Account Number" value={form.bankDetails.accountNumber} keyboardType="number-pad" onChangeText={(value) => updateNested("bankDetails", "accountNumber", value.replace(/\D/g, ""))} />
          <Field placeholder="IFSC Code" value={form.bankDetails.ifsc} autoCapitalize="characters" onChangeText={(value) => updateNested("bankDetails", "ifsc", value.toUpperCase())} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.segmentRow}>
            {[["BICYCLE", "Bicycle"], ["BIKE", "Bike"]].map(([value, label]) => (
              <TouchableOpacity key={value} activeOpacity={0.85} onPress={() => updateNested("vehicleDetails", "type", value)} style={[styles.segment, form.vehicleDetails.type === value && styles.segmentActive]}>
                <Bike size={18} color={form.vehicleDetails.type === value ? "#fff" : colors.muted} />
                <Text style={[styles.segmentText, form.vehicleDetails.type === value && styles.segmentTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {form.vehicleDetails.type === "BIKE" ? (
            <Field placeholder="Bike Registration Number" value={form.vehicleDetails.registrationNumber} autoCapitalize="characters" onChangeText={(value) => updateNested("vehicleDetails", "registrationNumber", value.toUpperCase())} />
          ) : (
            <Text style={styles.note}>Bicycle selected. Registration number is not required.</Text>
          )}
        </Card>

        <PrimaryButton title="Logout" tone="danger" onPress={handleLogout} style={styles.logout} />
      </ScrollView>
    </ScreenWithHeader>
  );
}

function QuickLink({ icon: Icon, label, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.quickLink}>
      <View style={styles.quickIcon}><Icon size={20} color={colors.primaryDark} /></View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function Field({ icon: Icon, style, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      {Icon ? <Icon size={18} color={colors.muted} /> : null}
      <TextInput placeholderTextColor="#94a3b8" style={[styles.input, style]} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 138, gap: 14 },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 24, backgroundColor: colors.primary, padding: 16 },
  logo: { width: 42, height: 42, borderRadius: 14 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  initials: { color: "#fff", fontSize: 24, fontWeight: "900" },
  heroText: { flex: 1, minWidth: 0 },
  name: { color: "#fff", fontSize: 21, fontWeight: "900" },
  role: { color: "#e0e7ff", marginTop: 3, fontWeight: "700" },
  saveButton: { borderRadius: 14, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 14, paddingVertical: 10 },
  saveText: { color: "#fff", fontWeight: "900" },
  quickGrid: { flexDirection: "row", gap: 10 },
  quickLink: { flex: 1, alignItems: "center", gap: 7, borderRadius: 18, borderWidth: 1, borderColor: "#e0e7ff", backgroundColor: "#fff", paddingVertical: 12 },
  quickIcon: { width: 40, height: 40, borderRadius: 16, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  quickLabel: { color: colors.primaryDark, fontWeight: "900", fontSize: 12 },
  legalGrid: { flexDirection: "row", gap: 10 },
  card: { gap: 12 },
  sectionTitle: { color: colors.primaryDark, fontSize: 19, fontWeight: "900" },
  fieldWrap: { minHeight: 52, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#fff" },
  input: { flex: 1, color: colors.ink, fontWeight: "700", fontSize: 15, minHeight: 48 },
  statusBox: { borderRadius: 16, backgroundColor: "#f8fafc", padding: 12, gap: 4 },
  statusText: { color: colors.muted, fontWeight: "800" },
  segmentRow: { flexDirection: "row", gap: 10 },
  segment: { flex: 1, minHeight: 52, borderWidth: 1, borderColor: colors.line, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  segmentActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  segmentText: { color: colors.muted, fontWeight: "900" },
  segmentTextActive: { color: "#fff" },
  note: { color: colors.muted, fontWeight: "700", lineHeight: 21 },
  logout: { marginTop: 2 },
});



