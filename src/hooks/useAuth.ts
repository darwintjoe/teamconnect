import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { getCurrentUser, setCurrentUser, login as dbLogin, logout as dbLogout, createUser, getUserByEmail, updateUser as dbUpdateUser } from '@/lib/db';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = useCallback((email: string): { success: boolean; message: string } => {
    const user = dbLogin(email);
    if (user) {
      setUser(user);
      return { success: true, message: 'Login successful' };
    }
    return { success: false, message: 'User not found. Please check your email.' };
  }, []);

  const register = useCallback((name: string, email: string, role?: string): { success: boolean; message: string } => {
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return { success: false, message: 'Email already registered' };
    }

    const newUser = createUser({
      name,
      email,
      role: role || 'Team Member',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    });

    setCurrentUser(newUser);
    setUser(newUser);
    return { success: true, message: 'Registration successful' };
  }, []);

  const logout = useCallback(() => {
    dbLogout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (user) {
      const updated = dbUpdateUser(user.id, updates);
      if (updated) {
        setCurrentUser(updated);
        setUser(updated);
      }
      return updated;
    }
    return null;
  }, [user, dbUpdateUser]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };
}
