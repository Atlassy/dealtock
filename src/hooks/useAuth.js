import { supabase } from "../lib/supabaseClient";

export const useAuth = () => {
  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // If signup success, insert into profiles
    if (data?.user) {
      const { id } = data.user;
      await supabase.from("profiles").insert({
        id,
        email,
      });
    }

    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return { signUp, signIn, signOut };
};
