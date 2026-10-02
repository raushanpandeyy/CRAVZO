import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "dodago-admin" });

export const Storage = {
  set:    (key, value) => storage.set(key, typeof value === "string" ? value : JSON.stringify(value)),
  get:    (key)        => { const v = storage.getString(key); try { return v ? JSON.parse(v) : null; } catch { return v ?? null; } },
  delete: (key)        => storage.delete(key),
  clear:  ()           => storage.clearAll(),
};

export const TOKEN_KEY    = "admin_token";
export const USER_KEY     = "admin_user";
export const ALERTS_KEY   = "admin_alerts";
