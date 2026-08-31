import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert, Image, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { PrimaryButton, TextButton } from "../components/Primitives";
import { sendOtp, verifyOtp } from "../services/authService";
import { useAuth } from "../services/AuthContext";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function OtpScreen({ navigation, route }) {
  const { signIn } = useAuth();
  const email = route?.params?.email || "";
  const mode  = route?.params?.mode  || "signup"; // "signup" | "login"

  const [otp,        setOtp]        = useState(Array(OTP_LENGTH).fill(""));
  const [loading,    setLoading]    = useState(false);
  const [resending,  setResending]  = useState(false);
  const [cooldown,   setCooldown]   = useState(RESEND_COOLDOWN);
  const [canResend,  setCanResend]  = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = useCallback((text, index) => {
    const digit = text.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyPress = useCallback((e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...otp];
      next[index - 1] = "";
      setOtp(next);
    }
  }, [otp]);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (otp.every((d) => d !== "")) handleVerify();
  }, [otp]);

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      Alert.alert("Incomplete OTP", "Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    try {
      const user = await verifyOtp({ email, otp: code });
      signIn(user);
    } catch (err) {
      Alert.alert("Invalid OTP", err.message || "Please check the code and try again.");
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      await sendOtp(email);
      setOtp(Array(OTP_LENGTH).fill(""));
      setCooldown(RESEND_COOLDOWN);
      setCanResend(false);
      Alert.alert("OTP Sent", `A new code was sent to ${email}`);
    } catch (err) {
      Alert.alert("Resend failed", err.message || "Please try again.");
    } finally {
      setResending(false);
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
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.icon}>📧</Text>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{"\n"}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            {/* OTP boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { inputRefs.current[i] = r; }}
                  style={[styles.otpBox, digit && styles.otpBoxFilled]}
                  value={digit}
                  onChangeText={(t) => handleChange(t, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  textAlign="center"
                />
              ))}
            </View>

            <PrimaryButton
              title="Verify OTP"
              onPress={handleVerify}
              loading={loading}
              disabled={otp.some((d) => d === "")}
              style={styles.verifyBtn}
            />

            {/* Resend */}
            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive it? </Text>
              {canResend
                ? <TextButton title="Resend OTP" onPress={handleResend} />
                : <Text style={styles.cooldownText}>Resend in {cooldown}s</Text>
              }
            </View>

            <TextButton
              title="← Back to sign in"
              onPress={() => navigation.navigate("Login")}
              style={styles.backBtn}
            />
          </View>

          {/* Helper text */}
          <Text style={styles.helperText}>
            Check your spam/junk folder if you don't see it in your inbox.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  flex:    { flex: 1 },
  scroll:  { flexGrow: 1, padding: 24, justifyContent: "center" },

  logoWrap: { alignItems: "center", marginBottom: 24 },
  logo:     { width: 64, height: 64, borderRadius: 16 },

  card: {
    backgroundColor: colors.card, borderRadius: 26, padding: 28,
    borderWidth: 1, borderColor: colors.line, alignItems: "center",
    shadowColor: "#0f172a", shadowOpacity: 0.08, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  icon:      { fontSize: 44, marginBottom: 12 },
  title:     { fontSize: 24, fontWeight: "900", color: colors.ink, marginBottom: 6 },
  subtitle:  { fontSize: 14, color: colors.muted, fontWeight: "700", textAlign: "center", lineHeight: 21, marginBottom: 28 },
  emailText: { color: colors.primary, fontWeight: "900" },

  otpRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  otpBox: {
    width: 46, height: 56, borderRadius: 14, borderWidth: 2,
    borderColor: colors.line, fontSize: 24, fontWeight: "900",
    color: colors.ink, backgroundColor: "#f8fafc", textAlign: "center",
  },
  otpBoxFilled: { borderColor: colors.primary, backgroundColor: colors.primarySoft },

  verifyBtn:   { width: "100%", marginBottom: 16 },
  resendRow:   { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  resendText:  { color: colors.muted, fontWeight: "700", fontSize: 14 },
  cooldownText:{ color: colors.subtle, fontWeight: "800", fontSize: 14 },
  backBtn:     { marginTop: 4 },

  helperText: {
    textAlign: "center", color: colors.subtle, fontSize: 12,
    fontWeight: "700", marginTop: 20, lineHeight: 18,
  },
});
