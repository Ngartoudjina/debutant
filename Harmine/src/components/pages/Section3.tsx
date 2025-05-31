import React from "react";
import { motion } from "framer-motion";
import { Rocket, Shield, Clock, Heart } from "lucide-react";

export default function Section3() {
  // Données pour les cartes
  const features = [
    {
      icon: <Rocket className="w-12 h-12 text-blue-500 dark:text-blue-400" />,
      title: "Livraison Express",
      description:
        "Nous livrons vos colis en un temps record, où que vous soyez. Rapidité et efficacité garanties.",
    },
    {
      icon: <Shield className="w-12 h-12 text-purple-500 dark:text-purple-400" />,
      title: "Sécurité Totale",
      description:
        "Vos colis sont assurés et suivis en temps réel. Nous garantissons une livraison sûre et sécurisée.",
    },
    {
      icon: <Clock className="w-12 h-12 text-pink-500 dark:text-pink-400" />,
      title: "Disponibilité 24/7",
      description:
        "Notre équipe est disponible 24 heures sur 24, 7 jours sur 7, pour répondre à vos besoins.",
    },
  ];

  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Fond animé - Visible uniquement en dark */}
      <div className="absolute inset-0 dark:block hidden">
        <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      </div>

      <div className="container mx-auto px-6">
        {/* Titre et sous-titre */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">
            Pourquoi Choisir Dynamism Express ?
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Découvrez les avantages qui font de nous le leader des services de
            livraison rapide et sécurisée.
          </p>
        </motion.div>

        {/* Cartes des fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="backdrop-blur-sm bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/20 transition-all duration-300 transform hover:-translate-y-2 shadow-lg dark:shadow-none"
            >
              <div className="flex flex-col items-center text-center">
                {/* Icône */}
                <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full">
                  {feature.icon}
                </div>

                {/* Titre */}
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-6">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call-to-Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <a
            href="/propos"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium hover:scale-105 transition-transform shadow-lg"
          >
            <span>En savoir plus</span>
            <Heart className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}