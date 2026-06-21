import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail]     = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Supabase redirects here after user clicks link in email
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setErrorMsg(error.message); return; }
    // Pass email to CheckEmail page so it can show it + allow resend
    navigate("/check-email", { state: { email } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">

        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Mail className="w-7 h-7 text-blue-600" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
          {t('auth.forgotPassword.title')}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          {t('auth.forgotPassword.subtitle')}
        </p>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('auth.forgotPassword.emailAddress')}
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('auth.forgotPassword.sending')}
              </>
            ) : t('auth.forgotPassword.sendResetLink')}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-gray-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4" /> {t('auth.forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
