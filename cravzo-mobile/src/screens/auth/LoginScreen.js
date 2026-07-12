import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useDispatch } from "react-redux";
import { Lock, Mail, User, Phone, X } from "lucide-react-native";
import { dodagologo } from "../../constants/images";
import OptimizedImage from "../../components/OptimizedImage";
import { colors } from "../../constants/colors";
import { login, signup, requestPasswordReset, resetPassword } from "../../services/authService";
import { setUser } from "../../store/slices/userSlice";
import { storage } from "../../services/storage";

const AuthInput = ({ icon: Icon, ...props }) => (
  <View className="relative">
    {Icon ? (
      <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
        <Icon size={20} color="#94a3b8" />
      </View>
    ) : null}
    <TextInput
      {...props}
      placeholderTextColor="#94a3b8"
      className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-950 ${
        Icon ? "pl-12" : ""
      }`}
    />
  </View>
);

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtpSent, setFpOtpSent] = useState(false);
  const [fpOtp, setFpOtp] = useState(["", "", "", "", "", ""]);
  const [fpPassword, setFpPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpMessage, setFpMessage] = useState("");
  const [fpSubmitting, setFpSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Please enter email and password.");
      return;
    }
    setIsSubmitting(true);
    setMessage("");
    try {
      const data = await login({ email, password });
      dispatch(setUser(data.user || data));
    } catch (e) {
      setMessage(e.response?.data?.message || e.message || "Login failed. Check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setMessage("Please fill in name, email and password.");
      return;
    }
    setIsSubmitting(true);
    setMessage("");
    try {
      await signup({ name, email, password, phone, role: "CUSTOMER" });
      storage.set("otpEmail", email.trim().toLowerCase());
      storage.set("otpRole", "CUSTOMER");
      navigation.navigate("VerifyOtp");
    } catch (e) {
      setMessage(e.response?.data?.message || "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isSignup ? "Create Account" : "Welcome Back";
  const subtitle = isSignup
    ? "Sign up to start ordering your favourite food."
    : "Login to continue ordering your favourite food.";

  if (isSubmitting) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F4F7FB]">
        <ActivityIndicator size="large" color={colors.brand[600]} />
        <Text className="mt-4 text-sm text-slate-500">Please wait...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView className="flex-1 bg-[#F4F7FB]" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-24">
          <View className="w-full overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-indigo-950/10">
            <View className="bg-indigo-950 px-6 pb-8 pt-7">
              <View className="mb-5 flex-row items-center justify-between">
                <OptimizedImage
                  source={{ uri: dodagologo }}
                  className="h-12 w-12 rounded-2xl"
                  resizeMode="cover"
                />
                <View className="rounded-full bg-white/10 px-3 py-1">
                  <Text className="text-xs font-bold uppercase tracking-wide text-white">
                    Customer
                  </Text>
                </View>
              </View>
              <Text className="text-3xl font-extrabold leading-tight text-white">
                {title}
              </Text>
              <Text className="mt-2 text-sm font-medium leading-6 text-indigo-100">
                {subtitle}
              </Text>
            </View>

            <View className="space-y-5 p-5">
              {message ? (
                <View className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                  <Text className="text-center text-sm font-semibold text-indigo-800">
                    {message}
                  </Text>
                </View>
              ) : null}

              <View className="space-y-4">
                {isSignup ? (
                  <>
                    <AuthInput
                      icon={User}
                      placeholder="Full Name"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                    <AuthInput
                      icon={Phone}
                      placeholder="Phone (optional)"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </>
                ) : null}

                <AuthInput
                  icon={Mail}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <AuthInput
                  icon={Lock}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                {!isSignup ? (
                  <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
                    <Text className="text-xs font-bold text-indigo-600 text-right">Forgot Password?</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  onPress={isSignup ? handleSignup : handleLogin}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-indigo-950 py-3.5 shadow-lg shadow-indigo-950/20"
                >
                  <Text className="text-center font-extrabold text-white">
                    {isSignup ? "Create Account" : "Login"}
                  </Text>
                </TouchableOpacity>

                <Text className="text-center text-xs text-slate-400">
                  By continuing, you agree to our Terms & Privacy Policy
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setIsSignup((c) => !c);
                  setMessage("");
                }}
                className="w-full rounded-2xl bg-slate-100 px-4 py-3"
              >
                <Text className="text-center text-sm font-extrabold text-indigo-950">
                  {isSignup
                    ? "Already have an account? Login"
                    : "New user? Create Account"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showForgotPassword} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-extrabold text-slate-900">Reset Password</Text>
              <TouchableOpacity onPress={() => { setShowForgotPassword(false); setFpOtpSent(false); setFpOtp(["", "", "", "", "", ""]); setFpMessage(""); }}>
                <X size={24} color={colors.slate[500]} />
              </TouchableOpacity>
            </View>
            {fpMessage ? (
              <View className="bg-indigo-50 rounded-2xl px-4 py-3 mb-4">
                <Text className="text-sm text-indigo-700">{fpMessage}</Text>
              </View>
            ) : null}
            {!fpOtpSent ? (
              <View className="gap-4">
                <AuthInput icon={Mail} placeholder="Email" value={fpEmail} onChangeText={setFpEmail} keyboardType="email-address" autoCapitalize="none" />
                <TouchableOpacity onPress={async () => {
                  if (!fpEmail) { setFpMessage("Please enter your email"); return; }
                  setFpSubmitting(true); setFpMessage("");
                  try {
                    await requestPasswordReset({ email: fpEmail, role: "CUSTOMER" });
                    setFpOtpSent(true);
                    setFpMessage("Password reset OTP sent to your email.");
                  } catch (err) { setFpMessage(err.message || "Failed to send OTP"); }
                  finally { setFpSubmitting(false); }
                }} disabled={fpSubmitting}
                  className="rounded-2xl bg-indigo-600 py-3.5 items-center disabled:opacity-60">
                  <Text className="font-extrabold text-white">{fpSubmitting ? "Sending..." : "Send Reset OTP"}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-4">
                <Text className="text-xs font-bold text-slate-700">OTP</Text>
                <View className="flex-row gap-2">
                  {fpOtp.map((digit, i) => (
                    <TextInput key={i} value={digit} maxLength={1} keyboardType="number-pad"
                      className="flex-1 h-12 rounded-xl bg-slate-50 border border-slate-200 text-center text-lg font-extrabold"
                      onChangeText={(v) => {
                        const newOtp = [...fpOtp];
                        newOtp[i] = v.replace(/\D/g, "").slice(0, 1);
                        setFpOtp(newOtp);
                      }} />
                  ))}
                </View>
                <AuthInput icon={Lock} placeholder="New Password" value={fpPassword} onChangeText={setFpPassword} secureTextEntry />
                <AuthInput icon={Lock} placeholder="Confirm Password" value={fpConfirmPassword} onChangeText={setFpConfirmPassword} secureTextEntry />
                <TouchableOpacity onPress={async () => {
                  if (fpPassword !== fpConfirmPassword) { setFpMessage("Passwords do not match"); return; }
                  if (fpPassword.length < 6) { setFpMessage("Password must be at least 6 characters"); return; }
                  const otpStr = fpOtp.join("");
                  if (otpStr.length < 6) { setFpMessage("Please enter the complete OTP"); return; }
                  setFpSubmitting(true); setFpMessage("");
                  try {
                    await resetPassword({ email: fpEmail, otp: otpStr, password: fpPassword, role: "CUSTOMER" });
                    setFpMessage("Password reset successfully!");
                    setTimeout(() => { setShowForgotPassword(false); setFpOtpSent(false); setFpOtp(["", "", "", "", "", ""]); setFpPassword(""); setFpConfirmPassword(""); }, 2000);
                  } catch (err) { setFpMessage(err.message || "Failed to reset password"); }
                  finally { setFpSubmitting(false); }
                }} disabled={fpSubmitting}
                  className="rounded-2xl bg-indigo-600 py-3.5 items-center disabled:opacity-60">
                  <Text className="font-extrabold text-white">{fpSubmitting ? "Resetting..." : "Reset Password"}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}


