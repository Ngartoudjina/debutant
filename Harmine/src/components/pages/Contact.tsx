import React, {
  useState,
  useEffect,
  useCallback,
  FormEvent,
  ChangeEvent,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Send,
  Facebook,
  Instagram,
  Linkedin,
  HelpCircle,
  Users,
  Star,
  Clock,
  Package,
  Truck,
  Shield,
  MessageCircle,
  ChevronDown,
  Globe,
  Award,
  Link,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import ThemeToggle from "./ThemeToggle";
import Slider from "react-slick";
import "leaflet/dist/leaflet.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CookieConsentBanner from "../cookies/CookieConsentBanner";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// Type definitions
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

interface SocialLink {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  link: string;
  label: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  rating: number;
}

interface FAQ {
  question: string;
  answer: string;
}

interface Service {
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  timestamp: any;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
            Une erreur s'est produite.
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Veuillez recharger la page ou contacter le support.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const ContactPage: React.FC = memo(() => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [language, setLanguage] = useState("fr");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Form Validation
  const validateForm = useCallback(() => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) errors.name = "Le nom est requis";
    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "L'email est invalide";
    }
    if (!formData.subject) errors.subject = "Le sujet est requis";
    if (!formData.message.trim()) errors.message = "Le message est requis";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const userId = localStorage.getItem("userId") || "";
      const response = await axios.post(
        "http://localhost:5000/api/contact/submit",
        {
          name: formData.name,
          email: formData.email,
          message: formData.message,
          userId,
        }
      );
      toast.success(response.data.message, {
        position: "top-right",
        autoClose: 3000,
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du message:", error);
      const errorMessage =
        error.response?.data?.error || "Erreur lors de l'envoi du message.";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Newsletter Signup
  const handleNewsletterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(newsletterEmail)) {
      toast.error("Veuillez entrer un email valide.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:5000/api/newsletter/subscribe",
        {
          email: newsletterEmail,
        }
      );
      toast.success(response.data.message, {
        position: "top-right",
        autoClose: 3000,
      });
      setNewsletterEmail("");
    } catch (error: any) {
      console.error("Erreur lors de l'inscription :", error);
      const errorMessage =
        error.response?.data?.error ||
        "Erreur lors de l'inscription à la newsletter.";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Chat Functionality
  useEffect(() => {
    if (!showChat) return;
    const q = query(
      collection(db, "chat_messages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];
      setChatMessages(messages);
    });
    return () => unsubscribe();
  }, [showChat]);

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    try {
      await addDoc(collection(db, "chat_messages"), {
        userId: localStorage.getItem("userId") || "anonymous",
        message: chatInput,
        timestamp: Timestamp.now(),
      });
      setChatInput("");
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
      toast.error("Erreur lors de l'envoi du message de chat.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // FAQ Toggle
  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Language Switcher (Placeholder)
  const switchLanguage = (lang: string) => {
    setLanguage(lang);
  };

  const renderSection = (
    title: string,
    content: React.ReactNode,
    Icon: React.ComponentType<{ className?: string }>,
    index: number
  ) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-2xl p-6 border border-gray-200 dark:bg-gray-800/70 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
    >
      <div className="flex items-center mb-4 space-x-3">
        <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
      </div>
      {content}
    </motion.div>
  );

  const socialLinks: SocialLink[] = [
    {
      Icon: Facebook,
      link: "https://www.facebook.com/abel.beingar?locale=fr_FR",
      label: "Facebook",
    },
    {
      Icon: Instagram,
      link: "https://instagram.com/dynamismexpress",
      label: "Instagram",
    },
    {
      Icon: Linkedin,
      link: "https://linkedin.com/company/dynamismexpress",
      label: "LinkedIn",
    },
  ];

  const testimonials: Testimonial[] = [
    {
      quote:
        "Service rapide et fiable ! Ma commande est arrivée en parfait état.",
      author: "Jean D.",
      role: "Client",
      rating: 5,
    },
    {
      quote: "Devenir coursier était simple grâce à leur équipe supportive.",
      author: "Marie L.",
      role: "Coursier",
      rating: 4,
    },
    {
      quote:
        "Support client exceptionnel, ils ont répondu en quelques minutes !",
      author: "Paul K.",
      role: "Client",
      rating: 5,
    },
  ];

  const faqs: FAQ[] = [
    {
      question: "Comment suivre ma commande ?",
      answer:
        "Connectez-vous à votre compte sur notre site et accédez à l'onglet 'Suivi' pour voir l'état de votre commande en temps réel.",
    },
    {
      question: "Comment devenir coursier ?",
      answer:
        "Remplissez le formulaire d'inscription dans la section 'Devenir Coursier' et notre équipe vous contactera pour les prochaines étapes.",
    },
    {
      question: "Que faire en cas de problème de livraison ?",
      answer:
        "Contactez notre support client via le formulaire ou par téléphone au +229 0159334483. Nous résoudrons votre problème rapidement.",
    },
    {
      question: "Quels sont les délais de livraison ?",
      answer:
        "Les délais varient selon la destination, mais notre service express garantit une livraison en 2 à 4 heures dans Cotonou.",
    },
  ];

  const services: Service[] = [
    {
      title: "Livraison Rapide",
      description:
        "Recevez vos colis en quelques heures avec notre service express.",
      Icon: Truck,
    },
    {
      title: "Sécurité Garantie",
      description: "Assurance incluse pour protéger vos colis précieux.",
      Icon: Shield,
    },
    {
      title: "Suivi en Temps Réel",
      description: "Suivez votre commande à chaque étape de la livraison.",
      Icon: MapPin,
    },
    {
      title: "Support 24/7",
      description: "Notre équipe est disponible à tout moment pour vous aider.",
      Icon: MessageCircle,
    },
  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    centerMode: true,
    centerPadding: "20px",
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2, centerPadding: "20px" },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1, centerMode: true, centerPadding: "10px" },
      },
      {
        breakpoint: 480,
        settings: { slidesToShow: 1, centerMode: true, centerPadding: "5px" },
      },
    ],
    lazyLoad: "ondemand" as const,
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 font-sans">
        <Navbar />
        <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-7xl w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16 flex flex-col items-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500">
              Contactez Dynamism Express
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto sm:max-w-2xl">
              Besoin d'aide ou envie de collaborer ? Notre équipe est là pour
              vous, 24/7.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
              <a
                href="/track-order"
                className="inline-flex items-center px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-all w-full sm:w-auto justify-center"
                aria-label="Suivre une commande"
              >
                <Link className="w-5 h-5 mr-2" />
                Suivre une Commande
              </a>
              <a
                href="/coursier"
                className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-gray-600 transition-all w-full sm:w-auto justify-center"
                aria-label="Devenir coursier"
              >
                <Users className="w-5 h-5 mr-2" />
                Devenir Coursier
              </a>
            </div>
          </motion.div>

          {/* Language Switcher */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center sm:justify-end mb-8"
          >
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-full p-2">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <select
                onChange={(e) => switchLanguage(e.target.value)}
                value={language}
                className="bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none"
                aria-label="Sélectionner la langue"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </motion.div>

          {/* Services Section */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-12 sm:mb-16 flex flex-col items-center"
            aria-labelledby="services-title"
          >
            <h2
              id="services-title"
              className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8 text-center"
            >
              Pourquoi Choisir Dynamism Express ?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full justify-items-center">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-800/70 rounded-lg p-6 border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-md hover:shadow-lg w-full max-w-sm"
                >
                  <service.Icon className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400 mb-4 mx-auto" />
                  <h3 className="text-base sm:text-lg font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                    {service.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16 w-full">
            {/* Contact Form */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-800/20 rounded-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-lg w-full mx-auto"
              aria-labelledby="contact-form-title"
            >
              <h2
                id="contact-form-title"
                className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center justify-center"
              >
                <Send className="mr-2 sm:mr-3 text-blue-600 dark:text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />
                Envoyez-nous un Message
              </h2>
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                aria-label="Formulaire de contact"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      Nom Complet
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Votre nom"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      aria-label="Nom complet"
                      className="mt-1 w-full px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500"
                    />
                    {formErrors.name && (
                      <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      Adresse Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      aria-label="Adresse e-mail"
                      className="mt-1 w-full px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500"
                    />
                    {formErrors.email && (
                      <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    Sujet
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    aria-label="Sélectionner un sujet"
                    className="mt-1 w-full px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all text-gray-900 dark:text-gray-100"
                  >
                    <option value="" className="bg-white dark:bg-gray-900">
                      Sélectionner un sujet
                    </option>
                    <option
                      value="support"
                      className="bg-white dark:bg-gray-900"
                    >
                      Support Client
                    </option>
                    <option
                      value="livraison"
                      className="bg-white dark:bg-gray-900"
                    >
                      Problème de Livraison
                    </option>
                    <option
                      value="devenir-coursier"
                      className="bg-white dark:bg-gray-900"
                    >
                      Devenir Coursier
                    </option>
                    <option value="autre" className="bg-white dark:bg-gray-900">
                      Autre
                    </option>
                  </select>
                  {formErrors.subject && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                      {formErrors.subject}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Votre message ici..."
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    aria-label="Message"
                    className="mt-1 w-full px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500"
                  />
                  {formErrors.message && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                      {formErrors.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white py-2 sm:py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Envoyer le message"
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer le Message"}
                </button>
              </form>
            </motion.section>

            {/* Contact Information */}
            <div className="space-y-6 flex flex-col items-center md:items-start w-full">
              {renderSection(
                "Nos Coordonnées",
                <div className="space-y-4 text-gray-700 dark:text-gray-200 text-center md:text-left">
                  <div className="flex items-center space-x-3 justify-center md:justify-start">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                    <span>Quartier Cadjehoun, Cotonou, Bénin</span>
                  </div>
                  <div className="flex items-center space-x-3 justify-center md:justify-start">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                    <a
                      href="tel:+2290159334483"
                      className="hover:text-blue-500 dark:hover:text-blue-300 transition"
                      aria-label="Appeler le support"
                    >
                      +229 0159334483
                    </a>
                  </div>
                  <div className="flex items-center space-x-3 justify-center md:justify-start">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                    <a
                      href="mailto:abelbeingar@gmail.com"
                      className="hover:text-blue-500 dark:hover:text-blue-300 transition"
                      aria-label="Envoyer un email"
                    >
                      abelbeingar@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center space-x-3 justify-center md:justify-start">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                    <span>Lun-Sam, 8h-20h</span>
                  </div>
                </div>,
                Phone,
                0
              )}

              {renderSection(
                "Questions Fréquentes",
                <div className="space-y-2 w-full">
                  {faqs.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: activeFaq === index ? "auto" : "auto",
                        opacity: 1,
                      }}
                      className="border-b border-gray-200 dark:border-gray-700"
                    >
                      <button
                        onClick={() => toggleFaq(index)}
                        className="flex items-center justify-between w-full py-3 text-left text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition text-sm sm:text-base"
                        aria-expanded={activeFaq === index}
                        aria-controls={`faq-${index}`}
                      >
                        <div className="flex items-center space-x-2">
                          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                          <span>{faq.question}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                            activeFaq === index ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {activeFaq === index && (
                          <motion.div
                            id={`faq-${index}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="pb-3 text-gray-600 dark:text-gray-300 text-sm"
                          >
                            {faq.answer}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>,
                HelpCircle,
                1
              )}

              {renderSection(
                "Suivez-nous",
                <div className="flex space-x-6 justify-center">
                  {socialLinks.map(({ Icon, link, label }, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition"
                      aria-label={`Suivez-nous sur ${label}`}
                    >
                      <Icon
                        size={24}
                        className="transition-transform hover:scale-110"
                      />
                    </a>
                  ))}
                </div>,
                Users,
                2
              )}
            </div>
          </div>

          {/* Trust Signals */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="my-12 sm:my-16 text-center flex flex-col items-center"
            aria-labelledby="trust-signals-title"
          >
            <h2
              id="trust-signals-title"
              className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8"
            >
              La Confiance de Nos Clients
            </h2>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 sm:gap-8 w-full max-w-3xl">
              <div className="flex items-center space-x-3">
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Certifié ISO 9001
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Qualité garantie
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    +10,000 Clients
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Satisfaits
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Star className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    4.8/5 Étoiles
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Sur Trustpilot
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Testimonials Carousel */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="my-12 sm:my-16 flex flex-col items-center"
            aria-labelledby="testimonials-title"
          >
            <h2
              id="testimonials-title"
              className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8 text-center flex items-center justify-center"
            >
              <Star className="mr-2 sm:mr-3 text-blue-600 dark:text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />
              Ce Que Disent Nos Clients
            </h2>
            <div className="w-full max-w-4xl">
              <Slider {...sliderSettings}>
                {testimonials.map(({ quote, author, role, rating }, index) => (
                  <div key={index} className="px-2 sm:px-4">
                    <div className="bg-white dark:bg-gray-800/70 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-600 shadow-md">
                      <div className="flex items-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 sm:w-4 sm:h-4 ${
                              i < rating ? "text-yellow-400" : "text-gray-300"
                            }`}
                            fill={i < rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <p className="italic text-gray-700 dark:text-gray-200 mb-4 text-sm sm:text-base">
                        "{quote}"
                      </p>
                      <p className="text-right text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        - {author},{" "}
                        <span className="font-semibold">{role}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </motion.section>

          {/* Newsletter Signup */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="my-12 sm:my-16 bg-blue-600 dark:bg-blue-500 text-white rounded-lg p-6 sm:p-8 text-center flex flex-col items-center"
            aria-labelledby="newsletter-title"
          >
            <h2
              id="newsletter-title"
              className="text-xl sm:text-2xl font-bold mb-4"
            >
              Restez Informé !
            </h2>
            <p className="text-blue-100 mb-6 text-sm sm:text-base max-w-md">
              Inscrivez-vous à notre newsletter pour recevoir des mises à jour
              et des offres exclusives.
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row w-full max-w-md mx-auto gap-2 sm:gap-0"
            >
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Votre email"
                className="flex-1 px-3 sm:px-4 py-2 rounded-t-lg sm:rounded-l-lg sm:rounded-t-none bg-blue-100 dark:bg-blue-200 text-gray-900 focus:outline-none"
                aria-label="Adresse email pour la newsletter"
              />
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 bg-blue-800 hover:bg-blue-900 rounded-b-lg sm:rounded-r-lg sm:rounded-b-none transition-all"
                aria-label="S'inscrire à la newsletter"
              >
                S'inscrire
              </button>
            </form>
          </motion.section>

          {/* Leaflet Map */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="my-12 sm:my-16 bg-white dark:bg-gray-800/70 rounded-lg border border-gray-200 dark:border-gray-600 shadow-md overflow-hidden w-full"
            aria-labelledby="map-title"
          >
            <h2
              id="map-title"
              className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 p-4 sm:p-6 text-center"
            >
              Où Nous Trouver
            </h2>
            <div className="h-80 sm:h-96 w-full">
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="my-12 sm:my-16 bg-white dark:bg-gray-800/70 rounded-lg border border-gray-200 dark:border-gray-600 shadow-md overflow-hidden w-full"
                aria-labelledby="map-title"
              >
                <h2
                  id="map-title"
                  className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 p-4 sm:p-6 text-center"
                >
                  Où Nous Trouver
                </h2>
                <div className="h-80 sm:h-96 w-full">
                  <MapContainer
                    center={[6.36536, 2.41808] as [number, number]}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[6.36536, 2.41808] as [number, number]}>
                      <Popup>
                        <div className="text-center">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100">
                            Dynamism Express
                          </h3>
                          <p className="text-gray-700 dark:text-gray-200">
                            Quartier Cadjehoun, Cotonou, Bénin
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </motion.section>
            </div>
          </motion.section>
        </div>

        {/* Chat Widget */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-20 right-4 sm:right-6 bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-[90%] sm:w-80 max-h-[400px] shadow-lg border border-gray-200 dark:border-gray-600"
              role="dialog"
              aria-labelledby="chat-title"
            >
              <h3
                id="chat-title"
                className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4"
              >
                Chat en Direct
              </h3>
              <div className="h-40 sm:h-48 overflow-y-auto mb-4 space-y-2">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-xs sm:text-sm text-gray-900 dark:text-gray-100"
                  >
                    <p>{msg.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(msg.timestamp.toDate()).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
                  aria-label="Message de chat"
                />
                <button
                  onClick={sendChatMessage}
                  className="px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg text-white"
                  aria-label="Envoyer le message de chat"
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="mt-4 text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm"
                aria-label="Fermer le chat"
              >
                Fermer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          onClick={() => setShowChat(!showChat)}
          className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-blue-600 dark:bg-blue-500 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={
            showChat ? "Fermer le chat en direct" : "Ouvrir le chat en direct"
          }
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.button>

        <Footer />
        <CookieConsentBanner />
      </div>
    </ErrorBoundary>
  );
});

export default ContactPage;
