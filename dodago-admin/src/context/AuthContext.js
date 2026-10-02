import React, { createContext, useContext, useEffect, useState } from "react";
import { signIn, signOut, getStoredUser, getStoredToken } from "../services/authService.js";
import { connectSocket, disconnectSocket } from "../services/socketService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [booting, setBooting] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const storedUser  = getStoredUser();
    const storedToken = getStoredToken();
    if (storedUser && storedToken) {
      setUser(storedUser);
      connectSocket();
    }
    setBooting(false);
  }, []);

  const login = async (email, password) => {
    const { user: u } = await signIn(email, password);
    setUser(u);
    connectSocket();
    return u;
  };

  const logout = () => {
    signOut();
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, booting, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
