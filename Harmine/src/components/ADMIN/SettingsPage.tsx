import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { getAuth } from 'firebase/auth';

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
    vehicleType: 'moto',
  });
  const [promotion, setPromotion] = useState<Promotion>({
    code: '',
    discount: 0,
    active: false,
  });
  const [coverageZones, setCoverageZones] = useState<string[]>([]);
  const [newZone, setNewZone] = useState<string>('');
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(['moto', 'voiture', 'vélo']);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'Dynamism Express',
    email: 'contact@dynamismexpress.com',
    address: '123 Rue de Paris, France',
  });
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingTarifs, setIsSavingTarifs] = useState<boolean>(false);
  const [isSavingZones, setIsSavingZones] = useState<boolean>(false);
  const [isSavingVehicles, setIsSavingVehicles] = useState<boolean>(false);
  const [isSavingAccount, setIsSavingAccount] = useState<boolean>(false);
  const [isSavingAll, setIsSavingAll] = useState<boolean>(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
      }

      const response = await fetch('http://localhost:5000/api/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des paramètres');
      }

      const data = await response.json();
      console.log('Raw Settings Data:', data.data);
      setDeliveryPrices(data.data.deliveryPrices);
      setPromotion(data.data.promotion);
      setCoverageZones(data.data.coverageZones);
      setVehicleTypes(data.data.vehicleTypes);
      setCompanyInfo(data.data.companyInfo);
      setAdminUsers(data.data.adminUsers);
      toast.success('Paramètres chargés avec succès');
    } catch (error: any) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast.error(error.message || 'Erreur lors du chargement des paramètres');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (section: string, data: any, setIsSaving: React.Dispatch<React.SetStateAction<boolean>>, retryCount = 0) => {
    try {
      setIsSaving(true);
      let token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
      }

      console.log(`Tentative de sauvegarde de ${section} avec token:`, token.substring(0, 10) + '...');

      const response = await fetch('http://localhost:5000/api/settings', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Token invalide' && retryCount < 2) {
          console.log('Token invalide, tentative de rafraîchissement...');
          const auth = getAuth();
          const user = auth.currentUser;
          if (user) {
            token = await user.getIdToken(true);
            localStorage.setItem('authToken', token);
            console.log('Nouveau token obtenu:', token.substring(0, 10) + '...');
            return saveSettings(section, data, setIsSaving, retryCount + 1);
          } else {
            throw new Error('Utilisateur non connecté');
          }
        }
        throw new Error(errorData.error || `Erreur lors de la mise à jour des ${section}`);
      }

      const responseData = await response.json();
      console.log(`${section} mis à jour:`, responseData.data);
      toast.success(`${section} mis à jour avec succès`);
    } catch (error: any) {
      console.error(`Erreur lors de la mise à jour des ${section}:`, error);
      toast.error(error.message || `Erreur lors de la mise à jour des ${section}`);
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
    await saveSettings('Paramètres', settingsData, setIsSavingAll);
  };

  const saveTarifs = async () => {
    const data = { deliveryPrices, promotion };
    await saveSettings('Tarifs et promotion', data, setIsSavingTarifs);
  };

  const saveZones = async () => {
    const data = { coverageZones };
    await saveSettings('Zones de couverture', data, setIsSavingZones);
  };

  const saveVehicles = async () => {
    const data = { vehicleTypes };
    await saveSettings('Types de véhicules', data, setIsSavingVehicles);
  };

  const saveAccount = async () => {
    const data = { companyInfo };
    await saveSettings('Paramètres du compte', data, setIsSavingAccount);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleDeliveryPriceChange = (field: keyof DeliveryPrices, value: string) => {
    setDeliveryPrices({ ...deliveryPrices, [field]: value });
  };

  const handlePromotionChange = (field: keyof Promotion, value: string | boolean) => {
    setPromotion({ ...promotion, [field]: value });
  };

  const addCoverageZone = () => {
    if (newZone.trim() !== '') {
      const updatedZones = [...coverageZones, newZone];
      setCoverageZones(updatedZones);
      setNewZone('');
      saveSettings('Zones de couverture', { coverageZones: updatedZones }, setIsSavingZones);
    } else {
      toast.error('La zone ne peut pas être vide');
    }
  };

  const addVehicleType = (type: string) => {
    if (type.trim() !== '' && !vehicleTypes.includes(type)) {
      const updatedVehicleTypes = [...vehicleTypes, type];
      setVehicleTypes(updatedVehicleTypes);
      saveSettings('Types de véhicules', { vehicleTypes: updatedVehicleTypes }, setIsSavingVehicles);
    } else {
      toast.error('Type de véhicule invalide ou déjà existant');
    }
  };

  const handleCompanyInfoChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo({ ...companyInfo, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des paramètres...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des tarifs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tarif en fonction de la distance (€/km)</Label>
            <Input
              type="number"
              value={deliveryPrices.distance}
              onChange={(e) => handleDeliveryPriceChange('distance', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tarif en fonction du poids (€/kg)</Label>
            <Input
              type="number"
              value={deliveryPrices.weight}
              onChange={(e) => handleDeliveryPriceChange('weight', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type de véhicule</Label>
            <Select
              value={deliveryPrices.vehicleType}
              onValueChange={(value) => handleDeliveryPriceChange('vehicleType', value)}
            >
              <SelectTrigger>
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
            <Label>Promotion</Label>
            <Input
              placeholder="Code de promotion"
              value={promotion.code}
              onChange={(e) => handlePromotionChange('code', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Réduction (%)"
              value={promotion.discount}
              onChange={(e) => handlePromotionChange('discount', e.target.value)}
            />
            <div className="flex items-center space-x-2">
              <Switch
                checked={promotion.active}
                onCheckedChange={(checked) => handlePromotionChange('active', checked)}
              />
              <Label>Activer la promotion</Label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveTarifs} disabled={isSavingTarifs}>
              {isSavingTarifs ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validation...
                </>
              ) : (
                'Valider les tarifs'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zones de couverture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Ajouter une zone</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Nom de la zone"
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
              />
              <Button onClick={addCoverageZone} disabled={isSavingZones}>
                {isSavingZones ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  'Ajouter'
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Zones disponibles</Label>
            {coverageZones.length === 0 ? (
              <p className="text-gray-500">Aucune zone disponible</p>
            ) : (
              <ul className="list-disc pl-6">
                {coverageZones.map((zone, index) => (
                  <li key={index}>{zone}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={saveZones} disabled={isSavingZones}>
              {isSavingZones ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validation...
                </>
              ) : (
                'Valider les zones'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Types de véhicules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Véhicules autorisés</Label>
            {vehicleTypes.length === 0 ? (
              <p className="text-gray-500">Aucun type de véhicule disponible</p>
            ) : (
              <ul className="list-disc pl-6">
                {vehicleTypes.map((type, index) => (
                  <li key={index}>{type}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <Label>Ajouter un type de véhicule</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Nouveau type de véhicule"
                id="new-vehicle-type"
                onBlur={(e) => addVehicleType(e.target.value)}
              />
              <Button onClick={() => addVehicleType(document.querySelector('#new-vehicle-type')?.value || '')} disabled={isSavingVehicles}>
                {isSavingVehicles ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  'Ajouter'
                )}
              </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveVehicles} disabled={isSavingVehicles}>
              {isSavingVehicles ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validation...
                </>
              ) : (
                'Valider les types de véhicules'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres du compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom de l'entreprise</Label>
            <Input
              value={companyInfo.name}
              onChange={(e) => handleCompanyInfoChange('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email de contact</Label>
            <Input
              value={companyInfo.email}
              onChange={(e) => handleCompanyInfoChange('email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input
              value={companyInfo.address}
              onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Utilisateurs administrateurs</Label>
            {adminUsers.length === 0 ? (
              <p className="text-gray-500">Aucun administrateur disponible</p>
            ) : (
              <ul className="list-disc pl-6">
                {adminUsers.map((user) => (
                  <li key={user.id}>{user.name} ({user.email})</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={saveAccount} disabled={isSavingAccount}>
              {isSavingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validation...
                </>
              ) : (
                'Valider les paramètres du compte'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveAllSettings} disabled={isSavingAll}>
          {isSavingAll ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            'Sauvegarder tous les paramètres'
          )}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;