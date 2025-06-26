import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const ADMIN_EMAIL = 'allblue.contact@gmail.com';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      setIsAdmin(false);
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name, avatar_url')
      .eq('id', sessionUser.id)
      .single();

    const userData = {
      ...sessionUser,
      name: profile?.full_name || sessionUser.email,
      company: profile?.company_name || 'Dealtock Inc.',
      avatar: profile?.avatar_url,
    };
    setUser(userData);
    setIsAdmin(sessionUser.email === ADMIN_EMAIL);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchUserProfile(session?.user);
      setIsLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await fetchUserProfile(session?.user);
        if (_event === 'INITIAL_SESSION') {
          setIsLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const register = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  const sendPasswordResetEmail = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) throw error;
  };

  return {
    user,
    isAdmin,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    sendPasswordResetEmail,
  };
}