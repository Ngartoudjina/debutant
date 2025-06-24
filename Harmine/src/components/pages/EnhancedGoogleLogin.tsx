import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Chrome, Loader2 } from 'lucide-react';

interface EnhancedGoogleLoginProps {
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

export const EnhancedGoogleLogin: React.FC<EnhancedGoogleLoginProps> = ({
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      console.log('Réponse de Google:', tokenResponse);
      try {
        if (onSuccess) {
          onSuccess({ credential: tokenResponse.access_token });
        }
      } catch (error) {
        console.error('Erreur lors de la connexion Google:', error);
        
        if (onError) {
          onError(error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Erreur Google Login:', error);
      
      if (onError) {
        onError(error);
      }
      setIsLoading(false);
    },
    scope: 'openid profile email',
  });

  return (
    <motion.button
      onClick={() => {
        setIsLoading(true);
        login();
      }}
      disabled={isLoading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, rotate: { repeat: Infinity, duration: 1 } }}
          >
            <Loader2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </motion.div>
        ) : (
          <motion.div
            key="chrome"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.2, rotate: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Chrome className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="font-medium text-gray-900 dark:text-gray-100">
        Se connecter avec Google
      </span>
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-100/30 to-purple-100/30 dark:from-blue-500/20 dark:to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        whileHover={{ opacity: 1 }}
      />
    </motion.button>
  );
};

export default EnhancedGoogleLogin;