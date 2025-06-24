import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useCouriers } from "./hooks/useCouriers";
import { ChatMessage, Courier, COURIER_STATUS, COVERAGE_ZONES } from "./types";
import { CourierTable } from "./CourierTable";
import CourierForm from "./CourierForm";
import { getAuth } from "firebase/auth";
import {
  RefreshCw,
  Send,
  AlertCircle,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface CourierTableProps {
  appliedCouriers: Courier[];
  registeredCouriers: Courier[];
  onEdit: (params: {
    courier: Courier;
    collection: "coursiers" | "truecoursiers";
  }) => void;
  onDeactivate: (id: string, collection: "coursiers" | "truecoursiers") => void;
  onDelete: (id: string, collection: "coursiers" | "truecoursiers") => void;
  onRefresh: () => void;
  isLoading: { coursiers: boolean; truecoursiers: boolean };
}

/**
 * Fonction de récupération des coursiers
 * @param collection - Collection de coursiers à récupérer ('coursiers' ou 'truecoursiers')
 * @param retryCount - Nombre de tentatives de récupération
 * @returns - Liste de coursiers récupérés
 */
const fetchCouriers = async (
  collection: "coursiers" | "truecoursiers",
  retryCount: number = 0
): Promise<Courier[]> => {
  const MAX_RETRIES = 2;
  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("Aucun token d'authentification trouvé");
  }

  const endpoint =
    collection === "coursiers" ? "/api/coursiers" : "/api/truecoursiers";
  const response = await fetch(`https://debutant.onrender.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Erreur de communication" }));
    if (errorData.error === "Token invalide" && retryCount < MAX_RETRIES) {
      const auth = getAuth();
      if (auth.currentUser) {
        const newToken = await auth.currentUser.getIdToken(true);
        localStorage.setItem("authToken", newToken);
        return fetchCouriers(collection, retryCount + 1);
      }
      throw new Error("Utilisateur non connecté");
    }
    throw new Error(
      errorData.error || `Erreur lors de la récupération des ${collection}`
    );
  }

  const data = await response.json();
  const mappedCouriers = data.data.map((courier: any): Courier => ({
    id: courier.id || "unknown",
    name: courier.fullName || "Nom inconnu",
    email: courier.email || "Email inconnu",
    phone: courier.phone || "Téléphone inconnu",
    address: courier.address || "Adresse inconnue",
    experience: courier.experience || "Expérience inconnue",
    vehicle: courier.transport || "Véhicule inconnu",
    coverageZone: courier.availability || COVERAGE_ZONES.PARIS_CENTRE,
    motivation: courier.motivation || "Motivation inconnue",
    status: courier.status || COURIER_STATUS.ACTIVE,
    photo:
      courier.profilePicture?.secure_url || "https://via.placeholder.com/32",
  }));
  return mappedCouriers;
};

const CouriersPage: React.FC = () => {
  const {
    couriers,
    addCourier,
    updateCourier,
    deactivateCourier,
    setCouriers,
  } = useCouriers([]);
  const [appliedCouriers, setAppliedCouriers] = useState<Courier[]>([]);
  const [registeredCouriers, setRegisteredCouriers] = useState<Courier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<{
    courier: Courier;
    collection: "coursiers" | "truecoursiers";
  } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterZone, setFilterZone] = useState<string>("all");
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<{
    coursiers: boolean;
    truecoursiers: boolean;
  }>({
    coursiers: true,
    truecoursiers: true,
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(false);

  const loadCouriers = useCallback(async (collection: "coursiers" | "truecoursiers") => {
    try {
      setLoading((prev) => ({ ...prev, [collection]: true }));
      const fetchedCouriers = await fetchCouriers(collection);
      if (collection === "coursiers") {
        setAppliedCouriers(fetchedCouriers);
      } else {
        setRegisteredCouriers(fetchedCouriers);
      }
      toast.success(`Coursiers ${collection} chargés avec succès`);
    } catch (error: any) {
      toast.error(error.message || `Erreur lors du chargement des ${collection}`);
    } finally {
      setLoading((prev) => ({ ...prev, [collection]: false }));
    }
  }, []);

  useEffect(() => {
    loadCouriers("coursiers");
    loadCouriers("truecoursiers");
  }, [loadCouriers]);

  const handleAddCourier = async (
    newCourierData: Omit<Courier, "id">,
    collection: "coursiers" | "truecoursiers"
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const formData = new FormData();
      formData.append("fullName", newCourierData.name);
      formData.append("email", newCourierData.email);
      formData.append("phone", newCourierData.phone);
      formData.append("address", newCourierData.address);
      formData.append("experience", newCourierData.experience);
      formData.append("transport", newCourierData.vehicle);
      formData.append("availability", newCourierData.coverageZone);
      formData.append("motivation", newCourierData.motivation);
      if (newCourierData.photo instanceof File) {
        formData.append("profilePicture", newCourierData.photo);
      }

      const endpoint =
        collection === "coursiers"
          ? "/api/coursiers/createCourier"
          : "/api/coursiers/createtrueCourier";
      const response = await fetch(`https://debutant.onrender.com${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur de communication" }));
        throw new Error(
          errorData.error || `Erreur lors de l'ajout du coursier dans ${collection}`
        );
      }

      const data = await response.json();
      const newCourier: Courier = {
        ...newCourierData,
        id: data.data.userId,
        photo:
          data.data.profilePicture?.secure_url || "https://via.placeholder.com/32",
      };

      if (collection === "coursiers") {
        setAppliedCouriers((prev) => [...prev, newCourier]);
      } else {
        setRegisteredCouriers((prev) => [...prev, newCourier]);
      }

      addCourier(newCourier);
      
    } catch (error: any) {
      console.error(error.message || `Erreur lors de l'ajout du coursier dans ${collection}`);
    }
  };

  const handleUpdateCourier = async (
    courierId: string,
    updatedData: Partial<Courier>,
    collection: "coursiers" | "truecoursiers"
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const formData = new FormData();
      if (updatedData.name) formData.append("fullName", updatedData.name);
      if (updatedData.email) formData.append("email", updatedData.email);
      if (updatedData.phone) formData.append("phone", updatedData.phone);
      if (updatedData.address) formData.append("address", updatedData.address);
      if (updatedData.experience) formData.append("experience", updatedData.experience);
      if (updatedData.vehicle) formData.append("transport", updatedData.vehicle);
      if (updatedData.coverageZone) formData.append("availability", updatedData.coverageZone);
      if (updatedData.motivation) formData.append("motivation", updatedData.motivation);
      if (updatedData.photo instanceof File) {
        formData.append("profilePicture", updatedData.photo);
      }

      const endpoint =
        collection === "coursiers"
          ? `/api/coursiers/${courierId}`
          : `/api/truecoursiers/${courierId}`;
      const response = await fetch(`https://debutant.onrender.com${endpoint}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur de communication" }));
        throw new Error(
          errorData.error || `Erreur lors de la mise à jour du coursier dans ${collection}`
        );
      }

      const data = await response.json();
      const updatedCourier: Partial<Courier> = {
        ...updatedData,
        photo:
          data.data.profilePicture?.secure_url ||
          updatedData.photo ||
          (collection === "coursiers"
            ? appliedCouriers
            : registeredCouriers
          ).find((c) => c.id === courierId)?.photo,
      };

      if (collection === "coursiers") {
        setAppliedCouriers((prev) =>
          prev.map((courier) =>
            courier.id === courierId ? { ...courier, ...updatedCourier } : courier
          )
        );
      } else {
        setRegisteredCouriers((prev) =>
          prev.map((courier) =>
            courier.id === courierId ? { ...courier, ...updatedCourier } : courier
          )
        );
      }

      updateCourier(courierId, updatedCourier);
      setSelectedCourier(null);
      
    } catch (error: any) {
      console.error(error.message || `Erreur lors de la mise à jour du coursier dans ${collection}`);
    }
  };

  const handleDeactivateCourier = async (
    courierId: string,
    collection: "coursiers" | "truecoursiers"
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const endpoint =
        collection === "coursiers"
          ? `/api/coursiers/${courierId}`
          : `/api/truecoursiers/${courierId}`;
      const response = await fetch(`https://debutant.onrender.com${endpoint}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: COURIER_STATUS.INACTIVE }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur de communication" }));
        throw new Error(
          errorData.error || `Erreur lors de la désactivation du coursier dans ${collection}`
        );
      }

      if (collection === "coursiers") {
        setAppliedCouriers((prev) =>
          prev.map((courier) =>
            courier.id === courierId
              ? { ...courier, status: COURIER_STATUS.INACTIVE }
              : courier
          )
        );
      } else {
        setRegisteredCouriers((prev) =>
          prev.map((courier) =>
            courier.id === courierId
              ? { ...courier, status: COURIER_STATUS.INACTIVE }
              : courier
          )
        );
      }

      deactivateCourier(courierId);
      
    } catch (error: any) {
      console.error(error.message || `Erreur lors de la désactivation dans ${collection}`);
    }
  };

  const handleDeleteCourier = async (
    courierId: string,
    collection: "coursiers" | "truecoursiers"
  ) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const endpoint =
        collection === "coursiers"
          ? `/api/coursiers/${courierId}`
          : `/api/truecoursiers/${courierId}`;
      const response = await fetch(`https://debutant.onrender.com${endpoint}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur de communication" }));
        throw new Error(
          errorData.error || `Erreur lors de la suppression du coursier dans ${collection}`
        );
      }

      if (collection === "coursiers") {
        setAppliedCouriers((prev) =>
          prev.filter((courier) => courier.id !== courierId)
        );
      } else {
        setRegisteredCouriers((prev) =>
          prev.filter((courier) => courier.id !== courierId)
        );
      }

      setCouriers(couriers.filter((courier) => courier.id !== courierId));
      
    } catch (error: any) {
      console.error(error.message || `Erreur lors de la suppression dans ${collection}`);
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
      
    } else {
      toast.error("Le message ne peut pas être vide");
    }
  };

  const isCompleteForAdd = (
    data: Partial<Courier>
  ): data is Omit<Courier, "id"> => {
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

  const filteredAppliedCouriers = appliedCouriers.filter((courier) => {
    const statusMatch =
      filterStatus === "all" || courier.status === filterStatus;
    const zoneMatch =
      filterZone === "all" || courier.coverageZone === filterZone;
    const searchMatch =
      searchQuery === "" ||
      courier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courier.phone.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && zoneMatch && searchMatch;
  });

  const filteredRegisteredCouriers = registeredCouriers.filter((courier) => {
    const statusMatch =
      filterStatus === "all" || courier.status === filterStatus;
    const zoneMatch =
      filterZone === "all" || courier.coverageZone === filterZone;
    const searchMatch =
      searchQuery === "" ||
      courier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courier.phone.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && zoneMatch && searchMatch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
      {/* Header avec titre et boutons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <span>Gestion des coursiers</span>
          {(loading.coursiers || loading.truecoursiers) && (
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
          )}
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1 sm:flex-none">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadCouriers("coursiers");
                loadCouriers("truecoursiers");
              }}
              disabled={loading.coursiers || loading.truecoursiers}
              className="w-full sm:w-auto h-10 px-3 sm:px-4 text-sm font-medium rounded-md border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading.coursiers || loading.truecoursiers ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1 sm:flex-none">
            <Button
              size="sm"
              onClick={() => {
                setSelectedCourier(null);
                setShowForm(true);
              }}
              className="w-full sm:w-auto h-10 px-3 sm:px-4 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau coursier
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Carte principale */}
      <Card className="w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <CardHeader className="px-6 py-4 space-y-4 border-b border-gray-200 dark:border-gray-700">
          {/* Barre de recherche */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un coursier..."
              className="pl-10 h-10 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Rechercher un coursier"
            />
          </div>

          {/* Filtres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                <Filter className="h-4 w-4" />
                Statut
              </Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger
                  className="h-10 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  aria-label="Filtrer par statut"
                >
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md">
                  <SelectItem value="all" className="text-sm">Tous les statuts</SelectItem>
                  <SelectItem value={COURIER_STATUS.ACTIVE} className="text-sm">Actif</SelectItem>
                  <SelectItem value={COURIER_STATUS.INACTIVE} className="text-sm">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                <Filter className="h-4 w-4" />
                Zone
              </Label>
              <Select value={filterZone} onValueChange={setFilterZone}>
                <SelectTrigger
                  className="h-10 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  aria-label="Filtrer par zone"
                >
                  <SelectValue placeholder="Filtrer par zone" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md">
                  <SelectItem value="all" className="text-sm">Toutes les zones</SelectItem>
                  {Object.values(COVERAGE_ZONES).map((zone) => (
                    <SelectItem key={zone} value={zone} className="text-sm">
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-4">
          {loading.coursiers && loading.truecoursiers ? (
            <div className="p-4 sm:p-6 space-y-4">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <CourierTable
                appliedCouriers={filteredAppliedCouriers}
                registeredCouriers={filteredRegisteredCouriers}
                onEdit={({ courier, collection }) => {
                  setSelectedCourier({ courier, collection });
                  setShowForm(true);
                }}
                onDeactivate={handleDeactivateCourier}
                onDelete={handleDeleteCourier}
                onRefresh={() => {
                  loadCouriers("coursiers");
                  loadCouriers("truecoursiers");
                }}
                isLoading={loading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire modale */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedCourier ? "Modifier coursier" : "Ajouter un coursier"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedCourier(null);
                    }}
                    className="h-8 w-8 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    aria-label="Fermer la modale"
                  >
                    ×
                  </Button>
                </CardHeader>
                <CardContent className="px-6 py-6">
                  <CourierForm
                    courier={selectedCourier?.courier}
                    onSubmit={(data) => {
                      if (selectedCourier) {
                        handleUpdateCourier(
                          selectedCourier.courier.id,
                          data,
                          selectedCourier.collection
                        );
                      } else if (isCompleteForAdd(data)) {
                        handleAddCourier(data, "coursiers");
                      } else {
                        toast.error("Veuillez remplir tous les champs obligatoires");
                        return;
                      }
                      setShowForm(false);
                    }}
                    isEditing={!!selectedCourier}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section communication */}
      <Card className="w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <CardHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Communication avec les coursiers
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900 dark:text-white">
              Envoyer un message
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Écrivez votre message ici..."
                className="flex-1 min-h-[100px] text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                aria-label="Écrire un message aux coursiers"
              />
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={handleSendMessage}
                  className="h-10 px-4 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  disabled={!message.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </Button>
              </motion.div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900 dark:text-white">
              Historique des messages
            </Label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-80 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-800/50">
              <AnimatePresence>
                {chatMessages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Aucun message
                  </motion.div>
                ) : (
                  chatMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="p-3 rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Admin</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {msg.timestamp.toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{msg.text}</p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CouriersPage;