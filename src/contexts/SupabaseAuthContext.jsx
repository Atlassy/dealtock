// src/contexts/SupabaseAuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user profile
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        console.log('✅ Profile loaded in context:', data);
        setProfile(data);
        return data;
      } else {
        console.warn('⚠️ No profile found for user:', userId);
        setProfile(null);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    // 1️⃣ Get current session on load
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      // Fetch profile if user exists
      if (currentUser) {
        await fetchProfile(currentUser.id);
      }
      
      setLoading(false);
    };

    getSession();

    // 2️⃣ Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      const previousUser = user;
      setUser(currentUser);
      
      // Fetch profile when user changes
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      
      // 🔥 ONLY dispatch event on actual login/logout, not on initial load
      if (previousUser !== currentUser) {
        if (!previousUser && currentUser) {
          console.log('👤 User logged in, dispatching userLoggedIn event');
          window.dispatchEvent(new Event('userLoggedIn'));
        }
        if (previousUser && !currentUser) {
          console.log('👤 User logged out, dispatching userLoggedOut event');
          window.dispatchEvent(new Event('userLoggedOut'));
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3️⃣ Login
  const signIn = async (email, password) => {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    let signedInProfile = null;
    if (data?.user) {
      signedInProfile = await fetchProfile(data.user.id);
      // 🔥 REMOVED duplicate event - onAuthStateChange will handle this
    }

    setLoading(false);
    return { data, error, profile: signedInProfile };
  };

  // 4️⃣ Logout
  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    // 🔥 REMOVED duplicate event - onAuthStateChange will handle this
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signOut,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Hook officiel
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}