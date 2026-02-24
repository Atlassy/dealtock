import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import PasswordStrength from "./PasswordStrength";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [strength, setStrength] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkRecoverySession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data?.session?.type === "recovery") {
        setAllowed(true);
      } else {
        setAllowed(false);
      }
    };

    checkRecoverySession();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    // Validation
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (strength !== "Strong" && strength !== "Medium") {
      setErrorMsg("Please choose a stronger password.");
      setLoading(false);
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Clear session and redirect
    await supabase.auth.signOut();
    navigate("/password-updated");
    setLoading(false);
  };

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white p-8 shadow rounded text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Reset Link</h2>
          <p className="mb-6">
            This link has expired or is invalid. Password reset links expire after 1 hour.
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="bg-black text-white py-3 px-6 rounded hover:bg-gray-800"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 shadow rounded">
        <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>

        {errorMsg && (
          <p className="text-red-600 mb-4 text-center">{errorMsg}</p>
        )}

        <form onSubmit={handleUpdate} className="space-y-5">
          <input
            type="password"
            placeholder="New password (min 8 characters)"
            className="w-full p-3 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <PasswordStrength 
            password={password} 
            onStrengthChange={setStrength} 
          />

          <input
            type="password"
            placeholder="Confirm password"
            className="w-full p-3 border rounded"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={loading}
          />

          <button 
            className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Updating Password..." : "Update Password"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          After updating, you'll be logged out and redirected to login.
        </p>
      </div>
    </div>
  );
}