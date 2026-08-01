import AsyncStorage from "@react-native-async-storage/async-storage";

export const storage = {
  async get(key) {
    return AsyncStorage.getItem(key);
  },
  async set(key, value) {
    return AsyncStorage.setItem(key, value);
  },
  async remove(key) {
    return AsyncStorage.removeItem(key);
  },
  async multiRemove(keys) {
    return AsyncStorage.multiRemove(keys);
  },
};
