import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import admin1 from "../../img/admin1.jpg";
import admin2 from "../../img/admin2.jpg";
import admin3 from "../../img/admin3.jpg";

export default function Section4() {
  // Données pour les témoignages
  const testimonials = [
    {
      name: "Alice Dupont",
      role: "Entrepreneure",
      photo: admin1,
      rating: 5,
      comment:
        "Dynamism Express a révolutionné ma façon de gérer mes livraisons. Rapide, fiable et professionnel !",
    },
    {
      name: "Jean Martin",
      role: "Gérant de boutique",
      photo: admin2,
      rating: 5,
      comment:
        "Le suivi en temps réel est incroyable. Je recommande vivement ce service à tous les professionnels.",
    },
    {
      name: "Sophie Leroy",
      role: "Particulière",
      photo: admin3,
      rating: 5,
      comment:
        "Service client exceptionnel et livraison toujours à l'heure. Merci Dynamism Express !",
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
            Ce Que Disent Nos Clients
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Découvrez pourquoi des milliers de clients nous font confiance pour
            leurs livraisons.
          </p>
        </motion.div>

        {/* Cartes des témoignages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/20 transition-all duration-300 transform hover:-translate-y-2 shadow-lg dark:shadow-none"
            >
              <div className="flex flex-col items-center text-center">
                {/* Photo de profil */}
                <img
                  src={testimonial.photo}
                  alt={testimonial.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-white/20"
                />

                {/* Nom et rôle */}
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-6">
                  {testimonial.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{testimonial.role}</p>

                {/* Avis étoilés */}
                <div className="flex items-center gap-1 mt-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                {/* Témoignage */}
                <div className="mt-6 text-gray-600 dark:text-gray-300 leading-relaxed relative">
                  <Quote className="absolute -top-6 left-0 w-6 h-6 text-blue-500 opacity-20" />
                  {testimonial.comment}
                  <Quote className="absolute -bottom-6 right-0 w-6 h-6 text-blue-500 opacity-20 transform rotate-180" />
                </div>
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
            href="/avis"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium hover:scale-105 transition-transform shadow-lg"
          >
            <span>Voir tous les avis</span>
            <Star className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}