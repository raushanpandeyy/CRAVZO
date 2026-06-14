import React, { useState, useRef, useCallback } from "react";
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
import { Lock, Mail, User, Phone, ShieldCheck } from "lucide-react-native";
import { cravzologo } from "../../constants/images";
import { colors } from "../../constants/colors";

const emptyOtp = ["", "", "", "", "", ""];

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
      if (otp[index] === "") {
        if (index > 0) refs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  return (
    <View className="flex-row justify-center gap-2">
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          value={digit}
          maxLength={1}
          keyboardType="number-pad"
          className="h-11 w-11 rounded-2xl border-2 border-indigo-200 bg-slate-50 text-center text-lg font-bold text-indigo-950"
          onChangeText={(t) => handleChange(t, index)}
          onKeyPress={(e) => handleKeyDown(e, index)}
          ref={(el) => (refs.current[index] = el)}
        />
      ))}
    </View>
  );
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(emptyOtp);
  const [showOtp, setShowOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const title = isForgotPassword
    ? "Reset Password"
    : isSignup
    ? "Create Customer Account"
    : "Welcome Back";
  const subtitle = isForgotPassword
    ? "Enter your email and set a fresh password securely."
    : isSignup
    ? "Sign up to order faster, save addresses, and track deliveries."
    : "Login to continue ordering your favourite food.";

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
                <Image
                  source={{ uri: cravzologo }}
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
              {!isForgotPassword && message ? (
                <View className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                  <Text className="text-center text-sm font-semibold text-indigo-800">
                    {message}
                  </Text>
                </View>
              ) : null}

              {isForgotPassword ? null : (
                <View className="space-y-4">
                  {isSignup ? (
                    <>
                      <AuthInput
                        icon={User}
                        placeholder="Name"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                      />
                      <AuthInput
                        icon={Phone}
                        placeholder="Phone"
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
                  <Text className="-mt-2 text-xs text-slate-400">
                    At least 8 characters
                  </Text>

                  {showOtp ? (
                    <>
                      <OtpInput otp={otp} setOtp={setOtp} />
                      <TouchableOpacity
                        disabled={isSubmitting}
                        className="flex-row w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5"
                      >
                        <ShieldCheck size={20} color="#fff" />
                        <Text className="font-bold text-white">Verify OTP</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={isSubmitting}
                        className="w-full rounded-2xl border border-indigo-200 py-3"
                      >
                        <Text className="text-center font-bold text-indigo-800">
                          Resend OTP
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : null}

                  <TouchableOpacity
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-indigo-950 py-3.5 shadow-lg shadow-indigo-950/20"
                  >
                    <Text className="text-center font-extrabold text-white">
                      {isSubmitting
                        ? "Please wait..."
                        : isSignup
                        ? "Create Account"
                        : "Login"}
                    </Text>
                  </TouchableOpacity>

                  {!isSignup ? (
                    <TouchableOpacity
                      onPress={() => {
                        setIsForgotPassword(true);
                        setMessage("");
                      }}
                      className="w-full"
                    >
                      <Text className="text-center text-sm font-bold text-indigo-700">
                        Forgot password?
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              <TouchableOpacity
                onPress={() => {
                  setIsSignup((c) => !c);
                  setIsForgotPassword(false);
                  setMessage("");
                  setShowOtp(false);
                  setOtp(emptyOtp);
                }}
                className="w-full rounded-2xl bg-slate-100 px-4 py-3"
              >
                <Text className="text-center text-sm font-extrabold text-indigo-950">
                  {isSignup
                    ? "Already have an account? Login"
                    : "New user? Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
