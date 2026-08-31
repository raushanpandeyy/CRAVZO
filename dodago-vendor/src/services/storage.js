import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY   = "dodagoVendorToken";
const USER_KEY    = "dodagoVendorUser";

export const getToken   = () => AsyncStorage.getItem(TOKEN_KEY);
export const setToken   = (v) => AsyncStorage.setItem(TOKEN_KEY, v);
export const removeToken= () => AsyncStorage.removeItem(TOKEN_KEY);

export const getUser    = async () => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};
export const setUser    = (u) => AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
export const removeUser = () => AsyncStorage.removeItem(USER_KEY);

export const clearSession = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};
