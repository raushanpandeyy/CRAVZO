import { Platform } from "react-native";
import { createMMKV } from "react-native-mmkv";

const isWeb = Platform.OS === "web";

export const storage = isWeb
  ? {
      getString: (key) => localStorage.getItem(key),
      set: (key, value) => localStorage.setItem(key, value),
      delete: (key) => localStorage.removeItem(key),
    }
  : createMMKV({ id: "dodago-storage" });
