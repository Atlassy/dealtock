import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [allowed, setAllowed] = useState(false); // IMPORTANT: page protection

  useEffect(() => {
    const checkRecoverySession = async () => {
      const { data } = await supabase.auth.getSession();

      // User must have a recovery session
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

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    navigate("/password-updated");
  };

  // --------- BLOCKED ACCESS ----------
  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white p-8 shadow rounded text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Reset Link</h2>
          <p className="mb-6">
            This page can only be accessed through a valid password reset link.
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
  // -----------------------------------

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 shadow rounded">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Reset Password
        </h2>

        {errorMsg && (
          <p className="text-red-600 mb-4 text-center">{errorMsg}</p>
        )}

        <form onSubmit={handleUpdate} className="space-y-5">
          <input
            type="password"
            placeholder="New password"
            className="w-full p-3 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm password"
            className="w-full p-3 border rounded"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button className="w-full bg-black text-white py-3 rounded hover:bg-gray-800">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
