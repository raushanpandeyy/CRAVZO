import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { dodagologo } from "../../constants/images";
import OptimizedImage from "../../components/OptimizedImage";

const emptyOtp = ["", "", "", "", "", ""];

const OtpInput = ({ otp, setOtp }) => {
  const refs = useRef([]);
  const handleChange = (text, index) => {
    const digit = text.replace(/\D/g, "");
    if (digit.length > 1) {
      const arr = digit.slice(0, 6).split("");
      setOtp(arr.map((d) => d).concat(Array(6 - arr.length).fill("")).slice(0, 6));
      refs.current[Math.min(arr.length - 1, 5)]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };
  const handleKeyDown = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      if (otp[index] === "") { if (index > 0) refs.current[index - 1]?.focus(); }
      else { const n = [...otp]; n[index] = ""; setOtp(n); }
    }
  };
  return (
    <View className="flex-row justify-center gap-2">
      {otp.map((digit, index) => (
        <TextInput key={index} value={digit} maxLength={1} keyboardType="number-pad"
          className="h-11 w-11 rounded-2xl border-2 border-indigo-200 bg-slate-50 text-center text-lg font-bold text-indigo-950"
          onChangeText={(t) => handleChange(t, index)} onKeyPress={(e) => handleKeyDown(e, index)}
          ref={(el) => (refs.current[index] = el)} />
      ))}
    </View>
  );
};

export default function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(emptyOtp);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView className="flex-1 bg-[#F4F7FB]" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-24">
          <View className="w-full overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-indigo-950/10">
            <View className="bg-indigo-950 px-6 pb-8 pt-7">
              <View className="mb-5 flex-row items-center justify-between">
                <OptimizedImage source={{ uri: dodagologo }} className="h-12 w-12 rounded-2xl" resizeMode="cover" />
                <View className="rounded-full bg-white/10 px-3 py-1">
                  <Text className="text-xs font-bold uppercase tracking-wide text-white">Customer</Text>
                </View>
              </View>
              <Text className="text-3xl font-extrabold leading-tight text-white">Reset Password</Text>
              <Text className="mt-2 text-sm font-medium leading-6 text-indigo-100">Enter your email and set a fresh password securely.</Text>
            </View>
            <View className="space-y-5 p-5">
              {message ? <View className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <Text className="text-center text-sm font-semibold text-indigo-800">{message}</Text>
              </View> : null}
              <View className="space-y-4">
                <View className="relative">
                  <TextInput placeholder="Email" value={email} onChangeText={setEmail}
                    keyboardType="email-address" autoCapitalize="none" editable={!otpSent}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950"
                    placeholderTextColor="#94a3b8" />
                </View>
                {otpSent ? (
                  <>
                    <OtpInput otp={otp} setOtp={setOtp} />
                    <TextInput placeholder="New Password" value={password} onChangeText={setPassword} secureTextEntry
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950"
                      placeholderTextColor="#94a3b8" />
                    <TextInput placeholder="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950"
                      placeholderTextColor="#94a3b8" />
                  </>
                ) : null}
                <TouchableOpacity disabled={isSubmitting}
                  className="w-full rounded-2xl bg-indigo-600 py-3 shadow-lg shadow-indigo-950/20">
                  <Text className="text-center font-bold text-white">
                    {isSubmitting ? "Please wait..." : otpSent ? "Reset Password" : "Send Reset OTP"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onBack}
                  className="w-full rounded-2xl border border-slate-300 py-3">
                  <Text className="text-center font-bold text-slate-700">Back to Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
