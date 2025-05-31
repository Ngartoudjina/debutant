import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Edit, Trash, Check } from 'lucide-react';
import { Courier, COURIER_STATUS } from './types';
import { toast } from 'react-toastify';

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

      const response = await fetch(`http://localhost:5000/api/coursiers/${courierId}/approve`, {
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
      toast.success('Coursier approuvé et transféré avec succès');
    } catch (error: any) {
      console.error('Erreur lors de l’approbation du coursier:', error);
      toast.error(error.message || 'Erreur lors de l’approbation du coursier');
    }
  };

  return (
    <div className="space-y-8">
      {/* Section pour les coursiers postulants */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Coursiers Postulants</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Nom</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Téléphone</th>
              <th className="p-2 text-left">Statut</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appliedCouriers.map((courier) => (
              <tr key={courier.id} className="border-b">
                <td className="p-2">{courier.name}</td>
                <td className="p-2">{courier.email}</td>
                <td className="p-2">{courier.phone}</td>
                <td className="p-2">{courier.status}</td>
                <td className="p-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit({ courier, collection: 'coursiers' })}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeactivate(courier.id, 'coursiers')}
                    disabled={courier.status === COURIER_STATUS.INACTIVE}
                  >
                    Désactiver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(courier.id, 'coursiers')}
                  >
                    <Trash size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApproveCourier(courier.id)}
                  >
                    <Check size={16} />
                    Approuver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading.coursiers && <p>Chargement des coursiers postulants...</p>}
      </div>

      {/* Section pour les coursiers enregistrés */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Coursiers Enregistrés</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Nom</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Téléphone</th>
              <th className="p-2 text-left">Statut</th>
              <th className="p-2 text-left">Livraisons</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {registeredCouriers.map((courier) => (
              <tr key={courier.id} className="border-b">
                <td className="p-2">{courier.name}</td>
                <td className="p-2">{courier.email}</td>
                <td className="p-2">{courier.phone}</td>
                <td className="p-2">{courier.status}</td>
                <td className="p-2">{courier.deliveriesCount || 0}</td>
                <td className="p-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit({ courier, collection: 'truecoursiers' })}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeactivate(courier.id, 'truecoursiers')}
                    disabled={courier.status === COURIER_STATUS.INACTIVE}
                  >
                    Désactiver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(courier.id, 'truecoursiers')}
                  >
                    <Trash size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading.truecoursiers && <p>Chargement des coursiers enregistrés...</p>}
      </div>

      <Button
        onClick={() => {
          onRefresh('coursiers');
          onRefresh('truecoursiers');
        }}
        disabled={isLoading.coursiers || isLoading.truecoursiers}
        className="mt-4"
      >
        <RefreshCw size={16} className="mr-2" />
        Rafraîchir
      </Button>
    </div>
  );
};