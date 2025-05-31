import React from "react";
import { motion } from "framer-motion";
import {
  Cookie,
  ShieldCheck,
  Globe,
  Settings,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Footer from "./Footer";
import Navbar from "./Navbar";

const renderSection = (title, content, Icon) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
    viewport={{ once: true }}
    className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-500 transition-all"
  >
    <div className="flex items-center mb-4 space-x-3">
      <Icon className="w-8 h-8 text-blue-400" />
      <h2 className="text-2xl font-bold text-white">{title}</h2>
    </div>
    <div className="text-gray-300">{content}</div>
  </motion.div>
);

const ContactSection = () => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    className="bg-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center"
  >
    <div>
      <h3 className="text-2xl font-bold text-white mb-2">Contactez-nous</h3>
      <p className="text-gray-400">
        Des questions sur notre politique de cookies ?
      </p>
    </div>
    <div className="space-y-2 mt-4 md:mt-0">
      {[
        { Icon: Mail, text: "abelbeingar@gmail.com" },
        { Icon: Phone, text: "+229 0159334483" },
        { Icon: MapPin, text: "Cadjehoun, Maison Bleue" },
      ].map(({ Icon, text }, index) => (
        <div
          key={index}
          className="flex items-center space-x-2 hover:text-blue-300 transition-colors"
        >
          <Icon className="w-5 h-5 text-blue-400" />
          <span>{text}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

export default function Cookies() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-blue-950 text-gray-200">
      <Navbar />
      <div className="container mx-auto px-6 py-24 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            Politique relative aux Cookies
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Comprendre comment nous utilisons les cookies pour améliorer votre
            expérience en ligne
          </p>
        </motion.div>

        <section className="space-y-8">
          {renderSection(
            "Qu'est-ce qu'un Cookie ?",
            <p>
              Un cookie est un petit fichier texte stocké sur votre appareil qui
              permet de mémoriser des informations et d'améliorer votre
              expérience utilisateur lors de la navigation sur notre site.
            </p>,
            Cookie
          )}

          {renderSection(
            "Types de Cookies",
            <ul className="space-y-2">
              {[
                "Cookies essentiels : Nécessaires au bon fonctionnement du site",
                "Cookies de performance : Analyser et améliorer l'utilisation du site",
                "Cookies de fonctionnalité : Personnaliser votre expérience",
                "Cookies publicitaires : Afficher des publicités ciblées",
              ].map((item, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>,
            Globe
          )}

          {renderSection(
            "Gestion des Cookies",
            <div className="space-y-4">
              <p>Contrôlez vos préférences de cookies via les navigateurs :</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["Chrome", "Firefox", "Safari", "Edge"].map(
                  (browser, index) => (
                    <div
                      key={index}
                      className="bg-white/10 rounded-lg p-2 text-center hover:bg-white/20 transition"
                    >
                      {browser}
                    </div>
                  )
                )}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Outils supplémentaires :{" "}
                <a
                  href="https://www.youronlinechoices.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                  aria-label="En savoir plus sur la gestion des cookies avec Your Online Choices"
                >
                  Your Online Choices
                </a>
              </p>
            </div>,
            Settings
          )}

          <ContactSection />
        </section>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12 text-gray-500"
        >
          <p>Date d'entrée en vigueur : 04/06/2021</p>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
