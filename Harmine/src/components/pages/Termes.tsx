import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import Footer from "./Footer";
import Navbar from "./Navbar";
import CookieConsentBanner from "../cookies/CookieConsentBanner";

export default function Termes() {
  const renderSection = (title: string, content: React.ReactNode) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-500 transition-all mb-8"
  >
    <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
    <div className="text-gray-300">{content}</div>
  </motion.div>
);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-blue-950 text-gray-200">
      <Navbar />
      <div className="container mx-auto px-6 py-24 max-w-4xl">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            Termes et Conditions & Politique de Vie Privée
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Découvrez les règles qui régissent l'utilisation de notre service et comment nous protégeons vos données.
          </p>
        </motion.div>

        {/* Navigation Interne */}
        <div className="flex justify-center space-x-4 mb-12">
          <a href="#terms" className="text-blue-400 hover:underline">
            Termes et Conditions
          </a>
          <a href="#privacy" className="text-blue-400 hover:underline">
            Politique de Vie Privée
          </a>
        </div>

        {/* Termes et Conditions */}
        <section id="terms" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Termes et Conditions</h2>
          {renderSection(
            "1. Introduction",
            <p>
              En utilisant notre service, vous acceptez les présentes conditions. Veuillez les lire attentivement.
            </p>
          )}
          {renderSection(
            "2. Utilisation du Service",
            <p>
              Notre service est destiné à un usage personnel et professionnel. Vous vous engagez à ne pas l'utiliser à des fins illégales.
            </p>
          )}
          {renderSection(
            "3. Responsabilités",
            <p>
              Vous êtes responsable de toutes les activités effectuées sous votre compte. Nous ne serons pas responsables des dommages résultant d'une utilisation abusive.
            </p>
          )}
          {renderSection(
            "4. Propriété Intellectuelle",
            <p>
              Tout le contenu de notre site est protégé par des droits d'auteur. Vous ne pouvez pas le reproduire sans autorisation.
            </p>
          )}
          {renderSection(
            "5. Résiliation",
            <p>
              Nous nous réservons le droit de résilier votre accès au service en cas de violation des conditions.
            </p>
          )}
          {renderSection(
            "6. Limitation de Responsabilité",
            <p>
              Nous ne serons pas responsables des dommages indirects, consécutifs ou spéciaux résultant de l'utilisation de notre service.
            </p>
          )}
        </section>

        {/* Politique de Vie Privée */}
        <section id="privacy" className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Politique de Vie Privée</h2>
          {renderSection(
            "1. Introduction",
            <p>
              Nous nous engageons à protéger vos données personnelles. Cette politique explique comment nous collectons et utilisons vos informations.
            </p>
          )}
          {renderSection(
            "2. Données Collectées",
            <p>
              Nous collectons des informations telles que votre nom, adresse e-mail, adresse IP et données de localisation.
            </p>
          )}
          {renderSection(
            "3. Utilisation des Données",
            <p>
              Vos données sont utilisées pour fournir et améliorer notre service, personnaliser votre expérience et vous informer des mises à jour.
            </p>
          )}
          {renderSection(
            "4. Partage des Données",
            <p>
              Nous ne partageons vos données qu'avec des tiers de confiance, comme nos partenaires de paiement, et uniquement si nécessaire.
            </p>
          )}
          {renderSection(
            "5. Droits des Utilisateurs",
            <p>
              Vous avez le droit d'accéder, de corriger ou de supprimer vos données. Contactez-nous pour exercer ces droits.
            </p>
          )}
          {renderSection(
            "6. Sécurité des Données",
            <p>
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données.
            </p>
          )}
          {renderSection(
            "7. Cookies",
            <p>
              Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez les gérer via les paramètres de votre navigateur.
            </p>
          )}
          {renderSection(
            "8. Modifications de la Politique",
            <p>
              Nous pouvons mettre à jour cette politique. Toute modification sera publiée sur cette page.
            </p>
          )}
        </section>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center"
        >
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Contactez-nous</h3>
            <p className="text-gray-400">
              Des questions sur nos termes ou notre politique de vie privée ?
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
      </div>
      <Footer />
      {/* Ajoutez le composant CookieConsentBanner ici */}
      <CookieConsentBanner />
    </div>
  );
}