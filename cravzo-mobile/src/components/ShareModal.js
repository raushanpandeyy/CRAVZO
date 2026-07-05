import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
} from "react-native";
import {
  MessageCircle,
  Send,
  MessageSquare,
  Mail,
  Copy,
  ExternalLink,
  X,
} from "lucide-react-native";
import {
  shareOnWhatsApp,
  shareOnTelegram,
  shareOnSMS,
  shareOnEmail,
  copyToClipboard,
  shareNative,
} from "../utils/share";

const platforms = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    bg: "bg-emerald-500",
    action: shareOnWhatsApp,
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: Send,
    bg: "bg-sky-500",
    action: shareOnTelegram,
  },
  {
    id: "sms",
    label: "SMS",
    icon: MessageSquare,
    bg: "bg-blue-500",
    action: shareOnSMS,
  },
  {
    id: "email",
    label: "Email",
    icon: Mail,
    bg: "bg-gray-600",
    action: shareOnEmail,
  },
];

export default function ShareModal({ url, text, visible, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    const ok = await shareNative(url, text);
    if (ok) onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-end"
        activeOpacity={1}
        onPress={onClose}
      >
        <View onStartShouldSetResponder={() => true}>
          <View className="rounded-t-3xl bg-white p-6 pb-10">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-black text-slate-900">Share</Text>
              <TouchableOpacity
                onPress={onClose}
                className="rounded-full p-1"
              >
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View className="mt-4 flex-row justify-between">
              {platforms.map((p) => {
                const Icon = p.icon;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      p.action(url, text);
                      onClose();
                    }}
                    className="items-center gap-2"
                  >
                    <View
                      className={`h-14 w-14 items-center justify-center rounded-2xl ${p.bg}`}
                    >
                      <Icon size={24} color="#fff" />
                    </View>
                    <Text className="text-[11px] font-bold text-slate-600">
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="mt-6 space-y-3">
              <TouchableOpacity
                onPress={handleCopy}
                className="flex-row items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3"
              >
                <Copy size={20} color="#94a3b8" />
                <Text className="text-sm font-bold text-slate-700">
                  {copied ? "Copied!" : "Copy Link"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNativeShare}
                className="flex-row items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3"
              >
                <ExternalLink size={20} color="#94a3b8" />
                <Text className="text-sm font-bold text-slate-700">More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
