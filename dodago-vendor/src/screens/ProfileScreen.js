import { useCallback, useEffect, useState } from "react";
import {
  ActionSheetIOS, Alert, Image, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Switch, Text,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { colors } from "../constants/colors";
import { Card, InputField, PrimaryButton, TextButton } from "../components/Primitives";
import { Camera, LogOut, MapPin, Store } from "../components/Icons";
import { getMyRestaurant, saveRestaurant, uploadImage } from "../services/vendorService";
import { useAuth } from "../services/AuthContext";
import { logout } from "../services/authService";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const EMPTY = {
  name:"", description:"", cuisine:"", phone:"",
  imageUrl:"", addressLine1:"", addressLine2:"",
  city:"", state:"", postalCode:"", fssaiNumber:"",
  isOpen: true, openingTime:"09:00", closingTime:"22:00",
  openDays: [...DAYS],
  latitude: null, longitude: null,
  bankDetails: { accountHolderName:"", bankName:"", accountNumber:"", ifsc:"" },
};

const pickImage = async (source) => {
  if (source === "camera") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") { Alert.alert("Permission needed","Camera access required."); return null; }
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16,9], quality: 0.8 });
    return r.canceled ? null : r.assets[0].uri;
  } else {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") { Alert.alert("Permission needed","Photo library access required."); return null; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16,9], quality: 0.8 });
    return r.canceled ? null : r.assets[0].uri;
  }
};

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [restaurantId, setRestaurantId] = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating,  setLocating]  = useState(false);
  const [message,   setMessage]   = useState("");
  const [activeTab, setActiveTab] = useState("info"); // info | hours | bank

  // ── Load restaurant ───────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyRestaurant();
      if (data) {
        setRestaurantId(data.id);
        setForm({
          name:         data.name         || "",
          description:  data.description  || "",
          cuisine:      data.cuisine      || "",
          phone:        data.phone        || "",
          imageUrl:     data.imageUrl     || "",
          addressLine1: data.addressLine1 || "",
          addressLine2: data.addressLine2 || "",
          city:         data.city         || "",
          state:        data.state        || "",
          postalCode:   data.postalCode   || "",
          fssaiNumber:  data.fssaiNumber  || "",
          isOpen:       Boolean(data.isOpen),
          openingTime:  data.openingTime  || "09:00",
          closingTime:  data.closingTime  || "22:00",
          openDays:     Array.isArray(data.openDays) && data.openDays.length > 0
                          ? data.openDays : [...DAYS],
          latitude:     data.latitude  || null,
          longitude:    data.longitude || null,
          bankDetails: {
            accountHolderName: data.bankDetails?.accountHolderName || "",
            bankName:          data.bankDetails?.bankName          || "",
            accountNumber:     data.bankDetails?.accountNumber     || "",
            ifsc:              data.bankDetails?.ifsc              || "",
          },
        });
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Helpers ───────────────────────────────────────────────────────
  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));
  const setBank = (key) => (val) =>
    setForm((p) => ({ ...p, bankDetails: { ...p.bankDetails, [key]: val } }));

  const toggleDay = (day) => {
    setForm((p) => ({
      ...p,
      openDays: p.openDays.includes(day)
        ? p.openDays.filter((d) => d !== day)
        : [...p.openDays, day],
    }));
  };

  // ── Cover image ───────────────────────────────────────────────────
  const handlePickCover = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel","Take Photo","Choose from Library"], cancelButtonIndex: 0 },
        async (idx) => {
          if (idx === 0) return;
          const uri = await pickImage(idx === 1 ? "camera" : "gallery");
          if (uri) uploadCover(uri);
        }
      );
    } else {
      Alert.alert("Cover Photo", "Choose source", [
        { text: "Camera",  onPress: async () => { const uri = await pickImage("camera");  if (uri) uploadCover(uri); }},
        { text: "Gallery", onPress: async () => { const uri = await pickImage("gallery"); if (uri) uploadCover(uri); }},
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const uploadCover = async (uri) => {
    setUploading(true);
    try {
      const url = await uploadImage(uri);
      set("imageUrl")(url);
    } catch (err) {
      Alert.alert("Upload failed", err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Detect current location ──────────────────────────────────────
  const handleDetectLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Location access is required to pin your restaurant on the map.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      // Reverse geocode to fill address fields
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      setForm((p) => ({
        ...p,
        latitude,
        longitude,
        addressLine1: p.addressLine1 || [geo?.streetNumber, geo?.street].filter(Boolean).join(" "),
        city:         p.city         || geo?.city         || geo?.subregion || "",
        state:        p.state        || geo?.region       || "",
        postalCode:   p.postalCode   || geo?.postalCode   || "",
      }));
      Alert.alert("📍 Location set!", `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}\n\nYour restaurant will now appear in nearby searches.`);
    } catch (err) {
      Alert.alert("Location error", err.message || "Could not get location");
    } finally {
      setLocating(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert("Validation", "Restaurant name is required"); return; }
    if (!restaurantId)    { Alert.alert("Error", "Restaurant not loaded yet"); return; }
    setSaving(true);
    setMessage("");
    try {
      await saveRestaurant(restaurantId, form);
      setMessage("✅  Profile saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      Alert.alert("Save failed", err.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await logout(); signOut(); } },
    ]);
  };

  const TABS = [
    { key: "info",  label: "🏪  Info"  },
    { key: "hours", label: "🕐  Hours" },
    { key: "bank",  label: "🏦  Bank"  },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={18} color={colors.danger} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* ── Cover image ── */}
        <TouchableOpacity style={styles.coverWrap} onPress={handlePickCover} disabled={uploading}>
          {form.imageUrl
            ? <Image source={{ uri: form.imageUrl }} style={styles.coverImage} resizeMode="cover" />
            : <View style={styles.coverPlaceholder}>
                <Store size={36} color={colors.subtle} />
                <Text style={styles.coverPlaceholderText}>Add Cover Photo</Text>
              </View>
          }
          <View style={styles.coverEditBtn}>
            <Camera size={16} color="#fff" />
            <Text style={styles.coverEditText}>{uploading ? "Uploading…" : "Edit Cover"}</Text>
          </View>
        </TouchableOpacity>

        {/* ── User info bar ── */}
        <View style={styles.userBar}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{user?.name?.[0] || "V"}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name || "Vendor"}</Text>
            <Text style={styles.userEmail}>{user?.email || ""}</Text>
          </View>
        </View>

        {/* ── Tab bar ── */}
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab content ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.tabContent}
        >
          {/* ── INFO TAB ── */}
          {activeTab === "info" && (
            <View style={styles.section}>
              <Card style={styles.formCard}>
                <Text style={styles.cardTitle}>Basic Information</Text>
                <InputField label="Restaurant Name *" placeholder="e.g. Biryani House"
                  value={form.name} onChangeText={set("name")} />
                <InputField label="Description" placeholder="Tell customers about your restaurant"
                  value={form.description} onChangeText={set("description")}
                  multiline numberOfLines={3}
                  inputStyle={{ minHeight: 72, textAlignVertical:"top", paddingTop:12 }} />
                <InputField label="Cuisine Type" placeholder="e.g. North Indian, Chinese, Fast Food"
                  value={form.cuisine} onChangeText={set("cuisine")} />
                <InputField label="Contact Phone" placeholder="Restaurant phone number"
                  value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
                <InputField label="FSSAI Number" placeholder="14-digit FSSAI license number"
                  value={form.fssaiNumber} onChangeText={set("fssaiNumber")} keyboardType="numeric" />
              </Card>

              <Card style={styles.formCard}>
                <View style={styles.cardTitleRow}>
                  <MapPin size={16} color={colors.primary} />
                  <Text style={styles.cardTitle}>Address</Text>
                </View>
                {/* Location pin button */}
                <TouchableOpacity
                  style={[styles.locBtn, locating && styles.locBtnDisabled]}
                  onPress={handleDetectLocation}
                  disabled={locating}
                >
                  <MapPin size={16} color={locating ? colors.muted : colors.primary} />
                  <Text style={[styles.locBtnText, locating && { color: colors.muted }]}>
                    {locating
                      ? "Detecting location…"
                      : form.latitude
                        ? `📍 Location set (${Number(form.latitude).toFixed(4)}, ${Number(form.longitude).toFixed(4)}) — Tap to update`
                        : "📍 Detect & Set My Location (required for map visibility)"}
                  </Text>
                </TouchableOpacity>
                <InputField label="Address Line 1 *" placeholder="Shop/Building number, Street"
                  value={form.addressLine1} onChangeText={set("addressLine1")} />
                <InputField label="Address Line 2" placeholder="Landmark, Area"
                  value={form.addressLine2} onChangeText={set("addressLine2")} />
                <View style={styles.rowFields}>
                  <InputField label="City" placeholder="City" value={form.city}
                    onChangeText={set("city")} style={styles.flex} />
                  <InputField label="State" placeholder="State" value={form.state}
                    onChangeText={set("state")} style={styles.flex} />
                </View>
                <InputField label="Postal Code" placeholder="6-digit pincode"
                  value={form.postalCode} onChangeText={set("postalCode")} keyboardType="numeric" />
              </Card>
            </View>
          )}

          {/* ── HOURS TAB ── */}
          {activeTab === "hours" && (
            <View style={styles.section}>
              <Card style={styles.formCard}>
                <Text style={styles.cardTitle}>Opening Hours</Text>

                {/* Open/Close toggle */}
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Currently Open</Text>
                  <Switch
                    value={form.isOpen}
                    onValueChange={set("isOpen")}
                    trackColor={{ false: colors.dangerSoft, true: colors.accentSoft }}
                    thumbColor={form.isOpen ? colors.accent : colors.danger}
                  />
                </View>

                {/* Times */}
                <View style={styles.rowFields}>
                  <InputField
                    label="Opening Time"
                    placeholder="09:00"
                    value={form.openingTime}
                    onChangeText={set("openingTime")}
                    style={styles.flex}
                  />
                  <InputField
                    label="Closing Time"
                    placeholder="22:00"
                    value={form.closingTime}
                    onChangeText={set("closingTime")}
                    style={styles.flex}
                  />
                </View>
                <Text style={styles.timeHint}>Format: HH:MM (24-hour), e.g. 09:00, 22:30</Text>
              </Card>

              <Card style={styles.formCard}>
                <Text style={styles.cardTitle}>Open Days</Text>
                <View style={styles.daysGrid}>
                  {DAYS.map((day) => {
                    const active = form.openDays.includes(day);
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayChip, active && styles.dayChipActive]}
                        onPress={() => toggleDay(day)}
                      >
                        <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                          {day.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            </View>
          )}

          {/* ── BANK TAB ── */}
          {activeTab === "bank" && (
            <View style={styles.section}>
              <View style={styles.bankNotice}>
                <Text style={styles.bankNoticeText}>
                  🔒  Your bank details are encrypted and used only for vendor payouts.
                </Text>
              </View>
              <Card style={styles.formCard}>
                <Text style={styles.cardTitle}>Bank Account Details</Text>
                <InputField
                  label="Account Holder Name"
                  placeholder="As per bank records"
                  value={form.bankDetails.accountHolderName}
                  onChangeText={setBank("accountHolderName")}
                />
                <InputField
                  label="Bank Name"
                  placeholder="e.g. SBI, HDFC, ICICI"
                  value={form.bankDetails.bankName}
                  onChangeText={setBank("bankName")}
                />
                <InputField
                  label="Account Number"
                  placeholder="Your account number"
                  value={form.bankDetails.accountNumber}
                  onChangeText={setBank("accountNumber")}
                  keyboardType="numeric"
                  secureTextEntry
                />
                <InputField
                  label="IFSC Code"
                  placeholder="e.g. SBIN0001234"
                  value={form.bankDetails.ifsc}
                  onChangeText={(v) => setBank("ifsc")(v.toUpperCase())}
                  autoCapitalize="characters"
                />
              </Card>
            </View>
          )}

          {/* ── Success message ── */}
          {message ? (
            <View style={styles.successMsg}>
              <Text style={styles.successText}>{message}</Text>
            </View>
          ) : null}

          {/* ── Save button ── */}
          <PrimaryButton
            title="Save Profile"
            tone="primary"
            onPress={handleSave}
            loading={saving || loading}
            style={styles.saveBtn}
          />

          {/* ── Quick links ── */}
          <View style={styles.quickLinksRow}>
            <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate("Reviews")}>
              <Text style={styles.quickLinkText}>⭐  Reviews</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate("Reports")}>
              <Text style={styles.quickLinkText}>📊  Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLink} onPress={() => navigation.navigate("Support")}>
              <Text style={styles.quickLinkText}>🎧  Support</Text>
            </TouchableOpacity>
          </View>

          {/* ── Legal links ── */}
          <View style={styles.legalRow}>
            <TouchableOpacity style={styles.legalBtn} onPress={() => navigation.navigate("About")}>
              <Text style={styles.legalBtnText}>About Us</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            <TouchableOpacity style={styles.legalBtn} onPress={() => navigation.navigate("Privacy")}>
              <Text style={styles.legalBtnText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            <TouchableOpacity style={styles.legalBtn} onPress={() => navigation.navigate("Contact")}>
              <Text style={styles.legalBtnText}>Contact Us</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  flex:   { flex: 1 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: colors.ink },
  logoutBtn:   { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.dangerSoft },
  logoutText:  { color: colors.danger, fontWeight: "800", fontSize: 13 },

  coverWrap:        { height: 160, marginHorizontal: 16, borderRadius: 20, overflow: "hidden", backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: colors.line },
  coverImage:       { width: "100%", height: "100%" },
  coverPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  coverPlaceholderText: { color: colors.subtle, fontWeight: "700", fontSize: 13 },
  coverEditBtn:     { position: "absolute", bottom: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  coverEditText:    { color: "#fff", fontWeight: "800", fontSize: 12 },

  userBar:     { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  userAvatar:  { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  userAvatarText: { color: "#fff", fontSize: 20, fontWeight: "900" },
  userName:    { fontSize: 16, fontWeight: "900", color: colors.ink },
  userEmail:   { fontSize: 13, color: colors.muted, fontWeight: "700" },

  tabBar:       { flexDirection: "row", marginHorizontal: 16, backgroundColor: "#f1f5f9", borderRadius: 14, padding: 4, marginBottom: 8 },
  tabItem:      { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabItemActive:{ backgroundColor: "#fff", shadowColor: "#0f172a", shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  tabText:      { fontSize: 13, fontWeight: "800", color: colors.muted },
  tabTextActive:{ color: colors.ink, fontWeight: "900" },

  tabContent:  { paddingHorizontal: 16, paddingBottom: 32 },
  section:     { gap: 14 },
  formCard:    { gap: 14 },
  cardTitle:   { fontSize: 15, fontWeight: "900", color: colors.ink },
  cardTitleRow:{ flexDirection: "row", alignItems: "center", gap: 6 },

  rowFields:   { flexDirection: "row", gap: 10 },

  toggleRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  toggleLabel: { fontSize: 14, fontWeight: "800", color: colors.ink },
  timeHint:    { fontSize: 11, color: colors.subtle, fontWeight: "700", marginTop: -4 },

  daysGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f1f5f9", borderWidth: 1.5, borderColor: colors.line },
  dayChipActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText:      { fontSize: 13, fontWeight: "800", color: colors.muted },
  dayChipTextActive:{ color: "#fff" },

  bankNotice:  { backgroundColor: colors.primarySoft, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#c7d2fe", marginBottom: 2 },
  bankNoticeText: { color: colors.primaryDark, fontSize: 13, fontWeight: "700", lineHeight: 19 },

  successMsg:  { backgroundColor: colors.accentSoft, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#6ee7b7", marginTop: 4 },
  successText: { color: colors.accent, fontWeight: "800", fontSize: 14, textAlign: "center" },

  saveBtn:     { marginTop: 16 },
  bottomPad:   { height: 16 },
  legalRow:    { flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 4, marginTop: 8 },
  legalBtn:    { paddingVertical: 4, paddingHorizontal: 2 },
  legalBtnText:{ color: colors.primary, fontSize: 13, fontWeight: "800" },
  legalDot:    { color: colors.subtle, fontSize: 13 },

  // Location button
  locBtn:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primarySoft, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#c7d2fe" },
  locBtnDisabled:{ opacity: 0.5 },
  locBtnText:   { color: colors.primary, fontWeight: "800", fontSize: 13, flex: 1, flexWrap: "wrap" },

  // Quick links
  quickLinksRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  quickLink:     { flex: 1, backgroundColor: colors.card, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: colors.line },
  quickLinkText: { fontSize: 13, fontWeight: "900", color: colors.ink },
});
