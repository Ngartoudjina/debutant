import React, { useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Bike,
  Clock,
  Upload,
  Send,
  Check,
  Moon,
  Sun,
} from "lucide-react";
import ThemeToggle from './ThemeToggle';
import { toast } from "react-toastify";
import Navbar from "./Navbar";
import Footer from "./Footer";
import debounce from "lodash/debounce";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { authStateObserver } from '../../../firebaseConfig'; // Remplacez par le chemin correct

// Configuration des fichiers
const FILE_CONFIG = {
  idDocument: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
    errorMessages: {
      size: "La pièce d'identité ne doit pas dépasser 5MB",
      type: "Format non supporté pour la pièce d'identité"
    }
  },
  drivingLicense: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
    errorMessages: {
      size: "Le permis ne doit pas dépasser 5MB",
      type: "Format non supporté pour le permis"
    }
  },
  profilePicture: {
    maxSize: 2 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/jpg"],
    errorMessages: {
      size: "La photo ne doit pas dépasser 2MB",
      type: "Format non supporté pour la photo de profil"
    }
  }
};

// Fonctions de validation séparées
const validateTextLength = (value: string, min: number, max: number): string => {
  if (value.trim().length < min) return `Le texte doit contenir au moins ${min} caractères`;
  if (value.trim().length > max) return `Le texte ne doit pas dépasser ${max} caractères`;
  return "";
};

const validateFile = (file: File, type: keyof typeof FILE_CONFIG): string => {
  const config = FILE_CONFIG[type];
  
  if (file.size > config.maxSize) {
    return config.errorMessages.size;
  }
  
  if (!config.allowedTypes.includes(file.type)) {
    return config.errorMessages.type;
  }
  
  return "";
};

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  experience: string;
  transport: string;
  availability: string;
  motivation: string;
  idDocument: FileWithPreview | null;
  drivingLicense: FileWithPreview | null;
  profilePicture: FileWithPreview | null;
}

interface FileWithPreview extends File {
  preview?: string;
}

type ValidationErrors = {
  [K in keyof FormData]?: string;
};

// État initial du formulaire pour réinitialisation
const initialFormData: FormData = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  experience: "",
  transport: "",
  availability: "",
  motivation: "",
  idDocument: null,
  drivingLicense: null,
  profilePicture: null,
};

