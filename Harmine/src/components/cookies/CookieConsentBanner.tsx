import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Shield, X } from "lucide-react";

interface CookieSettings {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [cookieSettings, setCookieSettings] = useState<CookieSettings>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const checkExistingCookies = () => {
      const consentCookie = Cookies.get("cookie_consent");
      const settingsCookie = Cookies.get("cookie_settings");

      if (consentCookie && settingsCookie) {
        try {
          const savedSettings = JSON.parse(settingsCookie);
          setCookieSettings(savedSettings);
          setShowBanner(false);
        } catch (error) {
          console.error("Erreur lors de la lecture des paramètres de cookies:", error);
          resetCookies();
        }
      } else {
        setShowBanner(true);
        Cookies.set("cookie_consent", "pending");
        setCookieSettings({
          necessary: true,
          analytics: false,
          marketing: false,
        });
      }
    };

    checkExistingCookies();
  }, []);

  const resetCookies = () => {
    Cookies.remove("cookie_consent");
    Cookies.remove("cookie_settings");
    setCookieSettings({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    setShowBanner(true);
  };

  const handleAcceptAll = () => {
    const settings = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    saveCookieSettings("accepted", settings);
  };

  const handleSaveSettings = () => {
    saveCookieSettings("custom", cookieSettings);
  };

  const handleDecline = () => {
    const settings = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    saveCookieSettings("declined", settings);
  };

  const saveCookieSettings = (consent: string, settings: CookieSettings) => {
    try {
      Cookies.set("cookie_consent", consent, { expires: 365 });
      Cookies.set("cookie_settings", JSON.stringify(settings), { expires: 365 });
      setCookieSettings(settings);
      setShowBanner(false);

      if (settings.analytics) {
        initializeAnalytics();
      }
      if (settings.marketing) {
        initializeMarketing();
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des paramètres:", error);
      alert("Une erreur est survenue lors de la sauvegarde de vos préférences.");
    }
  };

  const initializeAnalytics = () => {
    console.log("Analytics initialized");
  };

  const initializeMarketing = () => {
    console.log("Marketing initialized");
  };

  const toggleSetting = (setting: keyof CookieSettings) => {
    if (setting === 'necessary') return;
    setCookieSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-blue-950 border border-white/20 text-white p-6 mx-4 mb-4 rounded-2xl shadow-2xl">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-start mb-4">
                <Cookie className="w-6 h-6 text-blue-400 mr-3 flex-shrink-0" />
                <div className="flex-grow">
                  <h2 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                    Gérez vos préférences de cookies
                  </h2>
                  <p className="text-gray-300 text-sm">
                    Nous utilisons des cookies pour améliorer votre expérience sur notre site.
                    Vous pouvez personnaliser vos préférences ou accepter tous les cookies.
                  </p>
                </div>
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-gray-400 hover:text-white transition ml-4"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 overflow-hidden"
                  >
                    {Object.entries(cookieSettings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 text-blue-400 mr-2" />
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-300 capitalize">{key}</span>
                            <span className="text-xs text-gray-500">
                              {key === 'necessary' 
                                ? 'Cookies essentiels au fonctionnement du site'
                                : key === 'analytics'
                                ? 'Cookies pour analyser l\'utilisation du site'
                                : 'Cookies pour la personnalisation marketing'}
                            </span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => toggleSetting(key as keyof CookieSettings)}
                            disabled={key === 'necessary'}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer 
                            peer-checked:after:translate-x-full peer-checked:after:border-white 
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                            after:bg-white after:border-gray-300 after:border after:rounded-full 
                            after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600
                            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                        </label>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition underline"
                >
                  {showDetails ? "Masquer les détails" : "Afficher les détails"}
                </button>
                <div className="flex space-x-4">
                  <button
                    onClick={handleDecline}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm"
                  >
                    Refuser tout
                  </button>
                  {showDetails ? (
                    <button
                      onClick={handleSaveSettings}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm flex items-center"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Enregistrer les préférences
                    </button>
                  ) : (
                    <button
                      onClick={handleAcceptAll}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm flex items-center"
                    >
                      <Cookie className="w-4 h-4 mr-2" />
                      Tout accepter
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsentBanner;