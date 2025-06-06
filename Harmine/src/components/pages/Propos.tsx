import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // Removed unused AnimatePresence
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ThemeToggle from './ThemeToggle';
import {
  Rocket,
  Shield,
  Clock,
  ChevronRight,
  MapPin,
  PlaneTakeoff,
  Facebook,
  Eye,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { CiLinkedin } from 'react-icons/ci';
import { FaInstagram } from 'react-icons/fa';
import header from '../../img/Dynamism-header1.png';
import propos1 from '../../img/propos1.jpeg';
import admin1 from '../../img/admin1.jpg';
import admin2 from '../../img/admin2.jpg';
import admin3 from '../../img/admin3.jpg';

// Define interfaces for data
interface ServiceCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface PricingCard {
  title: string;
  price: string;
  features: string[];
}

interface TeamMember {
  name: string;
  role: string;
  image: string;
}

interface SocialLink {
  Icon: React.ComponentType<{ className?: string }>;
  href: string;
  label: string;
}

const Propos: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const serviceCards: ServiceCard[] = [
    {
      icon: Rocket,
      title: 'Livraison Rapide',
      description: 'Nos coursiers experts garantissent des livraisons ultrarapides et sécurisées.',
    },
    {
      icon: Shield,
      title: 'Sécurité Maximale',
      description: 'Traçabilité en temps réel et protection de vos colis à chaque étape.',
    },
    {
      icon: Clock,
      title: 'Flexibilité',
      description: 'Des horaires adaptés à vos besoins, 7j/7 et 24h/24.',
    },
  ];

  const pricingCards: PricingCard[] = [
    {
      title: 'Starter',
      price: '39',
      features: ['Jusqu'à 5 livraisons/mois', 'Support standard', 'Suivi de base'],
    },
    {
      title: 'Pro',
      price: '79',
      features: ['Jusqu'à 20 livraisons/mois', 'Support prioritaire', 'Suivi détaillé'],
    },
    {
      title: 'Enterprise',
      price: '149',
      features: ['Livraisons illimitées', 'Support premium', 'Rapports personnalisés'],
    },
  ];

  const teamMembers: TeamMember[] = [
    { name: 'John Doe', role: 'CEO', image: admin1 },
    { name: 'Jane Smith', role: 'CTO', image: admin2 },
    { name: 'Alice Johnson', role: 'Responsable Clientèle', image: admin3 },
  ];

  const socialLinks: SocialLink[] = [
    { Icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { Icon: FaWhatsapp, href: 'https://wa.me/1234567890', label: 'WhatsApp' },
    { Icon: CiLinkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { Icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-slate-100 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-950 text-gray-900 dark:text-white">
      <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center"
        >
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex items-center space-x-2 text-blue-600 dark:text-blue-400"
            >
              <PlaneTakeoff className="w-6 h-6" />
              <p className="uppercase tracking-wider text-sm">Transformer la logistique</p>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Livraisons Intelligentes,
              </span>
              <span className="block">Performance Garantie</span>
            </h1>
            <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg max-w-xl">
              Révolutionnez votre expérience de livraison avec notre technologie de pointe. Rapide, fiable et toujours à votre service.
            </p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
            >
              <Link
                to="/reserv"
                className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white hover:shadow-lg transition-all"
                aria-label="Réserver une livraison"
              >
                <motion.span whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                  Réserver
                </motion.span>
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="border border-gray-300 dark:border-white/20 px-6 py-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                aria-label="Contacter l'équipe"
              >
                Contactez-nous
              </Link>
            </motion.div>
          </motion.div>
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            src={header}
            alt="Service de livraison Dynamism Express"
            className="w-full rounded-3xl shadow-2xl object-cover"
          />
        </motion.div>
      </section>

      {/* Services Section */}
      <section className="bg-gray-100 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center mb-12"
          >
            Nos Services
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {serviceCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md dark:shadow-none"
              >
                <card.icon className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3">{card.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-6">Notre Histoire</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base sm:text-lg">
              Dynamism Express est né de la volonté de simplifier la logistique urbaine. Fondée en 2020, notre entreprise s'est rapidement imposée comme un acteur clé dans le domaine des livraisons rapides et sécurisées. Notre mission est de connecter les gens et les entreprises grâce à une technologie innovante et un service client exceptionnel.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Presentation Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-100 via-slate-100 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-950 py-16">
        <div className="container mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group relative"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl"
            >
              <img
                src={propos1}
                alt="Service de livraison Dynamism Express"
                className="w-full h-full object-cover"
              />
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-blue-900/30 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/20 backdrop-blur-sm p-4 rounded-full"
                >
                  <Eye className="w-10 h-10 text-white" />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-center space-x-2"
            >
              <Rocket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-600 dark:text-blue-400 uppercase text-sm tracking-wider">
                Notre Vision
              </span>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              Livraisons Intelligentes, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Expérience Simplifiée
              </span>
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
              Dynamism Express transforme la logistique urbaine. Notre plateforme connecte instantanément des clients à des coursiers experts, garantissant des livraisons rapides, sécurisées et totalement transparentes.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { Icon: MapPin, text: 'Couverture Nationale' },
                { Icon: Clock, text: 'Livraison 24/7' },
                { Icon: Shield, text: '100% Sécurisé' },
              ].map(({ Icon, text }, index) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center space-x-2 bg-white/80 dark:bg-white/10 px-4 py-2 rounded-full"
                >
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-800 dark:text-gray-200">{text}</span>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/reserv"
                className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white hover:shadow-xl transition-all"
                aria-label="Réserver une livraison"
              >
                <motion.span whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                  Réserver une Livraison
                </motion.span>
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center space-x-3">
                {socialLinks.map(({ Icon, href, label }, index) => (
                  <motion.a
                    key={index}
                    href={href}
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                    aria-label={`Suivez-nous sur ${label}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon className="w-6 h-6" />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-gradient-radial from-blue-600/20 via-transparent to-transparent"
        />
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-100 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center mb-12"
          >
            Notre Équipe
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl text-center shadow-md dark:shadow-none"
              >
                <motion.img
                  src={member.image}
                  alt={`Photo de ${member.name}`}
                  className="w-32 h-32 mx-auto rounded-full mb-4 object-cover"
                  whileHover={{ rotate: 5 }}
                  transition={{ duration: 0.3 }}
                />
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center mb-12"
          >
            Nos Offres
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all shadow-md dark:shadow-none"
              >
                <h3 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
                  {card.title}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{card.price}€</span>
                  <span className="text-gray-600 dark:text-gray-400">/mois</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {card.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                    >
                      <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className="block w-full text-center py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white hover:shadow-lg transition-all"
                  aria-label={`Choisir l'offre ${card.title}`}
                >
                  Choisir cette offre
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Propos;