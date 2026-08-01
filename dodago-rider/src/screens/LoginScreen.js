import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { Bike } from "../components/Icons";
import { Screen, Card, PrimaryButton } from "../components/Primitives";
import { colors } from "../constants/colors";
import { useAuth } from "../services/AuthContext";

export default function LoginScreen() {
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
        <View style={styles.brand}>
          <View style={styles.logo}><Bike color="#fff" size={34} /></View>
          <Text style={styles.title}>Dodago Rider</Text>
          <Text style={styles.subtitle}>Go online, accept orders, and complete deliveries.</Text>
        </View>
        <Card style={styles.card}>
          <Text style={styles.label}>Email or phone</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="rider@example.com" style={styles.input} />
          <Text style={styles.label}>Password</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" style={styles.input} />
          <PrimaryButton title="Sign in" onPress={handleLogin} loading={loading} style={styles.button} />
          <Text style={styles.help}>Only rider accounts can use this app.</Text>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "center", padding: 20 },
  wrap: { gap: 24 },
  brand: { alignItems: "center" },
  logo: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  title: { marginTop: 16, fontSize: 30, fontWeight: "900", color: colors.ink },
  subtitle: { marginTop: 8, color: colors.muted, textAlign: "center", fontSize: 15, lineHeight: 22 },
  card: { gap: 10 },
  label: { fontWeight: "800", color: colors.ink, marginTop: 4 },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 14, fontSize: 16, backgroundColor: "#fff" },
  button: { marginTop: 10 },
  help: { textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 4 },
});

