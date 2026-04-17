import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "mzflow_admin_token";

/** Decodes the Base64-encoded token and checks if it is still valid. */
function isTokenExpired(token: string): boolean {
  try {
    const decoded = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
    // Format: id:email:expiresAt:tokenVersion:signature
    const parts = decoded.split(":");
    if (parts.length < 3) return true;
    const expiresAt = parseInt(parts[2], 10);
    if (isNaN(expiresAt)) return true;
    return Date.now() > expiresAt;
  } catch {
    return true; // Treat malformed tokens as expired
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    // On init, reject expired tokens immediately
    if (stored && isTokenExpired(stored)) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return stored;
  });

  const login = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  // Listen for forced logout events (e.g., 401 from API)
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("admin-logout", handler);
    return () => window.removeEventListener("admin-logout", handler);
  }, [logout]);

  // Periodically check if the stored token has expired (every 60 seconds)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (isTokenExpired(token)) {
        logout();
        // Dispatch event so any open admin pages redirect to login
        window.dispatchEvent(new Event("admin-logout"));
      }
    }, 60_000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
