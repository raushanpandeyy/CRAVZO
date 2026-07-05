import { auth } from "./firebaseConfig";
import { apiRequest } from "./api";
import { persistSession, clearSession } from "./authService";

export const loginWithFirebase = async (email, password) => {
  const credential = await auth.signInWithEmailAndPassword(email, password);
  const idToken = await credential.user.getIdToken();
  const data = await apiRequest("/api/auth/firebase", {
    method: "POST",
    data: { idToken },
  });
  persistSession(data);
  return data;
};

export const signupWithFirebase = async (email, password, name) => {
  const credential = await auth.createUserWithEmailAndPassword(email, password);
  const idToken = await credential.user.getIdToken();
  const data = await apiRequest("/api/auth/firebase", {
    method: "POST",
    data: { idToken, name },
  });
  persistSession(data);
  return data;
};

export const signOutFirebase = async () => {
  await auth.signOut();
  clearSession();
};

export const onFirebaseAuthChanged = (callback) => {
  return auth.onAuthStateChanged(callback);
};

export const getCurrentFirebaseToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};
