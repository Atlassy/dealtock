import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrength from "./PasswordStrength";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SignUpForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [city, setCity] = useState("");
  const [accountType, setAccountType] = useState("customer");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [strength, setStrength] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const moroccanCities = [
    "Casablanca",
    "Rabat",
	"Salé",
    "Marrakech",
    "Fes",
    "Tangier",
    "Agadir",
    "Oujda",
  ];

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPwd) {
      setErrorMsg(t('auth.signup.passwordsDontMatch'));
      return;
    }

    if (strength !== "Strong") {
      setErrorMsg(t('auth.signup.chooseStrongerPassword'));
      return;
    }

    if (accountType !== "customer" && !companyName.trim()) {
      setErrorMsg(t('auth.signup.companyNameRequired'));
      return;
    }

    // FIRST and ONLY signup call
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });

    // -------------------------------
    // HANDLE ERRORS FROM SIGNUP
    // -------------------------------
    if (signupError) {
      const msg = signupError.message.toLowerCase();

      if (
        msg.includes("already") ||
        msg.includes("duplicate") ||
        msg.includes("registered") ||
        msg.includes("exists")
      ) {
        setErrorMsg(t('auth.signup.emailAlreadyRegistered'));
      } else {
        setErrorMsg(signupError.message);
      }

      return;
    }

    // -------------------------------------------------
    // HANDLE EXISTING EMAIL (SUPABASE SPECIAL BEHAVIOR)
    // -------------------------------------------------
    if (data.user && data.user.identities.length === 0) {
      if (!data.user.email_confirmed_at) {
        setErrorMsg(t('auth.signup.emailExistsNotConfirmed'));
      } else {
        setErrorMsg(t('auth.signup.emailAlreadyRegistered'));
      }
      return;
    }

    // For a seller/delivery application, submit a pending request — the
    // role is granted later by an admin, never directly at signup.
    if (accountType !== "customer" && data.user) {
      const { data: rpcResult, error: requestError } = await supabase.rpc("submit_role_request", {
        p_user_id: data.user.id,
        p_requested_role: accountType,
        p_company_name: companyName.trim(),
        p_phone: phone.trim() || null,
        p_message: message.trim() || null,
      });
      if (requestError || !rpcResult?.success) {
        console.error("Error submitting role request:", requestError || rpcResult?.error);
      }
    }

    // SUCCESS — new account created
    navigate("/email-confirmation");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-3 py-4 sm:px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-4 sm:p-8 shadow rounded-xl">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-gray-900 dark:text-white">{t('auth.signup.createAccount')}</h2>

        {errorMsg && (
          <p className="text-red-600 dark:text-red-400 mb-4 text-center">{errorMsg}</p>
        )}

        <form onSubmit={handleSignUp} className="space-y-5">

          <input
            type="email"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            placeholder={t('auth.signup.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              placeholder={t('auth.signup.passwordPlaceholder')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded pr-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-0 top-0 h-full px-3 flex items-center text-gray-600 dark:text-gray-400"
              onClick={() => setShowPwd(!showPwd)}
            >
              {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <PasswordStrength password={password} onStrengthChange={setStrength} />

          <div className="relative">
            <input
              type={showConfirmPwd ? "text" : "password"}
              placeholder={t('auth.signup.confirmPasswordPlaceholder')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded pr-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-0 top-0 h-full px-3 flex items-center text-gray-600 dark:text-gray-400"
              onClick={() => setShowConfirmPwd(!showConfirmPwd)}
            >
              {showConfirmPwd ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <select
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">{t('auth.signup.selectCity')}</option>
            {moroccanCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('auth.signup.accountType')}
            </label>
            <select
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option value="customer">{t('auth.signup.accountTypeCustomer')}</option>
              <option value="seller">{t('auth.signup.accountTypeSeller')}</option>
              <option value="delivery">{t('auth.signup.accountTypeDelivery')}</option>
            </select>
          </div>

          {accountType !== "customer" && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {t('auth.signup.applicationNotice')}
              </p>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder={t('auth.signup.companyNamePlaceholder')}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <input
                type="tel"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder={t('auth.signup.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <textarea
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder={t('auth.signup.messagePlaceholder')}
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-black dark:bg-blue-600 text-white py-3 rounded hover:bg-gray-800 dark:hover:bg-blue-700"
          >
            {t('auth.signup.register')}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
          {t('auth.signup.alreadyHaveAccount')}{" "}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 underline">
            {t('auth.signup.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
