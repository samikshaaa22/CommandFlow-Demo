'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from './types';
import { loginApi, registerApi } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthResponse>;
  register: (username: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  canMutate: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'inventory_auth_token';
const USER_KEY = 'inventory_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to load auth session from localStorage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await loginApi(username, password);
      const authUser: User = {
        username: res.username || username,
        role: res.role,
      };

      setToken(res.token);
      setUser(authUser);

      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));

      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string, role: string = 'viewer') => {
    setIsLoading(true);
    try {
      await registerApi(username, password, role);
      // Automatically login after successful registration
      await login(username, password);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed to remove auth session from localStorage', e);
    }
  };

  const role = user?.role?.toLowerCase() || '';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const canMutate = isAdmin || isManager;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAdmin,
        isManager,
        canMutate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
