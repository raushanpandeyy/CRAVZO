import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shield, Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "../context/AuthContext.js";
import { COLORS } from "../constants/config.js";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password)
      return setError("Email and password are required");

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryDark }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Title */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 20,
              backgroundColor: COLORS.primary,
              alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <Shield size={36} color="#fff" />
            </View>
            <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 }}>
              Dodago Admin
            </Text>
            <Text style={{ color: "#a5b4fc", fontSize: 14, fontWeight: "700", marginTop: 4 }}>
              Operations Dashboard
            </Text>
          </View>

          {/* Card */}
          <View style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: 24,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 8,
          }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: COLORS.ink, marginBottom: 4 }}>
              Sign in
            </Text>
            <Text style={{ color: COLORS.muted, fontWeight: "700", fontSize: 13, marginBottom: 24 }}>
              Admin access only
            </Text>

            {error ? (
              <View style={{
                backgroundColor: "#fef2f2", borderRadius: 12, padding: 12,
                marginBottom: 16, borderWidth: 1, borderColor: "#fecaca",
              }}>
                <Text style={{ color: "#dc2626", fontWeight: "800", fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <Text style={{ fontSize: 12, fontWeight: "900", color: COLORS.muted, marginBottom: 6 }}>
              EMAIL
            </Text>
            <TextInput
              value={email}
              onChangeText={(v) => { setEmail(v); setError(""); }}
              placeholder="admin@dodago.shop"
              placeholderTextColor={COLORS.subtle}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                borderWidth: 1.5, borderColor: COLORS.line,
                borderRadius: 14, paddingHorizontal: 16, height: 52,
                fontSize: 15, fontWeight: "700", color: COLORS.ink,
                backgroundColor: "#f8fafc", marginBottom: 16,
              }}
            />

            {/* Password */}
            <Text style={{ fontSize: 12, fontWeight: "900", color: COLORS.muted, marginBottom: 6 }}>
              PASSWORD
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
              <TextInput
                value={password}
                onChangeText={(v) => { setPassword(v); setError(""); }}
                placeholder="••••••••"
                placeholderTextColor={COLORS.subtle}
                secureTextEntry={!showPwd}
                style={{
                  flex: 1, borderWidth: 1.5, borderColor: COLORS.line,
                  borderRadius: 14, paddingHorizontal: 16, height: 52,
                  fontSize: 15, fontWeight: "700", color: COLORS.ink,
                  backgroundColor: "#f8fafc",
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPwd((p) => !p)}
                style={{
                  position: "absolute", right: 16,
                  width: 24, height: 24, alignItems: "center", justifyContent: "center",
                }}
              >
                {showPwd
                  ? <EyeOff size={20} color={COLORS.muted} />
                  : <Eye    size={20} color={COLORS.muted} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{
                backgroundColor: loading ? COLORS.subtle : COLORS.primary,
                borderRadius: 14, height: 54,
                alignItems: "center", justifyContent: "center",
                flexDirection: "row", gap: 8,
              }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Sign In →</Text>
              }
            </TouchableOpacity>
          </View>

          <Text style={{ color: "#6366f1", textAlign: "center", fontWeight: "700", marginTop: 24, fontSize: 12 }}>
            Dodago Admin · Restricted Access
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
