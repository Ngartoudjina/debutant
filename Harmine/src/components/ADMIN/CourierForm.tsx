import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { COVERAGE_ZONES, Courier } from './types';
import { motion } from 'framer-motion';

// Define the photo object interface for uploaded photos
interface PhotoObject {
  secure_url: string;
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
    photo: undefined,
  });

  // Helper function to get photo URL
  const getPhotoUrl = (photo: File | PhotoObject | string | null | undefined): string | null => {
    if (!photo) return null;
    if (typeof photo === 'string') return photo;
    if (photo instanceof File) return URL.createObjectURL(photo);
    if (typeof photo === 'object' && 'secure_url' in photo) return photo.secure_url;
    return null;
  };

  // Define the photo preview state
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    getPhotoUrl(courier?.photo)
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
        photo: undefined,
      });
      setPhotoPreview(getPhotoUrl(courier.photo));
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
        photo: undefined,
      });
      setPhotoPreview(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="w-full max-w-3xl mx-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Modifier le coursier' : 'Ajouter un coursier'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Nom complet <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData((prev: Partial<Courier>) => ({ ...prev, name: e.target.value }))}
                  placeholder="Jean Dupont"
                  required
                  className="h-10 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData((prev: Partial<Courier>) => ({ ...prev, email: e.target.value }))}
                  placeholder="jean.dupont@example.com"
                  required
                  className="h-10 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Téléphone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData((prev: Partial<Courier>) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+33612345678"
                  required
                  className="h-10 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                />
                {errors.phone && (
                  <p id="phone-error" className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Adresse <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData((prev: Partial<Courier>) => ({ ...prev, address: e.target.value }))}
                  placeholder="15 Rue de Paris, 75001"
                  required
                  className="h-10 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  aria-describedby={errors.address ? "address-error" : undefined}
                />
                {errors.address && (
                  <p id="address-error" className="text-red-500 text-xs mt-1">{errors.address}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Expérience <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="experience"
                  value={formData.experience || ''}
                  onChange={(e) => setFormData((prev: Partial<Courier>) => ({ ...prev, experience: e.target.value }))}
                  placeholder="2 ans"
                  required
                  className="h-10 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  aria-describedby={errors.experience ? "experience-error" : undefined}
                />
                {errors.experience && (
                  <p id="experience-error" className="text-red-500 text-xs mt-1">{errors.experience}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Véhicule <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.vehicle || ''}
                  onValueChange={(value) => setFormData((prev: Partial<Courier>) => ({ ...prev, vehicle: value }))}
                >
                  <SelectTrigger
                    id="vehicle"
                    className="h-10 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    aria-describedby={errors.vehicle ? "vehicle-error" : undefined}
                  >
                    <SelectValue placeholder="Sélectionner un véhicule" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md">
                    <SelectItem value="vélo" className="text-sm">Vélo</SelectItem>
                    <SelectItem value="vélo électrique" className="text-sm">Vélo électrique</SelectItem>
                    <SelectItem value="scooter" className="text-sm">Scooter</SelectItem>
                    <SelectItem value="voiture" className="text-sm">Voiture</SelectItem>
                  </SelectContent>
                </Select>
                {errors.vehicle && (
                  <p id="vehicle-error" className="text-red-500 text-xs mt-1">{errors.vehicle}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Zone de couverture <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.coverageZone || ''}
                  onValueChange={(value) => setFormData((prev: Partial<Courier>) => ({ ...prev, coverageZone: value }))}
                >
                  <SelectTrigger
                    id="zone"
                    className="h-10 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    aria-describedby={errors.coverageZone ? "zone-error" : undefined}
                  >
                    <SelectValue placeholder="Sélectionner une zone" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md">
                    {Object.values(COVERAGE_ZONES).map((zone) => (
                      <SelectItem key={zone} value={zone} className="text-sm">
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.coverageZone && (
                  <p id="zone-error" className="text-red-500 text-xs mt-1">{errors.coverageZone}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="motivation" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Motivation <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="motivation"
                  value={formData.motivation || ''}
                  onChange={(e) => setFormData((prev: Partial<Courier>) => ({ ...prev, motivation: e.target.value }))}
                  placeholder="Pourquoi souhaitez-vous rejoindre notre équipe ?"
                  rows={4}
                  required
                  className="text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  aria-describedby={errors.motivation ? "motivation-error" : undefined}
                />
                {errors.motivation && (
                  <p id="motivation-error" className="text-red-500 text-xs mt-1">{errors.motivation}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="photo" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Photo de profil {isEditing ? '' : <span className="text-red-500">*</span>}
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    aria-describedby={errors.photo ? "photo-error" : undefined}
                  />
                  {photoPreview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={photoPreview} alt="Prévisualisation de la photo de profil" />
                        <AvatarFallback className="text-sm bg-gray-200 dark:bg-gray-700">
                          {formData.name?.charAt(0) || ''}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  )}
                </div>
                {errors.photo && (
                  <p id="photo-error" className="text-red-500 text-xs mt-1">{errors.photo}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              {isEditing && (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onSubmit({})}
                    className="h-10 px-4 text-sm font-medium rounded-md border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    Annuler
                  </Button>
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  type="submit"
                  className="h-10 px-4 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  {isEditing ? 'Mettre à jour' : 'Ajouter'} le coursier
                </Button>
              </motion.div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CourierForm;