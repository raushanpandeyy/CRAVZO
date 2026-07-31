import { Platform } from "react-native";
import { createMMKV } from "react-native-mmkv";

const isWeb = Platform.OS === "web";
const nativeStorage = isWeb ? null : createMMKV({ id: "dodago-storage" });

export const storage = isWeb
  ? {
      getString: (key) => localStorage.getItem(key) ?? undefined,
      set: (key, value) => localStorage.setItem(key, String(value)),
      delete: (key) => localStorage.removeItem(key),
      remove: (key) => localStorage.removeItem(key),
    }
  : {
      getString: (key) => nativeStorage.getString(key),
      set: (key, value) => nativeStorage.set(key, value),
      delete: (key) => nativeStorage.remove(key),
      remove: (key) => nativeStorage.remove(key),
    };
