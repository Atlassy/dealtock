import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import fr from "../locales/fr.json";
import ar from "../locales/ar.json";

const STORAGE_KEY = "language";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    lng: localStorage.getItem(STORAGE_KEY) || "fr",
    fallbackLng: "fr",
    interpolation: { escapeValue: false },
  });

export default i18n;
