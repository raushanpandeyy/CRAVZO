import { Alert, Platform } from "react-native";

export const explainPermission = ({ title, message, confirmText = "Allow" }) => {
  if (Platform.OS === "web") return Promise.resolve(true);

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Not now", style: "cancel", onPress: () => resolve(false) },
      { text: confirmText, onPress: () => resolve(true) },
    ]);
  });
};

export const permissionMessages = {
  location:
    "Dodago uses your location only to show nearby restaurants, help you select a delivery address, and improve delivery accuracy. You can search manually if you do not allow it.",
  camera:
    "Dodago uses your camera only when you choose to take a profile photo or share an image in support chat.",
  gallery:
    "Dodago uses gallery access only when you choose a profile photo or share an image in support chat.",
  notifications:
    "Dodago uses notifications for order status, delivery updates, support replies, and offers only when you allow them.",
};
