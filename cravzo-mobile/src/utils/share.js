import { Linking, Clipboard, Share } from "react-native";

const APP_BASE_URL = "https://dodago.shop";

export const getShareUrl = {
  restaurant: (id) =>
    `${APP_BASE_URL}/restaurant/${id}?ref=share`,
  dish: (name) =>
    `${APP_BASE_URL}/dish/${encodeURIComponent(name)}?ref=share`,
};

export const getShareText = {
  restaurant: (name) =>
    `Check out ${name} on Dodago!`,
  dish: (name) =>
    `I'm craving ${name} on Dodago!`,
};

export function shareOnWhatsApp(url, text) {
  Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text + " " + url)}`);
}

export function shareOnTelegram(url, text) {
  Linking.openURL(`tg://msg?text=${encodeURIComponent(text + " " + url)}`);
}

export function shareOnSMS(url, text) {
  Linking.openURL(`sms:?body=${encodeURIComponent(text + " " + url)}`);
}

export function shareOnEmail(url, text) {
  Linking.openURL(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`);
}

export async function copyToClipboard(url) {
  Clipboard.setString(url);
  return true;
}

export async function shareNative(url, text) {
  try {
    const result = await Share.share({
      title: "Dodago",
      message: `${text}\n${url}`,
      url,
    });
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}
