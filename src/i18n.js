import i18n from "i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import process from "process";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath:
        //"https://rawcdn.githack.com/gregoire78/multitwitch/a80f9e44f17cc0e46b1b5e01eafe22a37e453482/src/assets/locales/fr/translation.json",
        //"https://raw.githack.com/gregoire78/multitwitch/2.0.0/src/assets/locales/{{lng}}/{{ns}}.json",
        //"https://raw.githubusercontent.com/gregoire78/multitwitch/2.0.0/src/assets/locales/{{lng}}/{{ns}}.json",
        "/assets/locales/{{lng}}/{{ns}}.json",
    },
    supportedLngs: ["en", "fr"],
    fallbackLng: "en",
    debug: process.env.NODE_ENV !== "production",

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
