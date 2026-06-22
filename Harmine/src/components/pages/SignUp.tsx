import { useState, FormEvent, ChangeEvent } from "react";
import { API_URL } from './config';
import { useTheme } from '../context/ThemeContext';
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  MapPin,
  Eye,
  EyeOff,
  UserPlus,
  Moon,
  Sun,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import CookieConsentBanner from "../cookies/CookieConsentBanner";
import { signInWithCustomToken, getAuth } from "firebase/auth";
import { getMessagingInstance } from "../../../firebaseConfig";
import { getToken, onMessage } from "firebase/messaging";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import axios, { AxiosError } from "axios";
import type { User as FirebaseUser } from "firebase/auth";

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
}

const SignupPage: React.FC = () => {
  const auth = getAuth();
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/check-email`,
        { email },
        { headers: { "Content-Type": "application/json" }, timeout: 5000 }
      );
      return response.data.exists;
    } catch (error) {
      console.error("Erreur vérification email:", error);
      return false;
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      phone: value,
    }));
  };

  const setupFCM = async (user: FirebaseUser): Promise<string | null> => {
    console.log("🔔 Début de setupFCM pour userId:", user?.uid || "UNDEFINED!");
    let fcmToken: string | null = null;

    try {
      if (!user || !user.uid) {
        console.error("❌ user ou user.uid manquant:", { user: !!user, uid: user?.uid });
        throw new Error("Utilisateur ou identifiant utilisateur manquant");
      }

      console.log("✅ User valide détecté:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      });

      if (!("serviceWorker" in navigator)) {
        console.warn("⚠️ Service workers non supportés");
        throw new Error("Service workers non supportés par ce navigateur");
      }
      if (!("PushManager" in window)) {
        console.warn("⚠️ Push notifications non supportées");
        throw new Error("Push notifications non supportées par ce navigateur");
      }
      if (!("Notification" in window)) {
        console.warn("⚠️ Notifications non supportées");
        throw new Error("Notifications non supportées par ce navigateur");
      }

      console.log("📜 Demande de permission notifications...");
      const permission = await Notification.requestPermission();
      console.log("📜 Permission notification:", permission);

      if (permission !== "granted") {
        console.warn("⚠️ Permission notifications refusée");
      }

      const messaging = await getMessagingInstance();
      if (!messaging) {
        throw new Error("Impossible d'initialiser Firebase Messaging");
      }
      console.log("✅ Messaging initialisé");

      const vapidKey = import.meta.env.VITE_VAPID_KEY;
      if (!vapidKey) {
        throw new Error("VITE_VAPID_KEY non définie dans les variables d'environnement");
      }
      console.log("✅ VAPID key trouvée");

      console.log("📡 Enregistrement du service worker...");
      let registration;
      try {
        registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("✅ Service worker enregistré:", registration);
        await navigator.serviceWorker.ready;
        console.log("✅ Service worker prêt");
      } catch (swError: unknown) {
        console.error("❌ Erreur service worker:", swError);
        if (swError instanceof Error) {
          throw new Error(`Erreur service worker: ${swError.message}`);
        }
        throw new Error("Erreur service worker inconnue");
      }

      if (permission === "granted") {
        console.log("🔑 Génération du token FCM...");
        try {
          fcmToken = await getToken(messaging, {
            vapidKey: vapidKey,
            serviceWorkerRegistration: registration,
          });

          if (fcmToken) {
            console.log("✅ Token FCM généré:", fcmToken.substring(0, 20) + "...");
            onMessage(messaging, (payload) => {
              console.log("📨 Notification reçue:", payload);
              
            });
          } else {
            console.warn("⚠️ Token FCM vide");
            fcmToken = null;
          }
        } catch (tokenError) {
          console.error("❌ Erreur génération token:", tokenError);
          fcmToken = null;
        }
      } else {
        console.log("ℹ️ Permissions non accordées, pas de génération de token");
      }

      console.log("🌐 Préparation envoi token pour userId:", user.uid, "token:", fcmToken || "null");
      try {
        const idToken = await user.getIdToken(true);
        if (!idToken) {
          throw new Error("Échec récupération idToken");
        }
        console.log("🔑 ID Token obtenu:", idToken.substring(0, 20) + "...");

        const requestData = {
          fcmToken: fcmToken,
          userId: user.uid,
        };
        console.log("📤 Données envoyées:", requestData);

        const response = await axios.post(
          `${API_URL}/api/notifications/register`,
          requestData,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          }
        );

        console.log("✅ Réponse backend:", response.data);
      } catch (axiosError: unknown) {
        console.error("❌ Erreur envoi token au backend:", axiosError);
        if (axiosError instanceof AxiosError && axiosError.response) {
          console.error("❌ Détails erreur:", {
            status: axiosError.response.status,
            data: axiosError.response.data,
            message: axiosError.message,
          });
        }
      }
    } catch (error: unknown) {
      console.error("❌ Erreur générale setupFCM:", error);
      if (user && user.uid) {
        try {
          const idToken = await user.getIdToken(true);
          await axios.post(
            `${API_URL}/api/notifications/register`,
            {
              fcmToken: null,
              userId: user.uid,
            },
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json",
              },
              timeout: 15000,
            }
          );
          console.log("✅ Token null envoyé au backend après erreur");
        } catch (fallbackError) {
          console.error("❌ Erreur envoi token null:", fallbackError);
        }
      }
    }

    console.log("🏁 Fin setupFCM, token final:", fcmToken);
    return fcmToken;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("📝 Début du processus d'inscription...");

    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.password
    ) {
      toast.error("Tous les champs sont requis");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Email invalide");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (!formData.phone || formData.phone.length < 8) {
      toast.error("Numéro de téléphone invalide");
      return;
    }

    setIsLoading(true);

    try {
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        toast.error("Cet email est déjà utilisé");
        return;
      }

      console.log("✅ Validation réussie, données:", {
        ...formData,
        password: "***",
        confirmPassword: "***",
      });

      console.log("🌐 Envoi requête inscription...");
      const response = await axios.post(
        `${API_URL}/api/auth/signup`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          password: formData.password,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        }
      );


      const { customToken } = response.data;
      if (!customToken) {
        throw new Error("Aucun token d'authentification reçu");
      }

      const userCredential = await signInWithCustomToken(auth, customToken);
      const user = userCredential.user;


      await setupFCM(user);

      toast.success("Inscription réussie ! Veuillez vérifier votre email pour activer votre compte.");
      setTimeout(() => {
        console.log("🚀 Redirection vers /login...");
        navigate("/login");
      }, 500);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'inscription");
    } finally {
      console.log("🏁 Fin du processus d'inscription");
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: "password" | "confirmPassword") => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-blue-900 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8"
      >
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-6 h-6 text-yellow-400" />
            ) : (
              <Moon className="w-6 h-6 text-gray-600 dark:text-gray-100" />
            )}
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-300 dark:to-purple-500">
            Créer un Compte
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Rejoignez Dynamism Express</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              </div>
              <input
                type="text"
                name="firstName"
                placeholder="Prénom"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                autoComplete="given-name"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              </div>
              <input
                type="text"
                name="lastName"
                placeholder="Nom"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                autoComplete="family-name"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Adresse e-mail"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="relative">
            <PhoneInput
              country={"bj"}
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="Numéro de téléphone"
              inputProps={{
                name: "phone",
                required: true,
                className:
                  "w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition text-gray-900 dark:text-gray-100",
              }}
              buttonStyle={{
                backgroundColor: isDarkMode ? "#374151" : "#F9FAFB",
                borderColor: isDarkMode ? "#4B5563" : "#D1D5DB",
                borderWidth: "1px",
                borderRadius: "0.5rem 0 0 0.5rem",
              }}
              dropdownStyle={{
                backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                color: isDarkMode ? "#F9FAFB" : "#111827",
              }}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            </div>
            <input
              type="text"
              name="address"
              placeholder="Adresse"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            </div>
            <input
              type={showPassword.password ? "text" : "password"}
              name="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={handleInputChange}
              required
              autoComplete="new-password"
              className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("password")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 transition"
              aria-label={showPassword.password ? "Masquer" : "Afficher"}
            >
              {showPassword.password ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            </div>
            <input
              type={showPassword.confirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              autoComplete="new-password"
              className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirmPassword")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 transition"
              aria-label={showPassword.confirmPassword ? "Masquer" : "Afficher"}
            >
              {showPassword.confirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 rounded-lg transition flex items-center justify-center space-x-2 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>S'inscrire</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-gray-600 dark:text-gray-300">
          Vous avez déjà un compte ?
          <a
            href="/login"
            className="text-blue-600 dark:text-blue-300 hover:underline ml-2"
          >
            Connectez-vous
          </a>
        </div>
      </motion.div>
      <CookieConsentBanner />
    </div>
  );
};

export default SignupPage;