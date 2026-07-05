import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MapPin, Plus, Check, Pencil, Trash2, ChevronLeft } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getAddresses, addAddress, updateAddress, deleteAddress } from "../../services/addressService";

export default function AddressesScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ label: "", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "" });

  useEffect(() => {
    (async () => {
      try {
        const data = await getAddresses();
        setAddresses(data);
      } catch (e) {
        Alert.alert("Error", "Failed to load addresses: " + (e.message || "Network error"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const resetForm = () => {
    setForm({ label: "", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (addr) => {
    setForm({
      label: addr.label || "",
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      line1: addr.line1 || "",
      line2: addr.line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postalCode || "",
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.label || !form.line1 || !form.city) {
      Alert.alert("Missing Fields", "Please fill in label, address, and city.");
      return;
    }
    try {
      if (editingId) {
        const updated = await updateAddress(editingId, form);
        setAddresses((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
      } else {
        const saved = await addAddress(form);
        setAddresses((prev) => [...prev, saved]);
      }
      resetForm();
      Alert.alert("Saved", "Address saved successfully.");
    } catch {
      Alert.alert("Error", "Failed to save address.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      Alert.alert("Error", "Failed to delete address.");
    }
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">My Addresses</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        {loading ? (
          <ActivityIndicator size="large" color={colors.brand[600]} style={{ marginTop: 40 }} />
        ) : addresses.length === 0 ? (
          <View className="items-center justify-center py-20">
            <MapPin size={48} color="#94a3b8" />
            <Text className="text-lg font-bold text-slate-900 mt-4">No addresses saved</Text>
            <Text className="text-sm text-slate-500 mt-1">Add a delivery address to get started</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {addresses.map((addr) => (
              <View key={addr.id} className="bg-white rounded-3xl p-4 shadow-sm">
                <View className="flex-row items-start gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                    <MapPin size={20} color={colors.brand[600]} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-bold text-slate-900">{addr.label}</Text>
                      {addr.isDefault ? (
                        <View className="bg-indigo-100 rounded-full px-2 py-0.5">
                          <Text className="text-[10px] font-bold text-indigo-700">Default</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-sm text-slate-600 mt-1">
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}{addr.state ? `, ${addr.state}` : ""} - {addr.postalCode}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-1">{addr.phone}</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleEdit(addr)}
                      className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
                    >
                      <Pencil size={14} color={colors.slate[600]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Alert.alert("Delete Address", "Are you sure?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => handleDelete(addr.id) },
                      ])}
                      className="h-8 w-8 items-center justify-center rounded-full bg-rose-50"
                    >
                      <Trash2 size={14} color={colors.red[600]} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {showForm ? (
          <View className="mt-4 bg-white rounded-3xl p-5 shadow-sm space-y-4">
            <Text className="text-lg font-extrabold text-slate-900">{editingId ? "Edit Address" : "Add Address"}</Text>
            <TextInput placeholder="Label (Home/Work/Other)" value={form.label} onChangeText={(t) => setForm({ ...form, label: t })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" />
            <TextInput placeholder="Full Name" value={form.fullName} onChangeText={(t) => setForm({ ...form, fullName: t })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" />
            <TextInput placeholder="Phone Number" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" keyboardType="phone-pad" />
            <TextInput placeholder="House/Flat/Building" value={form.line1} onChangeText={(t) => setForm({ ...form, line1: t })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" />
            <TextInput placeholder="Landmark (optional)" value={form.line2} onChangeText={(t) => setForm({ ...form, line2: t })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" />
            <View className="flex-row gap-3">
              <TextInput placeholder="City" value={form.city} onChangeText={(t) => setForm({ ...form, city: t })}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" />
              <TextInput placeholder="Pincode" value={form.postalCode} onChangeText={(t) => setForm({ ...form, postalCode: t })}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" keyboardType="number-pad" />
            </View>
            <TextInput placeholder="State" value={form.state} onChangeText={(t) => setForm({ ...form, state: t })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" />
            <TouchableOpacity onPress={handleSave}
              className="rounded-2xl bg-indigo-600 py-3.5">
              <Text className="text-center font-extrabold text-white">{editingId ? "Update Address" : "Save Address"}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity onPress={() => setShowForm(!showForm)}
          className="flex-row items-center justify-center gap-2 mt-4 rounded-2xl border-2 border-dashed border-slate-300 p-4 mb-8"
        >
          <Plus size={20} color={colors.slate[500]} />
          <Text className="font-bold text-slate-500">{showForm ? "Cancel" : "Add New Address"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
