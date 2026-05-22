import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import PasswordStrength from "./PasswordStrength";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strength, setStrength] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAllowed(data?.session?.type === "recovery");
    });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    if (password.length < 8) { setErrorMsg("Password must be at least 8 characters."); setLoading(false); return; }
    if (password !== confirm) { setErrorMsg("Passwords do not match."); setLoading(false); return; }
    if (strength !== "Strong" && strength !== "Medium") { setErrorMsg("Please choose a stronger password."); setLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setErrorMsg(error.message); setLoading(false); return; }
    await supabase.auth.signOut();
    navigate("/password-updated");
  };

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-gray-500 mb-6">
            This link has expired or is invalid. Password reset links expire after 1 hour.
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">

        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Lock className="w-7 h-7 text-blue-600" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Reset Password</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Choose a new strong password.</p>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required disabled={loading}
              />
              <button type="button" tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <PasswordStrength password={password} onStrengthChange={setStrength} />

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required disabled={loading}
              />
              <button type="button" tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</>
            ) : "Update Password"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          After updating, you'll be signed out and redirected to login.
        </p>
      </div>
    </div>
  );
}
