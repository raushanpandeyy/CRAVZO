import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, Switch,
} from "react-native";
import { ChevronLeft, Plus, Tag, Percent, X, Check, IndianRupee } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from "../../services/vendorService";

const emptyForm = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderValue: "",
  maxDiscount: "",
  maxUses: "",
  expiresAt: "",
};

export default function CouponManagementScreen({ navigation }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await getCoupons();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load coupons error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderValue: c.minOrderValue ? String(c.minOrderValue) : "",
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
      maxUses: c.maxUses ? String(c.maxUses) : "",
      expiresAt: c.expiresAt ? c.expiresAt.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.discountValue) {
      Alert.alert("Error", "Code and discount value are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : undefined,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      };
      if (editing) {
        await updateCoupon(editing.id, payload);
      } else {
        await createCoupon(payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon) => {
    try {
      await updateCoupon(coupon.id, { isActive: !coupon.isActive });
      load();
    } catch (err) {
      Alert.alert("Error", "Failed to update coupon");
    }
  };

  const handleDelete = (coupon) => {
    Alert.alert("Delete Coupon", `Deactivate "${coupon.code}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Deactivate", style: "destructive", onPress: async () => {
        try {
          await deleteCoupon(coupon.id);
          load();
        } catch (err) {
          Alert.alert("Error", "Failed to delete coupon");
        }
      }},
    ]);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : "—";

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F5F5] items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <ChevronLeft size={20} color={colors.slate[900]} />
            </TouchableOpacity>
            <Text className="text-xl font-extrabold text-slate-900">Coupons</Text>
          </View>
          <TouchableOpacity onPress={openCreate} className="h-10 w-10 items-center justify-center rounded-full bg-indigo-600">
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {coupons.length === 0 ? (
          <View className="items-center pt-16">
            <Tag size={48} color={colors.slate[300]} />
            <Text className="text-lg font-bold text-slate-400 mt-4">No coupons yet</Text>
            <Text className="text-sm text-slate-400 mt-1">Create your first offer</Text>
          </View>
        ) : (
          coupons.map((c) => (
            <View key={c.id} className={`bg-white rounded-3xl p-4 shadow-sm mb-3 ${c.isActive ? "" : "opacity-60"}`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
                    <Percent size={18} color="#e11d48" />
                  </View>
                  <View>
                    <Text className="font-extrabold text-slate-900">{c.code}</Text>
                    <Text className="text-xs text-slate-500">
                      {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                      {c.minOrderValue ? ` • Min ₹${c.minOrderValue}` : ""}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={c.isActive}
                  onValueChange={() => handleToggle(c)}
                  trackColor={{ false: "#e2e8f0", true: "#bbf7d0" }}
                  thumbColor={c.isActive ? "#22c55e" : "#94a3b8"}
                />
              </View>
              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <Text className="text-xs text-slate-400">Uses: {c.currentUses}/{c.maxUses || "∞"} • Exp: {formatDate(c.expiresAt)}</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => openEdit(c)} className="px-3 py-1 rounded-lg bg-indigo-50">
                    <Text className="text-xs font-bold text-indigo-600">Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(c)} className="px-3 py-1 rounded-lg bg-rose-50">
                    <Text className="text-xs font-bold text-rose-600">Del</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={showModal} onRequestClose={() => setShowModal(false)}>
        <View className="flex-1 bg-black/50">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setShowModal(false)} />
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            <ScrollView className="px-5 pb-8">
              <View className="flex-row items-center justify-between mt-4 mb-6">
                <Text className="text-lg font-black text-slate-900">{editing ? "Edit Coupon" : "New Coupon"}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)} className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <X size={18} color={colors.slate[700]} />
                </TouchableOpacity>
              </View>

              {!editing && (
                <View className="mb-4">
                  <Text className="text-sm font-bold text-slate-700 mb-1">Coupon Code</Text>
                  <TextInput value={form.code} onChangeText={(t) => setForm({ ...form, code: t.toUpperCase() })}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="e.g. SAVE20" autoCapitalize="characters" />
                </View>
              )}

              <View className="mb-4">
                <Text className="text-sm font-bold text-slate-700 mb-1">Discount Type</Text>
                <View className="flex-row gap-3">
                  {["PERCENTAGE", "FLAT"].map((t) => (
                    <TouchableOpacity key={t} onPress={() => setForm({ ...form, discountType: t })}
                      className={`flex-1 py-3 rounded-xl items-center border-2 ${form.discountType === t ? "border-indigo-600 bg-indigo-50" : "border-slate-200"}`}>
                      <Text className={`text-xs font-bold ${form.discountType === t ? "text-indigo-600" : "text-slate-500"}`}>
                        {t === "PERCENTAGE" ? "% Off" : "₹ Off"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-bold text-slate-700 mb-1">Discount Value</Text>
                <TextInput value={form.discountValue} onChangeText={(t) => setForm({ ...form, discountValue: t })}
                  keyboardType="decimal-pad" className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder={form.discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 50"} />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-bold text-slate-700 mb-1">Min Order Value (optional)</Text>
                <TextInput value={form.minOrderValue} onChangeText={(t) => setForm({ ...form, minOrderValue: t })}
                  keyboardType="decimal-pad" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="e.g. 200" />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-bold text-slate-700 mb-1">Max Discount (optional, for % coupons)</Text>
                <TextInput value={form.maxDiscount} onChangeText={(t) => setForm({ ...form, maxDiscount: t })}
                  keyboardType="decimal-pad" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="e.g. 100" />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-bold text-slate-700 mb-1">Max Uses (optional)</Text>
                <TextInput value={form.maxUses} onChangeText={(t) => setForm({ ...form, maxUses: t })}
                  keyboardType="number-pad" className="rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="Leave empty for unlimited" />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-bold text-slate-700 mb-1">Expiry Date (optional)</Text>
                <TextInput value={form.expiresAt} onChangeText={(t) => setForm({ ...form, expiresAt: t })}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="YYYY-MM-DD" />
              </View>

              <TouchableOpacity onPress={handleSave} disabled={saving}
                className="flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4">
                <Check size={20} color="#fff" />
                <Text className="font-extrabold text-white">{saving ? "Saving..." : "Save Coupon"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
