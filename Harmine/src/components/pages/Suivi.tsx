import { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  Cloud as CloudIcon,
  CloudRain,
  CloudLightning,
  MapPin,
  Package,
  Clock,
  User,
  MessageSquare,
  Star,
  Check,
  AlertCircle,
  Bell,
  Edit,
  MessageCircle,
  ThumbsUp,
  Share2,
  Sun,
  Moon,
  Scale,
  CalendarClock,
  Menu,
  X,
  Truck,
  ShieldCheck,
  Zap,
  ChevronDown,
  Plus,
  Minus,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLngTuple } from "leaflet";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useLocation, Link, useNavigate } from "react-router-dom";

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Custom marker icons
const deliveryIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3010/3010966.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const destinationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Interfaces
interface Address {
  address: string;
  lat: number;
  lng: number;
}

interface WeatherData {
  temperature: number;
  condition: "sunny" | "cloudy" | "rainy" | "stormy";
  impact: "none" | "low" | "medium" | "high";
}

interface RoutePoint {
  time: string;
  location: [number, number];
  status: string;
}

interface DeliveryStatus {
  status: "PENDING" | "IN_PROGRESS" | "DELIVERED" | "CANCELLED";
  estimatedTime: string;
  trackingNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCoords: Address;
  deliveryCoords: Address;
  currentLocation: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  routeHistory: RoutePoint[];
  eta: number; // minutes
  distance: number; // kilometers
  packageDetails: {
    weight: string;
    type: "small" | "medium" | "large";
    fragile: boolean;
    specialInstructions: string;
  };
  deliveryOption: "standard" | "express" | "urgent";
  weather: WeatherData;
  courier: {
    id: string;
    fullName: string;
    profilePicture: string | null;
    transport: string;
    rating: number;
    deliveriesCount: number;
  };
}

interface Feedback {
  rating: number;
  comment: string;
}

interface DeliveryTip {
  icon: React.ElementType;
  title: string;
  description: string;
}

// Map auto-centering component
const MapCenterTracker = ({
  position,
  zoom,
}: {
  position: LatLngTuple;
  zoom: number;
}) => {
  const map = useMap();

  useEffect(() => {
    map.setView(position, zoom);
  }, [position, zoom, map]);

  return null;
};

// Status badge component
const StatusBadge = ({ status }: { status: DeliveryStatus["status"] }) => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "reverse",
      },
    });
  }, [controls]);

  const statusConfig = {
    PENDING: {
      color: "bg-amber-500",
      text: "En attente",
      gradient: "from-amber-400 to-amber-600",
    },
    IN_PROGRESS: {
      color: "bg-blue-500",
      text: "En cours de livraison",
      gradient: "from-blue-400 to-blue-600",
    },
    DELIVERED: {
      color: "bg-emerald-500",
      text: "Livré",
      gradient: "from-emerald-400 to-emerald-600",
    },
    CANCELLED: {
      color: "bg-red-500",
      text: "Annulé",
      gradient: "from-red-400 to-red-600",
    },
  };

  return (
    <motion.div
      animate={{
        opacity: 1,
        y: 0,
        ...controls,
      }}
      className={`bg-gradient-to-r ${statusConfig[status].gradient} text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2`}
    >
      {status === "PENDING" && <Package className="w-4 h-4" />}
      {status === "IN_PROGRESS" && <Truck className="w-4 h-4" />}
      {status === "DELIVERED" && <Check className="w-4 h-4" />}
      {status === "CANCELLED" && <AlertCircle className="w-4 h-4" />}
      {statusConfig[status].text}
    </motion.div>
  );
};

