import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { ChevronLeft, Wallet, CreditCard, Smartphone, CheckCircle, Plus, X } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getProfile, updateProfile } from "../../services/userService";

const paymentOptions = [
  { id: "COD", name: "Cash on Delivery", description: "Pay when your order arrives", icon: Wallet, color: "#059669", bg: "bg-emerald-50" },
  { id: "UPI", name: "UPI", description: "Google Pay, PhonePe, Paytm", icon: Smartphone, color: "#8b5cf6", bg: "bg-violet-50" },
  { id: "CARD", name: "Credit / Debit Card", description: "Visa, Mastercard, Rupay", icon: CreditCard, color: "#6366f1", bg: "bg-indigo-50" },
];

const normalizeUpi = (value) => String(value || "").trim().toLowerCase();
const getPaymentMethods = (profile) => profile?.paymentMethods || {};
const getUpiIds = (profile) => Array.isArray(profile?.paymentMethods?.upiIds) ? profile.paymentMethods.upiIds : [];

export default function PaymentMethodsScreen({ navigation }) {
  const [selected, setSelected] = useState("COD");
  const [upiIds, setUpiIds] = useState([]);
  const [newUpi, setNewUpi] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        const paymentMethods = getPaymentMethods(profile);
        setUpiIds(getUpiIds(profile));
        setSelected(paymentMethods.preferredMethod || "COD");
      } catch (err) {
        setError(err.message || "Could not load payment methods");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const savePaymentMethods = async (nextPaymentMethods, successMessage = "Payment preferences saved") => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateProfile({ paymentMethods: nextPaymentMethods });
      const savedMethods = getPaymentMethods(updated);
      setUpiIds(getUpiIds(updated).length ? getUpiIds(updated) : nextPaymentMethods.upiIds || []);
      setSelected(savedMethods.preferredMethod || nextPaymentMethods.preferredMethod || "COD");
      setMessage(successMessage);
    } catch (err) {
      setError(err.message || "Failed to save payment preferences");
    } finally {
      setSaving(false);
    }
  };

  const savePreferredMethod = async (method) => {
    setSelected(method);
    await savePaymentMethods({ upiIds, preferredMethod: method });
  };

  const saveUpiIds = async (nextUpiIds) => {
    await savePaymentMethods({ upiIds: nextUpiIds, preferredMethod: selected }, "UPI details saved");
  };

  const addUpi = async () => {
    const value = normalizeUpi(newUpi);
    if (!value || !value.includes("@")) {
      setError("Enter a valid UPI ID");
      return;
    }
    if (upiIds.includes(value)) {
      setNewUpi("");
      return;
    }
    await saveUpiIds([value, ...upiIds]);
    setNewUpi("");
  };

  const removeUpi = async (value) => {
    await saveUpiIds(upiIds.filter((id) => id !== value));
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"><ChevronLeft size={20} color="#020617" /></TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Payment Methods</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        {message ? <View className="mb-3 rounded-2xl bg-emerald-50 px-4 py-3"><Text className="text-sm text-emerald-700">{message}</Text></View> : null}
        {error ? <View className="mb-3 rounded-2xl bg-rose-50 px-4 py-3"><Text className="text-sm text-rose-700">{error}</Text></View> : null}

        <Text className="text-sm font-bold text-slate-700 mb-3">Choose your preferred payment method</Text>
        <View className="space-y-3">
          {paymentOptions.map((opt) => {
            const isSelected = selected === opt.id;
            const Icon = opt.icon;
            return (
              <TouchableOpacity key={opt.id} onPress={() => savePreferredMethod(opt.id)} disabled={saving} className={`flex-row items-center gap-4 rounded-3xl bg-white p-5 shadow-sm border-2 ${isSelected ? "border-indigo-500" : "border-transparent"}`}>
                <View className={`h-14 w-14 items-center justify-center rounded-2xl ${opt.bg}`}><Icon size={26} color={opt.color} /></View>
                <View className="flex-1"><Text className="font-extrabold text-slate-900">{opt.name}</Text><Text className="text-sm text-slate-500 mt-0.5">{opt.description}</Text></View>
                {isSelected ? <CheckCircle size={22} color="#6366f1" /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <View className="flex-row items-center gap-2 mb-3"><Smartphone size={18} color={colors.brand[700]} /><Text className="text-base font-extrabold text-slate-900">Saved UPI IDs</Text></View>
          {loading ? <ActivityIndicator color={colors.brand[600]} /> : (
            <>
              {upiIds.length ? upiIds.map((upi, index) => (
                <View key={upi} className="mb-2 flex-row items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3">
                  <View className="flex-1"><Text className="font-black text-indigo-950">{upi}</Text>{index === 0 ? <Text className="text-xs text-indigo-700">Preferred UPI</Text> : null}</View>
                  <TouchableOpacity onPress={() => removeUpi(upi)} disabled={saving} className="h-8 w-8 items-center justify-center rounded-full bg-white"><X size={16} color={colors.slate[500]} /></TouchableOpacity>
                </View>
              )) : <Text className="mb-3 text-sm text-slate-500">No UPI IDs saved yet.</Text>}
              <View className="mt-2 flex-row gap-2">
                <TextInput value={newUpi} onChangeText={setNewUpi} autoCapitalize="none" placeholder="name@upi" placeholderTextColor="#94a3b8" className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900" />
                <TouchableOpacity onPress={addUpi} disabled={saving || !newUpi.trim()} className="items-center justify-center rounded-2xl bg-indigo-600 px-4 disabled:opacity-50">{saving ? <ActivityIndicator color="#fff" size="small" /> : <Plus size={20} color="#fff" />}</TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}