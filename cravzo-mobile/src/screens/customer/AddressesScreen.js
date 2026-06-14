import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { MapPin, Plus, Check, Pencil, Trash2, ChevronLeft } from "lucide-react-native";
import { colors } from "../../constants/colors";

const sampleAddresses = [
  { id: "1", label: "Home", fullName: "Raushan Kumar", phone: "9876543210", line1: "123, Main Street", line2: "Apt 4B", city: "Noida", state: "UP", postalCode: "201301", isDefault: true },
  { id: "2", label: "Work", fullName: "Raushan Kumar", phone: "9876543210", line1: "456, Office Tower", line2: "Sector 62", city: "Noida", state: "UP", postalCode: "201309", isDefault: false },
];

export default function AddressesScreen({ navigation }) {
  const [addresses] = useState(sampleAddresses);
  const [showForm, setShowForm] = useState(false);

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
        {addresses.length === 0 ? (
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
                      {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ""}{addr.city}, {addr.state} - {addr.postalCode}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-1">{addr.phone}</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                      <Pencil size={14} color={colors.slate[600]} />
                    </TouchableOpacity>
                    <TouchableOpacity className="h-8 w-8 items-center justify-center rounded-full bg-rose-50">
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
            <TextInput placeholder="Label (Home/Work/Other)" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" />
            <TextInput placeholder="Full Name" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" />
            <TextInput placeholder="Phone Number" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" keyboardType="phone-pad" />
            <TextInput placeholder="House/Flat/Building" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" />
            <TextInput placeholder="Landmark (optional)" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" />
            <View className="flex-row gap-3">
              <TextInput placeholder="City" className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" />
              <TextInput placeholder="Pincode" className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholderTextColor="#94a3b8" keyboardType="number-pad" />
            </View>
            <TouchableOpacity className="rounded-2xl bg-indigo-600 py-3.5">
              <Text className="text-center font-extrabold text-white">Save Address</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity onPress={() => setShowForm(!showForm)}
          className="flex-row items-center justify-center gap-2 mt-4 rounded-2xl border-2 border-dashed border-slate-300 p-4 mb-8">
          <Plus size={20} color={colors.slate[500]} />
          <Text className="font-bold text-slate-500">{showForm ? "Cancel" : "Add New Address"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
