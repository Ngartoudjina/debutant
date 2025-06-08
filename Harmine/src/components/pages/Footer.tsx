import React, { useState } from "react";
import logo from "../../img/logo-dynamism1.png";
import { Phone, Mail, MapPin } from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaLinkedin,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import axios, { AxiosError } from "axios"; // Import AxiosError
import { toast } from "react-toastify";

// Type definition for social media links
interface SocialLink {
  href: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Veuillez entrer une adresse email valide.", {
        position: "top-right",
        autoClose: 3000,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(
        process.env.REACT_APP_API_URL || "http://localhost:5000/api/newsletter/subscribe",
        { email }
      );
      toast.success(response.data.message, {
        position: "top-right",
        autoClose: 3000,
      });
      setEmail("");
    } catch (error) {
      // Type assertion for AxiosError
      const axiosError = error as AxiosError<{ error?: string }>;
      console.error("Erreur lors de l'inscription à la newsletter:", axiosError);
      const errorMessage =
        axiosError.response?.data?.error || "Une erreur est survenue. Veuillez réessayer.";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialLinks: SocialLink[] = [
    { href: "https://www.facebook.com/abel.beingar?locale=fr_FR", Icon: FaFacebook },
    { href: "https://linkedin.com", Icon: FaLinkedin },
    { href: "https://instagram.com", Icon: FaInstagram },
    { href: "https://twitter.com", Icon: FaTwitter },
    { href: "https://youtube.com", Icon: FaYoutube },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 py-16 px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
          {/* Section Logo et Description */}
          <div className="bg-white dark:bg-white/5 rounded-2xl p-8 transform hover:scale-105 transition-transform duration-300 shadow-lg dark:shadow-none">
            <img
              src={logo}
              alt="Logo"
              className="w-16 h-16 mb-6 filter drop-shadow-lg"
            />
            <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
            </h1>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Praesentium modi nam velit quo! Sit.
            </p>
          </div>

          {/* Formulaire d'inscription */}
          <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-lg dark:shadow-none">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2"
                >
                  Newsletter
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="abelbeingar@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-800 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium transform hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Envoi en cours..." : "Envoyer"}
              </button>
            </form>
          </div>
        </div>

        {/* Section Contact, Services, Ressources, Préférences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mt-16">
          {/* Contact Details */}
          <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-lg dark:shadow-none">
            <h2 className="text-xl font-bold mb-6 text-blue-500 dark:text-blue-400">
              Contact details
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Si vous avez des questions ou si vous avez besoin d'aide, veuillez
              nous contacter sur :
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 group">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors duration-300">
                  <Phone size={20} className="text-blue-500 dark:text-blue-400" />
                </div>
                <span className="text-gray-600 dark:text-gray-300">+229 01 59 33 44 83</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors duration-300">
                  <Mail size={20} className="text-blue-500 dark:text-blue-400" />
                </div>
                <span className="text-gray-600 dark:text-gray-300">abelbeingar@gmail.com</span>
              </div>
              <div className="flex items-start gap-3 group">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors duration-300">
                  <MapPin size={20} className="text-blue-500 dark:text-blue-400" />
                </div>
                <span className="text-gray-600 dark:text-gray-300">
                  Située au cœur du quartier résidentiel de Cadjehoun, la Maison
                  Bleue est un lieu emblématique et facilement accessible.
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-lg dark:shadow-none">
            <h2 className="text-xl font-bold mb-6 text-blue-500 dark:text-blue-400">Service</h2>
            <ul className="space-y-3">
              {[
                { to: "/", text: "Accueil" },
                { to: "/reserv", text: "Reservation express" },
                { to: "/suivi", text: "Suivie en temps réel" },
                { to: "/entreprise", text: "Solution Professionnelle" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="h-1 w-1 bg-blue-500 dark:bg-blue-400 rounded-full group-hover:w-3 transition-all duration-300"></span>
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-lg dark:shadow-none">
            <h2 className="text-xl font-bold mb-6 text-blue-500 dark:text-blue-400">Ressources</h2>
            <ul className="space-y-3">
              {[
                { to: "/propos", text: "À propos" },
                { to: "/contact", text: "Contact" },
                { to: "/client", text: "Client" },
                { to: "/coursier", text: "Coursier" },
                { to: "/login", text: "Se connecter" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="h-1 w-1 bg-blue-500 dark:bg-blue-400 rounded-full group-hover:w-3 transition-all duration-300"></span>
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Préférences */}
          <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-lg dark:shadow-none">
            <h2 className="text-xl font-bold mb-6 text-blue-500 dark:text-blue-400">
              Préférences
            </h2>
            <ul className="space-y-3">
              {[
                { to: "/confidential", text: "Confidentialité" },
                { to: "/cookies", text: "Cookies" },
                { to: "/termes", text: "Termes et vie privée" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="h-1 w-1 bg-blue-500 dark:bg-blue-400 rounded-full group-hover:w-3 transition-all duration-300"></span>
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="flex justify-end gap-6 mt-16">
          {socialLinks.map(({ href, Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="transform hover:scale-110 transition-transform duration-300"
            >
              <Icon
                size={24}
                className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-300"
              />
            </a>
          ))}
        </div>

        {/* Copyright et crédits */}
        <div className="border-t border-gray-300 dark:border-gray-800 mt-16 pt-8">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            © {new Date().getFullYear()} Dynamism-Express. Tous droits réservés.
            <a
              href="https://abelbeingar-codingspace.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 ml-2 transition-colors group inline-flex items-center"
            >
              Développé par
              <span className="inline-block group-hover:translate-x-1 transition-transform duration-300 ml-1">
                abelbeingar-codingspace →
              </span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}