import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getMe } from "./authService";
import { clearSession, getToken, getUser, setUser } from "./storage";
import { disconnectSocket } from "./socketService";
import { registerForPushNotifications, deregisterPushNotifications } from "./notificationService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children, navigationRef }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) { setLoading(false); return; }

        const stored = await getUser();
        if (stored) {
          setUserState(stored);
          setLoading(false);
          // Register push token for existing session
          registerForPushNotifications(navigationRef);
          return;
        }

        const freshUser = await getMe();
        if (freshUser) {
          await setUser(freshUser);
          setUserState(freshUser);
          registerForPushNotifications(navigationRef);
        }
      } catch {
        await clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback((u) => {
    setUserState(u);
    // Register push token after login
    registerForPushNotifications(navigationRef);
  }, []);

  const signOut = useCallback(async () => {
    await deregisterPushNotifications();
    disconnectSocket();
    await clearSession();
    setUserState(null);
  }, []);

  const updateUser = useCallback((partial) => {
    setUserState((prev) => {
      const next = { ...prev, ...partial };
      setUser(next);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
