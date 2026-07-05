import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Switch, Modal,
} from "react-native";
import {
  Plus, Pencil, Trash2, ChevronLeft, X, Percent,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { apiRequest } from "../../services/api";

export default function AdminPromotionsScreen({ navigation }) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", discountType: "PERCENTAGE", discountValue: "",
    minOrderValue: "", maxDiscount: "", code: "", isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/promotions/all");
      setPromotions(res.data || []);
    } catch (err) {
      console.error("Promotions load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", description: "", discountType: "PERCENTAGE", discountValue: "", minOrderValue: "", maxDiscount: "", code: "", isActive: true });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      title: p.title, description: p.description || "",
      discountType: p.discountType, discountValue: String(p.discountValue),
      minOrderValue: p.minOrderValue ? String(p.minOrderValue) : "",
      maxDiscount: p.maxDiscount ? String(p.maxDiscount) : "",
      code: p.code || "", isActive: p.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.discountValue) { Alert.alert("Error", "Title and discount value required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, discountValue: parseFloat(form.discountValue), minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : null, maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null };
      if (editing) {
        await apiRequest(`/api/promotions/${editing.id}`, { method: "PATCH", data: payload });
        setPromotions((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...payload } : p)));
      } else {
        const res = await apiRequest("/api/promotions", { method: "POST", data: payload });
        setPromotions((prev) => [...prev, res.data || res]);
      }
      setShowModal(false);
    } catch { Alert.alert("Error", "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await apiRequest(`/api/promotions/${id}`, { method: "DELETE" });
          setPromotions((prev) => prev.filter((p) => p.id !== id));
        } catch { Alert.alert("Error", "Failed to delete"); }
      }},
    ]);
  };

  const toggleActive = async (promo) => {
    try {
      await apiRequest(`/api/promotions/${promo.id}`, { method: "PATCH", data: { isActive: !promo.isActive } });
      setPromotions((prev) => prev.map((p) => p.id === promo.id ? { ...p, isActive: !p.isActive } : p));
    } catch { Alert.alert("Error", "Failed to update"); }
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Promotions</Text>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        {loading ? (
          <ActivityIndicator size="large" color={colors.brand[600]} style={{ marginTop: 20 }} />
        ) : promotions.length === 0 ? (
          <View className="items-center py-20">
            <Percent size={48} color="#94a3b8" />
            <Text className="text-base font-bold text-slate-500 mt-4">No promotions</Text>
            <Text className="text-sm text-slate-400 mt-1">Create your first promotion</Text>
          </View>
        ) : (
          <View className="space-y-3 pb-4">
            {promotions.map((promo) => (
              <View key={promo.id} className="bg-white rounded-3xl p-4 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="h-10 w-10 rounded-xl bg-rose-50 items-center justify-center">
                      <Percent size={20} color="#e11d48" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-slate-900">{promo.title}</Text>
                      <Text className="text-xs text-slate-500">
                        {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`}
                        {promo.code ? ` • Code: ${promo.code}` : ""}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Switch value={promo.isActive} onValueChange={() => toggleActive(promo)}
                      trackColor={{ false: "#e2e8f0", true: "#bbf7d0" }}
                      thumbColor={promo.isActive ? "#22c55e" : "#94a3b8"} />
                    <TouchableOpacity onPress={() => openEdit(promo)} className="h-8 w-8 rounded-full bg-indigo-50 items-center justify-center">
                      <Pencil size={14} color={colors.brand[600]} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(promo.id)} className="h-8 w-8 rounded-full bg-rose-50 items-center justify-center">
                      <Trash2 size={14} color={colors.red[600]} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity onPress={openAdd}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200 mb-8">
          <Plus size={20} color="#fff" />
          <Text className="font-extrabold text-white">Add Promotion</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-extrabold text-slate-900">{editing ? "Edit" : "Add"} Promotion</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><X size={24} color={colors.slate[500]} /></TouchableOpacity>
            </View>
            <ScrollView className="space-y-3">
              {[
                { key: "title", label: "Title", placeholder: "e.g. Summer Sale" },
                { key: "description", label: "Description", placeholder: "Brief description", multiline: true },
                { key: "code", label: "Coupon Code (optional)", placeholder: "e.g. SUMMER50", autoCapitalize: "characters" },
                { key: "discountValue", label: "Discount Value", placeholder: "e.g. 20", keyboard: "numeric" },
                { key: "minOrderValue", label: "Min Order Value (optional)", placeholder: "e.g. 199", keyboard: "numeric" },
                { key: "maxDiscount", label: "Max Discount (optional)", placeholder: "e.g. 100", keyboard: "numeric" },
              ].map(({ key, label, placeholder, multiline, keyboard, autoCapitalize }) => (
                <View key={key}>
                  <Text className="text-xs font-bold text-slate-700 mb-1">{label}</Text>
                  <TextInput className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm"
                    placeholder={placeholder} placeholderTextColor="#94a3b8"
                    value={form[key]} onChangeText={(v) => setForm({ ...form, [key]: v })}
                    multiline={multiline} keyboardType={keyboard || "default"}
                    autoCapitalize={autoCapitalize || "none"} />
                </View>
              ))}
              <View>
                <Text className="text-xs font-bold text-slate-700 mb-1">Discount Type</Text>
                <View className="flex-row gap-3">
                  {["PERCENTAGE", "FLAT"].map((t) => (
                    <TouchableOpacity key={t} onPress={() => setForm({ ...form, discountType: t })}
                      className={`flex-1 py-3 rounded-xl items-center border-2 ${form.discountType === t ? "border-indigo-600 bg-indigo-50" : "border-slate-200"}`}>
                      <Text className={`text-xs font-bold ${form.discountType === t ? "text-indigo-600" : "text-slate-500"}`}>
                        {t === "PERCENTAGE" ? "Percentage" : "Flat Amount"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity onPress={handleSave} disabled={saving}
                className="rounded-2xl bg-indigo-600 py-4 items-center">
                <Text className="font-extrabold text-white">{saving ? "Saving..." : editing ? "Update" : "Create"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
