import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lock, Mail, User, X } from "lucide-react-native";

import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { colors } from "../constants/colors";
import { apiRequest } from "../services/api";
import { login as loginApi, normalizeUser, persistSession } from "../services/authService";
import { setUser } from "../store/slices/userSlice";

const CUSTOMER_ROLE = "CUSTOMER";
const passwordIsStrong = (value) =>
  value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);

const OtpInput = ({ otp, setOtp, inputRef }) => (
  <View style={styles.otpBlock}>
    <View style={styles.otpRow}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[styles.otpBox, otp[i] ? styles.otpBoxFilled : styles.otpBoxEmpty]}>
          <Text style={styles.otpDigit}>{otp[i] || ""}</Text>
        </View>
      ))}
    </View>
    <TextInput
      ref={inputRef}
      value={otp}
      onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, "").slice(0, 6))}
      keyboardType="number-pad"
      maxLength={6}
      style={styles.hiddenOtpInput}
      autoFocus
    />
  </View>
);

export default function PhoneSignupModal({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const modalBottomGap = Math.max(insets.bottom + 16, 28);
  const dispatch = useDispatch();
  const [mode, setMode] = useState("signup");
  const [step, setStep] = useState("auth");
  const [authMethod, setAuthMethod] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setMode("signup");
      setStep("auth");
      setPhone("");
      setEmail("");
      setName("");
      setPassword("");
      setOtp("");
      setAuthMethod("phone");
    }
  }, [visible]);

  const closeModal = useCallback(() => {
    if (!loading) onClose?.();
  }, [loading, onClose]);

  const handleSendOtp = useCallback(async () => {
    if (authMethod === "phone") {
      const cleaned = phone.replace(/[^0-9]/g, "");
      if (cleaned.length < 10) {
        Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
        return;
      }

      setLoading(true);
      try {
        await apiRequest(API_ENDPOINTS.auth.phoneSignup, {
          method: "POST",
          data: { phone: cleaned, role: CUSTOMER_ROLE },
        });
        setStep("otp");
        setTimeout(() => otpInputRef.current?.focus(), 300);
      } catch (err) {
        Alert.alert("Error", err.response?.data?.message || err.message || "Failed to send OTP");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email");
      return;
    }
    if (!passwordIsStrong(password)) {
      Alert.alert("Weak Password", "Password must be 8+ chars with uppercase, lowercase, number & special character");
      return;
    }

    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.auth.signup, {
        method: "POST",
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: CUSTOMER_ROLE,
        },
      });
      setStep("otp");
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }, [authMethod, email, name, password, phone]);

  const handleLogin = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email");
      return;
    }
    if (!password) {
      Alert.alert("Password Required", "Please enter your password");
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi({ email: email.trim().toLowerCase(), password });
      const data = res.data || res;
      const user = data.user || data;
      const normalized = normalizeUser(user);
      await persistSession({ user: normalized, token: data.token });
      dispatch(setUser(normalized));
      onClose?.();
    } catch (err) {
      Alert.alert("Login Failed", err.response?.data?.message || err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }, [dispatch, email, onClose, password]);

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      const res =
        authMethod === "phone"
          ? await apiRequest(API_ENDPOINTS.auth.verifyPhoneOtp, {
              method: "POST",
              data: { phone: phone.replace(/[^0-9]/g, ""), otp, role: CUSTOMER_ROLE },
            })
          : await apiRequest(API_ENDPOINTS.auth.verifyOtp, {
              method: "POST",
              data: { email: email.trim().toLowerCase(), otp, role: CUSTOMER_ROLE },
            });
      const data = res.data || res;
      const user = data.user || data;
      const normalized = normalizeUser(user);
      await persistSession({ user: normalized, token: data.token });
      dispatch(setUser(normalized));
      onClose?.();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }, [authMethod, dispatch, email, onClose, otp, phone]);

  const handleResendOtp = useCallback(async () => {
    setLoading(true);
    try {
      if (authMethod === "phone") {
        await apiRequest(API_ENDPOINTS.auth.phoneSignup, {
          method: "POST",
          data: { phone: phone.replace(/[^0-9]/g, ""), role: CUSTOMER_ROLE },
        });
      } else {
        await apiRequest(API_ENDPOINTS.auth.sendOtp, {
          method: "POST",
          data: { email: email.trim().toLowerCase(), role: CUSTOMER_ROLE },
        });
      }
      setOtp("");
      Alert.alert("OTP Sent", "A new OTP has been sent to you.");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  }, [authMethod, email, phone]);

  const isSignupDisabled =
    loading ||
    (authMethod === "phone"
      ? phone.replace(/[^0-9]/g, "").length < 10
      : !name.trim() || !email.trim() || !passwordIsStrong(password));

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={closeModal}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={closeModal} />
        <View pointerEvents="box-none" style={styles.sheetWrap}>
          <View style={[styles.sheet, { marginBottom: modalBottomGap }]}>
            <View style={styles.header}>
              {step === "otp" ? (
                <Text style={styles.title}>Verify OTP</Text>
              ) : (
                <View style={styles.tabs}>
                  <TouchableOpacity
                    onPress={() => {
                      setMode("signup");
                      setPassword("");
                    }}
                    style={[styles.tab, mode === "signup" && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, mode === "signup" && styles.tabTextActive]}>Sign Up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setMode("login");
                      setPassword("");
                    }}
                    style={[styles.tab, mode === "login" && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Log In</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity onPress={closeModal} style={styles.closeButton} disabled={loading}>
                <X size={20} color={colors.slate[500]} />
              </TouchableOpacity>
            </View>

            {step === "otp" ? (
              <>
                <Text style={styles.helperText}>Enter the 6-digit code sent to</Text>
                <Text style={styles.destinationText}>{authMethod === "phone" ? `+91 ${phone}` : email}</Text>
                <OtpInput otp={otp} setOtp={setOtp} inputRef={otpInputRef} />
                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  style={[styles.primaryButton, (loading || otp.length !== 6) && styles.disabledButton]}
                >
                  <Text style={styles.primaryButtonText}>{loading ? "Verifying..." : "Verify & Create Account"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleResendOtp} disabled={loading} style={styles.linkButton}>
                  <Text style={styles.linkText}>Resend OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep("auth")} disabled={loading} style={styles.smallLinkButton}>
                  <Text style={styles.mutedLinkText}>{authMethod === "phone" ? "Change phone number" : "Change email"}</Text>
                </TouchableOpacity>
              </>
            ) : mode === "login" ? (
              <>
                <Text style={styles.helperTextBlock}>Welcome back! Log in to your account.</Text>
                <View style={styles.inputGroup}>
                  <View style={styles.inputRow}>
                    <Mail size={20} color={colors.slate[500]} />
                    <TextInput
                      placeholder="Email address"
                      placeholderTextColor={colors.slate[500]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      style={styles.textInput}
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <Lock size={20} color={colors.slate[500]} />
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor={colors.slate[500]}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                      style={styles.textInput}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading || !email.trim() || !password}
                  style={[styles.primaryButton, (loading || !email.trim() || !password) && styles.disabledButton]}
                >
                  <Text style={styles.primaryButtonText}>{loading ? "Logging in..." : "Log In"}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.helperTextBlock}>
                  {authMethod === "phone" ? "Enter your phone number to get started." : "Enter your details to get started."}
                </Text>

                {authMethod === "phone" ? (
                  <View style={[styles.inputRow, styles.inputGroupSingle]}>
                    <Text style={styles.flagText}>{String.fromCodePoint(0x1f1ee, 0x1f1f3)}</Text>
                    <Text style={styles.countryCode}>+91</Text>
                    <View style={styles.divider} />
                    <TextInput
                      placeholder="Phone number"
                      placeholderTextColor={colors.slate[500]}
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={(value) => setPhone(value.replace(/[^0-9]/g, ""))}
                      style={[styles.textInput, styles.phoneInput]}
                    />
                  </View>
                ) : (
                  <View style={styles.inputGroup}>
                    <View style={styles.inputRow}>
                      <User size={20} color={colors.slate[500]} />
                      <TextInput
                        placeholder="Full name"
                        placeholderTextColor={colors.slate[500]}
                        value={name}
                        onChangeText={setName}
                        style={styles.textInput}
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Mail size={20} color={colors.slate[500]} />
                      <TextInput
                        placeholder="Email address"
                        placeholderTextColor={colors.slate[500]}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.textInput}
                      />
                    </View>
                    <View style={styles.inputRow}>
                      <Lock size={20} color={colors.slate[500]} />
                      <TextInput
                        placeholder="Password (min 8 characters)"
                        placeholderTextColor={colors.slate[500]}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        style={styles.textInput}
                      />
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={isSignupDisabled}
                  style={[styles.primaryButton, isSignupDisabled && styles.disabledButton]}
                >
                  <Text style={styles.primaryButtonText}>{loading ? "Sending OTP..." : "Send OTP"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setAuthMethod(authMethod === "phone" ? "email" : "phone");
                    setName("");
                    setEmail("");
                    setPassword("");
                    setPhone("");
                  }}
                  disabled={loading}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>{authMethod === "phone" ? "Use email instead" : "Use phone instead"}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.42)",
  },
  sheetWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  sheet: {
    alignSelf: "stretch",
    maxHeight: "88%",
    borderRadius: 28,
    backgroundColor: colors.bg.white,
    paddingHorizontal: 22,
    paddingBottom: 24,
    paddingTop: 22,
    elevation: 24,
    shadowColor: colors.text.black,
    shadowOpacity: 0.2,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
  },
  header: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.slate[900],
    fontSize: 20,
    fontWeight: "900",
  },
  tabs: {
    flexDirection: "row",
    gap: 4,
    borderRadius: 12,
    backgroundColor: colors.slate[100],
    padding: 4,
  },
  tab: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: colors.bg.white,
    elevation: 2,
    shadowColor: colors.text.black,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  tabText: {
    color: colors.slate[500],
    fontSize: 14,
    fontWeight: "800",
  },
  tabTextActive: {
    color: colors.brand.dark,
  },
  closeButton: {
    borderRadius: 999,
    backgroundColor: colors.slate[100],
    padding: 8,
  },
  helperText: {
    color: colors.slate[500],
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  helperTextBlock: {
    color: colors.slate[500],
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  destinationText: {
    color: colors.slate[900],
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 24,
  },
  inputGroup: {
    gap: 12,
    marginBottom: 16,
  },
  inputGroupSingle: {
    marginBottom: 16,
  },
  inputRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.brand[100],
    borderRadius: 16,
    backgroundColor: colors.slate[50],
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    marginLeft: 12,
    flex: 1,
    color: colors.slate[900],
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 4,
  },
  phoneInput: {
    color: colors.brand[600],
  },
  flagText: {
    marginRight: 8,
    fontSize: 20,
  },
  countryCode: {
    marginRight: 8,
    color: colors.brand[600],
    fontWeight: "700",
  },
  divider: {
    height: 24,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.slate[200],
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: colors.brand.dark,
    paddingHorizontal: 24,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: colors.brand.dark,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.bg.white,
    fontSize: 14,
    fontWeight: "800",
  },
  linkButton: {
    alignItems: "center",
    marginTop: 16,
  },
  smallLinkButton: {
    alignItems: "center",
    marginTop: 8,
  },
  linkText: {
    color: colors.brand[600],
    fontSize: 14,
    fontWeight: "700",
  },
  mutedLinkText: {
    color: colors.slate[500],
    fontSize: 14,
    fontWeight: "700",
  },
  otpBlock: {
    marginBottom: 24,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  otpBox: {
    height: 56,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
  },
  otpBoxEmpty: {
    borderColor: colors.brand[100],
    backgroundColor: colors.slate[50],
  },
  otpBoxFilled: {
    borderColor: colors.brand.dark,
    backgroundColor: colors.brand[50],
  },
  otpDigit: {
    color: colors.slate[900],
    fontSize: 20,
    fontWeight: "900",
  },
  hiddenOtpInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
});
