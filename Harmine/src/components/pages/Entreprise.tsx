import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { toast } from 'react-toastify';

const Entreprise: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    message: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simuler l'envoi du formulaire (remplacez par une requête API réelle)
    toast.success('Votre demande a été envoyée avec succès !');
    setFormData({ companyName: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold mb-4"
          >
            Solutions de livraison pour votre entreprise
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl mb-8"
          >
            Dynamism Express : Votre partenaire logistique fiable pour des livraisons rapides et efficaces.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              asChild
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg"
            >
              <a href="#contact">Demander un devis</a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              À propos de Dynamism Express
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Dynamism Express est une entreprise de livraison innovante, spécialisée dans les solutions logistiques pour les entreprises. Notre mission est de simplifier vos opérations avec des livraisons rapides, sécurisées et adaptées à vos besoins.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Offers Section */}
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Nos offres pour les entreprises
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Livraison Express',
                description:
                  'Livraisons le jour même pour répondre aux besoins urgents de vos clients.',
                icon: <CheckCircle className="h-8 w-8 text-blue-600" />,
              },
              {
                title: 'Abonnements Mensuels',
                description:
                  'Plans personnalisés pour des livraisons régulières à tarif préférentiel.',
                icon: <CheckCircle className="h-8 w-8 text-blue-600" />,
              },
              {
                title: 'Intégration API',
                description:
                  'Connectez notre service à votre plateforme e-commerce pour une gestion fluide.',
                icon: <CheckCircle className="h-8 w-8 text-blue-600" />,
              },
            ].map((offer, index) => (
              <motion.div
                key={offer.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md text-center"
              >
                <div className="mb-4">{offer.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {offer.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{offer.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Pourquoi choisir Dynamism Express ?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              {
                title: 'Fiabilité',
                description: '99% de livraisons à temps grâce à notre réseau optimisé.',
              },
              {
                title: 'Flexibilité',
                description: 'Solutions adaptées à vos volumes et besoins spécifiques.',
              },
              {
                title: 'Support dédié',
                description: 'Une équipe disponible 24/7 pour vous accompagner.',
              },
              {
                title: 'Technologie avancée',
                description: 'Suivi en temps réel et rapports détaillés.',
              },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="flex items-start space-x-4"
              >
                <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="bg-gray-100 dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Contactez-nous
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Prêt à optimiser vos livraisons ? Remplissez le formulaire ci-dessous pour un devis personnalisé.
            </p>
          </motion.div>
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            onSubmit={handleSubmit}
            className="max-w-lg mx-auto"
          >
            <div className="space-y-4">
              <Input
                type="text"
                name="companyName"
                placeholder="Nom de l'entreprise"
                value={formData.companyName}
                onChange={handleInputChange}
                required
                className="w-full"
              />
              <Input
                type="email"
                name="email"
                placeholder="Adresse e-mail"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full"
              />
              <Textarea
                name="message"
                placeholder="Décrivez vos besoins"
                value={formData.message}
                onChange={handleInputChange}
                required
                className="w-full"
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Envoyer la demande
              </Button>
            </div>
          </motion.form>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Entreprise;