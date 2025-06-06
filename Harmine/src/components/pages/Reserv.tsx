import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, Clock, Truck, CreditCard, Calendar, AlertCircle, MapPin, Scale, User } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Navbar from './Navbar';
import Footer from './Footer';
import { db } from './firebaseConfig'; // Adjusted path based on context
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import ThemeToggle from './ThemeToggle';

// Types
interface DeliveryFormData {
  pickupAddress: string;
  deliveryAddress: string;
  packageType: 'small' | 'medium' | 'large';
  weight: number;
  urgency: 'standard' | 'express' | 'urgent';
  scheduledDate: Date;
  specialInstructions: string;
  insurance: boolean;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface Courier {
  id: string;
  fullName: string;
  profilePicture: string | null;
  transport: string;
  rating: number;
  deliveriesCount: number;
}

interface CourierResponse {
  data?: Courier[];
  error?: string;
  message?: string; // Added to handle potential API response variations
}

// Configuration des marqueurs Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Composant pour centrer la carte sur les marqueurs
const MapBounds = ({ markers }: { markers: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(coords => L.latLng(coords[0], coords[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);
  return null;
};

const Reserv: React.FC = () => {
  const [formData, setFormData] = useState<DeliveryFormData>({
    pickupAddress: '',
    deliveryAddress: '',
    packageType: 'small',
    weight: 2,
    urgency: 'standard',
    scheduledDate: new Date(),
    specialInstructions: '',
    insurance: false,
  });
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<Coordinates | null>(null);
  const [costEstimate, setCostEstimate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [markers, setMarkers] = useState<[number, number][]>([]);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [pricePerKg, setPricePerKg] = useState(0);
  const [distance, setDistance] = useState(0);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Log costEstimate updates
  useEffect(() => {
    console.log('costEstimate updated:', costEstimate);
  }, [costEstimate]);

  // Log submit button state
  useEffect(() => {
    console.log('Submit button state:', { isLoading, couriersLength: couriers.length });
  }, [isLoading, couriers.length]);

  // Log state changes
  useEffect(() => {
    console.log('State changed:', { formData, pickupCoords, deliveryCoords, costEstimate, distance, estimatedTime });
  }, [formData, pickupCoords, deliveryCoords, costEstimate, distance, estimatedTime]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Fetch price per kilogram from Firestore
  useEffect(() => {
    const fetchPricePerKg = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'parametres', 'general'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setPricePerKg(data.deliveryPrices?.weight || 2.5);
        } else {
          toast.error('Paramètres de prix non trouvés');
          setPricePerKg(2.5);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du prix:', error);
        toast.error('Erreur lors de la récupération des paramètres de prix');
        setPricePerKg(2.5);
      }
    };
    fetchPricePerKg();
  }, []);

  // Fetch available couriers
  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          throw new Error('Utilisateur non connecté');
        }

        const token = await user.getIdToken();
        const response = await fetch('http://localhost:5000/api/truecoursiers/available', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result: CourierResponse = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Erreur lors de la récupération des coursiers');
        }
        console.log('Couriers fetched:', result.data);
        if (result.data?.length) {
          setCouriers(result.data);
          setSelectedCourierId(result.data[0].id);
          console.log('Selected courier ID:', result.data[0].id);
        } else {
          console.warn('No couriers available');
          setCouriers([]);
        }
      } catch (error: unknown) {
        console.error('Erreur lors de la récupération des coursiers:', error);
        const errorMessage = error instanceof Error ? error.message : 'Impossible de charger les coursiers disponibles';
        toast.error(errorMessage);
      }
    };
    fetchCouriers();
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newDarkMode = !prev;
      document.documentElement.classList.toggle('dark', newDarkMode);
      localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
      return newDarkMode;
    });
  };

  // Geocode addresses using Nominatim
  const geocodeAddresses = async (): Promise<void> => {
    try {
      if (!formData.pickupAddress || !formData.deliveryAddress) {
        throw new Error('Veuillez entrer les deux adresses');
      }

      const pickupQuery = `${formData.pickupAddress}, Bénin`;
      const deliveryQuery = `${formData.deliveryAddress}, Bénin`;

      const pickupResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupQuery)}&limit=1`
      );
      const pickupData = await pickupResponse.json();
      console.log('Pickup geocoding results:', pickupData);
      if (!pickupData[0]) {
        throw new Error('Adresse de prise en charge non trouvée');
      }

      // Delay to respect Nominatim's rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));

      const deliveryResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(deliveryQuery)}&limit=1`
      );
      const deliveryData = await deliveryResponse.json();
      console.log('Delivery geocoding results:', deliveryData);
      if (!deliveryData[0]) {
        throw new Error('Adresse de livraison non trouvée');
      }

      const pickupCoords: Coordinates = {
        lat: parseFloat(pickupData[0].lat),
        lng: parseFloat(pickupData[0].lon),
      };
      const deliveryCoords: Coordinates = {
        lat: parseFloat(deliveryData[0].lat),
        lng: parseFloat(deliveryData[0].lon),
      };

      setPickupCoords(pickupCoords);
      setDeliveryCoords(deliveryCoords);
      setMarkers([[pickupCoords.lat, pickupCoords.lng], [deliveryCoords.lat, deliveryCoords.lng]]);

      const calculatedDistance = calculateDistance(pickupCoords, deliveryCoords);
      setDistance(calculatedDistance);
      calculateCost(calculatedDistance, pickupCoords, deliveryCoords);
    } catch (error: unknown) {
      console.error('Erreur lors de la géocodification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de localiser les adresses. Veuillez vérifier les adresses saisies.';
      toast.error(errorMessage);
      setPickupCoords(null);
      setDeliveryCoords(null);
      setMarkers([]);
      setDistance(0);
    }
  };

  // Debounced geocodeAddresses
  const debouncedGeocodeAddresses = debounce(geocodeAddresses, 1000);

  // Calculate distance between coordinates
  const calculateDistance = (coords1: Coordinates, coords2: Coordinates) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Update weight when package type changes
  useEffect(() => {
    const weights = {
      small: 2,
      medium: 5,
      large: 10, // Corrected typo here
    };
    setFormData(prev => ({ ...prev, weight: weights[formData.packageType] }));
  }, [formData.packageType]);

  // Calculate cost based on weight, distance, and admin-defined price
  const calculateCost = (calculatedDistance: number, pickup: Coordinates, delivery: Coordinates) => {
    console.log('Calculating cost with:', {
      pickup,       ,
      delivery,     :,
      distance, calculatedDistance,
      weight,      : formData.weight,
      urgency,     : distanceformData.urgency,,
      insurance,   : formData,,
      insurance: formData.insurance,
      distance: pricePerKg,
    });

    if (!pickup || !deliveryCoords) {
      console.warn('Invalid:', 'Coordonnées manquantes:', { pickup:, delivery: deliveryCoords } );
      toast.warning('Invalid delivery coordinates. Please verify to pour calculer le cost.');
      return;
      return;
    }

    if (formData.weight <= 0) {
      console.warn('Invalid poids:', { weight: formData.weight});
      toast.warning('Please specify a valid weight.');
      return;
    }

    const urgencyMultiplier = {
      standard: 1,
      express: 1.5,
      urgent: 2
      urgency: [formData.urgency],
      transition: {
    }[duration];

    const insuranceCost = formData.insurance ? 5 : 0;
    const weightCost := insurance formData.weight * pricePerKg;
    const distanceCost = calculatedDistance * 0.5;

    const total = (weightCost + distanceCost) * urgencyMultiplier + insuranceCost;
    console.log('Cost calculation:', { weightCost, distanceCost, urgencyMultiplier, insuranceCost, total });

    setCostEstimate(total);
    setDistance(calculatedDistance);

    const baseTime = calculatedDistance * 5;
    const urgencyTimeReduction = {
      standard: 1,
      express: 0.7,
      urgent: 0.5,
    }[formData.urgency];
    const estimatedMinutes = Math.round(baseTime * urgencyTimeReduction);
    setEstimatedTime(`${estimatedMinutes} minutes`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called with:', {
      costEstimate,
      selectedCourierId,
      pickupCoords,
      deliveryCoords,
      formData,
    });

    if (costEstimate === 0) {
      console.warn('Coût non calculé:', costEstimate);
      toast.warning('Veuillez calculer le coût avant de confirmer la réservation');
      return;
    }

    if (!selectedCourierId) {
      console.warn('Aucun coursier sélectionné:', selectedCourierId);
      toast.warning('Veuillez sélectionner un coursier');
      return;
    }

    if (!pickupCoords || !deliveryCoords) {
      console.warn('Coordonnées manquantes:', { pickupCoords, deliveryCoords });
      toast.warning('Veuillez vérifier les adresses pour obtenir des coordonnées valides');
      return;
    }

    setIsLoading(true);
    console.log('Submitting order...');
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Veuillez vous connecter pour réserver un coursier');
      }

      const token = await user.getIdToken();
      const orderData = {
        clientId: user.uid,
        pickupAddress: {
          address: formData.pickupAddress,
          lat: pickupCoords.lat,
          lng: pickupCoords.lng,
        },
        deliveryAddress: {
          address: formData.deliveryAddress,
          lat: deliveryCoords.lat,
          lng: deliveryCoords,
        },
        packageType: formData.packageType,
        weight: formData.weight,
        urgency: formData.urgency,
        scheduledDate: formData.scheduledDate.toISOString(),
        specialInstructions: formData.specialInstructions,
        insurance: formData.insurance,
        amount: costEstimate,
        status: 'PENDING',
        distance,
        estimatedTime,
        courierId: selectedCourierId,
      };

      console.log('Sending order data:', { orderData });

      const response = await fetch('http://localhost:5000/api/commandes/create', {
        method: 'POST',
        headers: {
          'Content-Type: application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      console.log('API response:', { status: response.status, result });

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création de la commande');
      }

      const orderId = result.data?.id || result.id;
      if (!orderId) {
        throw new Error('ID de commande non retourné par l\'API');
      }

      console.log('Order created with ID:', orderId);
      toast.success('Réservation confirmée avec succès !');
      navigate('/suivi', { state: { orderId } });

      // Reset form
      setFormData({
        pickupAddress: '',
        deliveryAddress: '',
        packageType: 'small',
        weight: 2,
        urgency: 'standard',
        scheduledDate: new Date(),
        specialInstructions: '',
        insurance: false,
      });
      setPickupCoords(null);
      setDeliveryCoords(null);
      setCostEstimate(0);
      setEstimatedTime('');
      setMarkers([]);
      setDistance(0);
      setSelectedCourierId(couriers?.length > 0 ? couriers[0].id : null);
    } catch (error: any) {
      console.error('Erreur lors de la réservation:', error);
      toast.error(error.message || 'Erreur lors de la réservation');
    } finally {
      setIsLoading(false);
      console.log('Submission complete, isLoading:', false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-blue-950">
      <Navbar darkMode={darkMode} />
      <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <ToastContainer position="top-right" autoClose={5000} theme={darkMode ? 'dark' : 'light'} />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 relative"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500">
            Réserver un coursier
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Service de livraison express disponible 24/7 au Bénin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Adresse de prise en charge
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300" size={20} />
                    <input
                      type="text"
                      value={formData[0].pickupAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, pickupAddress: formData.e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0"
                      placeholder="Ex: Rue 12.123,456, Cotonou, Bénin"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Entrez une adresse précise à Cotonou ou ailleurs au Bénin.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Adresse de livraison
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y/2 text-gray-500 dark:text-gray-300" size={20} />
                    <input
                      type="text"
                      value={formData[1].deliveryAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                      className="w-full pl-10 pr-3 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0"
                      placeholder="Ex: Avenue Steinmetz, Porto-Novo, Bénin"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Entrez une adresse précise à Porto-Novo ou ailleurs au Bénin.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                      Type de colis
                    </label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300" size={20} />
                      <select
                        value={formData.packageType}
                        onChange={(e) => setFormData(prev => ({ ...prev, packageType: e.target.value as DeliveryFormData['packageType'] }))}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0"
                      >
                        <option value="small">Petit (2kg)</option>
                        <option value="medium">Moyen (5kg)</option>
                        <option value="large">Grand (10kg)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                      Poids du colis (kg)
                    </label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300" size={20} />
                      <input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0"
                        placeholder="Poids en kg"
                        min="0.1"
                        step="0.1"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Urgence
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300" size={20} />
                    <select
                      value={formData.urgency}
                      onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as DeliveryFormData['urgency'] }))}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0"
                    >
                      <option value="standard">Standard</option>
                      <option value="express">Express</option>
                      <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                      Date et heure de prise en charge
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300" size={20} />
                      <DatePicker
                        selected={formData.scheduledDate}
                        onChange={(date: Date | null) => {
                          if (date) {
                            setFormData(prev => ({ ...prev, scheduledDate: date }));
                          }
                        }}
                        showTimeSelect
                        dateFormat="Pp"
                        minDate={new Date()}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                      Instructions spéciales
                    </label>
                    <textarea
                      value={formData.specialInstructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0"
                      rows={3}
                      placeholder="Instructions particulières pour le coursier..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="insurance"
                      checked={formData.insurance}
                      onChange={(e) => setFormData(prev => ({ ...prev, insurance: e.target.checked }))}
                      className="w-4 h-4 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded text-blue-500 dark:text-blue-400 focus:ring-blue-400 dark:focus:ring-blue-300"
                    />
                    <label htmlFor="insurance" className="text-sm text-gray-600 dark:text-gray-300">
                      Ajouter une assurance (+5€)
                    </label>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={debouncedGeocodeAddresses}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white p-3 rounded-lg transition flex items-center justify-center space-x-2"
                  aria-label="Calculer le coût"
                >
                  <CreditCard size={20} />
                  <span>Calculer le coût</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || couriers.length === 0}
                  className={`w-full ${
                    isLoading || couriers.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                  } text-white p-3 rounded-lg transition flex items-center justify-center space-x-2`}
                  aria-label="Réserver un coursier"
                  aria-disabled={isLoading || couriers.length === 0}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      aria-label="Chargement"
                    />
                  ) : (
                    <>
                      <Truck size={20} />
                      <span>Réserver maintenant</span>
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>

            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Carte de livraison</h2>
                <div className="h-[400px] rounded-lg overflow-hidden">
                  <MapContainer center={[6.3572, 2.4398]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      url={
                        darkMode
                          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                      }
                    />
                    {markers.map((position, index) => (
                      <Marker key={index} position={position}>
                        <Popup>{index === 0 ? 'Point de départ' : "Point d'arrivée"}</Popup>
                      </Marker>
                    ))}
                    <MapBounds markers={markers} />
                  </MapContainer>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <AlertCircle className="mr-2" size={20} />
                  Informations importantes
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <div className="flex items-start space-x-2">
                    <Info size={16} className="mt-1 flex-shrink-0" />
                    <p>Les délais de livraison peuvent varier en fonction du trafic et des conditions météorologiques.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Info size={16} className="mt-1 flex-shrink-0" />
                    <p>L'assurance couvre la perte ou les dommages jusqu'à 500€ de valeur déclarée.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Info size={16} className="mt-1 flex-shrink-0" />
                    <p>Nos coursiers sont équipés de systèmes de géolocalisation en temps réel pour un suivi précis.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Info size={16} className="mt-1 flex-shrink-0" />
                    <p>En cas d'urgence ou de modification de la livraison, contactez notre service client 24/7.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Choisir un coursier</h2>
                {couriers.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-300">
                    Aucun coursier disponible pour le moment.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {couriers.map(courier => (
                      <label
                        key={courier.id}
                        className={`flex items-center space-x-4 p-4 rounded-lg border ${
                          selectedCourierId === courier.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50'
                            : 'border-gray-200 dark:border-gray-700'
                        } cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition`}
                      >
                        <input
                          type="radio"
                          name="courier"
                          value={courier.id}
                          checked={selectedCourierId === courier.id}
                          onChange={() => setSelectedCourierId(courier.id)}
                          className="w-4 h-4 text-blue-500 focus:ring-blue-400 dark:focus:ring-blue-300"
                        />
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 flex items-center justify-center overflow-hidden">
                            {courier.profilePicture ? (
                              <img src={courier.profilePicture} alt={courier.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <User size={24} className="text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{courier.fullName}</h3>
                            <div className="flex items-center space-x-1 text-yellow-400 dark:text-yellow-300">
                              {'★'.repeat(Math.round(courier.rating))}
                              {'☆'.repeat(5 - Math.round(courier.rating))}
                              <span className="text-gray-600 dark:text-gray-300 text-sm ml-1">
                                {courier.rating}/5 ({courier.deliveriesCount} livraisons)
                              </span>
                            </div>
                            <p className="text-green-400 dark:text-green-300 text-sm">Transport: {courier.transport}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Résumé du coût</h2>
                {console.log('Rendering cost summary:', { costEstimate, distance, estimatedTime })}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Coût estimé :</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {costEstimate > 0 ? costEstimate.toFixed(2) : 'Non calculé'} €
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Distance :</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {distance > 0 ? distance.toFixed(2) : 'Non calculée'} km
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Temps estimé :</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {estimatedTime || 'Non calculé'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
        <Footer darkMode={darkMode} />
      </div>
    );
};

export default Reserv;