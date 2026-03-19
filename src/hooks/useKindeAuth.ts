import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';

export function useKindeAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for authenticated user on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session from Supabase (Kinde is connected via Supabase Auth)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          setUser(null);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          // Get user profile from Supabase
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              avatar: profile.avatar_url,
              role: profile.role,
              createdAt: profile.created_at,
            });
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar_url,
            role: profile.role,
            createdAt: profile.created_at,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login with Kinde - redirects to Kinde login page
  const login = useCallback(async () => {
    try {
      // Get Kinde client
      const { initKinde } = await import('@/lib/kinde');
      const kinde = await initKinde();
      
      if (kinde) {
        kinde.login();
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  }, []);

  // Login with Google via Kinde
  const loginWithGoogle = useCallback(async () => {
    try {
      const { initKinde } = await import('@/lib/kinde');
      const kinde = await initKinde();
      
      if (kinde) {
        kinde.login({ connection_id: 'conn_google' });
      }
    } catch (error) {
      console.error('Google login error:', error);
    }
  }, []);

  // Login with Facebook via Kinde
  const loginWithFacebook = useCallback(async () => {
    try {
      const { initKinde } = await import('@/lib/kinde');
      const kinde = await initKinde();
      
      if (kinde) {
        kinde.login({ connection_id: 'conn_facebook' });
      }
    } catch (error) {
      console.error('Facebook login error:', error);
    }
  }, []);

  // Register with Kinde
  const register = useCallback(async () => {
    try {
      const { initKinde } = await import('@/lib/kinde');
      const kinde = await initKinde();
      
      if (kinde) {
        kinde.register();
      }
    } catch (error) {
      console.error('Register error:', error);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Sign out from Kinde
      const { initKinde } = await import('@/lib/kinde');
      const kinde = await initKinde();
      
      if (kinde) {
        kinde.logout();
      }
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Update user profile
  const updateUser = useCallback(async (updates: Partial<User>): Promise<User | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          email: updates.email,
          avatar_url: updates.avatar,
          role: updates.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error || !data) {
        console.error('Error updating user:', error);
        return null;
      }

      const updatedUser = {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar_url,
        role: data.role,
        createdAt: data.created_at,
      };

      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }, [user]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    loginWithFacebook,
    register,
    logout,
    updateUser,
  };
}
