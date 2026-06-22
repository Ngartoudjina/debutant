import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { toast } from "react-toastify";

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Veuillez saisir une adresse e-mail valide");
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error(message);
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-300 dark:to-purple-500">
            Dynamism Express
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Réinitialisation du mot de passe
          </p>
        </div>

        {emailSent ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 text-sm">
                Un email de réinitialisation a été envoyé à votre adresse
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-200 transition text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à la connexion</span>
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500 dark:text-gray-300 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Adresse e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-0"
                />
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
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <span>Envoyer le lien de réinitialisation</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-200 transition text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à la connexion</span>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
