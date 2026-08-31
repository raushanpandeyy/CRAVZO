import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionSheetIOS, Alert, FlatList, Image, KeyboardAvoidingView,
  Modal, Platform, RefreshControl, ScrollView, StyleSheet,
  Switch, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../constants/colors";
import {
  Badge, Card, EmptyState, InputField,
  PrimaryButton, SectionHeader,
} from "../components/Primitives";
import { Camera, Edit, Image as ImageIcon, Plus, Search, Trash, X } from "../components/Icons";
import {
  createMenuItem, deleteMenuItem,
  getMyRestaurants, updateMenuItem, uploadImage,
} from "../services/vendorService";

// ── Constants ─────────────────────────────────────────────────────
const CATEGORIES = [
  "Main Course","Starters","Biryani","Thali",
  "Beverages","Desserts","Sides","Snacks","Breads",
];
const SIZES = ["S", "M", "L"];

const EMPTY_FORM = {
  name: "", description: "", price: "",
  category: "", imageUrl: "",
  isVeg: false, status: "ACTIVE",
  sizes: [], sideDishes: "",
};

const fmt = (v) => `Rs ${Math.floor(v || 0)}`;

// ── Image picker helper ───────────────────────────────────────────
const pickImage = async (source) => {
  if (source === "camera") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to take photos.");
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled) return result.assets[0].uri;
  } else {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission needed", "Photo library access is required.");
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled) return result.assets[0].uri;
  }
  return null;
};