const Courier: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filePreviewUrls, setFilePreviewUrls] = useState<{
    [key: string]: string;
  }>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null); // État pour l'utilisateur connecté

  // Gestion du mode sombre
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const [darkMode, setDarkMode] = useState(false);
  
    useEffect(() => {
      document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);
  
    const togleDarkMode = () => {
      setDarkMode((prev) => !prev);
    };

  // Observer l'état d'authentification
  useEffect(() => {
    const unsubscribe = authStateObserver(({ user, isAuthenticated }) => {
      if (isAuthenticated && user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        toast.error("Veuillez vous connecter pour soumettre votre candidature.");
      }
    });
    return () => unsubscribe();
  }, []);

  // Nettoyage des URLs de prévisualisation
  useEffect(() => {
    return () => {
      Object.values(filePreviewUrls).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [filePreviewUrls]);

  // Modification de la fonction validateField
  const validateField = useCallback((name: keyof FormData, value: string | File | null) => {
    if (value === null && name !== 'idDocument' && name !== 'drivingLicense' && name !== 'profilePicture') {
      return "Ce champ est requis";
    }

    switch (name) {
      case 'fullName': {
        if (typeof value !== 'string') return "Nom invalide";
        const lengthError = validateTextLength(value, 2, 50);
        if (lengthError) return lengthError;
        return /^[a-zA-ZÀ-ÿ\s'-]+$/.test(value) ? "" : "Le nom contient des caractères invalides";
      }

      case 'email': {
        if (typeof value !== 'string') return "Email invalide";
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return emailRegex.test(value) ? "" : "Email invalide";
      }

      case 'phone': {
        if (typeof value !== 'string') return "Téléphone invalide";
        
        const phoneNumber = parsePhoneNumberFromString(value, 'BJ');
        if (!phoneNumber || !phoneNumber.isValid()) {
          return "Numéro de téléphone invalide pour le Bénin";
        }
        return "";
      }

      case 'address': {
        if (typeof value !== 'string') return "Adresse invalide";
        return validateTextLength(value, 10, 200);
      }

      case 'experience': {
        if (typeof value !== 'string') return "Expérience invalide";
        return validateTextLength(value, 50, 1000);
      }

      case 'motivation': {
        if (typeof value !== 'string') return "Motivation invalide";
        return validateTextLength(value, 100, 2000);
      }

      case 'transport': {
        if (typeof value !== 'string') return "Transport invalide";
        return ['bike', 'motorcycle', 'car'].includes(value) ? "" : "Moyen de transport invalide";
      }

      case 'availability': {
        if (typeof value !== 'string') return "Disponibilité invalide";
        return ['full-time', 'part-time'].includes(value) ? "" : "Disponibilité invalide";
      }

      case 'idDocument':
      case 'drivingLicense':
      case 'profilePicture': {
        if (value === null) return "Fichier requis";
        if (!(value instanceof File)) return "Fichier requis";
        return validateFile(value, name);
      }

      default:
        return "";
    }
  }, []);

  const debouncedValidation = useMemo(
    () => debounce((name: keyof FormData, value: string | File | null) => {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }, 300),
    [validateField]
  );

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    debouncedValidation(name as keyof FormData, value);
  }, [debouncedValidation]);

  const handleFileChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>, 
    fieldName: keyof FormData
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileWithPreview: FileWithPreview = Object.assign(file, {
        preview: URL.createObjectURL(file)
      });

      setFormData(prev => ({ ...prev, [fieldName]: fileWithPreview }));
      
      const fileError = validateField(fieldName, file);
      if (fileError) {
        toast.error(fileError);
        setErrors(prev => ({ ...prev, [fieldName]: fileError }));
      } else {
        setErrors(prev => ({ ...prev, [fieldName]: "" }));
      }

      setFilePreviewUrls(prev => ({
        ...prev, 
        [fieldName]: fileWithPreview.preview || ''
      }));
    }
  }, [validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
  
    console.log("Données du formulaire avant envoi:", formData);
  
    // Validation des champs
    const newErrors: ValidationErrors = {};
    (Object.keys(formData) as Array<keyof FormData>).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
  
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }
  
    // Vérifier si un utilisateur est connecté
    if (!currentUser) {
      toast.error("Vous devez être connecté pour soumettre votre candidature.");
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      // Obtenir le token Firebase
      const idToken = await currentUser.getIdToken();
      if (!idToken) {
        throw new Error("Impossible d'obtenir le token d'authentification");
      }
  
      // CORRECTION: Créer un nouveau FormData et ajouter directement les fichiers
      const formDataToSend = new FormData();
  
      // Ajouter les champs texte
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('experience', formData.experience);
      formDataToSend.append('transport', formData.transport);
      formDataToSend.append('availability', formData.availability);
      formDataToSend.append('motivation', formData.motivation);
  
      // CORRECTION: Ajouter directement les fichiers au FormData
      if (formData.idDocument) {
        formDataToSend.append('idDocument', formData.idDocument);
        console.log("Fichier idDocument ajouté:", formData.idDocument.name);
      }
  
      if (formData.drivingLicense) {
        formDataToSend.append('drivingLicense', formData.drivingLicense);
        console.log("Fichier drivingLicense ajouté:", formData.drivingLicense.name);
      }
  
      if (formData.profilePicture) {
        formDataToSend.append('profilePicture', formData.profilePicture);
        console.log("Fichier profilePicture ajouté:", formData.profilePicture.name);
      }
  
      // CORRECTION: Vérifier que FormData contient bien les fichiers
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }
  
      // Envoyer la requête directement à l'API principale avec tous les fichiers
      console.log("Envoi des données à createCourier");
      const response = await fetch("http://localhost:5000/api/coursiers/createCourier", {
        method: "POST",
        body: formDataToSend,
        headers: {
          Authorization: `Bearer ${idToken}`,
          // CORRECTION: Ne pas ajouter le Content-Type pour FormData avec des fichiers
          // Le navigateur ajoutera automatiquement le bon Content-Type avec boundary
        },
      });
  
      console.log("Statut de la réponse:", response.status);
  
      const responseBody = await response.json();
      console.log("Corps de la réponse:", responseBody);
  
      if (!response.ok) {
        throw new Error(responseBody.error || "Erreur lors de la soumission");
      }
  
      toast.success("Votre candidature a été soumise avec succès !");
      setFormData(initialFormData);
      setFilePreviewUrls({});
    } catch (error) {
      console.error("Erreur de soumission complète:", error);
      toast.error(error instanceof Error ? error.message : "Erreur de soumission");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateField, currentUser]);

  const renderFormField = (
    name: keyof FormData,
    icon: React.ReactNode,
    placeholder: string,
    options: {
      type?: string;
      isTextarea?: boolean;
      isSelect?: boolean;
      selectOptions?: Array<{ value: string; label: string }>;
      minHeight?: string;
      'aria-invalid'?: boolean;
      'aria-describedby'?: string;
    } = {}
  ) => {
    const {
      type = "text",
      isTextarea = false,
      isSelect = false,
      selectOptions = [],
      minHeight,
    } = options;

    const baseClassName = `
      w-full pl-10 pr-4 py-3 
      bg-gray-50 dark:bg-gray-700/50 rounded-lg 
      border ${errors[name] ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
      focus:border-blue-500 dark:focus:border-blue-400 transition 
      text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 
      focus:outline-none focus:ring-2 focus:ring-blue-500/20
      ${minHeight ? `min-h-[${minHeight}]` : ""}
      ${isSelect ? "appearance-none" : ""}
    `;

    const iconElement = React.cloneElement(icon as React.ReactElement, {
      className: `w-5 h-5 ${
        errors[name] ? "text-red-400" : "text-gray-500 dark:text-gray-300"
      } group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors`,
    });

    return (
      <div className="relative group" data-error={!!errors[name]}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {iconElement}
        </div>

        {isTextarea ? (
          <textarea
            name={name}
            placeholder={placeholder}
            value={formData[name] as string}
            onChange={handleInputChange}
            className={baseClassName}
            required
            aria-invalid={!!errors[name]}
            aria-describedby={errors[name] ? `${name}-error` : undefined}
          />
        ) : isSelect ? (
          <select
            name={name}
            value={formData[name] as string}
            onChange={handleInputChange}
            className={baseClassName}
            required
            aria-invalid={!!errors[name]}
            aria-describedby={errors[name] ? `${name}-error` : undefined}
          >
            <option value="" className="bg-white dark:bg-gray-800">
              {placeholder}
            </option>
            {selectOptions.map(({ value, label }) => (
              <option key={value} value={value} className="bg-white dark:bg-gray-800">
                {label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={formData[name] as string}
            onChange={handleInputChange}
            className={baseClassName}
            required
            aria-invalid={!!errors[name]}
            aria-describedby={errors[name] ? `${name}-error` : undefined}
          />
        )}

        {errors[name] && (
          <p 
            id={`${name}-error`} 
            className="text-sm text-red-500 mt-1" 
            role="alert"
          >
            {errors[name]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-blue-900 flex flex-col items-center justify-center px-4 py-12">
      <Navbar />
      <ThemeToggle darkMode={darkMode} toggleDarkMode={togleDarkMode} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-white dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8"
      >
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-6 h-6 text-yellow-400" />
            ) : (
              <Moon className="w-6 h-6 text-gray-600 dark:text-gray-100" />
            )}
          </button>
        </div>

        <div className="text-center my-8">
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-300 dark:to-purple-500">
            Devenir Coursier
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Rejoignez notre équipe de coursiers professionnels
          </p>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Formulaire de candidature coursier">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
              Informations personnelles
            </h2>
            {renderFormField("fullName", <User />, "Nom complet")}
            {renderFormField("email", <Mail />, "Adresse e-mail", {
              type: "email"
            })}
            {renderFormField("phone", <Phone />, "Numéro de téléphone", {
              type: "tel"
            })}
            {renderFormField("address", <MapPin />, "Adresse résidentielle", {
              isTextarea: true,
              minHeight: "100px"
            })}
          </div>
  
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
              Informations professionnelles
            </h2>
  
            {renderFormField("experience", <Briefcase />, "Décrivez votre expérience précédente", {
              isTextarea: true
            })}
  
            {renderFormField("transport", <Bike />, "Sélectionnez votre moyen de transport", {
              isSelect: true,
              selectOptions: [
                { value: "bike", label: "Vélo" },
                { value: "motorcycle", label: "Moto" },
                { value: "car", label: "Voiture" }
              ]
            })}
  
            {renderFormField("availability", <Clock />, "Sélectionnez votre disponibilité", {
              isSelect: true,
              selectOptions: [
                { value: "full-time", label: "Temps plein" },
                { value: "part-time", label: "Temps partiel" }
              ]
            })}
          </div>
  
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
              Documents requis
            </h2>
  
            {["idDocument", "drivingLicense", "profilePicture"].map((field) => (
              <div key={field} className="relative group">
                <label className="block w-full cursor-pointer">
                  <div className="flex items-center justify-center w-full p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                      <Upload className="w-5 h-5" />
                      <span>
                        {field === "idDocument" && "Pièce d'identité"}
                        {field === "drivingLicense" && "Permis de conduire"}
                        {field === "profilePicture" && "Photo de profil"}
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, field as keyof FormData)}
                    accept={field === "profilePicture" ? "image/jpeg,image/png,image/jpg" : "image/jpeg,image/png,application/pdf"}
                    aria-invalid={!!errors[field as keyof FormData]}
                    aria-describedby={errors[field as keyof FormData] ? `${field}-error` : undefined}
                  />
                </label>

                {filePreviewUrls[field] && (
                  <div className="mt-4">
                    <img 
                      src={filePreviewUrls[field]} 
                      alt={`Prévisualisation ${field}`} 
                      className="max-w-full h-auto rounded-lg shadow-md"
                    />
                  </div>
                )}

                {formData[field as keyof FormData] && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Fichier sélectionné : {(formData[field as keyof FormData] as File).name}
                  </p>
                )}
                {errors[field as keyof FormData] && (
                  <p 
                    id={`${field}-error`} 
                    className="text-sm text-red-500 mt-2" 
                    role="alert"
                  >
                    {errors[field as keyof FormData]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
              Votre motivation
            </h2>
            {renderFormField("motivation", <Send />, "Pourquoi souhaitez-vous devenir coursier ?", {
              isTextarea: true,
              minHeight: "150px"
            })}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !currentUser}
            className={`w-full ${
              isSubmitting || !currentUser ? "bg-blue-700" : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            } text-white py-3 rounded-lg transition flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                aria-label="Chargement"
              />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Soumettre ma candidature</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
      <Footer />
    </div>
  );
};

export default Courier;