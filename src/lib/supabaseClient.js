import { createClient } from "@supabase/supabase-js";

// Local development (fallbacks)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

// Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

