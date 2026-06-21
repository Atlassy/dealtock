import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PasswordUpdated() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 shadow rounded text-center">
        <h2 className="text-2xl font-bold mb-4">{t('auth.passwordUpdated.title')}</h2>
        <p className="mb-6">{t('auth.passwordUpdated.body')}</p>

        <Link to="/login" className="text-blue-600 underline">
          {t('auth.passwordUpdated.backToLogin')}
        </Link>
      </div>
    </div>
  );
}
