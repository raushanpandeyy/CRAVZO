import { useEffect, useState } from "react";

import { getStoredUser, loadCurrentUser, logout as logoutRequest } from "../services/authService";

export function useAuth() {
  const [user, setUser] = useState(getStoredUser());
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const syncUser = () => {
      setUser(getStoredUser());
    };

    const hydrate = async () => {
      await loadCurrentUser();
      syncUser();
      setIsHydrating(false);
    };

    window.addEventListener("userChange", syncUser);
    hydrate();

    return () => window.removeEventListener("userChange", syncUser);
  }, []);

  const logout = async () => {
    await logoutRequest();
    setUser(null);
  };

  return {
    user,
    isHydrating,
    logout,
  };
}
