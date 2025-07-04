import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { motion, useAnimation, AnimationControls } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, LogIn, UserPlus, Moon, Sun } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import EnhancedGoogleLogin from "./EnhancedGoogleLogin";
import CookieConsentBanner from "../cookies/CookieConsentBanner";
import { toast } from "react-toastify";
import { signInWithCustomToken, getAuth } from "firebase/auth";
import { getUserData, getMessagingInstance } from "../../../firebaseConfig";
import { getToken, onMessage } from "firebase/messaging";
import axios from "axios";

// Interfaces
interface LoginFormData {
  email: string;
  password: string;
}

interface UserData {
  role: "admin" | "user" | string; // Adjust based on your Firestore user roles
  [key: string]: any; // Allow additional fields
}

interface CredentialResponse {
  credential?: string;
  [key: string]: any;
}

const LoginPage: React.FC = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isRememberMe, setIsRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const emailControls = useAnimation();
  const passwordControls = useAnimation();

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newDarkMode = !prev;
      document.documentElement.classList.toggle("dark", newDarkMode);
      localStorage.setItem("theme", newDarkMode ? "dark" : "light");
      return newDarkMode;
    });
  };

  const handleInputFocus = (controls: AnimationControls) => {
    controls.start({
      pathLength: 1,
      transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
    });
  };

  const handleInputBlur = (controls: AnimationControls) => {
    controls.stop();
    controls.start({ pathLength: 0 });
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setupFCM = async (idToken: string, userId: string): Promise<string | null> => {
    console.log("Configuration FCM pour userId:", userId);

    try {
      const messaging = await getMessagingInstance();
      let fcmToken: string | null = null;

      if (messaging && "serviceWorker" in navigator && "PushManager" in window) {
        const registrationPromise = navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          {
            scope: "/firebase-cloud-messaging-push-scope",
          }
        );

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Service Worker timeout")), 10000)
        );

        const registration = (await Promise.race([
          registrationPromise,
          timeoutPromise,
        ])) as ServiceWorkerRegistration;
        await navigator.serviceWorker.ready;

        const tokenPromise = getToken(messaging, {
          vapidKey: import.meta.env.VITE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        const tokenTimeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("FCM Token timeout")), 10000)
        );

        fcmToken = (await Promise.race([tokenPromise, tokenTimeoutPromise])) as string;
        console.log("Token FCM généré");

        onMessage(messaging, (payload) => {
          console.log("Notification reçue:", payload);
          
        });
      }

      const registerPromise = axios.post(
        "https://debutant.onrender.com/api/notifications/register",
        { fcmToken },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      const registerTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Register FCM timeout")), 8000)
      );

      await Promise.race([registerPromise, registerTimeoutPromise]);
      console.log("FCM configuré avec succès");

      return fcmToken;
    } catch (error: unknown) {
      console.error("Erreur FCM:", error);

      try {
        await axios.post(
          "https://debutant.onrender.com/api/notifications/register",
          { fcmToken: null },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
            timeout: 3000,
          }
        );
      } catch (registerError) {
        console.error("Erreur lors de l'enregistrement FCM null:", registerError);
      }

      
      return null;
    }
  };

  const authenticateWithBackend = async (
    email: string,
    password: string,
    retryCount = 0
  ): Promise<{ success: boolean; idToken?: string; customToken?: string; token?: string; error?: string }> => {
    const maxRetries = 2;

    try {
      console.log(`Tentative connexion backend ${retryCount + 1}/${maxRetries + 1}`);

      const response = await axios.post(
        "https://debutant.onrender.com/api/auth/signin",
        { email, password },
        {
          timeout: 8000,
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("Réponse backend reçue");
      return response.data;
    } catch (error: unknown) {
      console.error(`Erreur backend tentative ${retryCount + 1}:`, error);

      if (
        retryCount < maxRetries &&
        error instanceof Error &&
        (error.message.includes("ECONNABORTED") || error.message.includes("NETWORK_ERROR"))
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
        return authenticateWithBackend(email, password, retryCount + 1);
      }

      throw error;
    }
  };

  const authenticateWithFirebase = async (customToken: string, retryCount = 0) => {
    const maxRetries = 2;

    try {
      console.log(`Tentative auth Firebase ${retryCount + 1}/${maxRetries + 1}`);

      const userCredential = await signInWithCustomToken(auth, customToken);
      console.log("Authentification Firebase réussie");
      return userCredential;
    } catch (error: unknown) {
      console.error(`Erreur Firebase tentative ${retryCount + 1}:`, error);

      if (retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
        return authenticateWithFirebase(customToken, retryCount + 1);
      }

      throw error;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) {
      console.log("Connexion déjà en cours, annulation");
      return;
    }

    console.log("Début connexion avec email:", formData.email);
    setIsLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Email et mot de passe requis");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error("Email invalide");
      }

      const backendPromise = authenticateWithBackend(formData.email, formData.password);
      const backendTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout connexion backend")), 15000)
      );

      const data = await Promise.race([backendPromise, backendTimeoutPromise]);

      if (!data.success && !data.idToken && !data.customToken && !data.token) {
        throw new Error(data.error || "Réponse backend invalide");
      }

      const customToken = data.idToken || data.customToken || data.token;
      if (!customToken) {
        throw new Error("Aucun token reçu du backend");
      }

      const firebasePromise = authenticateWithFirebase(customToken);
      const firebaseTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout authentification Firebase")), 15000)
      );

      const userCredential = await Promise.race([firebasePromise, firebaseTimeoutPromise]);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      console.log("Utilisateur connecté:", user.uid);

      try {
        localStorage.setItem("authToken", idToken);
        localStorage.setItem("userId", user.uid);

        if (isRememberMe) {
          localStorage.setItem("userEmail", formData.email);
        } else {
          localStorage.removeItem("userEmail");
        }
      } catch (storageError) {
        console.error("Erreur stockage local:", storageError);
      }

      const userDataPromise = getUserData(user.uid);
      const userDataTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout récupération données utilisateur")), 10000)
      );

      const userData = (await Promise.race([userDataPromise, userDataTimeoutPromise])) as UserData;

      if (!userData) {
        throw new Error("Données utilisateur non trouvées");
      }

      console.log("Données utilisateur récupérées");

      setupFCM(idToken, user.uid).catch((error) => {
        console.error("Erreur FCM non bloquante:", error);
      });


      const redirectTo = location.state?.from || (userData.role === "admin" ? "/admin" : "/");
      console.log("Redirection vers:", redirectTo);
      navigate(redirectTo, { replace: true });
    } catch (error: unknown) {
      console.error("Erreur connexion:", error);

      
    } finally {
      console.log("Fin connexion");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    if (isLoading) {
      console.log("Connexion Google déjà en cours");
      return;
    }

    console.log("Début connexion Google");
    setIsLoading(true);

    try {
      const response = await Promise.race([
        axios.post(
          "https://debutant.onrender.com/api/auth/signin-google",
          { idToken: credentialResponse.credential },
          {
            timeout: 10000,
            headers: { "Content-Type": "application/json" },
          }
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout connexion Google")), 12000)
        ),
      ]);

      const data = response.data;
      console.log("Réponse Google signin reçue");

      if (!data.success) {
        throw new Error(data.error || "Erreur connexion Google");
      }

      const customToken = data.idToken || data.customToken || data.token;
      if (!customToken) {
        throw new Error("Aucun token Google reçu");
      }

      const userCredential = await Promise.race([
        signInWithCustomToken(auth, customToken),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout auth Firebase Google")), 10000)
        ),
      ]);

      const user = userCredential.user;
      const idToken = await user.getIdToken();

      console.log("Utilisateur Google connecté:", user.uid);

      try {
        localStorage.setItem("authToken", idToken);
        localStorage.setItem("userId", user.uid);
      } catch (error) {
        console.error("Erreur stockage Google:", error);
      }

      const userData = (await Promise.race([
        getUserData(user.uid),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout données utilisateur Google")), 8000)
        ),
      ])) as UserData;

      if (!userData) {
        throw new Error("Données utilisateur Google non trouvées");
      }

      setupFCM(idToken, user.uid).catch((error) => {
        console.error("Erreur FCM Google non bloquante:", error);
      });

      

      const redirectTo = location.state?.from || (userData.role === "admin" ? "/admin" : "/");
      navigate(redirectTo, { replace: true });
    } catch (error: unknown) {
      console.error("Erreur Google login:", error);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-blue-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8"
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
            Dynamism Express
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Connectez-vous à votre compte</p>
        </div>

        <div className="mb-6">
          <EnhancedGoogleLogin
            onSuccess={handleGoogleLogin}
            onError={(error) => {
              console.error("Erreur Google:", error);
              toast.error("Échec de la connexion avec Google");
            }}
          />
        </div>

        <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-300 mb-6">
          <div className="h-px flex-1 bg-gray-300 dark:bg-white/20"></div>
          <span className="text-sm px-4">ou continuez avec e-mail</span>
          <div className="h-px flex-1 bg-gray-300 dark:bg-white/20"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-gray-500 dark:text-gray-300 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
            </div>
            <div className="relative">
              <input
                type="email"
                name="email"
                placeholder="Adresse e-mail"
                value={formData.email}
                onChange={handleInputChange}
                onFocus={() => handleInputFocus(emailControls)}
                onBlur={() => handleInputBlur(emailControls)}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-0"
              />
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden"
                initial={{
                  borderImageSource: "linear-gradient(90deg, transparent, transparent)",
                }}
                animate={emailControls}
                variants={{
                  active: {
                    borderImageSource: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                    borderWidth: "2px",
                    borderStyle: "solid",
                    borderImageSlice: 1,
                    transition: { duration: 0.3 },
                  },
                  inactive: {
                    borderImageSource: "linear-gradient(90deg, transparent, transparent)",
                    borderWidth: "0px",
                    transition: { duration: 0.3 },
                  },
                }}
              >
                <motion.div
                  className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-blue-400 to-purple-500"
                  initial={{ width: 0 }}
                  animate={emailControls}
                  variants={{
                    active: {
                      width: ["0%", "100%", "100%", "0%"],
                      left: ["0%", "0%", "100%", "100%"],
                      top: [0, 0, "calc(100% - 2px)", "calc(100% - 2px)"],
                      transition: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      },
                    },
                    inactive: {
                      width: 0,
                    },
                  }}
                />
              </motion.div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-gray-500 dark:text-gray-300 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => handleInputFocus(passwordControls)}
                onBlur={() => handleInputBlur(passwordControls)}
                required
                className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-0"
              />
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden"
                initial={{
                  borderImageSource: "linear-gradient(90deg, transparent, transparent)",
                }}
                animate={passwordControls}
                variants={{
                  active: {
                    borderImageSource: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                    borderWidth: "2px",
                    borderStyle: "solid",
                    borderImageSlice: 1,
                    transition: { duration: 0.3 },
                  },
                  inactive: {
                    borderImageSource: "linear-gradient(90deg, transparent, transparent)",
                    borderWidth: "0px",
                    transition: { duration: 0.3 },
                  },
                }}
              >
                <motion.div
                  className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-blue-400 to-purple-500"
                  initial={{ width: 0 }}
                  animate={passwordControls}
                  variants={{
                    active: {
                      width: ["0%", "100%", "100%", "0%"],
                      left: ["0%", "0%", "100%", "100%"],
                      top: [0, 0, "calc(100% - 2px)", "calc(100% - 2px)"],
                      transition: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      },
                    },
                    inactive: {
                      width: 0,
                    },
                  }}
                />
              </motion.div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={isRememberMe}
                onChange={() => setIsRememberMe(!isRememberMe)}
                className="mr-2 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded text-blue-500 focus:ring-blue-400 focus:ring-offset-0"
              />
              <label
                htmlFor="rememberMe"
                className="text-gray-600 dark:text-gray-300 text-sm"
              >
                Se souvenir de moi
              </label>
            </div>
            <Link
              to="/reset-password"
              className="text-blue-600 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-200 text-sm transition"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${
              isLoading
                ? "bg-blue-700 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            } text-white py-3 rounded-lg transition flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Connexion</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/inscription" className="w-full inline-block">
            <button className="w-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white py-3 rounded-lg transition flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <UserPlus className="w-5 h-5" />
              <span>Créer un compte</span>
            </button>
          </Link>
        </div>
      </motion.div>
      <CookieConsentBanner />
    </div>
  );
};

export default LoginPage;