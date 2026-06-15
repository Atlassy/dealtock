import { Link, useLocation } from "react-router-dom";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email || "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (!email) { toast.error("Email address not found. Please go back and try again."); return; }
    setResending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResending(false);
    if (error) { toast.error(error.message); return; }
    setResent(true);
    toast.success("Reset link resent!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center">

        {/* Animated envelope */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Mail className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>

        <p className="text-sm text-gray-500 mb-1">
          We sent a password reset link to:
        </p>
        {email && (
          <p className="text-sm font-semibold text-blue-600 mb-4 break-all">{email}</p>
        )}
        <p className="text-sm text-gray-400 mb-6">
          Click the link in the email to reset your password.
          The link expires in <span className="font-medium text-gray-600">1 hour</span>.
        </p>

        {/* Steps */}
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
          {[
            "Open your email app",
            "Find the email from Dealtock",
            "Click \"Reset my password\"",
            "Choose a new strong password",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <p className="text-sm text-gray-600">{step}</p>
            </div>
          ))}
        </div>

        {/* Resend */}
        <p className="text-xs text-gray-400 mb-2">Didn't receive the email?</p>
        <button
          onClick={handleResend}
          disabled={resending || resent || !email}
          className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition mb-4"
        >
          {resending ? (
            <><RefreshCw className="w-4 h-4 animate-spin" />Resending...</>
          ) : resent ? (
            "✅ Link resent!"
          ) : (
            <><RefreshCw className="w-4 h-4" />Resend reset link</>
          )}
        </button>

        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        <p className="mt-4 text-xs text-gray-300">
          Check spam/junk if you don't see it in your inbox.
        </p>
      </div>
    </div>
  );
}
