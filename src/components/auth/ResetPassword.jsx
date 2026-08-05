import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import PasswordStrength from "./PasswordStrength";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strength, setStrength] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let resolved = false;

    // The official Supabase signal for "this session came from a password
    // recovery link". This fires once the recovery link has been exchanged
    // for a valid session by the Supabase client.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        resolved = true;
        setAllowed(true);
        setChecking(false);
      }
    });

    // Fallback: if the event already fired before this component mounted
    // (e.g. fast redirect), Supabase also puts `type=recovery` in the URL.
    const params = new URLSearchParams(window.location.hash.replace("#", "?"));
    if (params.get("type") === "recovery") {
      resolved = true;
      setAllowed(true);
    }

    // Give the recovery event a short window to fire before deciding the
    // link is invalid, instead of failing immediately.
    const timeout = setTimeout(() => {
      if (!resolved) setChecking(false);
    }, 1500);

    return () => {
      subscription?.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    if (password.length < 8) { setErrorMsg(t('auth.resetPassword.passwordMinLength')); setLoading(false); return; }
    if (password !== confirm) { setErrorMsg(t('auth.resetPassword.passwordsDontMatch')); setLoading(false); return; }
    if (strength !== "Strong" && strength !== "Medium") { setErrorMsg(t('auth.resetPassword.chooseStrongerPassword')); setLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setErrorMsg(error.message); setLoading(false); return; }
    await supabase.auth.signOut();
    navigate("/password-updated");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
        <span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('auth.resetPassword.invalidLinkTitle')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {t('auth.resetPassword.invalidLinkBody')}
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition"
          >
            {t('auth.resetPassword.requestNewLink')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">

        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
            <Lock className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">{t('auth.resetPassword.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">{t('auth.resetPassword.subtitle')}</p>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('auth.resetPassword.newPassword')}</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                placeholder={t('auth.resetPassword.minChars')}
                className="w-full px-4 py-3 pr-11 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required disabled={loading}
              />
              <button type="button" tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <PasswordStrength password={password} onStrengthChange={setStrength} />

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('auth.resetPassword.confirmPassword')}</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder={t('auth.resetPassword.repeatPassword')}
                className="w-full px-4 py-3 pr-11 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required disabled={loading}
              />
              <button type="button" tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('auth.resetPassword.updating')}</>
            ) : t('auth.resetPassword.updatePassword')}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          {t('auth.resetPassword.afterUpdateNote')}
        </p>
      </div>
    </div>
  );
}