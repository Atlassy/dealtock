import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/SupabaseAuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)  // Removed the semicolon here
      .maybeSingle();     // This should be on the same chain

    if (!error) setProfile(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.id) loadProfile();  // Changed session?.user?.id to user?.id
  }, [user]);  // Changed dependency from [session] to [user]

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center text-gray-600">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Dashboard</h1>

      {profile ? (
        <div className="p-4 bg-white border rounded shadow-sm">
          <p><b>Email:</b> {profile.email}</p>
          <p><b>Phone:</b> {profile.phone || "Not set"}</p>
          <p><b>City:</b> {profile.city || "Not set"}</p>
        </div>
      ) : (
        <p>No profile found.</p>
      )}
    </div>
  );
}