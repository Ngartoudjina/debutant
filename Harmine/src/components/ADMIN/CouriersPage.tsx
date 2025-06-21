import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from 'react-toastify';
import { useCouriers } from './hooks/useCouriers';
import { ChatMessage, Courier, COURIER_STATUS, COVERAGE_ZONES } from './types';
import { CourierTable } from './CourierTable';
import CourierForm from './CourierForm';
import { getAuth } from 'firebase/auth';
import { RefreshCw, Send, AlertCircle } from 'lucide-react';

/**
 * Fonction de récupération des coursiers
 * @param collection - Collection de coursiers à récupérer ('coursiers' ou 'truecoursiers')
 * @returns - Liste de coursiers récupérés
 */
const fetchCouriers = async (collection: 'coursiers' | 'truecoursiers'): Promise<Courier[]> => {
  const token = localStorage.getItem('authToken');
  console.log(`Token for ${collection}:`, token);
  if (!token) {
    throw new Error("Aucun token d'authentification trouvé");
  }

  const endpoint = collection === 'coursiers' ? '/api/coursiers' : '/api/truecoursiers';
  const response = await fetch(`https://debutant.onrender.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(`Fetch ${collection} Response Status:`, response.status);
  if (!response.ok) {
    const errorData = await response.json();
    console.log(`Fetch ${collection} Error Data:`, errorData);
    if (errorData.error === 'Token invalide') {
      const auth = getAuth();
      if (auth.currentUser) {
        const newToken = await auth.currentUser.getIdToken(true);
        console.log('New Token:', newToken);
        localStorage.setItem('authToken', newToken);
        return fetchCouriers(collection); // Réessayer
      }
    }
    throw new Error(errorData.error || `Erreur lors de la récupération des ${collection}`);
  }

  const data = await response.json();
  console.log(`Raw ${collection} Data:`, data.data);
  const mappedCouriers = data.data.map((courier: any) => ({
    id: courier.id || 'unknown',
    name: courier.fullName || 'Nom inconnu',
    email: courier.email || 'Email inconnu',
    phone: courier.phone || 'Téléphone inconnu',
    address: courier.address || 'Adresse inconnue',
    experience: courier.experience || 'Expérience inconnue',
    vehicle: courier.transport || 'Véhicule inconnu',
    coverageZone: courier.availability || COVERAGE_ZONES.PARIS_CENTRE,
    motivation: courier.motivation || 'Motivation inconnue',
    status: courier.status || COURIER_STATUS.ACTIVE,
    photo: courier.profilePicture?.secure_url || 'https://via.placeholder.com/32',
  }));
  console.log(`Mapped ${collection} Couriers:`, mappedCouriers);
  return mappedCouriers;
};

const CouriersPage: React.FC = () => {
  const { couriers, addCourier, updateCourier, deactivateCourier, setCouriers } = useCouriers([]);
  const [appliedCouriers, setAppliedCouriers] = useState<Courier[]>([]);
  const [registeredCouriers, setRegisteredCouriers] = useState<Courier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<{ courier: Courier; collection: 'coursiers' | 'truecoursiers' } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterZone, setFilterZone] = useState<string>("all");
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<{ coursiers: boolean; truecoursiers: boolean }>({
    coursiers: true,
    truecoursiers: true,
  });

  const loadCouriers = async (collection: 'coursiers' | 'truecoursiers') => {
    try {
      setLoading((prev) => ({ ...prev, [collection]: true }));
      const fetchedCouriers = await fetchCouriers(collection);
      if (collection === 'coursiers') {
        setAppliedCouriers(fetchedCouriers);
      } else {
        setRegisteredCouriers(fetchedCouriers);
      }
      toast.success(`Coursiers ${collection} chargés avec succès`);
    } catch (error: any) {
      console.error(`Erreur lors du chargement des ${collection}:`, error);
      toast.error(error.message || `Erreur lors du chargement des ${collection}`);
    } finally {
      setLoading((prev) => ({ ...prev, [collection]: false }));
    }
  };

  useEffect(() => {
    loadCouriers('coursiers');
    loadCouriers('truecoursiers');
  }, []);

  const handleAddCourier = async (newCourierData: Omit<Courier, 'id'>, collection: 'coursiers' | 'truecoursiers') => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const formData = new FormData();
      formData.append('fullName', newCourierData.name);
      formData.append('email', newCourierData.email);
      formData.append('phone', newCourierData.phone);
      formData.append('address', newCourierData.address);
      formData.append('experience', newCourierData.experience);
      formData.append('transport', newCourierData.vehicle);
      formData.append('availability', newCourierData.coverageZone);
      formData.append('motivation', newCourierData.motivation);
      if (newCourierData.photo instanceof File) {
        formData.append('profilePicture', newCourierData.photo);
      }

      console.log(`Adding courier to ${collection} with FormData:`, Object.fromEntries(formData));
      const endpoint = collection === 'coursiers' ? '/api/coursiers/createCourier' : '/api/coursiers/createtrueCourier';
      const response = await fetch(`https://debutant.onrender.com${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log(`Add Courier ${collection} Response Status:`, response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`Add Courier ${collection} Error Data:`, errorData);
        throw new Error(errorData.error || `Erreur lors de l'ajout du coursier dans ${collection}`);
      }

      const data = await response.json();
      console.log(`Add Courier ${collection} Response Data:`, data);

      const newCourier = {
        ...newCourierData,
        id: data.data.userId,
        photo: data.data.profilePicture?.secure_url || 'https://via.placeholder.com/32',
      };

      if (collection === 'coursiers') {
        setAppliedCouriers((prev) => [...prev, newCourier]);
      } else {
        setRegisteredCouriers((prev) => [...prev, newCourier]);
      }

      addCourier(newCourier);
      toast.success(`Coursier ajouté avec succès dans ${collection}`);
    } catch (error: any) {
      console.error(`Erreur lors de l'ajout du coursier dans ${collection}:`, error);
      toast.error(error.message || `Erreur lors de l'ajout du coursier dans ${collection}`);
    }
  };

  const handleUpdateCourier = async (courierId: string, updatedData: Partial<Courier>, collection: 'coursiers' | 'truecoursiers') => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const formData = new FormData();
      if (updatedData.name) formData.append('fullName', updatedData.name);
      if (updatedData.email) formData.append('email', updatedData.email);
      if (updatedData.phone) formData.append('phone', updatedData.phone);
      if (updatedData.address) formData.append('address', updatedData.address);
      if (updatedData.experience) formData.append('experience', updatedData.experience);
      if (updatedData.vehicle) formData.append('transport', updatedData.vehicle);
      if (updatedData.coverageZone) formData.append('availability', updatedData.coverageZone);
      if (updatedData.motivation) formData.append('motivation', updatedData.motivation);
      if (updatedData.photo instanceof File) {
        formData.append('profilePicture', updatedData.photo);
      }

      console.log(`Updating courier in ${collection} with FormData:`, Object.fromEntries(formData));
      const endpoint = collection === 'coursiers' ? `/api/coursiers/${courierId}` : `/api/truecoursiers/${courierId}`;
      const response = await fetch(`https://debutant.onrender.com${endpoint}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log(`Update Courier ${collection} Response Status:`, response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`Update Courier ${collection} Error Data:`, errorData);
        throw new Error(errorData.error || `Erreur lors de la mise à jour du coursier dans ${collection}`);
      }

      const data = await response.json();
      console.log(`Update Courier ${collection} Response Data:`, data);

      const updatedCourier = {
        ...updatedData,
        photo: data.data.profilePicture?.secure_url || updatedData.photo || (collection === 'coursiers' ? appliedCouriers : registeredCouriers).find(c => c.id === courierId)?.photo,
      };

      if (collection === 'coursiers') {
        setAppliedCouriers((prev) =>
          prev.map((courier) => (courier.id === courierId ? { ...courier, ...updatedCourier } : courier))
        );
      } else {
        setRegisteredCouriers((prev) =>
          prev.map((courier) => (courier.id === courierId ? { ...courier, ...updatedCourier } : courier))
        );
      }

      updateCourier(courierId, updatedCourier);
      setSelectedCourier(null);
      toast.success(`Coursier mis à jour avec succès dans ${collection}`);
    } catch (error: any) {
      console.error(`Erreur lors de la mise à jour du coursier dans ${collection}:`, error);
      toast.error(error.message || `Erreur lors de la mise à jour du coursier dans ${collection}`);
    }
  };

  const handleDeactivateCourier = async (courierId: string, collection: 'coursiers' | 'truecoursiers') => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const endpoint = collection === 'coursiers' ? `/api/coursiers/${courierId}` : `/api/truecoursiers/${courierId}`;
      const response = await fetch(`https://debutant.onrender.com${endpoint}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: COURIER_STATUS.INACTIVE }),
      });

      console.log(`Deactivate Courier ${collection} Response Status:`, response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`Deactivate Courier ${collection} Error Data:`, errorData);
        throw new Error(errorData.error || `Erreur lors de la désactivation du coursier dans ${collection}`);
      }

      if (collection === 'coursiers') {
        setAppliedCouriers((prev) =>
          prev.map((courier) => (courier.id === courierId ? { ...courier, status: COURIER_STATUS.INACTIVE } : courier))
        );
      } else {
        setRegisteredCouriers((prev) =>
          prev.map((courier) => (courier.id === courierId ? { ...courier, status: COURIER_STATUS.INACTIVE } : courier))
        );
      }

      deactivateCourier(courierId);
      toast.success(`Coursier désactivé avec succès dans ${collection}`);
    } catch (error: any) {
      console.error(`Erreur lors de la désactivation dans ${collection}:`, error);
      toast.error(error.message || `Erreur lors de la désactivation du coursier dans ${collection}`);
    }
  };

  const handleDeleteCourier = async (courierId: string, collection: 'coursiers' | 'truecoursiers') => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const endpoint = collection === 'coursiers' ? `/api/coursiers/${courierId}` : `/api/truecoursiers/${courierId}`;
      const response = await fetch(`https://debutant.onrender.com${endpoint}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`Delete Courier ${collection} Response Status:`, response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`Delete Courier ${collection} Error Data:`, errorData);
        throw new Error(errorData.error || `Erreur lors de la suppression du coursier dans ${collection}`);
      }

      if (collection === 'coursiers') {
        setAppliedCouriers((prev) => prev.filter((courier) => courier.id !== courierId));
      } else {
        setRegisteredCouriers((prev) => prev.filter((courier) => courier.id !== courierId));
      }

      setCouriers(couriers.filter((courier) => courier.id !== courierId));
      toast.success(`Coursier supprimé avec succès dans ${collection}`);
    } catch (error: any) {
      console.error(`Erreur lors de la suppression dans ${collection}:`, error);
      toast.error(error.message || `Erreur lors de la suppression du coursier dans ${collection}`);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now(),
        text: message.trim(),
        timestamp: new Date(),
        senderId: -1,
      };
      setChatMessages((prev) => [...prev, newMessage]);
      setMessage("");
      toast.success('Message envoyé');
    }
  };

  // Helper function to validate if data is complete for adding a new courier
  const isCompleteForAdd = (data: Partial<Courier>): data is Omit<Courier, 'id'> => {
    return !!(
      data.name &&
      data.email &&
      data.phone &&
      data.address &&
      data.experience &&
      data.vehicle &&
      data.coverageZone &&
      data.motivation &&
      data.status &&
      data.photo !== undefined
    );
  };

  // Filtrer les deux collections séparément
  const filteredAppliedCouriers = appliedCouriers.filter((courier) => {
    const statusMatch = filterStatus === "all" || courier.status === filterStatus;
    const zoneMatch = filterZone === "all" || courier.coverageZone === filterZone;
    return statusMatch && zoneMatch;
  });

  const filteredRegisteredCouriers = registeredCouriers.filter((courier) => {
    const statusMatch = filterStatus === "all" || courier.status === filterStatus;
    const zoneMatch = filterZone === "all" || courier.coverageZone === filterZone;
    return statusMatch && zoneMatch;
  });

  return (
    <div className="p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Gestion des coursiers</span>
            {(loading.coursiers || loading.truecoursiers) && <RefreshCw size={18} className="animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 w-full sm:w-1/3">
              <Label>Statut</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value={COURIER_STATUS.ACTIVE}>Actif</SelectItem>
                  <SelectItem value={COURIER_STATUS.INACTIVE}>Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-full sm:w-1/3">
              <Label>Zone de couverture</Label>
              <Select value={filterZone} onValueChange={setFilterZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {Object.values(COVERAGE_ZONES).map((zone) => (
                    <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>


            <CourierTable
              appliedCouriers={filteredAppliedCouriers}
              registeredCouriers={filteredRegisteredCouriers}
              onEdit={setSelectedCourier}
              onDeactivate={handleDeactivateCourier}
              onDelete={handleDeleteCourier}
              onRefresh={loadCouriers}
              isLoading={loading}
            />
 
        </CardContent>
      </Card>

      <CourierForm
        courier={selectedCourier?.courier}
        onSubmit={(data) => {
          if (selectedCourier) {
            handleUpdateCourier(selectedCourier.courier.id, data, selectedCourier.collection);
          } else {
            // Validate that all required fields are present for adding a new courier
            if (isCompleteForAdd(data)) {
              handleAddCourier(data, 'coursiers'); // Par défaut, ajouter à 'coursiers'
            } else {
              toast.error('Veuillez remplir tous les champs obligatoires');
            }
          }
        }}
        isEditing={!!selectedCourier}
      />

      <Card>
        <CardHeader>
          <CardTitle>Communication avec les coursiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Envoyer un message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrivez votre message ici..."
            />
            <Button
              onClick={handleSendMessage}
              className="mt-2 flex items-center gap-2"
            >
              <Send size={16} />
              Envoyer
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Historique des messages</Label>
            <div className="border rounded-lg p-4 h-40 overflow-y-auto space-y-2">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <AlertCircle className="mr-2" size={16} />
                  Aucun message
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm flex flex-col">
                    <span className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleString()}
                    </span>
                    <span>{msg.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CouriersPage;