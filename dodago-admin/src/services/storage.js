import { MMKV } from "react-native-mmkv";

// Lazy singleton — do NOT instantiate at module scope.
// react-native-mmkv v4 (Nitro-based) requires the JS runtime to be
// fully ready before `new MMKV()` is called. Instantiating at module
// scope triggers the "[runtime not ready]: TypeError: undefined cannot
// be used as a constructor" crash on app launch.
let _storage = null;
const getStorage = () => {
  if (!_storage) _storage = new MMKV({ id: "dodago-admin" });
  return _storage;
};

export const Storage = {
  set:    (key, value) => getStorage().set(key, typeof value === "string" ? value : JSON.stringify(value)),
  get:    (key)        => { const v = getStorage().getString(key); try { return v ? JSON.parse(v) : null; } catch { return v ?? null; } },
  delete: (key)        => getStorage().delete(key),
  clear:  ()           => getStorage().clearAll(),
};

export const TOKEN_KEY  = "admin_token";
export const USER_KEY   = "admin_user";
export const ALERTS_KEY = "admin_alerts";
