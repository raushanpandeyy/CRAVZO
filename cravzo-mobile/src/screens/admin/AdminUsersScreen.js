import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
} from "react-native";
import { Search, User, Store, Bike, Shield, ChevronRight, X } from "lucide-react-native";
import { colors } from "../../constants/colors";

const sampleUsers = [
  { id: "1", name: "Raushan Kumar", email: "raushan@example.com", type: "customer", status: "Active", orders: 23 },
  { id: "2", name: "Amrit Restaurant", email: "amrit@example.com", type: "vendor", status: "Active", orders: 145 },
  { id: "3", name: "Vikram S.", email: "vikram@example.com", type: "rider", status: "Active", orders: 89 },
  { id: "4", name: "New Vendor", email: "pending@example.com", type: "vendor", status: "Pending", orders: 0 },
];

const typeIcons = { customer: User, vendor: Store, rider: Bike, admin: Shield };
const typeColors = { customer: "#6366f1", vendor: "#f59e0b", rider: "#10b981", admin: "#ef4444" };

export default function AdminUsersScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const filters = ["All", "Customer", "Vendor", "Rider", "Pending"];
  const filtered = sampleUsers.filter((u) => {
    if (filter !== "All" && filter === "Pending" && u.status !== "Pending") return false;
    if (filter !== "All" && filter !== "Pending" && u.type !== filter.toLowerCase()) return false;
    if (query && !u.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <Text className="text-xl font-extrabold text-slate-900">User Management</Text>
        <View className="flex-row items-center bg-slate-50 rounded-xl px-4 h-11 mt-3 border border-slate-200">
          <Search size={16} color="#94a3b8" />
          <TextInput className="flex-1 ml-2 text-sm text-slate-900" placeholder="Search users..." placeholderTextColor="#94a3b8"
            value={query} onChangeText={setQuery} />
          {query ? <TouchableOpacity onPress={() => setQuery("")}><X size={16} color="#94a3b8" /></TouchableOpacity> : null}
        </View>
      </View>
      <ScrollView className="flex-1">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3" contentContainerStyle={{ gap: 8 }}>
          {filters.map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              className={`rounded-full px-5 py-2 ${filter === f ? "bg-indigo-600" : "bg-white border border-slate-200"}`}>
              <Text className={`text-xs font-extrabold ${filter === f ? "text-white" : "text-slate-700"}`}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View className="px-4 space-y-3 pb-8">
          {filtered.map((u) => {
            const Icon = typeIcons[u.type] || User;
            const color = typeColors[u.type] || "#6366f1";
            return (
              <TouchableOpacity key={u.id} className="bg-white rounded-3xl p-4 shadow-sm">
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={22} color={color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-bold text-slate-900">{u.name}</Text>
                      <View className={`rounded-full px-2 py-0.5 ${u.status === "Active" ? "bg-emerald-50" : "bg-amber-50"}`}>
                        <Text className={`text-[9px] font-extrabold ${u.status === "Active" ? "text-emerald-600" : "text-amber-600"}`}>
                          {u.status}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-500 mt-0.5">{u.email}</Text>
                    <Text className="text-xs text-slate-400 mt-0.5">{u.orders} orders</Text>
                  </View>
                  <ChevronRight size={18} color={colors.slate[400]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
