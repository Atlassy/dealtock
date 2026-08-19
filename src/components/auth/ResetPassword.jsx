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

  /*
   * ============================================================
   * PASSWORD RECOVERY INITIALIZATION
   * ============================================================
   *
   * The email template sends the user to:
   *
   * /reset-password?token_hash=XXX&type=recovery
   *
   * We verify that token directly with Supabase.
   *
   * We intentionally do NOT depend on:
   * - PASSWORD_RECOVERY auth event
   * - SIGNED_IN auth event
   * - URL hash parameters
   * - a timeout
   *
   * verifyOtp() is the source of truth for this recovery flow.
   */

  useEffect(() => {
    let mounted = true;

    const verifyRecoveryToken = async () => {
      try {
        const searchParams = new URLSearchParams(
          window.location.search
        );

        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        // Diagnostic logs
        console.log(
          "RESET PASSWORD URL:",
          window.location.href
        );

        console.log(
          "TOKEN HASH PRESENT:",
          !!tokenHash
        );

        console.log(
          "RECOVERY TYPE:",
          type
        );

        /*
         * Make sure this is actually a recovery URL.
         */
        if (!tokenHash || type !== "recovery") {
          console.error(
            "Invalid password recovery URL."
          );

          if (mounted) {
            setAllowed(false);
            setChecking(false);
          }

          return;
        }

        /*
         * Verify the token with Supabase.
         */
        const { data, error } =
          await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });

        // Diagnostic logs
        console.log(
          "VERIFY OTP DATA:",
          data
        );

        console.log(
          "VERIFY OTP ERROR:",
          error
        );

        if (!mounted) return;

        /*
         * Token invalid / expired / already used.
         */
        if (error) {
          console.error(
            "Password recovery verification failed:",
            error
          );

          setAllowed(false);
          setChecking(false);

          return;
        }

        /*
         * Supabase should return a recovery session.
         */
        if (data?.session) {
          console.log(
            "PASSWORD RECOVERY SESSION ESTABLISHED"
          );

          setAllowed(true);
        } else {
          console.error(
            "Recovery verification succeeded but no session was returned."
          );

          setAllowed(false);
        }

        setChecking(false);
      } catch (error) {
        console.error(
          "Unexpected password recovery error:",
          error
        );

        if (!mounted) return;

        setAllowed(false);
        setChecking(false);
      }
    };

    verifyRecoveryToken();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ============================================================
   * UPDATE PASSWORD
   * ============================================================
   */

  const handleUpdate = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setLoading(true);

    /*
     * Basic password length validation
     */
    if (password.length < 8) {
      setErrorMsg(
        t("auth.resetPassword.passwordMinLength")
      );

      setLoading(false);
      return;
    }

    /*
     * Password confirmation validation
     */
    if (password !== confirm) {
      setErrorMsg(
        t("auth.resetPassword.passwordsDontMatch")
      );

      setLoading(false);
      return;
    }

    /*
     * Password strength validation
     */
    if (
      strength !== "Strong" &&
      strength !== "Medium"
    ) {
      setErrorMsg(
        t("auth.resetPassword.chooseStrongerPassword")
      );

      setLoading(false);
      return;
    }

    /*
     * Update password using the recovery session
     */
    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      console.error(
        "Password update error:",
        error
      );

      setErrorMsg(error.message);
      setLoading(false);

      return;
    }

    /*
     * Password successfully updated.
     *
     * We sign the user out because this is a password
     * recovery flow and the desired behavior is to send
     * the user back through normal login.
     */
    await supabase.auth.signOut();

    navigate("/password-updated");
  };

  /*
   * ============================================================
   * LOADING / VERIFYING RECOVERY LINK
   * ============================================================
   */

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
        <span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /*
   * ============================================================
   * INVALID / EXPIRED RECOVERY LINK
   * ============================================================
   */

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">

          <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-red-500 dark:text-red-400" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t(
              "auth.resetPassword.invalidLinkTitle"
            )}
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {t(
              "auth.resetPassword.invalidLinkBody"
            )}
          </p>

          <button
            onClick={() =>
              navigate("/forgot-password")
            }
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition"
          >
            {t(
              "auth.resetPassword.requestNewLink"
            )}
          </button>

        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * PASSWORD RESET FORM
   * ============================================================
   */

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">

      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
            <Lock className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
          {t("auth.resetPassword.title")}
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          {t("auth.resetPassword.subtitle")}
        </p>

        {/* Error */}
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4 text-center">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleUpdate}
          className="space-y-4"
        >

          {/* New Password */}
          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t(
                "auth.resetPassword.newPassword"
              )}
            </label>

            <div className="relative">

              <input
                type={
                  showPwd
                    ? "text"
                    : "password"
                }
                placeholder={t(
                  "auth.resetPassword.minChars"
                )}
                className="w-full px-4 py-3 pr-11 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
                disabled={loading}
              />

              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                onClick={() =>
                  setShowPwd(!showPwd)
                }
              >
                {showPwd ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>

            </div>
          </div>

          {/* Password Strength */}
          <PasswordStrength
            password={password}
            onStrengthChange={setStrength}
          />

          {/* Confirm Password */}
          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t(
                "auth.resetPassword.confirmPassword"
              )}
            </label>

            <div className="relative">

              <input
                type={
                  showConfirm
                    ? "text"
                    : "password"
                }
                placeholder={t(
                  "auth.resetPassword.repeatPassword"
                )}
                className="w-full px-4 py-3 pr-11 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                value={confirm}
                onChange={(e) =>
                  setConfirm(e.target.value)
                }
                required
                disabled={loading}
              />

              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                onClick={() =>
                  setShowConfirm(!showConfirm)
                }
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>

            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t(
                  "auth.resetPassword.updating"
                )}
              </>
            ) : (
              t(
                "auth.resetPassword.updatePassword"
              )
            )}
          </button>

        </form>

        {/* Footer note */}
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          {t(
            "auth.resetPassword.afterUpdateNote"
          )}
        </p>

      </div>
    </div>
  );
}
