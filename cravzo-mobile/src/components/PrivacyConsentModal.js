import React, { useEffect, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Bell, Check, MapPin, Megaphone, Shield, Square, Image as ImageIcon } from "lucide-react-native";
import { useSelector } from "react-redux";

import { colors } from "../constants/colors";
import { getPrivacyConsent, hasCurrentPrivacyConsent, savePrivacyConsent } from "../services/privacyConsent";
import { registerForPushNotifications } from "../services/notificationService";

const ConsentToggle = ({ icon: Icon, title, description, value, onToggle, required = false }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={() => !required && onToggle(!value)}
    className="flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-4"
  >
    <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
      <Icon size={18} color={colors.brand[600]} />
    </View>
    <View className="flex-1">
      <View className="flex-row items-start gap-2">
        <Text className="flex-1 text-sm font-extrabold text-slate-900">{title}</Text>
        <View className={`h-6 w-6 items-center justify-center rounded-md border ${value ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"}`}>
          {value ? <Check size={15} color="#fff" /> : <Square size={12} color="transparent" />}
        </View>
      </View>
      <Text className="mt-1 text-xs leading-5 text-slate-500">{description}</Text>
    </View>
  </TouchableOpacity>
);

export default function PrivacyConsentModal() {
  const { isLoggedIn } = useSelector((state) => state.user);
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState({
    location: false,
    notifications: false,
    media: false,
    marketing: false,
    ageConfirmed: false,
    acceptedNotice: false,
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    const consent = getPrivacyConsent();
    setForm((current) => ({ ...current, ...(consent || {}) }));
    setVisible(!hasCurrentPrivacyConsent());
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  const canContinue = form.ageConfirmed && form.acceptedNotice;

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!canContinue) return;
    const saved = savePrivacyConsent(form);
    setVisible(false);
    if (saved.notifications) {
      registerForPushNotifications().catch((error) => {
        console.warn("Push notification registration failed:", error.message);
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[92%] rounded-t-[28px] bg-[#F4F7FB] px-4 pb-8 pt-4">
          <View className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="rounded-3xl bg-indigo-950 p-5">
              <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Shield size={24} color="#fff" />
              </View>
              <Text className="text-2xl font-extrabold text-white">Privacy & Consent Notice</Text>
              <Text className="mt-2 text-sm leading-6 text-indigo-100">
                Dodago processes personal data to create your account, place orders, deliver food, process payments, prevent fraud, provide support, and keep the service secure.
              </Text>
            </View>

            <View className="mt-4 gap-3">
              <ConsentToggle
                icon={Shield}
                title="Essential account and order processing"
                description="Required for signup/login, addresses, cart, orders, payments, support, fraud prevention, and legal compliance. This cannot be switched off while using the app."
                value
                required
              />
              <ConsentToggle
                icon={MapPin}
                title="Location access"
                description="Used only when you ask for nearby restaurants or select a delivery address. You can still search manually."
                value={form.location}
                onToggle={(value) => updateField("location", value)}
              />
              <ConsentToggle
                icon={Bell}
                title="Push notifications"
                description="Used for order status, delivery updates, support replies, and important account alerts."
                value={form.notifications}
                onToggle={(value) => updateField("notifications", value)}
              />
              <ConsentToggle
                icon={ImageIcon}
                title="Camera and gallery"
                description="Used only when you choose to upload a profile photo or send an image in support chat."
                value={form.media}
                onToggle={(value) => updateField("media", value)}
              />
              <ConsentToggle
                icon={Megaphone}
                title="Offers and marketing"
                description="Optional promotions and offers. Transactional order messages may still be sent."
                value={form.marketing}
                onToggle={(value) => updateField("marketing", value)}
              />
              <ConsentToggle
                icon={Shield}
                title="I am 18+ or have parent/guardian consent"
                description="DPDP Act requires verifiable parent or guardian consent for children. Do not continue without it if you are under 18."
                value={form.ageConfirmed}
                onToggle={(value) => updateField("ageConfirmed", value)}
              />
              <ConsentToggle
                icon={Shield}
                title="I have read the privacy notice"
                description="You can access, correct, erase, withdraw consent, nominate a representative, and raise grievances from support or privacy@dodago.shop."
                value={form.acceptedNotice}
                onToggle={(value) => updateField("acceptedNotice", value)}
              />
            </View>

            <View className="mt-4 rounded-2xl bg-white p-4">
              <Text className="text-sm font-extrabold text-slate-900">Grievance Officer</Text>
              <Text className="mt-1 text-xs leading-5 text-slate-500">
                Name: Dodago Grievance Officer (Privacy). Email: privacy@dodago.shop. You may also contact support@dodago.shop for account and order data requests.
              </Text>
            </View>

            <TouchableOpacity
              disabled={!canContinue}
              onPress={handleSave}
              className="mt-4 rounded-2xl bg-indigo-600 py-4 disabled:opacity-50"
            >
              <Text className="text-center text-sm font-extrabold text-white">Save Consent & Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
