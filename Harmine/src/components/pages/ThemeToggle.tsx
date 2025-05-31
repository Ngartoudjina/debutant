import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sun, Moon, Truck, Package, UserCog } from 'lucide-react';

interface ThemeToggleProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ darkMode, toggleDarkMode }) => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const buttonVariants = {
    initial: { 
      x: 100, 
      opacity: 0,
      scale: 0.8 
    },
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 20,
        duration: 0.6,
      },
    },
  };

  const buttonHover = {
    scale: 1.1,
    rotate: 5,
    transition: { type: 'spring', stiffness: 400, damping: 10 }
  };

  const buttonTap = {
    scale: 0.9,
    transition: { duration: 0.1 }
  };

  return (
    <motion.div 
      className="fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-3"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Bouton Toggle Theme */}
      <motion.button
        variants={buttonVariants}
        whileHover={buttonHover}
        whileTap={buttonTap}
        onClick={toggleDarkMode}
        className="p-3 sm:p-4 rounded-full bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 dark:hover:shadow-blue-400/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
        aria-label={darkMode ? 'Basculer vers le mode clair' : 'Basculer vers le mode sombre'}
      >
        <AnimatePresence mode="wait">
          {darkMode ? (
            <motion.div
              key="sun"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Bouton Coursier */}
      <motion.div variants={buttonVariants}>
        <Link
          to="/coursier"
          className="block p-3 sm:p-4 rounded-full bg-white dark:bg-gray-800 border-2 border-green-500 dark:border-green-400 shadow-lg hover:shadow-xl hover:shadow-green-500/20 dark:hover:shadow-green-400/20 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-300"
          aria-label="Accéder à la page des coursiers"
        >
          <motion.div
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
          </motion.div>
        </Link>
      </motion.div>

      {/* Bouton Commandes */}
      <motion.div variants={buttonVariants}>
        <Link
          to="/commandes"
          className="block p-3 sm:p-4 rounded-full bg-white dark:bg-gray-800 border-2 border-orange-500 dark:border-orange-400 shadow-lg hover:shadow-xl hover:shadow-orange-500/20 dark:hover:shadow-orange-400/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all duration-300"
          aria-label="Accéder à la page des commandes"
        >
          <motion.div
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
          </motion.div>
        </Link>
      </motion.div>

      {/* Bouton Admin */}
      <motion.div variants={buttonVariants}>
        <Link
          to="/admin"
          className="block p-3 sm:p-4 rounded-full bg-white dark:bg-gray-800 border-2 border-purple-500 dark:border-purple-400 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 dark:hover:shadow-purple-400/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
          aria-label="Accéder à la page d'administration"
        >
          <motion.div
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            <UserCog className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
          </motion.div>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default ThemeToggle;