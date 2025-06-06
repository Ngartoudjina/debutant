import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Globe,
  Database,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { LucideProps } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CookieConsentBanner from "../cookies/CookieConsentBanner";
import ThemeToggle from "./ThemeToggle";

export default function Confidential() {
  // Ajout du state pour le theme
  const [darkMode, setDarkMode] = useState(true);
  
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const renderSection = useCallback(
    (title: string, content: React.ReactNode, Icon: React.ComponentType<LucideProps>) => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-500 hover:shadow-lg transition-all"
      >
        <div className="flex items-center mb-4 space-x-3">
          <Icon className="w-8 h-8 text-blue-400" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        {content}
      </motion.div>
    ),
    []
  );

  return (
    <div
      lang="fr"
      className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-blue-950 text-gray-200"
    >
      <Navbar />
      <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <div className="container mx-auto px-6 py-24 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            Politique de Confidentialité
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Chez Dynamism Express, la protection de vos données personnelles est
            notre priorité absolue.
          </p>
        </motion.div>

        <div className="space-y-8">
          {renderSection(
            "Collecte des Données",
            <ul className="space-y-2 text-gray-300">
              {[
                "Informations personnelles : Nom, email, téléphone",
                "Détails de paiement",
                "Données de localisation",
                "Données d'utilisation du service",
              ].map((item, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <Database
                    className="w-4 h-4 text-blue-400"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>,
            Database
          )}

          {renderSection(
            "Utilisation des Données",
            <ul className="space-y-2 text-gray-300">
              {[
                "Amélioration de nos services",
                "Personnalisation de l'expérience utilisateur",
                "Traitement des transactions",
                "Communication d'offres spéciales",
              ].map((item, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-blue-400" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>,
            Globe
          )}

          {renderSection(
            "Protection et Sécurité",
            <div className="space-y-4">
              <p className="text-gray-300">
                Nous garantissons la sécurité de vos données par :
              </p>
              <ul className="space-y-2 text-gray-300">
                {[
                  "Chiffrement avancé",
                  "Contrôles d'accès stricts",
                  "Audits de sécurité réguliers",
                ].map((item, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Lock
                      className="w-4 h-4 text-blue-400"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>,
            Shield
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="bg-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center hover:bg-white/15 transition-all"
          >
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Contactez-nous
              </h3>
              <p className="text-gray-400">
                Pour toute question concernant vos données
              </p>
            </div>
            <div className="space-y-2 mt-4 md:mt-0">
              {[
                {
                  Icon: Mail,
                  text: "abelbeingar@gmail.com",
                  ariaLabel: "Email de contact",
                },
                {
                  Icon: Phone,
                  text: "+229 0159334483",
                  ariaLabel: "Numéro de téléphone",
                },
                {
                  Icon: MapPin,
                  text: "Cadjehoun, Maison Bleue",
                  ariaLabel: "Adresse",
                },
              ].map(({ Icon, text, ariaLabel }, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 hover:text-blue-300 transition-colors"
                  aria-label={ariaLabel}
                >
                  <Icon className="w-5 h-5 text-blue-400" aria-hidden="true" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center mt-12 text-gray-500"
        >
          <p>Date d'entrée en vigueur : 05/06/2021</p>
        </motion.div>
      </div>

      <Footer />
      <CookieConsentBanner />
    </div>
  );
}