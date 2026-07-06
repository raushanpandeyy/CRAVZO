import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { ChevronLeft, ShieldCheck } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { verifyOtp, resendOtp } from "../../services/authService";
import { storage } from "../../services/storage";

export default function VerifyOtpScreen({ navigation, route }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputs = useRef([]);

  const handleChange = (val, index) => {
    const digit = val.replace(/[^0-9]/g, "");
    if (digit.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    const email = storage.getString("otpEmail");
    if (!email) { Alert.alert("Error", "Email not found"); return; }
    setIsResending(true);
    try {
      await resendOtp({ email });
      Alert.alert("OTP Sent", "A new OTP has been sent to your email");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    const email = storage.getString("otpEmail");
    const role = storage.getString("otpRole") || "CUSTOMER";
    if (!email) { Alert.alert("Error", "Email not found"); return; }

    setIsSubmitting(true);
    try {
      await verifyOtp({ email, otp: otp.join(""), role });
      const accountType = role.toLowerCase();
      if (accountType === "vendor") navigation.replace("VendorTabs");
      else if (accountType === "rider") navigation.replace("RiderTabs");
      else navigation.replace("MainTabs");
    } catch (err) {
      Alert.alert("Error", err.message || "Invalid OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-16 px-4 pb-4">
        <TouchableOpacity onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <ChevronLeft size={20} color={colors.slate[900]} />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 px-6">
        <View className="items-center mb-8">
          <View className="h-16 w-16 rounded-2xl bg-indigo-50 items-center justify-center mb-4">
            <ShieldCheck size={32} color={colors.brand[600]} />
          </View>
          <Text className="text-2xl font-extrabold text-slate-900">Verify OTP</Text>
          <Text className="text-sm text-slate-500 mt-2 text-center">
            Enter the 6-digit code sent to your email
          </Text>
        </View>

        <View className="flex-row justify-center gap-3 mb-8">
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => (inputs.current[i] = ref)}
              className="h-14 w-12 rounded-xl bg-slate-50 border-2 border-slate-200 text-center text-xl font-extrabold text-slate-900"
              keyboardType="numeric"
              maxLength={1}
              value={digit}
              onChangeText={(v) => handleChange(v, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleVerify} disabled={isSubmitting || otp.join("").length !== 6}
          className="rounded-2xl bg-indigo-600 py-4 items-center shadow-lg shadow-indigo-200">
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-extrabold text-white text-base">Verify OTP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={isResending} className="mt-6 items-center">
          <Text className="text-sm text-indigo-600 font-bold">{isResending ? "Sending..." : "Resend OTP"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
