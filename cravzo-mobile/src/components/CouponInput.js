import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Tag, ChevronDown, ChevronUp, X } from "lucide-react-native";
import { colors } from "../constants/colors";

const formatCurrency = (amount) => `\u20B9${Math.floor(amount)}`;

const CouponInput = ({ onApply, currentDiscount, onRemove, placeholder = "Enter coupon code", accentColor = "#059669", accentBgColor = "#ecfdf5" }) => {
  const [couponCode, setCouponCode] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!couponCode.trim()) return;
    setIsApplying(true);
    setError("");
    try {
      await onApply(couponCode.trim());
      setCouponCode("");
      setIsExpanded(false);
    } catch (err) {
      setError(err.message || "Invalid coupon code");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <View className="border-t border-slate-100 pt-4">
      {currentDiscount > 0 ? (
        <View className="flex-row items-center justify-between rounded-xl p-4" style={{ backgroundColor: accentBgColor }}>
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: accentBgColor }}>
              <Tag size={20} color={accentColor} />
            </View>
            <View>
              <Text className="font-bold" style={{ color: accentColor }}>Code Applied</Text>
              <Text className="text-sm" style={{ color: accentColor }}>-{formatCurrency(currentDiscount)}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onRemove}
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: accentBgColor }}
          >
            <X size={16} color={accentColor} />
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <TouchableOpacity
            onPress={() => setIsExpanded(!isExpanded)}
            className="flex-row items-center justify-between rounded-xl border border-dashed border-slate-300 p-4"
          >
            <View className="flex-row items-center gap-3">
              <Tag size={20} color={colors.slate[400]} />
              <Text className="font-medium text-slate-700">Apply Coupon</Text>
            </View>
            {isExpanded ? <ChevronUp size={20} color={colors.slate[400]} /> : <ChevronDown size={20} color={colors.slate[400]} />}
          </TouchableOpacity>
          {isExpanded ? (
            <View className="mt-3 flex-row gap-2">
              <TextInput
                value={couponCode}
                onChangeText={(t) => setCouponCode(t.toUpperCase())}
                placeholder={placeholder}
                placeholderTextColor={colors.slate[500]}
                autoCapitalize="characters"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
              />
              <TouchableOpacity
                onPress={handleApply}
                disabled={!couponCode.trim() || isApplying}
                className="rounded-xl px-6 py-3 items-center justify-center"
                style={{ backgroundColor: accentColor, opacity: (!couponCode.trim() || isApplying) ? 0.6 : 1 }}
              >
                <Text className="font-bold text-white">{isApplying ? "..." : "Apply"}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {error ? <Text className="mt-2 text-sm text-red-500">{error}</Text> : null}
        </View>
      )}
    </View>
  );
};

export default CouponInput;
