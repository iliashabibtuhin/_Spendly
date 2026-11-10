import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setUnauthorizedHandler, tokenStore } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" while an existing token is being verified on first load
  const [status, setStatus] = useState(() => (tokenStore.get() ? "loading" : "ready"));

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .get("/auth/me")
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.clear())
      .finally(() => setStatus("ready"));
  }, []);

  const handleAuth = useCallback(({ user, token }) => {
    tokenStore.set(token);
    setUser(user);
  }, []);

  const login = useCallback((values) => api.post("/auth/login", values).then(handleAuth), [handleAuth]);
  const register = useCallback((values) => api.post("/auth/register", values).then(handleAuth), [handleAuth]);

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
