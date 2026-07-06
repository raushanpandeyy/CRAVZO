import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from "react-native";
import { ChevronLeft, Upload, FileText, Info, CheckCircle2, AlertTriangle } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { bulkImportMenuItems } from "../../services/vendorService";

export default function BulkImportScreen({ navigation }) {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    if (!raw.trim()) { Alert.alert("Error", "Paste menu items first"); return; }
    setLoading(true);
    setResult(null);
    try {
      let items;
      try {
        items = JSON.parse(raw.trim());
      } catch {
        items = raw.trim().split("\n").filter(Boolean).map((line) => {
          const parts = line.split(",").map((s) => s.trim());
          return {
            name: parts[0],
            price: Number(parts[1]) || 0,
            category: parts[2] || "Other",
            description: parts[3] || "",
            isAvailable: parts[4]?.toLowerCase() !== "no",
            isVeg: parts[5]?.toLowerCase() === "veg",
            preparationTime: Number(parts[6]) || 15,
            image: parts[7] || "",
          };
        });
      }
      if (!Array.isArray(items) || items.length === 0) {
        Alert.alert("Error", "No valid items found"); return;
      }
      const res = await bulkImportMenuItems(items);
      setResult(res);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const sample = `name,price,category,description,available,veg,prepTime,image
Butter Chicken,320,Main Course,Creamy tomato curry,yes,no,20,
Dal Makhani,220,Main Course,Black lentils simmered overnight,yes,yes,25,
Garlic Naan,45,Breads,Buttery garlic bread,yes,yes,10,https://example.com/naan.jpg
Gulab Jamun,120,Dessert,Rose-syrup dumplings,yes,yes,15,`;

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Bulk Import Menu</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6 pb-8">
        <View className="bg-amber-50 rounded-3xl p-4 mb-4 border-l-4 border-amber-400">
          <View className="flex-row items-start gap-2">
            <Info size={18} color="#d97706" style={{ marginTop: 2 }} />
            <View className="flex-1">
              <Text className="font-bold text-amber-800 mb-1">CSV Format</Text>
              <Text className="text-xs text-amber-700">Paste CSV rows or a JSON array. Each row: name, price, category, description, available (yes/no), veg (veg/no), prep time (mins), image URL</Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-3xl p-4 shadow-sm mb-4">
          <Text className="font-bold text-slate-900 mb-2">Sample</Text>
          <View className="bg-slate-50 rounded-2xl p-3">
            <Text className="text-[11px] text-slate-600 font-mono">{sample}</Text>
          </View>
        </View>

        <Text className="text-sm font-bold text-slate-700 mb-2">Paste CSV or JSON</Text>
        <TextInput value={raw} onChangeText={setRaw} multiline textAlignVertical="top"
          className="bg-white rounded-3xl border border-slate-200 px-5 py-4 text-sm min-h-[200]"
          placeholder="Paste CSV rows or JSON array here..." />

        <TouchableOpacity onPress={handleImport} disabled={loading}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 mt-4 mb-6">
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Upload size={20} color="#fff" />
          )}
          <Text className="font-extrabold text-white">{loading ? "Importing..." : "Import Items"}</Text>
        </TouchableOpacity>

        {result && (
          <View className={`rounded-3xl p-5 ${result.success !== false ? "bg-emerald-50 border-l-4 border-emerald-500" : "bg-rose-50 border-l-4 border-rose-500"}`}>
            <View className="flex-row items-start gap-2">
              {result.success !== false ? (
                <CheckCircle2 size={22} color="#059669" style={{ marginTop: 2 }} />
              ) : (
                <AlertTriangle size={22} color="#e11d48" style={{ marginTop: 2 }} />
              )}
              <View className="flex-1">
                <Text className={`font-extrabold text-lg ${result.success !== false ? "text-emerald-800" : "text-rose-800"}`}>
                  {result.success !== false ? "Import Successful" : "Import Failed"}
                </Text>
                {result.message && <Text className="text-sm text-slate-600 mt-1">{result.message}</Text>}
                {result.count != null && <Text className="text-sm font-bold text-emerald-700 mt-1">{result.count} items imported</Text>}
              </View>
            </View>
          </View>
        )}

        <View className="bg-white rounded-3xl p-5 shadow-sm mt-4">
          <Text className="font-bold text-slate-900 mb-3">JSON Array Example</Text>
          <View className="bg-slate-50 rounded-2xl p-3">
            <Text className="text-[11px] text-slate-600 font-mono">
              {JSON.stringify([
                { name: "Paneer Tikka", price: 280, category: "Starters", description: "Grilled cottage cheese", isAvailable: true, isVeg: true, preparationTime: 20 },
                { name: "Chicken Biryani", price: 350, category: "Main Course", description: "Fragrant rice with chicken", isAvailable: true, isVeg: false, preparationTime: 30 },
              ], null, 2)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
