import { useState, useEffect, useCallback } from "react";
import type { User } from "@shared/schema";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("grizzly_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({ user, isLoading: false, isAuthenticated: true });
      } catch {
        localStorage.removeItem("grizzly_user");
        setAuthState({ user: null, isLoading: false, isAuthenticated: false });
      }
    } else {
      setAuthState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const login = useCallback((user: User) => {
    localStorage.setItem("grizzly_user", JSON.stringify(user));
    setAuthState({ user, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("grizzly_user");
    setAuthState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  const isAdmin = authState.user?.role === "admin";
  const isDriver = authState.user?.role === "driver";

  return {
    ...authState,
    login,
    logout,
    isAdmin,
    isDriver,
  };
}
