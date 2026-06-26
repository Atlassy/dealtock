import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const DASHBOARD_ROLES = ["admin", "seller", "dropshipper", "delivery", "warehouse"];

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const { error, profile } = await signIn(email, password);
    if (error) { setErrorMsg(error.message); return; }
    navigate(DASHBOARD_ROLES.includes(profile?.role) ? "/dashboard" : "/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 mb-3">
            <img
              src="https://i.ibb.co/PGkjFhwv/Dealtock.png"
              alt="Dealtock"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.innerHTML =
                  `<div style="width:100%;height:100%;borderRadius:12px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;alignItems:center;justifyContent:center"><span style="color:white;fontWeight:bold;fontSize:24px">D</span></div>`;
              }}
            />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
            Dealtock
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('auth.version')}</p>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 dark:text-white text-center mb-5">
          {t('auth.login.welcomeBack')}
        </h2>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('auth.login.emailAddress')}
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Password — flexbox row, NO absolute positioning */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.login.password')}</label>
              <Link to="/forgot-password" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                {t('auth.login.forgotPassword')}
              </Link>
            </div>
            {/* KEY FIX: flex row instead of relative/absolute */}
            <div
              className="flex items-center border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent"
            >
              <input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                className="flex-1 px-4 py-3 text-sm outline-none border-none bg-transparent text-gray-900 dark:text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="px-3 py-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center justify-center flex-shrink-0"
                onClick={() => setShowPwd(!showPwd)}
                tabIndex={-1}
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('auth.login.signingIn')}
              </>
            ) : t('auth.login.signIn')}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('auth.login.noAccount')}{" "}
          <Link to="/signup" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            {t('auth.login.createAccount')}
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          {t('auth.login.allRightsReserved', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}
