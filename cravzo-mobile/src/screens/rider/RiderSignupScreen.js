import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { ChevronLeft, Bike, User, Phone, Mail, ShieldCheck, MapPin } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { signup } from "../../services/authService";
import { storage } from "../../services/storage";

const STEPS = ["Personal Info", "Vehicle Details", "Verification"];

export default function RiderSignupScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    vehicleType: "Bike", vehicleNumber: "",
  });

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSignup = async () => {
    setSubmitting(true);
    try {
      await signup({
        name: form.name, email: form.email, phone: form.phone, password: form.password,
        role: "RIDER",
        vehicleType: form.vehicleType,
        vehicleNumber: form.vehicleNumber,
      });
      storage.set("otpEmail", form.email);
      storage.set("otpRole", "RIDER");
      navigation.navigate("VerifyOtp");
    } catch (err) {
      Alert.alert("Error", err.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View className="space-y-4">
            <Text className="text-lg font-extrabold text-slate-900">Personal Information</Text>
            {[
              { key: "name", label: "Full Name", icon: User, placeholder: "Your name" },
              { key: "email", label: "Email", icon: Mail, placeholder: "email@example.com", keyboard: "email-address" },
              { key: "phone", label: "Phone", icon: Phone, placeholder: "+91 9876543210", keyboard: "phone-pad" },
              { key: "password", label: "Password", icon: ShieldCheck, placeholder: "Min 6 characters", secure: true },
            ].map(({ key, label, icon: Icon, placeholder, keyboard, secure }) => (
              <View key={key}>
                <Text className="text-xs font-bold text-slate-700 mb-1">{label}</Text>
                <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4">
                  <Icon size={16} color={colors.slate[400]} />
                  <TextInput className="flex-1 ml-2 py-3 text-sm" placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    value={form[key]} onChangeText={(v) => update(key, v)}
                    keyboardType={keyboard || "default"} secureTextEntry={secure} />
                </View>
              </View>
            ))}
          </View>
        );
      case 1:
        return (
          <View className="space-y-4">
            <Text className="text-lg font-extrabold text-slate-900">Vehicle Details</Text>
            <View>
              <Text className="text-xs font-bold text-slate-700 mb-2">Vehicle Type</Text>
              <View className="flex-row gap-3">
                {["Bike", "Scooter", "Cycle"].map((type) => (
                  <TouchableOpacity key={type} onPress={() => update("vehicleType", type)}
                    className={`flex-1 py-3 rounded-xl items-center border-2 ${form.vehicleType === type ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-slate-50"}`}>
                    <Bike size={20} color={form.vehicleType === type ? colors.brand[600] : colors.slate[500]} />
                    <Text className={`text-xs font-bold mt-1 ${form.vehicleType === type ? "text-indigo-600" : "text-slate-500"}`}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {["vehicleNumber"].map((key) => (
              <View key={key}>
                <Text className="text-xs font-bold text-slate-700 mb-1">Vehicle Number</Text>
                <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4">
                  <MapPin size={16} color={colors.slate[400]} />
                  <TextInput className="flex-1 ml-2 py-3 text-sm" placeholder="e.g. DL-01-AB-1234"
                    placeholderTextColor="#94a3b8"
                    value={form[key]} onChangeText={(v) => update(key, v)}
                    autoCapitalize="characters" />
                </View>
              </View>
            ))}
          </View>
        );
      case 2:
        return (
          <View className="items-center py-8">
            <ShieldCheck size={64} color={colors.brand[600]} />
            <Text className="text-xl font-extrabold text-slate-900 mt-4">Almost Done!</Text>
            <Text className="text-sm text-slate-500 text-center mt-2 px-4">
              Review your details. You'll receive an OTP to verify your email.
            </Text>
            <View className="w-full bg-slate-50 rounded-2xl p-4 mt-6 space-y-2">
              <Text className="text-sm"><Text className="font-bold">Name:</Text> {form.name}</Text>
              <Text className="text-sm"><Text className="font-bold">Email:</Text> {form.email}</Text>
              <Text className="text-sm"><Text className="font-bold">Vehicle:</Text> {form.vehicleType} ({form.vehicleNumber})</Text>
            </View>
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="pt-16 px-4 pb-4 border-b border-slate-100">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => step === 0 ? navigation.goBack() : setStep(step - 1)}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-extrabold text-slate-900">Rider Signup</Text>
            <Text className="text-xs text-slate-500">Step {step + 1} of {STEPS.length}</Text>
          </View>
        </View>
        <View className="flex-row gap-2 mt-4">
          {STEPS.map((_, i) => (
            <View key={i} className={`flex-1 h-1 rounded-full ${i <= step ? "bg-indigo-600" : "bg-slate-200"}`} />
          ))}
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">{renderStep()}</ScrollView>
      <View className="px-4 pb-8 pt-2">
        <TouchableOpacity onPress={step === 2 ? handleSignup : () => setStep(step + 1)} disabled={submitting}
          className="rounded-2xl bg-indigo-600 py-4 items-center">
          <Text className="font-extrabold text-white">
            {submitting ? "Submitting..." : step === 2 ? "Submit & Verify OTP" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
