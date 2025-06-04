import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { COVERAGE_ZONES, COURIER_STATUS } from './types';

// Define the Courier interface
interface Courier {
  name: string;
  email: string;
  phone: string;
  address: string;
  experience: string;
  vehicle: string;
  coverageZone: string;
  motivation: string;
  photo: File | string | null;
}

// Define the props interface
interface CourierFormProps {
  courier?: Partial<Courier>;
  onSubmit: (data: Partial<Courier>) => void;
  isEditing: boolean;
}

const CourierForm: React.FC<CourierFormProps> = ({ courier, onSubmit, isEditing }) => {
  // Define the initial form data with explicit type
  const [formData, setFormData] = useState<Partial<Courier>>({
    name: courier?.name || '',
    email: courier?.email || '',
    phone: courier?.phone || '',
    address: courier?.address || '',
    experience: courier?.experience || '',
    vehicle: courier?.vehicle || '',
    coverageZone: courier?.coverageZone || COVERAGE_ZONES.PARIS_CENTRE,
    motivation: courier?.motivation || '',
    photo: null,
  });

  // Define the photo preview state
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    typeof courier?.photo === 'string' ? courier.photo : courier?.photo?.secure_url || null
  );

  // Define the errors state with explicit type
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Update form data when courier prop changes
  useEffect(() => {
    if (courier) {
      setFormData({
        name: courier.name || '',
        email: courier.email || '',
        phone: courier.phone || '',
        address: courier.address || '',
        experience: courier.experience || '',
        vehicle: courier.vehicle || '',
        coverageZone: courier.coverageZone || COVERAGE_ZONES.PARIS_CENTRE,
        motivation: courier.motivation || '',
        photo: null,
      });
      setPhotoPreview(
        typeof courier.photo === 'string' ? courier.photo : courier.photo?.secure_url || null
      );
    }
  }, [courier]);

  // Form validation function
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name?.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Email invalide';
    if (!formData.phone?.match(/^\+?\d{10,}$/)) newErrors.phone = 'Téléphone invalide';
    if (!formData.address?.trim()) newErrors.address = 'L\'adresse est requise';
    if (!formData.experience?.trim()) newErrors.experience = 'L\'expérience est requise';
    if (!formData.vehicle) newErrors.vehicle = 'Le véhicule est requis';
    if (!formData.coverageZone) newErrors.coverageZone = 'La zone est requise';
    if (!formData.motivation?.trim()) newErrors.motivation = 'La motivation est requise';
    if (!isEditing && !formData.photo) newErrors.photo = 'Une photo est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev: { [key: string]: string }) => ({ ...prev, photo: 'Fichier image requis' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev: { [key: string]: string }) => ({ ...prev, photo: 'L\'image doit être inférieure à 5MB' }));
        return;
      }
      setFormData((prev: Partial<Courier>) => ({ ...prev, photo: file }));
      setPhotoPreview(URL.createObjectURL(file));
      setErrors((prev: { [key: string]: string }) => ({ ...prev, photo: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit(formData);

    if (!isEditing) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        experience: '',
        vehicle: '',
        coverageZone: COVERAGE_ZONES.PARIS_CENTRE,
        motivation: '',
        photo: null,
      });
      setPhotoPreview(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Modifier le coursier' : 'Ajouter un coursier'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData((prev: Partial<Courier>) => ({ ...prev, name: e.target.value }))}
                placeholder="Jean Dupont"
                required
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData((prev: Partial<Courier>) => ({ ...prev, email: e.target.value }))}
                placeholder="jean.dupont@example.com"
                required
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData((prev: Partial<Courier>) => ({ ...prev, phone: e.target.value }))}
                placeholder="+33612345678"
                required
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse *</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData((prev: Partial<Courier>) => ({ ...prev, address: e.target.value }))}
                placeholder="15 Rue de Paris, 75001"
                required
              />
              {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Expérience *</Label>
              <Input
                id="experience"
                value={formData.experience || ''}
                onChange={(e) => setFormData((prev: Partial<Courier>) => ({ ...prev, experience: e.target.value }))}
                placeholder="2 ans"
                required
              />
              {errors.experience && <p className="text-red-500 text-sm">{errors.experience}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle">Véhicule *</Label>
              <Select value={formData.vehicle || ''} onValueChange={(value) => setFormData((prev: Partial<Courier>) => ({ ...prev, vehicle: value }))}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vélo">Vélo</SelectItem>
                  <SelectItem value="vélo électrique">Vélo électrique</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                  <SelectItem value="voiture">Voiture</SelectItem>
                </SelectContent>
              </Select>
              {errors.vehicle && <p className="text-red-500 text-sm">{errors.vehicle}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone">Zone de couverture *</Label>
              <Select value={formData.coverageZone || ''} onValueChange={(value) => setFormData((prev: Partial<Courier>) => ({ ...prev, coverageZone: value }))}>
                <SelectTrigger id="zone">
                  <SelectValue placeholder="Sélectionner une zone" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(COVERAGE_ZONES).map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.coverageZone && <p className="text-red-500 text-sm">{errors.coverageZone}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="motivation">Motivation *</Label>
              <Textarea
                id="motivation"
                value={formData.motivation || ''}
                onChange={(e) => setFormData((prev: Partial<Courier>) => ({ ...prev, motivation: e.target.value }))}
                placeholder="Pourquoi souhaitez-vous rejoindre notre équipe ?"
                rows={4}
                required
              />
              {errors.motivation && <p className="text-red-500 text-sm">{errors.motivation}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="photo">Photo de profil {isEditing ? '' : '*'}</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full"
              />
              {photoPreview && (
                <Avatar className="mt-2">
                  <AvatarImage src={photoPreview} alt="Prévisualisation" />
                  <AvatarFallback>{formData.name?.charAt(0) || ''}</AvatarFallback>
                </Avatar>
              )}
              {errors.photo && <p className="text-red-500 text-sm">{errors.photo}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-4">
            {isEditing && (
              <Button type="button" variant="outline" onClick={() => onSubmit({})}>
                Annuler
              </Button>
            )}
            <Button type="submit">
              {isEditing ? 'Mettre à jour' : 'Ajouter'} le coursier
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourierForm;