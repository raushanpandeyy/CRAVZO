import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Bike } from "../components/Icons";
import { Screen, Card, PrimaryButton } from "../components/Primitives";
import { colors } from "../constants/colors";
import { useAuth } from "../services/AuthContext";

const logo = require("../../assets/dodagologo.png");

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing details", "Email/phone and password enter karo.");
      return;
    }
    try {
      setLoading(true);
      await login({ email: email.trim(), password });
    } catch (error) {
      Alert.alert("Login failed", error.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
        <View style={styles.hero}>
          <Image source={logo} style={styles.logoImage} />
          <View style={styles.logo}><Bike color="#fff" size={32} /></View>
          <Text style={styles.kicker}>Rider Partner</Text>
          <Text style={styles.title}>Dodago Rider</Text>
          <Text style={styles.subtitle}>Access deliveries, earnings, chat, and your profile.</Text>
        </View>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Rider Login</Text>
          <Text style={styles.label}>Email or phone</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="rider@example.com" placeholderTextColor="#94a3b8" style={styles.input} />
          <Text style={styles.label}>Password</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor="#94a3b8" style={styles.input} />
          <PrimaryButton title="Login" onPress={handleLogin} loading={loading} style={styles.button} />
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate("Signup")} style={styles.signupLink}>
            <Text style={styles.signupText}>Need a new rider account? Sign up</Text>
          </TouchableOpacity>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "center", padding: 16 },
  wrap: { gap: 16 },
  hero: { minHeight: 230, borderRadius: 28, backgroundColor: colors.primary, padding: 22, justifyContent: "flex-end", overflow: "hidden" },
  logoImage: { position: "absolute", top: 18, left: 18, width: 48, height: 48, borderRadius: 15 },
  logo: { position: "absolute", top: 18, right: 18, width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" },
  kicker: { color: "#ddd6fe", fontWeight: "900", fontSize: 12, textTransform: "uppercase" },
  title: { marginTop: 8, fontSize: 32, fontWeight: "900", color: "#fff" },
  subtitle: { marginTop: 8, color: "#eef2ff", fontSize: 15, lineHeight: 22, fontWeight: "700" },
  card: { gap: 10 },
  cardTitle: { color: colors.ink, fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 4 },
  label: { fontWeight: "900", color: colors.ink, marginTop: 4 },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 14, fontSize: 16, backgroundColor: "#f8fafc", color: colors.ink, fontWeight: "700" },
  button: { marginTop: 10 },
  signupLink: { alignItems: "center", paddingVertical: 8 },
  signupText: { color: colors.primaryDark, fontWeight: "900" },
});
