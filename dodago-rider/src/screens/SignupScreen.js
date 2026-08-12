import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Bike } from "../components/Icons";
import { Card, PrimaryButton, Screen } from "../components/Primitives";
import { colors } from "../constants/colors";
import { signup, verifyOtp, sendOtp } from "../services/authService";
import { useAuth } from "../services/AuthContext";

const logo = require("../../assets/dodagologo.png");

const initialForm = {
  name: "",
  city: "",
  vehicleType: "",
  vehicleNumber: "",
  drivingLicense: "",
  address: "",
  shirtSize: "",
  email: "",
  phone: "",
  password: "",
};

export default function SignupScreen({ navigation }) {
  const { setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const validateStep = () => {
    if (step === 1) return form.name.trim() && form.city.trim() && form.phone.length === 10 && form.email.trim() && form.password.length >= 8;
    if (step === 2) return form.vehicleType && (form.vehicleType !== "bike" || (form.vehicleNumber.trim() && form.drivingLicense.trim()));
    return form.address.trim() && form.shirtSize;
  };

  const next = () => {
    if (!validateStep()) {
      Alert.alert("Missing details", "Required rider details complete karo.");
      return;
    }
    setStep((current) => current + 1);
  };

  const requestOtp = async () => {
    if (!validateStep()) {
      Alert.alert("Missing details", "Address aur shirt size fill karo.");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      await signup({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: "RIDER",
        onboardingData: {
          city: form.city,
          vehicleType: form.vehicleType,
          vehicleNumber: form.vehicleNumber,
          drivingLicense: form.drivingLicense,
          address: form.address,
          shirtSize: form.shirtSize,
          phone: form.phone,
        },
      });
      setMessage("OTP sent to your email.");
      setStep(4);
    } catch (error) {
      Alert.alert("Signup failed", error.message || "Could not submit rider details.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      setLoading(true);
      await sendOtp({ email: form.email, role: "RIDER" });
      setMessage("OTP resent to your email.");
    } catch (error) {
      Alert.alert("OTP failed", error.message || "Could not resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "6 digit OTP enter karo.");
      return;
    }
    try {
      setLoading(true);
      const result = await verifyOtp({ email: form.email, otp, role: "RIDER" });
      if (result.user?.id) setUser(result.user);
      else {
        Alert.alert("Submitted", "Rider details submitted. Admin approval ke baad login kar paoge.");
        navigation.replace("Login");
      }
    } catch (error) {
      Alert.alert("OTP failed", error.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Image source={logo} style={styles.logo} />
            <View style={styles.heroIcon}><Bike size={28} color="#fff" /></View>
            <Text style={styles.kicker}>Rider Partner</Text>
            <Text style={styles.title}>Register as Dodago Partner</Text>
            <Text style={styles.subtitle}>Create your rider profile and verify with OTP.</Text>
          </View>

          <Card style={styles.card}>
            <Text style={styles.step}>Step {step} of 4</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}

            {step === 1 ? (
              <View style={styles.fields}>
                <Field placeholder="Enter Name" value={form.name} onChangeText={(value) => update("name", value)} />
                <Field placeholder="City" value={form.city} onChangeText={(value) => update("city", value)} />
                <Field placeholder="Mobile Number" value={form.phone} keyboardType="number-pad" maxLength={10} onChangeText={(value) => update("phone", value.replace(/\D/g, "").slice(0, 10))} />
                <Field placeholder="Email" value={form.email} autoCapitalize="none" keyboardType="email-address" onChangeText={(value) => update("email", value)} />
                <Field placeholder="Password" value={form.password} secureTextEntry onChangeText={(value) => update("password", value)} />
                <PrimaryButton title="Continue" onPress={next} />
              </View>
            ) : null}

            {step === 2 ? (
              <View style={styles.fields}>
                <Text style={styles.label}>Vehicle Type</Text>
                <View style={styles.segmentRow}>
                  {[["cycle", "Cycle"], ["bike", "Bike"]].map(([value, label]) => (
                    <TouchableOpacity key={value} activeOpacity={0.85} onPress={() => update("vehicleType", value)} style={[styles.segment, form.vehicleType === value && styles.segmentActive]}>
                      <Text style={[styles.segmentText, form.vehicleType === value && styles.segmentTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {form.vehicleType === "bike" ? (
                  <>
                    <Field placeholder="Vehicle Number" value={form.vehicleNumber} autoCapitalize="characters" onChangeText={(value) => update("vehicleNumber", value.toUpperCase())} />
                    <Field placeholder="Driving License" value={form.drivingLicense} autoCapitalize="characters" onChangeText={(value) => update("drivingLicense", value.toUpperCase())} />
                  </>
                ) : null}
                <View style={styles.actionRow}><PrimaryButton title="Back" tone="muted" onPress={() => setStep(1)} style={styles.flex} /><PrimaryButton title="Next" onPress={next} style={styles.flex} /></View>
              </View>
            ) : null}

            {step === 3 ? (
              <View style={styles.fields}>
                <Field placeholder="Address" value={form.address} multiline style={styles.textArea} onChangeText={(value) => update("address", value)} />
                <Text style={styles.label}>Shirt Size</Text>
                <View style={styles.segmentRow}>
                  {["S", "M", "L", "XL"].map((size) => (
                    <TouchableOpacity key={size} activeOpacity={0.85} onPress={() => update("shirtSize", size)} style={[styles.segmentSmall, form.shirtSize === size && styles.segmentActive]}>
                      <Text style={[styles.segmentText, form.shirtSize === size && styles.segmentTextActive]}>{size}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.actionRow}><PrimaryButton title="Back" tone="muted" onPress={() => setStep(2)} style={styles.flex} /><PrimaryButton title="Send OTP" loading={loading} onPress={requestOtp} style={styles.flex} /></View>
              </View>
            ) : null}

            {step === 4 ? (
              <View style={styles.fields}>
                <Text style={styles.verifyTitle}>Verify and submit</Text>
                <Text style={styles.verifyCopy}>Admin approval starts after this OTP step.</Text>
                <Field placeholder="6 digit OTP" value={otp} keyboardType="number-pad" maxLength={6} onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))} style={styles.otp} />
                <PrimaryButton title="Verify & Submit" loading={loading} onPress={submitOtp} />
                <View style={styles.actionRow}><PrimaryButton title="Back" tone="muted" onPress={() => setStep(3)} style={styles.flex} /><PrimaryButton title="Resend" tone="dark" loading={loading} onPress={resend} style={styles.flex} /></View>
              </View>
            ) : null}

            <TouchableOpacity onPress={() => navigation.replace("Login")} style={styles.loginLink}>
              <Text style={styles.loginText}>Already registered? Login</Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ style, ...props }) {
  return <TextInput placeholderTextColor="#94a3b8" style={[styles.input, style]} {...props} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  hero: { borderRadius: 28, backgroundColor: colors.primary, padding: 22, minHeight: 220, justifyContent: "flex-end" },
  logo: { position: "absolute", top: 18, left: 18, width: 48, height: 48, borderRadius: 15 },
  heroIcon: { position: "absolute", top: 18, right: 18, width: 52, height: 52, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  kicker: { color: "#ddd6fe", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#fff", fontSize: 29, fontWeight: "900", lineHeight: 34, marginTop: 8 },
  subtitle: { color: "#eef2ff", fontWeight: "700", marginTop: 8, lineHeight: 21 },
  card: { gap: 14 },
  step: { color: colors.primary, fontWeight: "900" },
  message: { color: colors.primaryDark, backgroundColor: "#eef2ff", padding: 10, borderRadius: 12, fontWeight: "800" },
  fields: { gap: 12 },
  label: { color: colors.ink, fontWeight: "900" },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 14, backgroundColor: "#f8fafc", color: colors.ink, fontSize: 15, fontWeight: "700" },
  textArea: { minHeight: 96, paddingTop: 14, textAlignVertical: "top" },
  segmentRow: { flexDirection: "row", gap: 10 },
  segment: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingVertical: 14, alignItems: "center", backgroundColor: "#fff" },
  segmentSmall: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingVertical: 12, alignItems: "center", backgroundColor: "#fff" },
  segmentActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  segmentText: { color: colors.muted, fontWeight: "900" },
  segmentTextActive: { color: "#fff" },
  actionRow: { flexDirection: "row", gap: 10 },
  verifyTitle: { color: colors.ink, fontSize: 19, fontWeight: "900" },
  verifyCopy: { color: colors.muted, fontWeight: "700", lineHeight: 21 },
  otp: { textAlign: "center", fontSize: 22, letterSpacing: 6, fontWeight: "900" },
  loginLink: { alignItems: "center", paddingVertical: 4 },
  loginText: { color: colors.primaryDark, fontWeight: "900" },
});
