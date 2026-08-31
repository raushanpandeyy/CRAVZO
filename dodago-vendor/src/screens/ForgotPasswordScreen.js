import { useState } from "react";
import {
  Alert, Image, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { InputField, PrimaryButton, TextButton } from "../components/Primitives";
import { forgotPassword } from "../services/authService";

export default function ForgotPasswordScreen({ navigation }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSend = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      Alert.alert("Failed", err.message || "Could not send reset code.");
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
          <View style={styles.logoWrap}>
            <Image source={require("../../assets/dodagologo.png")} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.card}>
            {sent ? (
              <>
                <Text style={styles.icon}>✅</Text>
                <Text style={styles.title}>Email sent!</Text>
                <Text style={styles.subtitle}>
                  We've sent a password reset code to{"\n"}
                  <Text style={styles.highlight}>{email}</Text>
                </Text>
                <TextButton
                  title="← Back to sign in"
                  onPress={() => navigation.navigate("Login")}
                  style={styles.backBtn}
                />
              </>
            ) : (
              <>
                <Text style={styles.icon}>🔑</Text>
                <Text style={styles.title}>Reset password</Text>
                <Text style={styles.subtitle}>
                  Enter your email and we'll send you a reset code.
                </Text>

                <InputField
                  label="Email"
                  placeholder="you@email.com"
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={error}
                  style={styles.input}
                />

                <PrimaryButton
                  title="Send Reset Code"
                  onPress={handleSend}
                  loading={loading}
                  style={styles.submitBtn}
                />

                <TextButton
                  title="← Back to sign in"
                  onPress={() => navigation.navigate("Login")}
                  style={styles.backBtn}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  flex:      { flex: 1 },
  scroll:    { flexGrow: 1, padding: 24, justifyContent: "center" },

  logoWrap:  { alignItems: "center", marginBottom: 24 },
  logo:      { width: 64, height: 64, borderRadius: 16 },

  card: {
    backgroundColor: colors.card, borderRadius: 26, padding: 28,
    borderWidth: 1, borderColor: colors.line, alignItems: "center",
    shadowColor: "#0f172a", shadowOpacity: 0.08, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  icon:      { fontSize: 40, marginBottom: 12 },
  title:     { fontSize: 22, fontWeight: "900", color: colors.ink, marginBottom: 6 },
  subtitle:  { fontSize: 14, color: colors.muted, fontWeight: "700", textAlign: "center", lineHeight: 21, marginBottom: 22 },
  highlight: { color: colors.primary, fontWeight: "900" },

  input:     { width: "100%", marginBottom: 4 },
  submitBtn: { width: "100%", marginTop: 4 },
  backBtn:   { marginTop: 16 },
});
