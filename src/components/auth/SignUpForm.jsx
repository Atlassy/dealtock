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

    // SUCCESS — new account created
    navigate("/email-confirmation");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 shadow rounded">
        <h2 className="text-2xl font-bold mb-6 text-center">{t('auth.signup.createAccount')}</h2>

        {errorMsg && (
          <p className="text-red-600 mb-4 text-center">{errorMsg}</p>
        )}

        <form onSubmit={handleSignUp} className="space-y-5">

          <input
            type="email"
            className="w-full p-3 border rounded bg-white text-gray-900"
            placeholder={t('auth.signup.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              placeholder={t('auth.signup.passwordPlaceholder')}
              className="w-full p-3 border rounded pr-10 bg-white text-gray-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-gray-600"
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
              className="w-full p-3 border rounded pr-10 bg-white text-gray-900"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-gray-600"
              onClick={() => setShowConfirmPwd(!showConfirmPwd)}
            >
              {showConfirmPwd ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <select
            className="w-full p-3 border rounded bg-white text-gray-900"
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

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded hover:bg-gray-800"
          >
            {t('auth.signup.register')}
          </button>
        </form>

        <p className="mt-4 text-center">
          {t('auth.signup.alreadyHaveAccount')}{" "}
          <Link to="/login" className="text-blue-600 underline">
            {t('auth.signup.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
