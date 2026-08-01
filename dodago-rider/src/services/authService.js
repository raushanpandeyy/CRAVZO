import { apiRequest } from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { storage } from "./storage";

export const normalizeUser = (user = {}) => {
  const raw = user?.data?.user || user?.user || user?.data || user || {};
  return {
    ...raw,
    id: raw.id || raw._id,
    name: raw.name || raw.fullName || "",
    email: raw.email || "",
    phone: raw.phone || "",
    avatarUrl: raw.avatarUrl || raw.imageUrl || raw.photoUrl || "",
    role: raw.role || raw.accountType || "RIDER",
    accountType: (raw.accountType || raw.role || "rider").toLowerCase(),
    isOnline: Boolean(raw.isOnline),
    isLoggedIn: true,
  };
};

const ensureRiderAccount = (user) => {
  const accountType = (user?.accountType || user?.role || "").toLowerCase();
  if (accountType !== "rider") {
    throw new Error("This app is only for rider accounts.");
  }
};

export const persistSession = async ({ user, token }) => {
  if (token) await storage.set("authToken", token);
  if (user) await storage.set("user", JSON.stringify(normalizeUser(user)));
};

export const clearSession = async () => storage.multiRemove(["authToken", "user"]);

export const login = async (payload) => {
  const response = await apiRequest(API_ENDPOINTS.auth.login, { method: "POST", data: payload });
  const result = response.data || response;
  const user = normalizeUser(result.user || result);
  ensureRiderAccount(user);
  await persistSession({ user, token: result.token });
  return { ...result, user };
};

export const logout = async () => {
  try {
    await apiRequest(API_ENDPOINTS.auth.logout, { method: "POST" });
  } catch {}
  await clearSession();
};

export const loadCurrentUser = async () => {
  const token = await storage.get("authToken");
  if (!token) return null;

  try {
    const cached = await storage.get("user");
    if (cached) {
      const user = normalizeUser(JSON.parse(cached));
      ensureRiderAccount(user);
      return user;
    }
    const response = await apiRequest(API_ENDPOINTS.auth.me);
    const result = response.data || response;
    const user = normalizeUser(result.user || result);
    ensureRiderAccount(user);
    await persistSession({ user, token });
    return user;
  } catch {
    await clearSession();
    return null;
  }
};

export const getStoredUser = async () => {
  const raw = await storage.get("user");
  return raw ? normalizeUser(JSON.parse(raw)) : null;
};
