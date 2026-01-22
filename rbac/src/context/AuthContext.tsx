import React, { createContext, useEffect, useState } from "react";
import {
  AuthUser,
  clearAuthStorage,
  getAuthFromStorage,
  saveAuthToStorage,
} from "../lib/auth";

type AuthState = { token: string; user: AuthUser } | null;

export const AuthContext = createContext<{
  auth: AuthState;
  ready: boolean; // ✅ added
  setAuth: (a: AuthState) => void;
  logout: () => void;
}>({
  auth: null,
  ready: false,
  setAuth: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getAuthFromStorage();
    if (stored) setAuthState(stored);
    setReady(true);
  }, []);

  function setAuth(a: AuthState) {
    setAuthState(a);
    if (a) saveAuthToStorage(a.token, a.user);
    else clearAuthStorage();
  }

  function logout() {
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, ready, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
