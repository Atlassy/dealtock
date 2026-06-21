import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PasswordUpdated() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 shadow rounded text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('auth.passwordUpdated.title')}</h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">{t('auth.passwordUpdated.body')}</p>

        <Link to="/login" className="text-blue-600 dark:text-blue-400 underline">
          {t('auth.passwordUpdated.backToLogin')}
        </Link>
      </div>
    </div>
  );
}
