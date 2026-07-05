import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Alert, Modal, ActivityIndicator, Image,
} from "react-native";
import { Plus, Pencil, Trash2, ChevronLeft, X, ImagePlus } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../constants/colors";
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, getMyRestaurant, uploadImage } from "../../services/vendorService";

const categories = ["All", "Main Course", "Starters", "Thali", "Beverages", "Desserts", "Biryani", "Sides"];

const emptyForm = {
  name: "",
  price: "",
  category: "Main Course",
  description: "",
  isVeg: true,
  status: "ACTIVE",
  imageUrl: "",
  sizes: [],
  sideDishes: [],
};

export default function VendorMenuScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const rest = await getMyRestaurant();
      const id = rest.id || rest.restaurant?.id;
      setRestaurantId(id);
      if (id) {
        const data = await getMenuItems(id);
        setItems(data);
      }
    } catch (err) {
      console.error("Menu load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filtered = activeCategory === "All" ? items : items.filter((i) => i.category === activeCategory);

  const openAdd = () => {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      price: String(item.price),
      category: item.category || "Main Course",
      description: item.description || "",
      isVeg: item.isVeg ?? true,
      status: item.status || "ACTIVE",
      imageUrl: item.imageUrl || "",
      sizes: item.sizes || [],
      sideDishes: item.sideDishes || [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      Alert.alert("Error", "Name and price are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        price: parseFloat(form.price),
        category: form.category,
        description: form.description || null,
        isVeg: form.isVeg,
        status: form.status,
        imageUrl: form.imageUrl || null,
        sizes: form.sizes.length > 0 ? form.sizes : null,
        sideDishes: form.sideDishes.length > 0 ? form.sideDishes : null,
        restaurantId,
      };
      if (editingItem) {
        await updateMenuItem(editingItem.id, payload);
        setItems((prev) => prev.map((i) => (i.id === editingItem.id ? { ...i, ...payload } : i)));
      } else {
        const res = await createMenuItem(payload);
        setItems((prev) => [...prev, res.data || res]);
      }
      setShowModal(false);
    } catch (err) {
      Alert.alert("Error", "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Item", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await deleteMenuItem(id);
            setItems((prev) => prev.filter((i) => i.id !== id));
          } catch { Alert.alert("Error", "Failed to delete"); }
        },
      },
    ]);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera roll permission is needed to select a photo");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    setUploadingImage(true);
    try {
      const uploadRes = await uploadImage({ dataUrl: `data:${asset.mimeType};base64,${asset.base64}`, folder: "menu-items" });
      const url = uploadRes.data?.url || uploadRes.url || uploadRes.secure_url;
      if (url) setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      Alert.alert("Upload Failed", "Could not upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const addSize = () => {
    setForm((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: "M", price: "" }],
    }));
  };

  const updateSize = (index, field, value) => {
    setForm((prev) => {
      const sizes = [...prev.sizes];
      sizes[index] = { ...sizes[index], [field]: value };
      return { ...prev, sizes };
    });
  };

  const removeSize = (index) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const addSideDish = () => {
    setForm((prev) => ({
      ...prev,
      sideDishes: [...prev.sideDishes, { name: "", price: "" }],
    }));
  };

  const updateSideDish = (index, field, value) => {
    setForm((prev) => {
      const sideDishes = [...prev.sideDishes];
      sideDishes[index] = { ...sideDishes[index], [field]: value };
      return { ...prev, sideDishes };
    });
  };

  const removeSideDish = (index) => {
    setForm((prev) => ({
      ...prev,
      sideDishes: prev.sideDishes.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.brand[600]} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Manage Menu</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}
              className={`rounded-full px-5 py-2 ${activeCategory === cat ? "bg-indigo-600" : "bg-white border border-slate-200"}`}>
              <Text className={`text-xs font-extrabold ${activeCategory === cat ? "text-white" : "text-slate-700"}`}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="space-y-3">
          {filtered.map((item) => (
            <View key={item.id} className="bg-white rounded-3xl p-4 shadow-sm">
              <View className="flex-row items-start gap-3">
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} className="h-14 w-14 rounded-2xl" />
                ) : (
                  <View className="h-14 w-14 rounded-2xl bg-slate-100 items-center justify-center">
                    <Text className="text-xs text-slate-400">No img</Text>
                  </View>
                )}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <View className={`h-3 w-3 rounded-sm ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                    <Text className="font-bold text-slate-900">{item.name}</Text>
                    <View className={`px-2 py-0.5 rounded-full ${item.status === "ACTIVE" ? "bg-emerald-100" : "bg-slate-100"}`}>
                      <Text className={`text-[10px] font-bold ${item.status === "ACTIVE" ? "text-emerald-700" : "text-slate-500"}`}>
                        {item.status || "ACTIVE"}
                      </Text>
                    </View>
                  </View>
                  {item.description ? (
                    <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  <Text className="text-sm font-bold text-slate-700 mt-1">₹{Number(item.price).toFixed(2)}</Text>
                  {item.sizes?.length > 0 ? (
                    <View className="flex-row gap-2 mt-1">
                      {item.sizes.map((s, i) => (
                        <Text key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                          {s.size}: ₹{Number(s.price).toFixed(0)}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  {item.sideDishes?.length > 0 ? (
                    <Text className="text-[10px] text-slate-400 mt-1">
                      +{item.sideDishes.length} side dish{item.sideDishes.length > 1 ? "es" : ""}
                    </Text>
                  ) : null}
                </View>
                <View className="gap-2">
                  <TouchableOpacity onPress={() => openEdit(item)} className="h-8 w-8 items-center justify-center rounded-full bg-indigo-50">
                    <Pencil size={14} color={colors.brand[600]} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} className="h-8 w-8 items-center justify-center rounded-full bg-rose-50">
                    <Trash2 size={14} color={colors.red[600]} />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <Text className="text-xs text-slate-500">{item.category}</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-slate-500">Active</Text>
                  <Switch
                    value={item.status === "ACTIVE"}
                    onValueChange={async () => {
                      try {
                        const newStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                        await updateMenuItem(item.id, { status: newStatus });
                        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)));
                      } catch { Alert.alert("Error", "Failed to update"); }
                    }}
                    trackColor={{ false: "#e2e8f0", true: "#bbf7d0" }}
                    thumbColor={item.status === "ACTIVE" ? "#22c55e" : "#94a3b8"}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={openAdd}
          className="flex-row items-center justify-center gap-2 mt-6 mb-8 rounded-2xl bg-indigo-600 py-4 shadow-lg shadow-indigo-200">
          <Plus size={20} color="#fff" />
          <Text className="font-extrabold text-white">Add New Item</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-10 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-extrabold text-slate-900">{editingItem ? "Edit Item" : "Add Item"}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><X size={24} color={colors.slate[500]} /></TouchableOpacity>
            </View>
            <ScrollView className="space-y-4">
              <TextInput
                className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm"
                placeholder="Item name *"
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
              />

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-700 mb-1">Price (₹) *</Text>
                  <TextInput
                    className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm"
                    placeholder="Price"
                    keyboardType="numeric"
                    value={form.price}
                    onChangeText={(v) => setForm({ ...form, price: v })}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-700 mb-1">Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                    {categories.filter((c) => c !== "All").map((cat) => (
                      <TouchableOpacity key={cat} onPress={() => setForm({ ...form, category: cat })}
                        className={`rounded-full px-3 py-2 ${form.category === cat ? "bg-indigo-600" : "bg-slate-100"}`}>
                        <Text className={`text-xs font-bold ${form.category === cat ? "text-white" : "text-slate-700"}`}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <TextInput
                className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm min-h-[60px]"
                placeholder="Description (optional)"
                value={form.description}
                onChangeText={(v) => setForm({ ...form, description: v })}
                multiline
              />

              {/* Image */}
              <View>
                <Text className="text-xs font-bold text-slate-700 mb-2">Image (optional)</Text>
                {form.imageUrl ? (
                  <Image source={{ uri: form.imageUrl }} className="h-24 w-full rounded-xl mb-2" />
                ) : null}
                  <TouchableOpacity
                    onPress={handlePickImage}
                    className="flex-row items-center gap-2 rounded-xl bg-slate-100 px-4 py-3"
                  >
                    <ImagePlus size={16} color={colors.slate[600]} />
                    <Text className="text-sm text-slate-600">{uploadingImage ? "Uploading..." : "Upload Image"}</Text>
                  </TouchableOpacity>
              </View>

              {/* Veg/Non-veg */}
              <View className="flex-row items-center gap-4">
                <TouchableOpacity onPress={() => setForm({ ...form, isVeg: true })}
                  className={`flex-row items-center gap-2 px-4 py-2 rounded-xl ${form.isVeg ? "bg-green-50 border border-green-300" : "bg-slate-50 border border-slate-200"}`}>
                  <View className="h-3 w-3 rounded-sm bg-green-500" />
                  <Text className="text-sm font-bold text-slate-700">Veg</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setForm({ ...form, isVeg: false })}
                  className={`flex-row items-center gap-2 px-4 py-2 rounded-xl ${!form.isVeg ? "bg-red-50 border border-red-300" : "bg-slate-50 border border-slate-200"}`}>
                  <View className="h-3 w-3 rounded-sm bg-red-500" />
                  <Text className="text-sm font-bold text-slate-700">Non-Veg</Text>
                </TouchableOpacity>
              </View>

              {/* Sizes */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-bold text-slate-700">Sizes & Prices (optional)</Text>
                  <TouchableOpacity onPress={addSize} className="bg-indigo-50 px-3 py-1 rounded-full">
                    <Text className="text-xs font-bold text-indigo-700">+ Add Size</Text>
                  </TouchableOpacity>
                </View>
                {form.sizes.map((s, i) => (
                  <View key={i} className="flex-row items-center gap-2 mb-2">
                    {["S", "M", "L"].map((sz) => (
                      <TouchableOpacity
                        key={sz}
                        onPress={() => updateSize(i, "size", sz)}
                        className={`px-3 py-1 rounded-lg ${s.size === sz ? "bg-indigo-600" : "bg-slate-100"}`}
                      >
                        <Text className={`text-xs font-bold ${s.size === sz ? "text-white" : "text-slate-600"}`}>{sz}</Text>
                      </TouchableOpacity>
                    ))}
                    <TextInput
                      className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Price"
                      keyboardType="numeric"
                      value={String(s.price)}
                      onChangeText={(v) => updateSize(i, "price", v)}
                    />
                    <TouchableOpacity onPress={() => removeSize(i)}>
                      <X size={16} color={colors.red[500]} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Side Dishes */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-bold text-slate-700">Side Dishes (optional)</Text>
                  <TouchableOpacity onPress={addSideDish} className="bg-indigo-50 px-3 py-1 rounded-full">
                    <Text className="text-xs font-bold text-indigo-700">+ Add Side Dish</Text>
                  </TouchableOpacity>
                </View>
                {form.sideDishes.map((sd, i) => (
                  <View key={i} className="flex-row items-center gap-2 mb-2">
                    <TextInput
                      className="flex-[2] rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Name"
                      value={sd.name}
                      onChangeText={(v) => updateSideDish(i, "name", v)}
                    />
                    <TextInput
                      className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Price"
                      keyboardType="numeric"
                      value={String(sd.price)}
                      onChangeText={(v) => updateSideDish(i, "price", v)}
                    />
                    <TouchableOpacity onPress={() => removeSideDish(i)}>
                      <X size={16} color={colors.red[500]} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity onPress={handleSave} disabled={saving}
                className="rounded-2xl bg-indigo-600 py-4 items-center mt-2">
                <Text className="font-extrabold text-white">{saving ? "Saving..." : editingItem ? "Update Item" : "Add Item"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
