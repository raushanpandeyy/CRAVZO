import { useState } from "react";
import {
  Alert, Image, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { InputField, PrimaryButton, TextButton } from "../components/Primitives";
import { Eye, EyeOff } from "../components/Icons";
import { signup } from "../services/authService";

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [showPwd,  setShowPwd]  = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const set = (key) => (val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Full name is required";
    if (!form.email.trim())   e.email   = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim())   e.phone   = "Mobile number is required";
    else if (form.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid 10-digit number";
    if (!form.password)       e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    else if (!/[A-Z]/.test(form.password)) e.password = "Must have at least one uppercase letter";
    else if (!/[0-9]/.test(form.password)) e.password = "Must have at least one number";
    else if (!/[^A-Za-z0-9]/.test(form.password)) e.password = "Must have at least one special character";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await signup({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        phone:    form.phone.trim(),
        password: form.password,
      });
      // Backend sends OTP to email after signup
      navigation.navigate("Otp", {
        email: data?.email || form.email.trim().toLowerCase(),
        mode:  "signup",
      });
    } catch (err) {
      Alert.alert("Signup failed", err.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Image source={require("../../assets/dodagologo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brand}>Join as a Partner</Text>
            <Text style={styles.brandSub}>Create your restaurant account</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Fill in the details below to get started</Text>

            <View style={styles.form}>
              {/* Name */}
              <InputField
                label="Full Name"
                placeholder="Your name"
                value={form.name}
                onChangeText={set("name")}
                autoCapitalize="words"
                error={errors.name}
              />

              {/* Email */}
              <InputField
                label="Email"
                placeholder="you@email.com"
                value={form.email}
                onChangeText={set("email")}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              {/* Phone */}
              <InputField
                label="Mobile Number"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChangeText={(v) => set("phone")(v.replace(/\D/g, "").slice(0, 10))}
                keyboardType="phone-pad"
                error={errors.phone}
              />

              {/* Password */}
              <View style={styles.pwdRow}>
                <InputField
                  label="Password"
                  placeholder="Min 8 chars, uppercase, number, symbol"
                  value={form.password}
                  onChangeText={set("password")}
                  secureTextEntry={!showPwd}
                  error={errors.password}
                  style={styles.flex}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd((p) => !p)}>
                  {showPwd ? <EyeOff size={20} color={colors.muted} /> : <Eye size={20} color={colors.muted} />}
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <View style={styles.pwdRow}>
                <InputField
                  label="Confirm Password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChangeText={set("confirmPassword")}
                  secureTextEntry={!showCPwd}
                  error={errors.confirmPassword}
                  style={styles.flex}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCPwd((p) => !p)}>
                  {showCPwd ? <EyeOff size={20} color={colors.muted} /> : <Eye size={20} color={colors.muted} />}
                </TouchableOpacity>
              </View>

              {/* Password hint */}
              <View style={styles.hintBox}>
                <Text style={styles.hintTitle}>Password must have:</Text>
                {[
                  ["At least 8 characters",       form.password.length >= 8],
                  ["One uppercase letter (A-Z)",   /[A-Z]/.test(form.password)],
                  ["One number (0-9)",              /[0-9]/.test(form.password)],
                  ["One special character (!@#...)",/[^A-Za-z0-9]/.test(form.password)],
                ].map(([text, met]) => (
                  <Text key={text} style={[styles.hintItem, met && styles.hintMet]}>
                    {met ? "✓ " : "○ "}{text}
                  </Text>
                ))}
              </View>

              <PrimaryButton
                title="Create Account →"
                onPress={handleSignup}
                loading={loading}
                style={styles.submitBtn}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TextButton title="Sign in" onPress={() => navigation.navigate("Login")} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: colors.bg },
  flex:     { flex: 1 },
  scroll:   { flexGrow: 1, padding: 24, paddingTop: 16 },

  logoWrap:  { alignItems: "center", marginBottom: 24, marginTop: 8 },
  logo:      { width: 64, height: 64, borderRadius: 16 },
  brand:     { color: colors.primaryDark, fontSize: 22, fontWeight: "900", marginTop: 10 },
  brandSub:  { color: colors.muted, fontSize: 13, fontWeight: "700", marginTop: 2 },

  card: {
    backgroundColor: colors.card, borderRadius: 26, padding: 24,
    borderWidth: 1, borderColor: colors.line,
    shadowColor: "#0f172a", shadowOpacity: 0.08, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  title:    { fontSize: 22, fontWeight: "900", color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.muted, fontWeight: "700", marginBottom: 20 },

  form:     { gap: 14 },
  pwdRow:   { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  eyeBtn:   { width: 52, height: 52, borderRadius: 14, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  submitBtn:{ marginTop: 6 },

  hintBox:   { backgroundColor: "#f8fafc", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.line, gap: 4 },
  hintTitle: { color: colors.muted, fontWeight: "900", fontSize: 12, marginBottom: 4 },
  hintItem:  { color: colors.subtle, fontSize: 12, fontWeight: "700" },
  hintMet:   { color: colors.accent },

  footer:     { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24, marginBottom: 16 },
  footerText: { color: colors.muted, fontSize: 14, fontWeight: "700" },
});
