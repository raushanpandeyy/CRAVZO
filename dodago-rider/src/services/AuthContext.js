import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadCurrentUser, login as loginRequest, logout as logoutRequest } from "../services/authService";
import { setUnauthorizedHandler } from "../services/api";
import { registerForPushNotifications, deregisterPushNotifications } from "./notificationService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children, navigationRef }) => {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadCurrentUser().then((currentUser) => {
      if (mounted) {
        setUser(currentUser);
        if (currentUser) {
          // Register push token for existing session
          registerForPushNotifications(navigationRef);
        }
      }
    }).finally(() => {
      if (mounted) setBooting(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (payload) => {
    const result = await loginRequest(payload);
    setUser(result.user);
    // Register push token after login
    registerForPushNotifications(navigationRef);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await deregisterPushNotifications();
    await logoutRequest();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, setUser, booting, login, logout }), [user, booting, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
