import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react-native";

import { colors } from "../constants/colors";
import { setBrandedAlertPresenter } from "../services/brandedAlert";

const getTone = (title = "") => {
  const normalized = String(title).toLowerCase();
  if (normalized.includes("success") || normalized.includes("saved") || normalized.includes("sent") || normalized.includes("applied")) {
    return { Icon: CheckCircle2, color: "#059669", bg: "#ecfdf5" };
  }
  if (normalized.includes("delete") || normalized.includes("failed") || normalized.includes("error") || normalized.includes("invalid")) {
    return { Icon: XCircle, color: colors.rose[500], bg: "#fff1f2" };
  }
  if (normalized.includes("required") || normalized.includes("missing") || normalized.includes("permission")) {
    return { Icon: AlertTriangle, color: "#d97706", bg: "#fffbeb" };
  }
  return { Icon: Info, color: colors.brand[700], bg: colors.brand[50] };
};

const normalizeButtons = (buttons) => {
  if (Array.isArray(buttons) && buttons.length) return buttons;
  return [{ text: "OK", style: "default" }];
};

export default function BrandedAlertHost() {
  const [alertConfig, setAlertConfig] = useState(null);

  useEffect(() => setBrandedAlertPresenter(setAlertConfig), []);

  const buttons = useMemo(() => normalizeButtons(alertConfig?.buttons), [alertConfig?.buttons]);
  const tone = useMemo(() => getTone(alertConfig?.title), [alertConfig?.title]);

  const closeAlert = useCallback((button) => {
    const onPress = button?.onPress;
    const onDismiss = alertConfig?.options?.onDismiss;
    setAlertConfig(null);
    setTimeout(() => {
      onPress?.();
      if (!button) onDismiss?.();
    }, 80);
  }, [alertConfig?.options]);

  const handleBackdropPress = () => {
    if (alertConfig?.options?.cancelable) closeAlert(null);
  };

  if (!alertConfig) return null;

  const { Icon } = tone;
  const title = alertConfig.title || "Dodago";
  const message = alertConfig.message || "";

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={handleBackdropPress}>
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: "rgba(15, 23, 42, 0.48)" }}>
        <Pressable className="absolute inset-0" onPress={handleBackdropPress} />
        <View className="w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-2xl">
          <View className="items-center px-6 pb-5 pt-6">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-3xl" style={{ backgroundColor: tone.bg }}>
              <Icon size={28} color={tone.color} />
            </View>
            <Text className="text-center text-xl font-black text-slate-950">{title}</Text>
            {message ? <Text className="mt-2 text-center text-sm font-semibold leading-6 text-slate-500">{message}</Text> : null}
          </View>

          <View className="gap-2 border-t border-slate-100 bg-slate-50 px-4 py-4">
            {buttons.map((button, index) => {
              const isCancel = button.style === "cancel";
              const isDestructive = button.style === "destructive";
              const isPrimary = !isCancel && !isDestructive;
              return (
                <TouchableOpacity
                  key={`${button.text || "button"}-${index}`}
                  activeOpacity={0.85}
                  onPress={() => closeAlert(button)}
                  className="h-12 items-center justify-center rounded-2xl px-4"
                  style={{
                    backgroundColor: isPrimary ? colors.brand[700] : isDestructive ? colors.rose[500] : "#ffffff",
                    borderWidth: isCancel ? 1 : 0,
                    borderColor: colors.slate[200],
                  }}
                >
                  <Text className="text-sm font-black" style={{ color: isCancel ? colors.slate[900] : "#ffffff" }}>
                    {button.text || "OK"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