// Delivery timeline component
const DeliveryTimeline = ({
  status,
  routeHistory = [],
}: {
  status: DeliveryStatus["status"];
  routeHistory?: RoutePoint[];
}) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const steps = [
    {
      icon: Package,
      label: "Commande reçue",
      time: "10:30",
      done: true,
      details: "Votre commande a été reçue et confirmée par notre système.",
    },
    {
      icon: Check,
      label: "Commande préparée",
      time: "10:45",
      done: status !== "PENDING",
      details: "Votre colis a été emballé et préparé pour l'expédition.",
    },
    {
      icon: Truck,
      label: "En livraison",
      time: "11:00",
      done: status === "DELIVERED",
      details: "Votre colis est en route vers votre adresse de livraison.",
    },
    {
      icon: MapPin,
      label: "Livré",
      time: "11:30",
      done: status === "DELIVERED",
      details: "Votre colis a été livré avec succès à l'adresse indiquée.",
    },
  ];

  return (
    <div className="space-y-6 mt-8">
      {steps.map((step, index) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative"
        >
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={() =>
              setExpandedStep(expandedStep === index ? null : index)
            }
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`p-3 rounded-full ${
                step.done
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                  : "bg-gray-200 dark:bg-gray-700"
              } shadow-md`}
            >
              <step.icon
                className={`w-5 h-5 ${
                  step.done ? "text-white" : "text-gray-500 dark:text-gray-400"
                }`}
              />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center">
                <p
                  className={`font-medium ${
                    step.done
                      ? "text-gray-800 dark:text-gray-100"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                <ChevronDown
                  className={`w-4 h-4 ml-2 transition-transform ${
                    expandedStep === index ? "rotate-180" : ""
                  }`}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {step.time}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {expandedStep === index && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-12 mt-2 p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg"
              >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {step.details}
                </p>

                {index === 2 && routeHistory.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Historique du trajet:
                    </p>
                    {routeHistory.slice(0, 3).map((point, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                      >
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>{point.time}</span>
                        <span>•</span>
                        <span>{point.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {index < steps.length - 1 && (
            <div
              className={`absolute left-6 ml-[2px] top-12 w-[2px] h-14 ${
                step.done
                  ? "bg-gradient-to-b from-blue-500 to-transparent"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Feedback form component
const FeedbackForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (feedback: Feedback) => void;
  onCancel: () => void;
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Veuillez sélectionner une note");
      return;
    }
    onSubmit({ rating, comment });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white/10 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl"
    >
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <ThumbsUp className="w-5 h-5" />
        Noter le coursier
      </h3>

      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setRating(star)}
            className="focus:outline-none"
            aria-label={`Noter ${star} étoile${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`w-7 h-7 ${
                star <= rating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            />
          </motion.button>
        ))}
      </div>

      <textarea
        className="w-full p-4 rounded-xl bg-white/10 dark:bg-gray-700/50 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
        placeholder="Votre commentaire (facultatif)..."
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <div className="flex gap-4 mt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
        >
          Envoyer
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-3 rounded-xl transition-all"
        >
          Annuler
        </motion.button>
      </div>
    </motion.div>
  );
};

