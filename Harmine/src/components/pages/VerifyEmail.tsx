import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../../../firebaseConfig";
import { applyActionCode } from "firebase/auth";

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Récupérer le oobCode depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const oobCode = urlParams.get("oobCode");

        if (!oobCode) {
          setError("Code de vérification manquant.");
          setIsVerifying(false);
          return;
        }

        // Appliquer le code de vérification
        await applyActionCode(auth, oobCode);
        console.log("✅ Email vérifié avec succès");

        // Vérifier si l'utilisateur est connecté
        const user = auth.currentUser;
        if (user) {
          // Mettre à jour Firestore via le backend
          await axios.get(`http://localhost:5000/api/auth/check-email-verified/${user.uid}`);
          toast.success("Email vérifié avec succès ! Vous pouvez maintenant vous connecter.");
        } else {
          toast.success("Email vérifié avec succès ! Veuillez vous connecter.");
        }

        // Rediriger vers /login
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } catch (error: any) {
        console.error("❌ Erreur vérification email:", error);
        let errorMessage = "Erreur lors de la vérification de l'email.";
        if (error.code === "auth/invalid-action-code") {
          errorMessage = "Lien de vérification invalide ou expiré.";
        }
        setError(errorMessage);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-blue-900 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center"
      >
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-300 dark:to-purple-500">
          Vérification de l'email
        </h1>
        {isVerifying ? (
          <p className="text-gray-600 dark:text-gray-300">Vérification en cours...</p>
        ) : error ? (
          <p className="text-red-600 dark:text-red-400">{error}</p>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">
            Votre email a été vérifié. Redirection vers la page de connexion...
          </p>
        )}
      </motion.div>
    </div>
  );
}