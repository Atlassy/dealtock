import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // Standardized path
import { useAuth } from "@/contexts/SupabaseAuthContext";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // ✅ ADDED: cities array
  const cities = [
    "Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fès"
  ];

  const loadProfile = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id) // ✅ FIXED: Changed from session.user.id to user.id
      .maybeSingle();

    setProfile(data);
  };

  const saveChanges = async () => {
    if (!user?.id || !profile) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        phone: profile.phone,
        city: profile.city
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error saving profile:", error);
    }
    
    setSaving(false);
  };

  useEffect(() => {
    loadProfile();
  }, [user]); // ✅ ADDED: user as dependency

  if (!profile) {
    return (
      <div className="p-8 text-center text-gray-600">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">My Profile</h1>

      <div className="bg-white border rounded p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm text-gray-600">Email</label>
          <input
            disabled
            value={profile.email || user.email || ""}
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Phone</label>
          <input
            value={profile.phone || ""}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600">City</label>
          <select
            value={profile.city || ""}
            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">Select city</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={saveChanges}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}