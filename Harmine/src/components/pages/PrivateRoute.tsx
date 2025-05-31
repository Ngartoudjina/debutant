import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserData } from '../../../firebaseConfig';
import { motion } from 'framer-motion';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const PrivateRoute = ({ children, requireAdmin = false }: PrivateRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        if (requireAdmin) {
          try {
            const userData = await getUserData(user.uid);
            setIsAuthorized(userData.role === 'admin');
          } catch (error) {
            console.error('Erreur lors de la vérification du rôle:', error);
            setIsAuthorized(false);
          }
        } else {
          setIsAuthorized(true);
        }
      } else {
        setIsAuthenticated(false);
        setIsAuthorized(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [requireAdmin]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAuthorized)) {
      navigate('/login', {
        state: { from: location.pathname },
        replace: true,
      });
    }
  }, [isLoading, isAuthenticated, isAuthorized, navigate, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-gray-900 to-purple-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <motion.div
            className="w-16 h-16 border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          {/* Texte clignotant */}
          <motion.h2
            className="text-2xl font-semibold text-white"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            Chargement
          </motion.h2>
        </div>
      </div>
    );
  }

  return isAuthenticated && isAuthorized ? <>{children}</> : null;
};

export default PrivateRoute;