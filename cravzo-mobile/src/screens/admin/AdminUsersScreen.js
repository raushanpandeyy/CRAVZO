import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from "react-native";
import { Search, User, Store, Bike, Shield, ChevronRight, X } from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getUsers, updateUserStatus } from "../../services/adminService";

const typeIcons = { customer: User, vendor: Store, rider: Bike, admin: Shield };
const typeColors = { customer: "#6366f1", vendor: "#f59e0b", rider: "#10b981", admin: "#ef4444" };

export default function AdminUsersScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const filters = ["All", "Customer", "Vendor", "Rider", "Pending"];

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== "All") {
        if (filter === "Pending") params.status = "PENDING";
        else params.role = filter.toLowerCase();
      }
      if (query) params.search = query;
      const data = await getUsers(params);
      setUsers(data);
    } catch (err) {
      console.error("Admin users load error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleStatusToggle = (user) => {
    const newStatus = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    Alert.alert(
      `${newStatus === "ACTIVE" ? "Activate" : "Block"} User`,
      `${newStatus === "ACTIVE" ? "Activate" : "Block"} ${user.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: newStatus === "ACTIVE" ? "Activate" : "Block",
          style: newStatus === "BLOCKED" ? "destructive" : "default",
          onPress: async () => {
            try {
              await updateUserStatus(user.id, newStatus);
              setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: newStatus } : u));
            } catch { Alert.alert("Error", "Failed to update status"); }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <Text className="text-xl font-extrabold text-slate-900">User Management</Text>
        <View className="flex-row items-center bg-slate-50 rounded-xl px-4 h-11 mt-3 border border-slate-200">
          <Search size={16} color="#94a3b8" />
          <TextInput className="flex-1 ml-2 text-sm text-slate-900" placeholder="Search users..."
            placeholderTextColor="#94a3b8"
            value={query} onChangeText={setQuery} onSubmitEditing={loadUsers} />
          {query ? <TouchableOpacity onPress={() => { setQuery(""); }}><X size={16} color="#94a3b8" /></TouchableOpacity> : null}
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
          {loading ? (
            <ActivityIndicator size="large" color={colors.brand[600]} style={{ marginTop: 40 }} />
          ) : users.length === 0 ? (
            <View className="items-center py-20">
              <Text className="text-sm text-slate-500">No users found</Text>
            </View>
          ) : (
            users.map((u) => {
              const role = (u.role || u.accountType || "customer").toLowerCase();
              const Icon = typeIcons[role] || User;
              const color = typeColors[role] || "#6366f1";
              const isPending = u.status === "PENDING";
              return (
                <TouchableOpacity key={u.id} className="bg-white rounded-3xl p-4 shadow-sm" onPress={() => handleStatusToggle(u)}>
                  <View className="flex-row items-center gap-3">
                    <View className="h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
                      <Icon size={22} color={color} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-bold text-slate-900">{u.name}</Text>
                        <View className={`rounded-full px-2 py-0.5 ${u.status === "ACTIVE" ? "bg-emerald-50" : isPending ? "bg-amber-50" : "bg-rose-50"}`}>
                          <Text className={`text-[9px] font-extrabold ${u.status === "ACTIVE" ? "text-emerald-600" : isPending ? "text-amber-600" : "text-rose-600"}`}>
                            {u.status}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-slate-500 mt-0.5">{u.email}</Text>
                      <Text className="text-xs text-slate-400 mt-0.5 capitalize">{role}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.slate[400]} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
