import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile data
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profileData?.name || session.user.email?.split('@')[0] || '',
            avatar: profileData?.avatar_url || undefined,
            role: profileData?.role || 'Team Member',
            createdAt: profileData?.created_at || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profileData?.name || session.user.email?.split('@')[0] || '',
            avatar: profileData?.avatar_url || undefined,
            role: profileData?.role || 'Team Member',
            createdAt: profileData?.created_at || new Date().toISOString(),
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string = 'password123'): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        const profileData = await fetchProfile(data.user.id);
        setProfile(profileData);
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: profileData?.name || data.user.email?.split('@')[0] || '',
          avatar: profileData?.avatar_url || undefined,
          role: profileData?.role || 'Team Member',
          createdAt: profileData?.created_at || new Date().toISOString(),
        });
        return { success: true, message: 'Login successful' };
      }

      return { success: false, message: 'Login failed' };
    } catch (error) {
      return { success: false, message: 'An error occurred during login' };
    }
  }, [fetchProfile]);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string = 'password123',
    role?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: role || 'Team Member',
          },
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        // Profile will be created automatically by the trigger
        const profileData = await fetchProfile(data.user.id);
        setProfile(profileData);
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: profileData?.name || name,
          avatar: profileData?.avatar_url || undefined,
          role: profileData?.role || role || 'Team Member',
          createdAt: profileData?.created_at || new Date().toISOString(),
        });
        return { success: true, message: 'Registration successful' };
      }

      return { success: false, message: 'Registration failed' };
    } catch (error) {
      return { success: false, message: 'An error occurred during registration' };
    }
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>): Promise<User | null> => {
    if (!user) return null;

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.avatar !== undefined) updateData.avatar_url = updates.avatar;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }, [user]);

  return {
    user,
    profile,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };
}