export default function MenuScreen() {
  const [restaurants,   setRestaurants]   = useState([]);
  const [selectedRestId,setSelectedRestId]= useState("");
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [editingItem,   setEditingItem]   = useState(null); // null = new
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [formErrors,    setFormErrors]    = useState({});
  const [saving,        setSaving]        = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [deleting,      setDeleting]      = useState("");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [filterStatus,  setFilterStatus]  = useState("ALL"); // ALL | ACTIVE | INACTIVE
  const [selectedIds,   setSelectedIds]   = useState(new Set()); // bulk selection
  const [bulkUpdating,  setBulkUpdating]  = useState(false);

  // ── Load ─────────────────────────────────────────────────────────
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await getMyRestaurants();
      setRestaurants(data);
      if (!selectedRestId && data[0]) setSelectedRestId(data[0].id);
    } catch (err) {
      if (!silent) Alert.alert("Error", err.message || "Failed to load menu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRestId]);

  useEffect(() => { load(); }, []);

  const restaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedRestId) || restaurants[0] || null,
    [restaurants, selectedRestId]
  );

  const menuItems = useMemo(() => restaurant?.menuItems || [], [restaurant]);

  const filtered = useMemo(() => {
    let items = menuItems;
    if (filterStatus !== "ALL")
      items = items.filter((i) => i.status === filterStatus);
    if (searchQuery.trim())
      items = items.filter((i) =>
        i.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
    return items;
  }, [menuItems, filterStatus, searchQuery]);

  // ── Open modal ────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      name:        item.name || "",
      description: item.description || "",
      price:       String(item.price || ""),
      category:    item.category || "",
      imageUrl:    item.imageUrl || "",
      isVeg:       Boolean(item.isVeg),
      status:      item.status || "ACTIVE",
      sizes:       Array.isArray(item.sizes) ? item.sizes : [],
      sideDishes:  Array.isArray(item.sideDishes) ? item.sideDishes.join(", ") : (item.sideDishes || ""),
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const closeModal = () => { setModalVisible(false); setEditingItem(null); };

  // ── Form helpers ──────────────────────────────────────────────────
  const setField = (key) => (val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setFormErrors((p) => ({ ...p, [key]: "" }));
  };

  const toggleSize = (size) => {
    setForm((p) => ({
      ...p,
      sizes: p.sizes.includes(size)
        ? p.sizes.filter((s) => s !== size)
        : [...p.sizes, size],
    }));
  };

  // ── Image pick (camera or gallery) ────────────────────────────────
  const handlePickImage = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", "Take Photo", "Choose from Library"], cancelButtonIndex: 0 },
        async (idx) => {
          if (idx === 0) return;
          const uri = await pickImage(idx === 1 ? "camera" : "gallery");
          if (uri) handleUploadImage(uri);
        }
      );
    } else {
      Alert.alert("Add Image", "Choose source", [
        { text: "Camera",  onPress: async () => { const uri = await pickImage("camera");  if (uri) handleUploadImage(uri); } },
        { text: "Gallery", onPress: async () => { const uri = await pickImage("gallery"); if (uri) handleUploadImage(uri); } },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleUploadImage = async (uri) => {
    setUploading(true);
    try {
      const url = await uploadImage(uri);
      setForm((p) => ({ ...p, imageUrl: url }));
    } catch (err) {
      Alert.alert("Upload failed", err.message || "Could not upload image");
    } finally {
      setUploading(false);
    }
  };

  // ── Validate ──────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Item name is required";
    if (!form.price.trim())    e.price    = "Price is required";
    else if (isNaN(Number(form.price)) || Number(form.price) <= 0)
                               e.price    = "Enter a valid price";
    if (!form.category.trim()) e.category = "Category is required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    if (!restaurant?.id) { Alert.alert("Error", "No restaurant selected"); return; }
    setSaving(true);
    try {
      const payload = {
        restaurantId: restaurant.id,
        name:         form.name.trim(),
        description:  form.description.trim(),
        price:        Number(form.price),
        category:     form.category,
        imageUrl:     form.imageUrl || null,
        isVeg:        form.isVeg,
        status:       form.status,
        sizes:        form.sizes,
        sideDishes:   form.sideDishes
          ? form.sideDishes.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };
      if (editingItem) {
        await updateMenuItem(editingItem.id, payload);
      } else {
        await createMenuItem(payload);
      }
      closeModal();
      load({ silent: true });
    } catch (err) {
      Alert.alert("Save failed", err.message || "Could not save item");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = (item) => {
    Alert.alert(
      "Delete Item",
      `Remove "${item.name}" from your menu? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            setDeleting(item.id);
            try {
              await deleteMenuItem(item.id);
              load({ silent: true });
            } catch (err) {
              Alert.alert("Delete failed", err.message);
            } finally { setDeleting(""); }
          },
        },
      ]
    );
  };

  // ── Toggle active/inactive ────────────────────────────────────────
  const handleToggleStatus = async (item) => {
    const next = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateMenuItem(item.id, { ...item, status: next });
      load({ silent: true });
    } catch (err) {
      Alert.alert("Failed", err.message);
    }
  };

  // ── Bulk select helpers ───────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filtered.map((i) => i.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkUpdate = async (status) => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      await Promise.all(
        [...selectedIds].map((id) => {
          const item = menuItems.find((m) => m.id === id);
          return item ? updateMenuItem(id, { ...item, status }) : Promise.resolve();
        })
      );
      clearSelection();
      load({ silent: true });
    } catch (err) {
      Alert.alert("Bulk update failed", err.message);
    } finally {
      setBulkUpdating(false);
    }
  };

  // ── Render menu item ──────────────────────────────────────────────
  const renderItem = useCallback(({ item }) => {
    const isSelected = selectedIds.has(item.id);
    return (
    <TouchableOpacity
      onLongPress={() => toggleSelect(item.id)}
      onPress={() => selectedIds.size > 0 ? toggleSelect(item.id) : null}
      activeOpacity={0.85}
    >
    <View style={[
      styles.itemCard,
      item.status === "INACTIVE" && styles.itemCardInactive,
      isSelected && styles.itemCardSelected,
    ]}>
      {/* Selection indicator */}
      {selectedIds.size > 0 && (
        <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
          {isSelected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      )}
      {/* Image */}
      {item.imageUrl
        ? <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
        : <View style={styles.itemImagePlaceholder}><ImageIcon size={28} color={colors.subtle} /></View>
      }

      {/* Info */}
      <View style={styles.itemInfo}>
        <View style={styles.itemTopRow}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.vegDot, { backgroundColor: item.isVeg ? colors.accent : colors.danger }]} />
        </View>
        {item.category
          ? <Badge label={item.category} tone="muted" style={styles.itemCategory} />
          : null}
        {item.description
          ? <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
          : null}
        <View style={styles.itemBottomRow}>
          <Text style={styles.itemPrice}>{fmt(item.price)}</Text>
          <Switch
            value={item.status === "ACTIVE"}
            onValueChange={() => handleToggleStatus(item)}
            trackColor={{ false: "#f1f5f9", true: colors.accentSoft }}
            thumbColor={item.status === "ACTIVE" ? colors.accent : colors.subtle}
            style={styles.itemSwitch}
          />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.itemActionBtn} onPress={() => openEdit(item)}>
          <Edit size={17} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.itemActionBtn, styles.itemDeleteBtn]}
          onPress={() => handleDelete(item)}
          disabled={deleting === item.id}
        >
          <Trash size={17} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
    </TouchableOpacity>
    );
  }, [deleting, selectedIds, filtered]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* ── Restaurant selector (if multiple) ── */}
      {restaurants.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.restTabs}>
          {restaurants.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.restTab, r.id === selectedRestId && styles.restTabActive]}
              onPress={() => setSelectedRestId(r.id)}
            >
              <Text style={[styles.restTabText, r.id === selectedRestId && styles.restTabTextActive]}>
                {r.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Stats bar ── */}
      <View style={styles.statsBar}>
        <View style={styles.statPill}>
          <Text style={styles.statPillVal}>{menuItems.length}</Text>
          <Text style={styles.statPillLbl}>Total</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.statPillVal, { color: colors.accent }]}>
            {menuItems.filter((i) => i.status === "ACTIVE").length}
          </Text>
          <Text style={styles.statPillLbl}>Active</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: "#f1f5f9" }]}>
          <Text style={[styles.statPillVal, { color: colors.muted }]}>
            {menuItems.filter((i) => i.status === "INACTIVE").length}
          </Text>
          <Text style={styles.statPillLbl}>Inactive</Text>
        </View>
      </View>

      {/* ── Search + filter ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Search size={16} color={colors.muted} />
          <InputField
            placeholder="Search items…"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            inputStyle={styles.searchInputInner}
          />
        </View>
        {["ALL","ACTIVE","INACTIVE"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filterStatus === f && styles.filterChipActive]}
            onPress={() => setFilterStatus(f)}
          >
            <Text style={[styles.filterChipText, filterStatus === f && styles.filterChipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Bulk action bar (shown when items selected) ── */}
      {selectedIds.size > 0 && (
        <View style={styles.bulkBar}>
          <Text style={styles.bulkCount}>{selectedIds.size} selected</Text>
          <TouchableOpacity style={styles.bulkSelectAll} onPress={selectAll}>
            <Text style={styles.bulkSelectAllText}>Select All ({filtered.length})</Text>
          </TouchableOpacity>
          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={[styles.bulkBtn, styles.bulkBtnSuccess]}
              onPress={() => handleBulkUpdate("ACTIVE")}
              disabled={bulkUpdating}
            >
              <Text style={styles.bulkBtnText}>{bulkUpdating ? "…" : "Enable"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkBtn, styles.bulkBtnMuted]}
              onPress={() => handleBulkUpdate("INACTIVE")}
              disabled={bulkUpdating}
            >
              <Text style={[styles.bulkBtnText, { color: colors.ink }]}>{bulkUpdating ? "…" : "Disable"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bulkCancel} onPress={clearSelection}>
              <Text style={styles.bulkCancelText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load({ silent: true }); }}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading
            ? <EmptyState icon="🍽️" title="No items" body={searchQuery ? "No items match your search." : "Add your first menu item."} />
            : <View style={styles.loadingWrap}><Text style={styles.loadingText}>Loading menu…</Text></View>
        }
      />

      {/* ── Add / Edit Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalShade}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalKAV}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />

              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingItem ? "Edit Item" : "Add Menu Item"}
                </Text>
                <TouchableOpacity onPress={closeModal} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
                  <X size={22} color={colors.ink} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.formBody}
              >
                {/* Image picker */}
                <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} disabled={uploading}>
                  {form.imageUrl
                    ? <Image source={{ uri: form.imageUrl }} style={styles.imagePickerPreview} resizeMode="cover" />
                    : (
                      <View style={styles.imagePickerPlaceholder}>
                        {uploading
                          ? <Text style={styles.uploadingText}>Uploading…</Text>
                          : (
                            <>
                              <Camera size={28} color={colors.muted} />
                              <Text style={styles.imagePickerText}>Tap to add photo</Text>
                              <Text style={styles.imagePickerSub}>Camera or Gallery</Text>
                            </>
                          )
                        }
                      </View>
                    )
                  }
                  {form.imageUrl && (
                    <View style={styles.imageEditOverlay}>
                      <Camera size={18} color="#fff" />
                      <Text style={styles.imageEditText}>Change</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Name */}
                <InputField
                  label="Item Name *"
                  placeholder="e.g. Butter Chicken"
                  value={form.name}
                  onChangeText={setField("name")}
                  error={formErrors.name}
                />

                {/* Price */}
                <InputField
                  label="Price (Rs) *"
                  placeholder="e.g. 199"
                  value={form.price}
                  onChangeText={setField("price")}
                  keyboardType="numeric"
                  error={formErrors.price}
                />

                {/* Category */}
                <View>
                  <Text style={styles.fieldLabel}>Category *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.chip, form.category === cat && styles.chipActive]}
                        onPress={() => setField("category")(cat)}
                      >
                        <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {formErrors.category ? <Text style={styles.errorText}>{formErrors.category}</Text> : null}
                </View>

                {/* Description */}
                <InputField
                  label="Description"
                  placeholder="Brief description of the item"
                  value={form.description}
                  onChangeText={setField("description")}
                  multiline
                  numberOfLines={3}
                  inputStyle={{ minHeight: 72, textAlignVertical: "top", paddingTop: 12 }}
                />

                {/* Sizes */}
                <View>
                  <Text style={styles.fieldLabel}>Available Sizes (optional)</Text>
                  <View style={styles.chipRow}>
                    {SIZES.map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[styles.chip, form.sizes.includes(size) && styles.chipActive]}
                        onPress={() => toggleSize(size)}
                      >
                        <Text style={[styles.chipText, form.sizes.includes(size) && styles.chipTextActive]}>{size}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Side dishes */}
                <InputField
                  label="Side Dishes (comma separated)"
                  placeholder="e.g. Raita, Papad, Pickle"
                  value={form.sideDishes}
                  onChangeText={setField("sideDishes")}
                />

                {/* Veg toggle + Status */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleItem}>
                    <View style={[styles.vegDot, styles.vegDotLarge, { backgroundColor: form.isVeg ? colors.accent : colors.danger }]} />
                    <Text style={styles.toggleLabel}>{form.isVeg ? "Veg" : "Non-Veg"}</Text>
                    <Switch
                      value={form.isVeg}
                      onValueChange={setField("isVeg")}
                      trackColor={{ false: colors.dangerSoft, true: colors.accentSoft }}
                      thumbColor={form.isVeg ? colors.accent : colors.danger}
                    />
                  </View>
                  <View style={styles.toggleItem}>
                    <Text style={styles.toggleLabel}>{form.status === "ACTIVE" ? "Active" : "Inactive"}</Text>
                    <Switch
                      value={form.status === "ACTIVE"}
                      onValueChange={(v) => setField("status")(v ? "ACTIVE" : "INACTIVE")}
                      trackColor={{ false: "#f1f5f9", true: colors.accentSoft }}
                      thumbColor={form.status === "ACTIVE" ? colors.accent : colors.subtle}
                    />
                  </View>
                </View>

                {/* Save button */}
                <PrimaryButton
                  title={editingItem ? "Save Changes" : "Add to Menu"}
                  tone="primary"
                  onPress={handleSave}
                  loading={saving}
                  style={styles.saveBtn}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },

  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: colors.ink },
  addBtn:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  addBtnText:  { color: "#fff", fontWeight: "900", fontSize: 14 },

  restTabs:     { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  restTab:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: colors.line },
  restTabActive:{ backgroundColor: colors.primary, borderColor: colors.primary },
  restTabText:  { fontSize: 13, fontWeight: "800", color: colors.muted },
  restTabTextActive:{ color: "#fff" },

  statsBar:    { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  statPill:    { flex: 1, backgroundColor: colors.primarySoft, borderRadius: 14, paddingVertical: 10, alignItems: "center" },
  statPillVal: { fontSize: 20, fontWeight: "900", color: colors.primary },
  statPillLbl: { fontSize: 11, fontWeight: "800", color: colors.muted, marginTop: 1 },

  searchRow:   { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  searchWrap:  { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, paddingLeft: 12, borderWidth: 1.5, borderColor: colors.line },
  searchInput: { flex: 1, marginBottom: 0 },
  searchInputInner: { borderWidth: 0, borderRadius: 0, backgroundColor: "transparent", minHeight: 44 },
  filterChip:  { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: colors.line },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText:   { fontSize: 12, fontWeight: "800", color: colors.muted },
  filterChipTextActive: { color: "#fff" },

  list:        { padding: 16, paddingTop: 4, gap: 12, paddingBottom: 32 },
  loadingWrap: { padding: 32, alignItems: "center" },
  loadingText: { color: colors.muted, fontWeight: "700" },

  itemCard:    { backgroundColor: colors.card, borderRadius: 20, flexDirection: "row", borderWidth: 1, borderColor: colors.line, overflow: "hidden", shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  itemCardInactive: { opacity: 0.55 },
  itemImage:   { width: 90, height: "100%", minHeight: 100 },
  itemImagePlaceholder: { width: 90, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center", minHeight: 100 },
  itemInfo:    { flex: 1, padding: 12, gap: 5 },
  itemTopRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  itemName:    { flex: 1, fontSize: 15, fontWeight: "900", color: colors.ink },
  vegDot:      { width: 10, height: 10, borderRadius: 5 },
  vegDotLarge: { width: 14, height: 14, borderRadius: 7 },
  itemCategory:{ alignSelf: "flex-start" },
  itemDesc:    { fontSize: 12, color: colors.muted, fontWeight: "700", lineHeight: 17 },
  itemBottomRow:{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemPrice:   { fontSize: 15, fontWeight: "900", color: colors.primaryDark },
  itemSwitch:  { transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },
  itemActions: { justifyContent: "center", gap: 8, paddingRight: 12 },
  itemActionBtn:{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  itemDeleteBtn:{ backgroundColor: colors.dangerSoft },

  modalShade:  { flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "flex-end" },
  modalKAV:    { justifyContent: "flex-end" },
  modalCard:   { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "92%", paddingBottom: 16 },
  modalHandle: { width: 44, height: 5, borderRadius: 999, backgroundColor: "#e2e8f0", alignSelf: "center", marginTop: 12, marginBottom: 4 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  modalTitle:  { fontSize: 20, fontWeight: "900", color: colors.ink },
  formBody:    { paddingHorizontal: 16, gap: 16, paddingBottom: 24 },

  imagePicker: { height: 180, borderRadius: 18, overflow: "hidden", borderWidth: 2, borderColor: colors.line, borderStyle: "dashed", backgroundColor: "#f8fafc" },
  imagePickerPreview: { width: "100%", height: "100%" },
  imagePickerPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  imagePickerText: { fontSize: 14, fontWeight: "800", color: colors.muted },
  imagePickerSub:  { fontSize: 12, fontWeight: "700", color: colors.subtle },
  uploadingText:   { fontSize: 14, fontWeight: "800", color: colors.primary },
  imageEditOverlay:{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8 },
  imageEditText:   { color: "#fff", fontWeight: "900", fontSize: 13 },

  fieldLabel:  { fontSize: 13, fontWeight: "800", color: colors.ink, marginBottom: 8 },
  chipRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f1f5f9", borderWidth: 1.5, borderColor: colors.line },
  chipActive:  { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:    { fontSize: 13, fontWeight: "800", color: colors.muted },
  chipTextActive: { color: "#fff" },
  errorText:   { color: colors.danger, fontSize: 12, fontWeight: "700", marginTop: 4 },

  toggleRow:   { flexDirection: "row", gap: 12 },
  toggleItem:  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f8fafc", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.line },
  toggleLabel: { fontSize: 13, fontWeight: "800", color: colors.ink },

  saveBtn:     { marginTop: 4 },

  // ── Bulk action bar ──
  bulkBar: {
    flexDirection: "row", alignItems: "center", flexWrap: "wrap",
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    backgroundColor: colors.ink,
  },
  bulkCount:        { color: "#fff", fontWeight: "900", fontSize: 14, marginRight: 4 },
  bulkSelectAll:    { paddingHorizontal: 10, paddingVertical: 4 },
  bulkSelectAllText:{ color: colors.warning, fontWeight: "800", fontSize: 12 },
  bulkActions:      { flexDirection: "row", gap: 8, marginLeft: "auto" },
  bulkBtn:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  bulkBtnSuccess:   { backgroundColor: colors.accent },
  bulkBtnMuted:     { backgroundColor: "#e2e8f0" },
  bulkBtnText:      { color: "#fff", fontWeight: "900", fontSize: 13 },
  bulkCancel:       { paddingHorizontal: 10, paddingVertical: 7, justifyContent: "center" },
  bulkCancelText:   { color: colors.subtle, fontWeight: "900", fontSize: 16 },

  // ── Item selection ──
  itemCardSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primarySoft },
  checkCircle: {
    position: "absolute", top: 8, left: 8, zIndex: 2,
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.muted,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  checkCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark:         { color: "#fff", fontSize: 13, fontWeight: "900" },
});
