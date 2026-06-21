import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "react-i18next";

export default function EmailConfirmation() {
  const { t } = useTranslation();
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  const resendEmail = async () => {
    setError("");

    const user = (await supabase.auth.getUser()).data?.user;
    if (!user) {
      setError(t('auth.emailConfirmation.mustLoginAgain'));
      return;
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
    });

    if (error) setError(error.message);
    else setResent(true);
  };

  return (
    <div className="h-screen flex items-center justify-center px-6">
      <div className="bg-white shadow border p-8 max-w-md w-full rounded">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          {t('auth.emailConfirmation.title')}
        </h2>

        <p className="text-gray-700 mb-4 leading-relaxed">
          {t('auth.emailConfirmation.body')}
          <br />
          {t('auth.emailConfirmation.clickToActivate')}
        </p>

        {resent ? (
          <p className="text-green-600 mb-4">{t('auth.emailConfirmation.resent')}</p>
        ) : (
          <button
            onClick={resendEmail}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mb-3"
          >
            {t('auth.emailConfirmation.resendButton')}
          </button>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
}
