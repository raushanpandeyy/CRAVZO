import { login as loginApi } from "./api.js";
import { Storage, TOKEN_KEY, USER_KEY } from "./storage.js";

export const signIn = async (email, password) => {
  const res = await loginApi(email.trim().toLowerCase(), password);
  const { user, token } = res.data || {};

  if (!user || !token) throw new Error("Invalid response from server");
  if (user.role !== "ADMIN") throw new Error("This app is for Dodago admins only");

  Storage.set(TOKEN_KEY, token);
  Storage.set(USER_KEY, user);
  return { user, token };
};

export const signOut = () => {
  Storage.delete(TOKEN_KEY);
  Storage.delete(USER_KEY);
};

export const getStoredUser  = () => Storage.get(USER_KEY);
export const getStoredToken = () => Storage.get(TOKEN_KEY);
