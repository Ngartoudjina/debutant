import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Edit, Trash, Check } from 'lucide-react';
import { Courier, COURIER_STATUS } from './types';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

interface CourierTableProps {
  appliedCouriers: Courier[];
  registeredCouriers: Courier[];
  onEdit: (courier: { courier: Courier; collection: 'coursiers' | 'truecoursiers' }) => void;
  onDeactivate: (courierId: string, collection: 'coursiers' | 'truecoursiers') => void;
  onDelete: (courierId: string, collection: 'coursiers' | 'truecoursiers') => void;
  onRefresh: (collection: 'coursiers' | 'truecoursiers') => void;
  isLoading: { coursiers: boolean; truecoursiers: boolean };
}

export const CourierTable: React.FC<CourierTableProps> = ({
  appliedCouriers,
  registeredCouriers,
  onEdit,
  onDeactivate,
  onDelete,
  onRefresh,
  isLoading,
}) => {
  // Nouvelle fonction pour approuver un coursier
  const handleApproveCourier = async (courierId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const response = await fetch(`https://debutant.onrender.com/api/coursiers/${courierId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l’approbation du coursier');
      }

      // Rafraîchir les deux collections après le transfert
      onRefresh('coursiers');
      onRefresh('truecoursiers');
      toast.success('Coursier approuvé avec succès');
    } catch (error: any) {
      console.error('Erreur lors de l’approbation du coursier:', error);
      toast.error(error.message || 'Erreur lors de l’approbation du coursier');
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Coursiers Postulants
        </h3>
        <div className="hidden sm:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100">
                <th className="p-3 text-left font-medium">Nom</th>
                <th className="p-3 text-left font-medium">Email</th>
                <th className="p-3 text-left font-medium">Téléphone</th>
                <th className="p-3 text-left font-medium">Statut</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appliedCouriers.map((courier) => (
                <tr
                  key={courier.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="p-3 text-sm">{courier.name}</td>
                  <td className="p-3 text-sm">{courier.email}</td>
                  <td className="p-3 text-sm">{courier.phone}</td>
                  <td className="p-3 text-sm">{courier.status}</td>
                  <td className="p-3 flex flex-wrap gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit({ courier, collection: 'coursiers' })}
                        className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        aria-label={`Modifier ${courier.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeactivate(courier.id, 'coursiers')}
                        disabled={courier.status === COURIER_STATUS.INACTIVE}
                        className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        aria-label={`Désactiver ${courier.name}`}
                      >
                        Désactiver
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(courier.id, 'coursiers')}
                        className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        aria-label={`Supprimer ${courier.name}`}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApproveCourier(courier.id)}
                        className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        aria-label={`Approuver ${courier.name}`}
                      >
                        <Check className="h-4 w-4" />
                        Approuver
                      </Button>
                    </motion.div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="block sm:hidden space-y-4">
          {appliedCouriers.map((courier) => (
            <motion.div
              key={courier.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm"
            >
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Nom:</span>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{courier.name}</span>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Email:</span>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{courier.email}</span>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Téléphone:</span>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{courier.phone}</span>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Statut:</span>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{courier.status}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit({ courier, collection: 'coursiers' })}
                      className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      aria-label={`Modifier ${courier.name}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeactivate(courier.id, 'coursiers')}
                      disabled={courier.status === COURIER_STATUS.INACTIVE}
                      className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      aria-label={`Désactiver ${courier.name}`}
                    >
                      Désactiver
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(courier.id, 'coursiers')}
                      className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      aria-label={`Supprimer ${courier.name}`}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproveCourier(courier.id)}
                      className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      aria-label={`Approuver ${courier.name}`}
                    >
                      <Check className="h-4 w-4" />
                      Approuver
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {isLoading.coursiers && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Chargement des coursiers postulants...
          </p>
        )}
      </div>

      
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Coursiers Enregistrés
        </h3>
        <div className="hidden sm:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100">
                <th className="p-3 text-left font-medium">Nom</th>
                <th className="p-3 text-left font-medium">Email</th>
                <th className="p-3 text-left font-medium">Téléphone</th>
                <th className="p-3 text-left font-medium">Statut</th>
                <th className="p-3 text-left font-medium">Livraisons</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registeredCouriers.map((courier) => (
                <tr
                  key={courier.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="p-3 text-sm">{courier.name}</td>
                  <td className="p-3 text-sm">{courier.email}</td>
                  <td className="p-3 text-sm">{courier.phone}</td>
                  <td className="p-3 text-sm">{courier.status}</td>
                  <td className="p-3 text-sm">{courier.deliveriesCount || 0}</td>
                  <td className="p-3 flex flex-wrap gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit({ courier, collection: 'truecoursiers' })}
                        className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        aria-label={`Modifier ${courier.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeactivate(courier.id, 'truecoursiers')}
                        disabled={courier.status === COURIER_STATUS.INACTIVE}
                        className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        aria-label={`Désactiver ${courier.name}`}
                      >
                        Désactiver
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(courier.id, 'truecoursiers')}
                        className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        aria-label={`Supprimer ${courier.name}`}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="block sm:hidden space-y-4">
          {registeredCouriers.map((courier) => (
            <motion.div
              key={courier.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm"
            >
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Nom:</span>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{courier.name}</span>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Email:</span>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{courier.email}</span>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Téléphone:</span>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{courier.phone}</span>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Statut:</span>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{courier.status}</span>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Livraisons:</span>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{courier.deliveriesCount || 0}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit({ courier, collection: 'truecoursiers' })}
                      className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      aria-label={`Modifier ${courier.name}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeactivate(courier.id, 'truecoursiers')}
                      disabled={courier.status === COURIER_STATUS.INACTIVE}
                      className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      aria-label={`Désactiver ${courier.name}`}
                    >
                      Désactiver
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(courier.id, 'truecoursiers')}
                      className="h-8 px-2 text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      aria-label={`Supprimer ${courier.name}`}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {isLoading.truecoursiers && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Chargement des coursiers enregistrés...
          </p>
        )}
      </div>

      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        <Button
          onClick={() => {
            onRefresh('coursiers');
            onRefresh('truecoursiers');
          }}
          disabled={isLoading.coursiers || isLoading.truecoursiers}
          className="w-full sm:w-auto h-10 px-4 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors mt-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Rafraîchir
        </Button>
      </motion.div>
    </div>
  );
};