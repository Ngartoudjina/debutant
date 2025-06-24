import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { getAuth } from "firebase/auth";
import { motion } from "framer-motion";

interface DeliveryPrices {
  distance: number;
  weight: number;
  vehicleType: string;
}

interface Promotion {
  code: string;
  discount: number;
  active: boolean;
}

interface CompanyInfo {
  name: string;
  email: string;
  address: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

const SettingsPage: React.FC = () => {
  const [deliveryPrices, setDeliveryPrices] = useState<DeliveryPrices>({
    distance: 0,
    weight: 0,
    vehicleType: "moto",
  });
  const [promotion, setPromotion] = useState<Promotion>({
    code: "",
    discount: 0,
    active: false,
  });
  const [coverageZones, setCoverageZones] = useState<string[]>([]);
  const [newZone, setNewZone] = useState<string>("");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([
    "moto",
    "voiture",
    "vélo",
  ]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "Dynamism Express",
    email: "contact@dynamismexpress.com",
    address: "123 Rue de Paris, France",
  });
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingTarifs, setIsSavingTarifs] = useState<boolean>(false);
  const [isSavingZones, setIsSavingZones] = useState<boolean>(false);
  const [isSavingVehicles, setIsSavingVehicles] = useState<boolean>(false);
  const [isSavingAccount, setIsSavingAccount] = useState<boolean>(false);
  const [isSavingAll, setIsSavingAll] = useState<boolean>(false);
  const [newVehicleType, setNewVehicleType] = useState<string>("");

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const response = await fetch("https://debutant.onrender.com/api/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur de communication" }));
        throw new Error(
          errorData.error || "Erreur lors de la récupération des paramètres"
        );
      }

      const data = await response.json();
      setDeliveryPrices(data.data.deliveryPrices || { distance: 0, weight: 0, vehicleType: "moto" });
      setPromotion(data.data.promotion || { code: "", discount: 0, active: false });
      setCoverageZones(data.data.coverageZones || []);
      setVehicleTypes(data.data.vehicleTypes || ["moto", "voiture", "vélo"]);
      setCompanyInfo(data.data.companyInfo || { name: "", email: "", address: "" });
      setAdminUsers(data.data.adminUsers || []);
      
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des paramètres");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = async (
    section: string,
    data: any,
    setIsSaving: React.Dispatch<React.SetStateAction<boolean>>,
    retryCount = 0
  ) => {
    const MAX_RETRIES = 2;
    try {
      setIsSaving(true);
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const response = await fetch("https://debutant.onrender.com/api/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur de communication" }));
        if (errorData.error === "Token invalide" && retryCount < MAX_RETRIES) {
          const auth = getAuth();
          const user = auth.currentUser;
          if (user) {
            const newToken = await user.getIdToken(true);
            localStorage.setItem("authToken", newToken);
            return saveSettings(section, data, setIsSaving, retryCount + 1);
          }
          throw new Error("Utilisateur non connecté");
        }
        throw new Error(
          errorData.error || `Erreur lors de la mise à jour des ${section}`
        );
      }

      await response.json();
      
    } catch (error: any) {
      console.error(error.message || `Erreur lors de la mise à jour des ${section}`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllSettings = async () => {
    const settingsData = {
      deliveryPrices,
      promotion,
      coverageZones,
      vehicleTypes,
      companyInfo,
    };
    await saveSettings("Paramètres", settingsData, setIsSavingAll);
  };

  const saveTarifs = async () => {
    const data = { deliveryPrices, promotion };
    await saveSettings("Tarifs et promotion", data, setIsSavingTarifs);
  };

  const saveZones = async () => {
    const data = { coverageZones };
    await saveSettings("Zones de couverture", data, setIsSavingZones);
  };

  const saveVehicles = async () => {
    const data = { vehicleTypes };
    await saveSettings("Types de véhicules", data, setIsSavingVehicles);
  };

  const saveAccount = async () => {
    const data = { companyInfo };
    await saveSettings("Paramètres du compte", data, setIsSavingAccount);
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleDeliveryPriceChange = (
    field: keyof DeliveryPrices,
    value: string
  ) => {
    setDeliveryPrices({ ...deliveryPrices, [field]: field === "vehicleType" ? value : parseFloat(value) || 0 });
  };

  const handlePromotionChange = (
    field: keyof Promotion,
    value: string | boolean
  ) => {
    setPromotion({
      ...promotion,
      [field]: field === "discount" ? parseFloat(value as string) || 0 : value,
    });
  };

  const addCoverageZone = () => {
    if (newZone.trim() !== "") {
      const updatedZones = [...coverageZones, newZone.trim()];
      setCoverageZones(updatedZones);
      setNewZone("");
      saveSettings(
        "Zones de couverture",
        { coverageZones: updatedZones },
        setIsSavingZones
      );
    } else {
      console.error("La zone ne peut pas être vide");
    }
  };

  const addVehicleType = (type: string) => {
    if (type.trim() !== "" && !vehicleTypes.includes(type.trim())) {
      const updatedVehicleTypes = [...vehicleTypes, type.trim()];
      setVehicleTypes(updatedVehicleTypes);
      setNewVehicleType("");
      saveSettings(
        "Types de véhicules",
        { vehicleTypes: updatedVehicleTypes },
        setIsSavingVehicles
      );
    } else {
      console.error("Type de véhicule invalide ou déjà existant");
    }
  };

  const handleCompanyInfoChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo({ ...companyInfo, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-sm sm:text-base">Chargement des paramètres...</span>
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4">
      {/* Gestion des tarifs */}
      <Card className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-lg sm:text-xl">Gestion des tarifs</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Tarif en fonction de la distance (€/km)</Label>
            <Input
              type="number"
              value={deliveryPrices.distance}
              onChange={(e) => handleDeliveryPriceChange("distance", e.target.value)}
              className="w-full h-8 sm:h-9 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Tarif en fonction du poids (€/kg)</Label>
            <Input
              type="number"
              value={deliveryPrices.weight}
              onChange={(e) => handleDeliveryPriceChange("weight", e.target.value)}
              className="w-full h-8 sm:h-9 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Type de véhicule</Label>
            <Select
              value={deliveryPrices.vehicleType}
              onValueChange={(value) => handleDeliveryPriceChange("vehicleType", value)}
            >
              <SelectTrigger className="w-full h-8 sm:h-9 text-sm">
                <SelectValue placeholder="Sélectionnez un type de véhicule" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Promotion</Label>
            <Input
              placeholder="Code de promotion"
              value={promotion.code}
              onChange={(e) => handlePromotionChange("code", e.target.value)}
              className="w-full h-8 sm:h-9 text-sm"
            />
            <Input
              type="number"
              placeholder="Réduction (%)"
              value={promotion.discount}
              onChange={(e) => handlePromotionChange("discount", e.target.value)}
              className="w-full h-8 sm:h-9 text-sm"
            />
            <div className="flex items-center space-x-2">
              <Switch
                checked={promotion.active}
                onCheckedChange={(checked) => handlePromotionChange("active", checked)}
              />
              <Label className="text-sm">Activer la promotion</Label>
            </div>
          </div>
          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={saveTarifs}
                disabled={isSavingTarifs}
                className="h-8 sm:h-9 text-sm"
              >
                {isSavingTarifs ? (
                  <>
                    <Loader2 className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                    Validation...
                  </>
                ) : (
                  "Valider les tarifs"
                )}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Zones de couverture */}
      <Card className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-lg sm:text-xl">Zones de couverture</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Ajouter une zone</Label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                placeholder="Nom de la zone"
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                className="w-full h-8 sm:h-9 text-sm"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={addCoverageZone}
                  disabled={isSavingZones}
                  className="h-8 sm:h-9 text-sm"
                >
                  {isSavingZones ? (
                    <>
                      <Loader2 className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                      Ajout...
                    </>
                  ) : (
                    "Ajouter"
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Zones disponibles</Label>
            {coverageZones.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune zone disponible</p>
            ) : (
              <ul className="list-disc pl-4 sm:pl-6 text-sm">
                {coverageZones.map((zone, index) => (
                  <li key={index}>{zone}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={saveZones}
                disabled={isSavingZones}
                className="h-8 sm:h-9 text-sm"
              >
                {isSavingZones ? (
                  <>
                    <Loader2 className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                    Validation...
                  </>
                ) : (
                  "Valider les zones"
                )}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Types de véhicules */}
      <Card className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-lg sm:text-xl">Types de véhicules</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Véhicules autorisés</Label>
            {vehicleTypes.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun type de véhicule disponible</p>
            ) : (
              <ul className="list-disc pl-4 sm:pl-6 text-sm">
                {vehicleTypes.map((type, index) => (
                  <li key={index}>{type}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Ajouter un type de véhicule</Label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                placeholder="Nouveau type de véhicule"
                value={newVehicleType}
                onChange={(e) => setNewVehicleType(e.target.value)}
                className="w-full h-8 sm:h-9 text-sm"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => {
                    addVehicleType(newVehicleType);
                  }}
                  disabled={isSavingVehicles}
                  className="h-8 sm:h-9 text-sm"
                >
                  {isSavingVehicles ? (
                    <>
                      <Loader2 className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                      Ajout...
                    </>
                  ) : (
                    "Ajouter"
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={saveVehicles}
                disabled={isSavingVehicles}
                className="h-8 sm:h-9 text-sm"
              >
                {isSavingVehicles ? (
                  <>
                    <Loader2 className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                    Validation...
                  </>
                ) : (
                  "Valider les types de véhicules"
                )}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres du compte */}
      <Card className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-lg sm:text-xl">Paramètres du compte</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Nom de l'entreprise</Label>
            <Input
              value={companyInfo.name}
              onChange={(e) => handleCompanyInfoChange("name", e.target.value)}
              className="w-full h-8 sm:h-9 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Email de contact</Label>
            <Input
              value={companyInfo.email}
              onChange={(e) => handleCompanyInfoChange("email", e.target.value)}
              className="w-full h-8 sm:h-9 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Adresse</Label>
            <Input
              value={companyInfo.address}
              onChange={(e) => handleCompanyInfoChange("address", e.target.value)}
              className="w-full h-8 sm:h-9 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Utilisateurs administrateurs</Label>
            {adminUsers.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun administrateur disponible</p>
            ) : (
              <ul className="list-disc pl-4 sm:pl-6 text-sm">
                {adminUsers.map((user) => (
                  <li key={user.id}>
                    {user.name} ({user.email})
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={saveAccount}
                disabled={isSavingAccount}
                className="h-8 sm:h-9 text-sm"
              >
                {isSavingAccount ? (
                  <>
                    <Loader2 className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                    Validation...
                  </>
                ) : (
                  "Valider les paramètres du compte"
                )}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Sauvegarde globale */}
      <div className="flex justify-end">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={saveAllSettings}
            disabled={isSavingAll}
            className="h-8 sm:h-9 text-sm mr-2 sm:mr-3"
          >
            {isSavingAll ? (
              <>
                <Loader2 className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              "Sauvegarder tous les paramètres"
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;