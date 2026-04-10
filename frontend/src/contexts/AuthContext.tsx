import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserRole } from '@/types';

import { authService } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // Small delay to ensure state is stable
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string, rememberMe: boolean = false): Promise<void> => {
    const data = await authService.login({ username, password });
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem('token', data.access);
    storage.setItem('refreshToken', data.refresh);
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('loginTimestamp', Date.now().toString());
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('loginTimestamp');
    }

    const userProfile = await authService.getCurrentUser();
    setUser(userProfile);
    storage.setItem('user', JSON.stringify(userProfile));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