// Live ETA card
const LiveETA = ({ eta, distance }: { eta: number; distance: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/50"
    >
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
        <CalendarClock className="w-4 h-4" />
        Estimation en temps réel
      </h3>

      <div className="flex justify-between">
        <div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {eta} min
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Temps d'arrivée estimé
          </div>
        </div>

        <div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {distance.toFixed(1)} km
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Distance
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Package details component
const PackageDetails = ({
  packageDetails,
}: {
  packageDetails: DeliveryStatus["packageDetails"];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/50"
    >
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <Package className="w-4 h-4" />
          Détails du colis
        </h3>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-3 overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Poids:
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {packageDetails.weight}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Type:
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {packageDetails.type}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Fragile:
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {packageDetails.fragile ? "Oui" : "Non"}
              </span>
            </div>

            {packageDetails.specialInstructions && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                  Instructions spéciales:
                </span>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {packageDetails.specialInstructions}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Weather impact component
const WeatherImpact = ({ weather }: { weather: WeatherData }) => {
  const getWeatherIcon = () => {
    switch (weather.condition) {
      case "sunny":
        return <Sun className="w-6 h-6 text-yellow-400" />;
      case "cloudy":
        return <CloudIcon className="w-6 h-6 text-gray-400" />;
      case "rainy":
        return <CloudRain className="w-6 h-6 text-blue-400" />;
      case "stormy":
        return <CloudLightning className="w-6 h-6 text-purple-400" />;
    }
  };

  const getImpactColor = () => {
    switch (weather.impact) {
      case "none":
        return "text-green-500";
      case "low":
        return "text-yellow-500";
      case "medium":
        return "text-orange-500";
      case "high":
        return "text-red-500";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/50"
    >
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
        <CloudIcon className="w-4 h-4" />
        Conditions météo
      </h3>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getWeatherIcon()}
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {weather.temperature}°C
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {weather.condition}
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Impact sur la livraison:
          </div>
          <div className={`text-sm font-medium ${getImpactColor()} capitalize`}>
            {weather.impact === "none" ? "Aucun" : weather.impact}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Delivery option badge
const DeliveryOptionBadge = ({
  option,
}: {
  option: DeliveryStatus["deliveryOption"];
}) => {
  const optionConfig = {
    standard: {
      icon: Truck,
      text: "Standard",
      color: "bg-blue-500",
      gradient: "from-blue-500 to-blue-600",
    },
    express: {
      icon: Zap,
      text: "Express",
      color: "bg-amber-500",
      gradient: "from-amber-500 to-amber-600",
    },
    urgent: {
      icon: Zap,
      text: "Urgent",
      color: "bg-red-500",
      gradient: "from-red-500 to-red-600",
    },
  };

  const Icon = optionConfig[option].icon;

  return (
    <div
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${optionConfig[option].gradient}`}
    >
      <Icon className="w-3 h-3" />
      {optionConfig[option].text}
    </div>
  );
};

// Cloud component
const Cloud = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.8 }}
      className={`absolute rounded-full bg-white dark:bg-gray-600/20 blur-3xl ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Mobile menu component
interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onEnableNotifications: () => void;
  onShareTracking: () => void;
  onContactSupport: () => void;
}

const MobileMenu = ({
  isOpen,
  onClose,
  onEnableNotifications,
  onShareTracking,
  onContactSupport,
}: MobileMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 shadow-xl z-50 p-6"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Menu
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            <div className="space-y-6">
              <button
                onClick={onEnableNotifications}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-full">
                  <Bell className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-gray-800 dark:text-gray-200">
                  Activer les notifications
                </span>
              </button>
              <button
                onClick={onShareTracking}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-full">
                  <Share2 className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-gray-800 dark:text-gray-200">
                  Partager le suivi
                </span>
              </button>
              <button
                onClick={onContactSupport}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-full">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-gray-800 dark:text-gray-200">
                  Contacter le support
                </span>
              </button>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Besoin d'aide ?
                </div>
                <button className="bg-blue-500 hover:bg-blue-600 text-white w-full py-3 rounded-xl font-medium">
                  Centre d'aide
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Delivery tips component
const DeliveryTips = () => {
  const tips: DeliveryTip[] = [
    {
      icon: Bell,
      title: "Activez les notifications",
      description: "Restez informé à chaque étape de votre livraison",
    },
    {
      icon: MapPin,
      title: "Précisez vos instructions",
      description: "Ajoutez des détails pour aider le livreur à vous trouver",
    },
    {
      icon: ShieldCheck,
      title: "Livraison sécurisée",
      description: "Votre colis est assuré pendant toute la livraison",
    },
  ];

  return (
    <div className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-5 border border-white/20 dark:border-gray-700/50">
      <h3 className="text-base font-medium text-gray-800 dark:text-white mb-4">
        Conseils et astuces
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tips.map((tip, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg bg-white/30 dark:bg-gray-700/30 border border-white/30 dark:border-gray-600/30"
          >
            <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-full w-fit mb-3">
              <tip.icon className="w-5 h-5 text-blue-500" />
            </div>
            <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-1">
              {tip.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tip.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Delivery analytics component
const DeliveryAnalytics = () => {
  const deliveryData = [
    { time: "10:00", eta: 35 },
    { time: "10:15", eta: 32 },
    { time: "10:30", eta: 28 },
    { time: "10:45", eta: 25 },
    { time: "11:00", eta: 22 },
    { time: "11:15", eta: 18 },
    { time: "11:30", eta: 15 },
    { time: "11:45", eta: 12 },
  ];

  return (
    <div className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl p-5 border border-white/20 dark:border-gray-700/50">
      <h3 className="text-base font-medium text-gray-800 dark:text-white mb-4">
        Évolution du temps estimé
      </h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={deliveryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ color: "#374151", fontWeight: 600 }}
              itemStyle={{ color: "#3b82f6" }}
              formatter={(value: number) => [`${value} min`, "Temps estimé"]}
            />
            <Line
              type="monotone"
              dataKey="eta"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{
                r: 6,
                fill: "#3b82f6",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Main component
const Suivi = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);
  const [viewMode, setViewMode] = useState<"map" | "analytics">("map");
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus | null>(
    null
  );
  const [route, setRoute] = useState<LatLngTuple[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Gérer l'orderId depuis location.state
  useEffect(() => {
    const { orderId: newOrderId } = location.state || {};
    if (newOrderId) {
      setOrderId(newOrderId);
    }
  }, [location.state]);

  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userId");
        if (!token || !userId) {
          throw new Error("Utilisateur non connecté");
        }

        // Utiliser l'orderId si disponible, sinon récupérer la dernière commande
        let order;
        if (orderId) {
          const response = await fetch(`https://debutant.onrender.com/api/commandes/${orderId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(
              result.error || "Erreur lors de la récupération de la commande"
            );
          }
          order = result.data;
        } else {
          const response = await fetch(`https://debutant.onrender.com/api/commandes/user`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(
              result.error || "Erreur lors de la récupération de la commande"
            );
          }
          if (!result.data || result.data.length === 0) {
            throw new Error("Aucune commande trouvée");
          }
          order = result.data[0];
          setOrderId(order.id);
        }

        // Vérifier la structure des adresses
        if (!order.pickupAddress?.address || !order.deliveryAddress?.address) {
          throw new Error("Adresses de commande invalides");
        }

        // Récupérer les informations du coursier
        const courierResponse = await fetch(
          `https://debutant.onrender.com/api/truecoursiers/${order.courierId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const courierResult = await courierResponse.json();
        if (!courierResponse.ok) {
          throw new Error(
            courierResult.error || "Erreur lors de la récupération du coursier"
          );
        }

        // Utiliser les coordonnées directement depuis les données de la commande
        const pickupCoords: Address = {
          address: order.pickupAddress.address,
          lat: parseFloat(order.pickupAddress.lat),
          lng: parseFloat(order.pickupAddress.lng),
        };
        const deliveryCoords: Address = {
          address: order.deliveryAddress.address,
          lat: parseFloat(order.deliveryAddress.lat),
          lng: parseFloat(order.deliveryAddress.lng),
        };

        setRoute([
          [pickupCoords.lat, pickupCoords.lng],
          [deliveryCoords.lat, deliveryCoords.lng],
        ]);

        // Formater les données
        const etaMinutes = parseInt(order.estimatedTime) || 15;
        setDeliveryStatus({
          status: order.status,
          estimatedTime: new Date(order.scheduledDate).toLocaleTimeString(
            "fr-FR",
            { hour: "2-digit", minute: "2-digit" }
          ),
          trackingNumber: order.id.slice(0, 8).toUpperCase(),
          pickupAddress: order.pickupAddress.address,
          deliveryAddress: order.deliveryAddress.address,
          pickupCoords,
          deliveryCoords,
          currentLocation: { lat: pickupCoords.lat, lng: pickupCoords.lng },
          destination: { lat: deliveryCoords.lat, lng: deliveryCoords.lng },
          routeHistory: [
            {
              time: new Date(order.createdAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              location: [pickupCoords.lat, pickupCoords.lng] as [number, number],
              status: "En route",
            },
          ],
          eta: etaMinutes,
          distance: order.distance,
          packageDetails: {
            weight: `${order.weight} kg`,
            type: order.packageType,
            fragile: order.insurance,
            specialInstructions: order.specialInstructions || "",
          },
          deliveryOption: order.urgency,
          weather: {
            temperature: 22,
            condition: "sunny",
            impact: "none",
          },
          courier: {
            id: courierResult.data.id,
            fullName: courierResult.data.fullName,
            profilePicture:
              courierResult.data.profilePicture?.secure_url || null,
            transport: courierResult.data.transport,
            rating: courierResult.data.rating || 4.8,
            deliveriesCount: courierResult.data.deliveriesCount || 0,
          },
        });
      } catch (error: any) {
        console.error("Erreur lors de la récupération des données:", error);
        toast.error(
          error.message || "Impossible de charger les données de la commande"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrderData();
  }, [orderId]);

  // Simulate real-time status updates
  useEffect(() => {
    if (!deliveryStatus || deliveryStatus.status !== "IN_PROGRESS") return;

    const interval = setInterval(() => {
      const newLat =
        deliveryStatus.currentLocation.lat +
        (deliveryStatus.destination.lat - deliveryStatus.currentLocation.lat) *
          0.05;
      const newLng =
        deliveryStatus.currentLocation.lng +
        (deliveryStatus.destination.lng - deliveryStatus.currentLocation.lng) *
          0.05;

      setDeliveryStatus((prev: DeliveryStatus | null) => {
        if (!prev) return null;
        return {
          ...prev,
          currentLocation: {
            lat: newLat,
            lng: newLng,
          },
          eta: Math.max(prev.eta - 1, 1),
          distance: Math.max(prev.distance - 0.1, 0.1),
          routeHistory: [
            ...prev.routeHistory,
            {
              time: new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              location: [newLat, newLng] as [number, number],
              status: "En progression",
            },
          ].slice(-10),
        };
      });

      setRoute([
        [newLat, newLng],
        [deliveryStatus.destination.lat, deliveryStatus.destination.lng],
      ]);

      if (Math.random() > 0.7) {
        toast.info("Mise à jour: Le coursier avance vers votre adresse!", {
          position: "bottom-right",
          icon: <Truck className="w-5 h-5 text-blue-500" />,
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [deliveryStatus]);

  const handleEnableNotifications = () => {
    setIsNotificationsEnabled(true);
    toast.success("Notifications activées avec succès!", {
      position: "bottom-right",
      icon: <Bell className="w-5 h-5" />,
    });
  };

  const handleShareTracking = () => {
    const trackingUrl = `${window.location.origin}/track/${
      deliveryStatus?.trackingNumber || ""
    }`;
    navigator.clipboard.writeText(trackingUrl);
    toast.success("Lien de suivi copié dans le presse-papiers!", {
      position: "bottom-right",
      icon: <Share2 className="w-5 h-5" />,
    });
  };

  const handleContactSupport = () => {
    toast.info("Ouverture de la messagerie du support...", {
      position: "bottom-right",
      icon: <MessageSquare className="w-5 h-5" />,
    });
  };

  const handleFeedbackSubmit = async (feedback: Feedback) => {
    if (!deliveryStatus || !orderId) {
      navigate("/reserv");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Utilisateur non connecté");
      }

      const response = await fetch(`https://debutant.onrender.com/api/feedback/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          courierId: deliveryStatus.courier.id,
          rating: feedback.rating,
          comment: feedback.comment,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || "Erreur lors de la soumission de l'avis"
        );
      }

      toast.success("Merci pour votre avis !", {
        position: "bottom-right",
        autoClose: 5000,
        icon: <Star className="w-5 h-5 text-yellow-500" />,
      });
      setShowFeedbackForm(false);
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du feedback:", error);
      toast.error(error.message || "Erreur lors de l'envoi de l'avis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModifyAddress = () => {
    toast.info("Redirection vers le formulaire de modification d'adresse...", {
      position: "bottom-right",
      icon: <Edit className="w-4 h-4" />,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!deliveryStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
        <div className="text-center text-gray-700 dark:text-gray-300">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p>
            Aucune commande trouvée. Veuillez vérifier votre numéro de suivi.
          </p>
          <Link
            to="/reserv"
            className="
    bg-blue-600 
    hover:bg-blue-700
    text-white            
    font-bold             
    py-3                  
    px-6                  
    rounded-full          
    shadow-lg             
    hover:shadow-xl       
    transition-all        
    duration-300          
    ease-in-out           
    transform             
    hover:scale-105       
    focus:outline-none    
    focus:ring-2          
    focus:ring-blue-500   
    focus:ring-opacity-50 
    inline-block          
    text-center           
  "
          >
            Passez une commande
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-300 relative overflow-hidden">
      <Cloud className="w-96 h-96 -top-48 -left-20 opacity-20" />
      <Cloud className="w-96 h-96 top-1/3 -right-20 opacity-20" />
      <Cloud className="w-64 h-64 bottom-20 left-20 opacity-20" />

      <Navbar />
      <ThemeToggle
        darkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        theme={isDarkMode ? "dark" : "light"}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onEnableNotifications={handleEnableNotifications}
        onShareTracking={handleShareTracking}
        onContactSupport={handleContactSupport}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6 md:p-8 pb-16"
      >
        <div className="flex justify-between items-center">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-full bg-white/10 dark:bg-gray-800/50 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() =>
                setViewMode(viewMode === "map" ? "analytics" : "map")
              }
              className="p-2 rounded-full bg-white/10 dark:bg-gray-800/50 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Basculer entre carte et analytiques"
            >
              {viewMode === "map" ? (
                <Scale className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <MapPin className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-white/10 dark:bg-gray-800/50 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-colors"
              aria-label={
                isDarkMode ? "Passer au mode clair" : "Passer au mode sombre"
              }
            >
              {isDarkMode ? (
                <Sun className="w-6 h-6 text-yellow-400" />
              ) : (
                <Moon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </motion.button>
          </div>
        </div>

        <div className="text-center relative">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
          >
            Suivi de Livraison
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 dark:bg-gray-800/30 rounded-full backdrop-blur-sm border border-gray-100/30 dark:border-gray-700/30"
          >
            <Package className="w-4 h-4 text-blue-500" />
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              N° de suivi:{" "}
              <span className="font-semibold">
                {deliveryStatus.trackingNumber}
              </span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 flex items-center justify-center gap-2"
          >
            <DeliveryOptionBadge option={deliveryStatus.deliveryOption} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/30 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-5"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <StatusBadge status={deliveryStatus.status} />

            <div className="hidden md:flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEnableNotifications}
                disabled={isNotificationsEnabled}
                className={`p-2 rounded-full ${
                  isNotificationsEnabled
                    ? "bg-green-500/20"
                    : "bg-white/10 dark:bg-gray-700/50 hover:bg-white/20 dark:hover:bg-gray-600/50"
                } transition-colors`}
                aria-label="Activer les notifications"
              >
                <Bell
                  className={`w-5 h-5 ${
                    isNotificationsEnabled
                      ? "text-green-400"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShareTracking}
                className="p-2 rounded-full bg-white/10 dark:bg-gray-700/50 hover:bg-white/20 dark:hover:bg-gray-600/50 transition-colors"
                aria-label="Partager le suivi"
              >
                <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleContactSupport}
                className="p-2 rounded-full bg-white/10 dark:bg-gray-700/50 hover:bg-white/20 dark:hover:bg-gray-600/50 transition-colors"
                aria-label="Contacter le support"
              >
                <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 bg-white/30 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl p-5 border border-white/20 dark:border-gray-700/50"
          >
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Adresse de livraison
            </h3>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {deliveryStatus.deliveryAddress}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleModifyAddress}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 mt-2"
            >
              <Edit className="w-4 h-4" /> Modifier l'adresse
            </motion.button>
          </motion.div>

          <LiveETA
            eta={deliveryStatus.eta}
            distance={deliveryStatus.distance}
          />
        </div>

        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/30 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-5 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-medium text-gray-800 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  Suivi en temps réel
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMapZoom(Math.min(mapZoom + 1, 18))}
                    className="p-1.5 bg-white/50 dark:bg-gray-700/50 rounded-md text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMapZoom(Math.max(mapZoom - 1, 10))}
                    className="p-1.5 bg-white/50 dark:bg-gray-700/50 rounded-md text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-white/10 dark:bg-gray-900/50 rounded-xl overflow-hidden shadow-inner">
                <MapContainer
                  center={
                    [
                      deliveryStatus.currentLocation.lat,
                      deliveryStatus.currentLocation.lng,
                    ] as LatLngTuple
                  }
                  zoom={mapZoom}
                  style={{
                    height: "400px",
                    width: "100%",
                    borderRadius: "0.75rem",
                  }}
                  className="z-0"
                  zoomControl={false}
                >
                  <TileLayer
                    url={
                      isDarkMode
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    }
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker
                    position={
                      [
                        deliveryStatus.currentLocation.lat,
                        deliveryStatus.currentLocation.lng,
                      ] as LatLngTuple
                    }
                    icon={deliveryIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold">Position du livreur</p>
                        <p className="text-xs text-gray-600">
                          Arrivée prévue dans {deliveryStatus.eta} min
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                  <Marker
                    position={
                      [
                        deliveryStatus.destination.lat,
                        deliveryStatus.destination.lng,
                      ] as LatLngTuple
                    }
                    icon={destinationIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold">Votre adresse</p>
                        <p className="text-xs text-gray-600">
                          {deliveryStatus.deliveryAddress}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                  <Polyline
                    positions={route}
                    pathOptions={{
                      color: isDarkMode ? "#60A5FA" : "#3B82F6",
                      weight: 4,
                      dashArray: "8, 8",
                    }}
                  />
                  <MapCenterTracker
                    position={
                      [
                        deliveryStatus.currentLocation.lat,
                        deliveryStatus.currentLocation.lng,
                      ] as LatLngTuple
                    }
                    zoom={mapZoom}
                  />
                </MapContainer>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <DeliveryAnalytics />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PackageDetails packageDetails={deliveryStatus.packageDetails} />
          <WeatherImpact weather={deliveryStatus.weather} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/30 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-5"
        >
          <h3 className="text-base font-medium text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Progression de la livraison
          </h3>
          <DeliveryTimeline
            status={deliveryStatus.status}
            routeHistory={deliveryStatus.routeHistory}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/30 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-5"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              {deliveryStatus.courier.profilePicture ? (
                <img
                  src={deliveryStatus.courier.profilePicture}
                  alt={deliveryStatus.courier.fullName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-blue-500 shadow-md"
                >
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
                {deliveryStatus.courier.fullName}
              </h3>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-gray-600 dark:text-gray-300">
                  {deliveryStatus.courier.rating.toFixed(1)} (
                  {deliveryStatus.courier.deliveriesCount} livraisons)
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                En ligne - Transport: {deliveryStatus.courier.transport}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
              aria-label="Contacter le coursier"
            >
              <MessageCircle className="w-4 h-4" />
              Contacter
            </motion.button>
          </div>
        </motion.div>

        <DeliveryTips />

        <AnimatePresence>
          {showFeedbackForm && deliveryStatus.status === "DELIVERED" && (
            <FeedbackForm
              onSubmit={handleFeedbackSubmit}
              onCancel={() => setShowFeedbackForm(false)}
            />
          )}
        </AnimatePresence>

        {deliveryStatus.status === "DELIVERED" && !showFeedbackForm && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFeedbackForm(true)}
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            aria-label="Donner un avis"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <ThumbsUp className="w-5 h-5" />
                Noter le coursier
              </>
            )}
          </motion.button>
        )}
      </motion.div>
      <Footer />
    </div>
  );
};

export default Suivi;