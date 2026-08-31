import { useState } from "react";
import {
  Alert, Image, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { InputField, PrimaryButton, TextButton } from "../components/Primitives";
import { Eye, EyeOff } from "../components/Icons";
import { login } from "../services/authService";
import { useAuth } from "../services/AuthContext";

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim())    e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password)        e.password = "Password is required";
    else if (password.length < 8) e.password = "Minimum 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login({ email: email.trim().toLowerCase(), password });
      signIn(user);
    } catch (err) {
      Alert.alert("Login failed", err.message || "Please check your credentials.");
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
            <Text style={styles.brand}>Dodago</Text>
            <Text style={styles.brandSub}>Restaurant Partner</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to manage your restaurant</Text>

            <View style={styles.form}>
              <InputField
                label="Email"
                placeholder="you@email.com"
                value={email}
                onChangeText={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: "" })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
              />

              <View style={styles.pwdWrap}>
                <InputField
                  label="Password"
                  placeholder="Your password"
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: "" })); }}
                  secureTextEntry={!showPwd}
                  autoComplete="password"
                  error={errors.password}
                  style={styles.flex}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPwd((p) => !p)}
                >
                  {showPwd
                    ? <EyeOff size={20} color={colors.muted} />
                    : <Eye    size={20} color={colors.muted} />
                  }
                </TouchableOpacity>
              </View>

              <TextButton
                title="Forgot password?"
                onPress={() => navigation.navigate("ForgotPassword")}
                style={styles.forgotBtn}
              />

              <PrimaryButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={styles.submitBtn}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TextButton title="Sign up" onPress={() => navigation.navigate("Signup")} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  flex:        { flex: 1 },
  scroll:      { flexGrow: 1, padding: 24, paddingTop: 16, justifyContent: "center" },

  logoWrap:    { alignItems: "center", marginBottom: 28 },
  logo:        { width: 72, height: 72, borderRadius: 18 },
  brand:       { color: colors.primaryDark, fontSize: 26, fontWeight: "900", marginTop: 10 },
  brandSub:    { color: colors.muted, fontSize: 13, fontWeight: "700", marginTop: 2 },

  card: {
    backgroundColor: colors.card,
    borderRadius: 26,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title:       { fontSize: 24, fontWeight: "900", color: colors.ink, marginBottom: 4 },
  subtitle:    { fontSize: 14, color: colors.muted, fontWeight: "700", marginBottom: 22 },

  form:        { gap: 16 },
  pwdWrap:     { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  eyeBtn:      { width: 52, height: 52, borderRadius: 14, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", marginBottom: 0 },
  forgotBtn:   { alignSelf: "flex-end", marginTop: -6 },
  submitBtn:   { marginTop: 4 },

  footer:      { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  footerText:  { color: colors.muted, fontSize: 14, fontWeight: "700" },
});
