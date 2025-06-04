import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import CookieConsentBanner from "../cookies/CookieConsentBanner";
import {
  Home,
  Package,
  MapPin,
  User,
  HelpCircle,
  Star,
  MessageCircle,
  Settings,
  X,
  ChevronUp,
  ChevronDown,
  Bell,
  BarChart,
  Plus,
  Clock,
  Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { requestNotificationPermission, onMessageListener } from "../../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { SwipeableList, SwipeableListItem, TrailingActions, SwipeAction } from "react-swipeable-list";
import "react-swipeable-list/dist/styles.css";

// Interfaces TypeScript
interface Address {
  address: string;
  lat: number;
  lng: number;
}

interface QuickOrder {
  pickupAddress: Address;
  deliveryAddress: Address;
  weight: string;
  urgency: "standard" | "express" | "urgent";
}

interface UserPreferences {
  name: string;
  email: string;
  address: string;
  primaryColor: string;
  dashboardLayout: string[];
}

interface Order {
  id: string;
  status: string;
  createdAt: string;
  amount?: number;
  courierId?: string;
  estimatedTime?: string;
  pickupAddress: Address;
  deliveryAddress: Address;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface Stats {
  ordersThisMonth: number;
  totalSpent: string;
}

interface Interaction {
  message: string;
  createdAt: string;
  type: string;
}

interface Courier {
  id: string;
  fullName: string;
  transport: string;
}

interface FirebaseMessage {
  messageId: string;
  notification: {
    title: string;
    body: string;
  };
}

// Lazy-load Map components
const MapContainer = React.lazy(() => import("react-leaflet").then((module) => ({ default: module.MapContainer })));
const TileLayer = React.lazy(() => import("react-leaflet").then((module) => ({ default: module.TileLayer })));
const Marker = React.lazy(() => import("react-leaflet").then((module) => ({ default: module.Marker })));
const Popup = React.lazy(() => import("react-leaflet").then((module) => ({ default: module.Popup })));

// Fix pour les icônes Leaflet
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const Client: React.FC = () => {
  const [activeSection, setActiveSection] = useState<"dashboard" | "support">("dashboard");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showCookieBanner, setShowCookieBanner] = useState<boolean>(
    !localStorage.getItem("cookieConsent")
  );
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    name: "",
    email: "",
    address: "",
    primaryColor: "#3B82F6",
    dashboardLayout: ["orders", "tracking", "profile", "stats", "quickOrder"],
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [quickOrder, setQuickOrder] = useState<QuickOrder>({
    pickupAddress: { address: "", lat: 0, lng: 0 },
    deliveryAddress: { address: "", lat: 0, lng: 0 },
    weight: "",
    urgency: "standard",
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState<Stats>({ ordersThisMonth: 0, totalSpent: "0" });
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const auth = getAuth();
  const colorOptions = ["#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

  // Protéger la route
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Gérer le thème
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    document.documentElement.style.setProperty("--primary-color", userPreferences.primaryColor);
  }, [isDarkMode, userPreferences.primaryColor]);

  const getIdToken = useCallback(async (): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non authentifié");
      return await user.getIdToken();
    } catch (error) {
      console.error("Erreur lors de la récupération du token:", error);
      throw error;
    }
  }, [auth]);

  const validateUserData = (data: any): UserPreferences => ({
    name:
      data.displayName ||
      (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : "Utilisateur"),
    email: typeof data.email === "string" ? data.email : "",
    address: typeof data.address === "string" ? data.address : "",
    primaryColor:
      typeof data.primaryColor === "string" && /^#[0-9A-F]{6}$/i.test(data.primaryColor)
        ? data.primaryColor
        : "#3B82F6",
    dashboardLayout:
      Array.isArray(data.dashboardLayout) &&
      data.dashboardLayout.every((item: any) => typeof item === "string")
        ? data.dashboardLayout
        : ["orders", "tracking", "profile", "stats", "quickOrder"],
  });

  // Staggered API calls with retry
  const fetchWithRetry = async (url: string, options: RequestInit, retries: number = 2): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return response;
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  };

  const fetchUserData = async (token: string) => {
    const response = await fetchWithRetry("http://localhost:5000/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = await response.json();
    setUserPreferences(validateUserData(userData.data));
  };

  const fetchOrders = async (token: string) => {
    const response = await fetchWithRetry("http://localhost:5000/api/commandes/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ordersData = await response.json();
    setOrders(ordersData.data);
    const activeOrder = ordersData.data.find(
      (order: Order) => order.status === "PENDING" || order.status === "IN_PROGRESS"
    );
    setTrackingOrder(activeOrder || null);
  };

  const fetchNotifications = async (token: string) => {
    const response = await fetchWithRetry("http://localhost:5000/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const notificationsData = await response.json();
    setNotifications(notificationsData.data);
    notificationsData.data.forEach((notif: Notification) => {
      if (!notif.read) toast.success(notif.message);
    });
  };

  const fetchInteractions = async (token: string) => {
    const response = await fetchWithRetry("http://localhost:5000/api/interactions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const interactionsData = await response.json();
    setInteractions(interactionsData.data);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      await fetchUserData(token);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await fetchOrders(token);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await fetchNotifications(token);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await fetchInteractions(token);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Notifications push
  useEffect(() => {
    const initNotifications = async () => {
      try {
        const token = await getIdToken();
        if (Notification.permission === "denied") {
          toast.error(
            "Les notifications sont bloquées. Veuillez autoriser les notifications dans les paramètres du navigateur."
          );
          return;
        }
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) {
          const response = await fetch("http://localhost:5000/api/notifications/register", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fcmToken }),
          });
          if (!response.ok) throw new Error("Erreur lors de l'enregistrement du token FCM");
        }
        onMessageListener()
          .then((payload: FirebaseMessage) => {
            toast.success(payload.notification.body);
            setNotifications((prev) => [
              {
                id: payload.messageId,
                message: payload.notification.body,
                title: payload.notification.title,
                createdAt: new Date().toISOString(),
                read: false,
              },
              ...prev,
            ]);
          })
          .catch((error) => console.error("Erreur lors de l'écoute des messages:", error));
      } catch (error) {
        console.error("Erreur lors de l'initialisation des notifications:", error);
        toast.error("Erreur lors de l'initialisation des notifications");
      }
    };
    initNotifications();
  }, [getIdToken]);

  const calculatedStats = useMemo(() => {
    const thisMonth = new Date().getMonth();
    const ordersThisMonth = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === new Date().getFullYear();
    });
    const totalSpent = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    return {
      ordersThisMonth: ordersThisMonth.length,
      totalSpent: totalSpent.toFixed(2),
    };
  }, [orders]);

  useEffect(() => {
    setStats(calculatedStats);
  }, [calculatedStats]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const updatePrimaryColor = async (color: string) => {
    try {
      const token = await getIdToken();
      setUserPreferences((prev) => ({ ...prev, primaryColor: color }));
      document.documentElement.style.setProperty("--primary-color", color);
      const response = await fetch("http://localhost:5000/api/users/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ primaryColor: color }),
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour de la couleur");
      toast.success("Couleur mise à jour");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la couleur:", error);
      toast.error("Erreur lors de la mise à jour de la couleur");
    }
  };

  const reorderDashboardWidgets = async (newOrder: string[]) => {
    try {
      const token = await getIdToken();
      setUserPreferences((prev) => ({ ...prev, dashboardLayout: newOrder }));
      const response = await fetch("http://localhost:5000/api/users/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dashboardLayout: newOrder }),
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour de la disposition");
      toast.success("Disposition mise à jour");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la disposition:", error);
      toast.error("Erreur lors de la mise à jour de la disposition");
    }
  };

  const fetchAvailableCouriers = async (token: string): Promise<Courier[]> => {
    try {
      const response = await fetchWithRetry("http://localhost:5000/api/truecoursiers/available", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const couriersData = await response.json();
      return couriersData.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des coursiers:", error);
      throw error;
    }
  };

  const handleQuickOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !quickOrder.pickupAddress.address ||
      !quickOrder.deliveryAddress.address ||
      !quickOrder.weight
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (parseFloat(quickOrder.weight) <= 0) {
      toast.error("Le poids doit être supérieur à 0");
      return;
    }
    try {
      const token = await getIdToken();
      const couriers = await fetchAvailableCouriers(token);
      if (couriers.length === 0) {
        toast.error("Aucun coursier disponible");
        return;
      }
      const courierId = couriers[0].id;

      const pickupLat = 48.8566; // Placeholder
      const pickupLng = 2.3522;
      const deliveryLat = 48.8606;
      const deliveryLng = 2.3622;

      const distance = Math.sqrt(
        Math.pow(deliveryLat - pickupLat, 2) + Math.pow(deliveryLng - pickupLng, 2)
      ) * 111;

      const basePrice = 5;
      const pricePerKm = 1;
      const weightPrice = parseFloat(quickOrder.weight) * 0.5;
      const urgencyMultiplier = { standard: 1, express: 1.5, urgent: 2 }[quickOrder.urgency];
      const amount = (basePrice + distance * pricePerKm + weightPrice) * urgencyMultiplier;

      const estimatedTime = `${Math.round(distance * 2)} minutes`;

      const response = await fetch("http://localhost:5000/api/commandes/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: auth.currentUser?.uid,
          pickupAddress: {
            address: quickOrder.pickupAddress.address,
            lat: pickupLat,
            lng: pickupLng,
          },
          deliveryAddress: {
            address: quickOrder.deliveryAddress.address,
            lat: deliveryLat,
            lng: deliveryLng,
          },
          packageType: "small",
          weight: parseFloat(quickOrder.weight),
          urgency: quickOrder.urgency,
          scheduledDate: new Date().toISOString(),
          specialInstructions: "",
          insurance: false,
          amount,
          status: "PENDING",
          distance,
          estimatedTime,
          courierId,
        }),
      });
      if (!response.ok) throw new Error("Erreur lors de la création de la commande");
      toast.success("Commande créée avec succès");
      setQuickOrder({
        pickupAddress: { address: "", lat: 0, lng: 0 },
        deliveryAddress: { address: "", lat: 0, lng: 0 },
        weight: "",
        urgency: "standard",
      });
      fetchOrders(token);
    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error);
      toast.error("Erreur lors de la création de la commande");
    }
  };

  const handleFeedbackSubmit = async (orderId: string, rating: number, comment: string) => {
    try {
      const token = await getIdToken();
      const response = await fetch("http://localhost:5000/api/feedback/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          courierId: orders.find((order) => order.id === orderId)?.courierId || "",
          rating,
          comment,
        }),
      });
      if (!response.ok) throw new Error("Erreur lors de la soumission de l'avis");
      toast.success("Avis envoyé !");
    } catch (error) {
      console.error("Erreur lors de la soumission de l'avis:", error);
      toast.error("Erreur lors de la soumission de l'avis");
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      const token = await getIdToken();
      const response = await fetch("http://localhost:5000/api/notifications/mark-read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      if (!response.ok) throw new Error("Erreur lors du marquage de la notification");
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif))
      );
      toast.success("Notification marquée comme lue");
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error);
      toast.error("Erreur lors du marquage de la notification");
    }
  };

  const markNotificationsRead = async () => {
    try {
      const token = await getIdToken();
      const unreadNotifications = notifications.filter((notif) => !notif.read).map((notif) => notif.id);
      if (unreadNotifications.length === 0) return;
      const response = await fetch("http://localhost:5000/api/notifications/mark-read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds: unreadNotifications }),
      });
      if (!response.ok) throw new Error("Erreur lors du marquage des notifications");
      setNotifications((prev) =>
        prev.map((notif) => (unreadNotifications.includes(notif.id) ? { ...notif, read: true } : notif))
      );
      toast.success("Notifications marquées comme lues");
    } catch (error) {
      console.error("Erreur lors du marquage des notifications:", error);
      toast.error("Erreur lors du marquage des notifications");
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      const token = await getIdToken();
      const response = await fetch("http://localhost:5000/api/notifications/mark-read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression de la notification");
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      toast.success("Notification supprimée");
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification:", error);
      toast.error("Erreur lors de la suppression de la notification");
    }
  };

  const clearAllNotifications = async () => {
    try {
      const token = await getIdToken();
      const response = await fetch("http://localhost:5000/api/notifications/mark-read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds: notifications.map((notif) => notif.id) }),
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression des notifications");
      setNotifications([]);
      toast.success("Toutes les notifications ont été supprimées");
    } catch (error) {
      console.error("Erreur lors de la suppression des notifications:", error);
      toast.error("Erreur lors de la suppression des notifications");
    }
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    if (!name || !email || !message) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      const token = await getIdToken();
      const response = await fetch("http://localhost:5000/api/contact/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
          userId: auth.currentUser?.uid,
        }),
      });
      if (!response.ok) throw new Error("Erreur lors de l'envoi du message");
      toast.success("Message envoyé avec succès");
      e.currentTarget.reset();
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast.error("Erreur lors de l'envoi du message");
    }
  };

  const handleCookieAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setShowCookieBanner(false);
  };

  const handleCookieLearnMore = () => {
    window.open("https://example.com/privacy-policy", "_blank");
  };

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  const modalVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { y: "100%", opacity: 0 },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const renderPersonalizationModal = () => (
    <AnimatePresence>
      {isPersonalizationOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setIsPersonalizationOpen(false)}
            role="button"
            aria-label="Fermer la modale de personnalisation"
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto z-50"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Personnalisation
              </h2>
              <button
                onClick={() => setIsPersonalizationOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Fermer la modale"
              >
                <X className="w-5 h-5 text-gray-900 dark:text-gray-100" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">Thème</h3>
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 p-3 rounded-xl w-full"
                  aria-label={isDarkMode ? "Passer au mode clair" : "Passer au mode sombre"}
                >
                  <div className="w-10 h-6 bg-gray-400 dark:bg-gray-600 rounded-full p-1 flex">
                    <div
                      className="w-4 h-4 bg-white rounded-full"
                      style={{ marginLeft: isDarkMode ? "auto" : 0 }}
                    />
                  </div>
                  <span className="text-gray-900 dark:text-gray-100">
                    {isDarkMode ? "Mode Clair" : "Mode Sombre"}
                  </span>
                </button>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">Couleur Principale</h3>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => updatePrimaryColor(color)}
                      style={{ backgroundColor: color }}
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      aria-label={`Sélectionner la couleur ${color}`}
                    >
                      {userPreferences.primaryColor === color && (
                        <div className="w-4 h-4 bg-white rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">
                  Disposition du Tableau de Bord
                </h3>
                <div className="space-y-2">
                  {userPreferences.dashboardLayout.map((widget, index) => (
                    <div
                      key={widget}
                      className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center"
                    >
                      <span className="capitalize text-gray-900 dark:text-gray-100">{widget}</span>
                      <div className="flex space-x-1">
                        {index > 0 && (
                          <button
                            onClick={() => {
                              const newOrder = [...userPreferences.dashboardLayout];
                              [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                              reorderDashboardWidgets(newOrder);
                            }}
                            className="p-1 hover:bg-gray-300 dark:hover:bg-gray-500 rounded"
                            aria-label={`Déplacer ${widget} vers le haut`}
                          >
                            <ChevronUp className="w-4 h-4 text-gray-900 dark:text-gray-100" />
                          </button>
                        )}
                        {index < userPreferences.dashboardLayout.length - 1 && (
                          <button
                            onClick={() => {
                              const newOrder = [...userPreferences.dashboardLayout];
                              [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                              reorderDashboardWidgets(newOrder);
                            }}
                            className="p-1 hover:bg-gray-300 dark:hover:bg-gray-500 rounded"
                            aria-label={`Déplacer ${widget} vers le bas`}
                          >
                            <ChevronDown className="w-4 h-4 text-gray-900 dark:text-gray-100" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const renderMenu = () => (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          className="fixed top-0 right-0 w-64 h-full bg-gray-100 dark:bg-gray-900 z-50 p-4"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5 text-gray-900 dark:text-gray-100" />
          </button>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => {
                setIsPersonalizationOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full text-left p-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center"
              aria-label="Ouvrir les paramètres de personnalisation"
            >
              <Settings className="w-5 h-5 mr-2" />
              Personnalisation
            </button>
            <button
              onClick={() => {
                navigate("/");
              }}
              className="w-full text-left p-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center"
              aria-label="Accueil"
            >
              <Home className="w-5 h-5 mr-2" />
              Accueil
            </button>
            <button
              onClick={() => {
                auth.signOut();
                navigate("/login");
              }}
              className="w-full text-left p-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center"
              aria-label="Se déconnecter"
            >
              <X className="w-5 h-5 mr-2" />
              Déconnexion
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderNotifications = () => (
    <AnimatePresence>
      {isNotificationsOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setIsNotificationsOpen(false)}
            role="button"
            aria-label="Fermer les notifications"
          />
          <motion.div
            className="fixed bottom-0 w-full bg-white dark:bg-gray-800 rounded-t-lg p-4 max-h-[50vh] overflow-y-auto z-50"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="Fermer les notifications"
              >
                <X className="w-5 h-5 text-gray-900 dark:text-gray-100" />
              </button>
            </div>
            <SwipeableList>
              {notifications.map((notif) => (
                <SwipeableListItem
                  key={notif.id}
                  trailingActions={
                    <TrailingActions>
                      <SwipeAction destructive={true} onClick={() => dismissNotification(notif.id)}>
                        <div className="flex items-center justify-center bg-red-500 h-full w-20">
                          <span className="text-white">Supprimer</span>
                        </div>
                      </SwipeAction>
                    </TrailingActions>
                  }
                >
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 mb-2 rounded-lg flex justify-between items-center">
                    <div className="flex items-start space-x-2">
                      {!notif.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      )}
                      <div>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">{notif.title}</p>
                        <p className="text-gray-600 dark:text-gray-400">{notif.message}</p>
                        <p className="text-gray-500 dark:text-gray-500 text-xs">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!notif.read && (
                        <button
                          onClick={() => markNotificationRead(notif.id)}
                          className="text-blue-500 hover:text-blue-600 p-1"
                          aria-label="Marquer comme lu"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => dismissNotification(notif.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                        aria-label="Supprimer la notification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </SwipeableListItem>
              ))}
            </SwipeableList>
            {notifications.length > 0 && (
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={markNotificationsRead}
                  className="flex-1 py-2 rounded-lg text-white"
                  style={{ backgroundColor: userPreferences.primaryColor }}
                  aria-label="Marquer tous comme lu"
                >
                  Marquer tous comme lu
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white"
                  aria-label="Supprimer toutes les notifications"
                >
                  Tout supprimer
                </button>
              </div>
            )}
            {notifications.length === 0 && (
              <p className="text-center text-gray-500">Aucune notification</p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const renderDashboard = () => {
    const widgetMap: { [key: string]: JSX.Element } = {
      orders: (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border">
          <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
            <Package className="mr-2" style={{ color: userPreferences.primaryColor }} />
            Historique
          </h2>
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{order.id}</span>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {order.status} le {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {(order.amount || 0).toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
      tracking: (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border">
          <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
            <MapPin className="mr-2" style={{ color: userPreferences.primaryColor }} />
            Suivi
          </h2>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            {trackingOrder ? (
              <Suspense fallback={<div>Chargement de la carte...</div>}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 dark:text-gray-300">Statut : {trackingOrder.status}</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    Estimée : {trackingOrder.estimatedTime || "N/A"}
                  </p>
                </div>
                <MapContainer
                  center={[trackingOrder.pickupAddress.lat, trackingOrder.pickupAddress.lng]}
                  zoom={13}
                  style={{ height: "150px", width: "100%" }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  <Marker position={[trackingOrder.pickupAddress.lat, trackingOrder.pickupAddress.lng]}>
                    <Popup>Adresse de prise en charge</Popup>
                  </Marker>
                  <Marker position={[trackingOrder.deliveryAddress.lat, trackingOrder.deliveryAddress.lng]}>
                    <Popup>Adresse de livraison</Popup>
                  </Marker>
                </MapContainer>
              </Suspense>
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-400">Aucune commande active</p>
            )}
          </div>
        </div>
      ),
      profile: (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border">
          <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
            <User className="mr-2" style={{ color: userPreferences.primaryColor }} />
            Profil
          </h2>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                style={{ backgroundColor: userPreferences.primaryColor }}
              >
                {userPreferences.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {userPreferences.name}
                </p>
                <p className="text-gray-600 dark:text-gray-500 text-sm">{userPreferences.email}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  {userPreferences.address}
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      stats: (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border">
          <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
            <BarChart className="mr-2" style={{ color: userPreferences.primaryColor }} />
            Statistiques
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200" style={{ color: userPreferences.primaryColor }}>
                {stats.ordersThisMonth}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Commandes ce mois</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200" style={{ color: userPreferences.primaryColor }}>
                {stats.totalSpent} €
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Dépenses totales</p>
            </div>
          </div>
        </div>
      ),
      quickOrder: (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border">
          <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
            <Plus className="mr-2" style={{ color: userPreferences.primaryColor }} />
            Nouvelle commande
          </h2>
          <form onSubmit={handleQuickOrderSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Adresse de prise en charge"
              value={quickOrder.pickupAddress.address}
              onChange={(e) =>
                setQuickOrder({
                  ...quickOrder,
                  pickupAddress: { ...quickOrder.pickupAddress, address: e.target.value },
                })
              }
              className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 text-gray-800 dark:text-gray-200"
              required
              aria-label="Adresse de prise en charge"
            />
            <input
              type="text"
              placeholder="Adresse de livraison"
              value={quickOrder.deliveryAddress.address}
              onChange={(e) =>
                setQuickOrder({
                  ...quickOrder,
                  deliveryAddress: { ...quickOrder.deliveryAddress, address: e.target.value },
                })
              }
              className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 text-gray-800 dark:text-gray-200"
              required
              aria-label="Adresse de livraison"
            />
            <input
              type="number"
              placeholder="Poids (kg)"
              value={quickOrder.weight}
              onChange={(e) => setQuickOrder({ ...quickOrder, weight: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 text-gray-800 dark:text-gray-200"
              required
              aria-label="Poids en kilogrammes"
            />
            <select
              value={quickOrder.urgency}
              onChange={(e) =>
                setQuickOrder({ ...quickOrder, urgency: e.target.value as QuickOrder["urgency"] })
              }
              className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 text-gray-800 dark:text-gray-200"
              aria-label="Urgence de la livraison"
            >
              <option value="standard">Standard</option>
              <option value="express">Express</option>
              <option value="urgent">Urgent</option>
            </select>
            <button
              type="submit"
              className="w-full py-3 rounded-lg text-white"
              style={{ backgroundColor: userPreferences.primaryColor }}
              aria-label="Passer la commande"
            >
              Passer la Commande
            </button>
          </form>
        </div>
      ),
    };

    return (
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {userPreferences.dashboardLayout.map((widget) => (
          <motion.div key={widget} variants={itemVariants}>
            {widgetMap[widget]}
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderSupport = () => (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border">
        <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
          <HelpCircle className="mr-2" style={{ color: userPreferences.primaryColor }} />
          Support Client
        </h2>
        <div className="space-y-4">
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">FAQ</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Comment annuler une commande ? Contactez notre support.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Contact</h3>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Votre nom"
                className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                required
                aria-label="Nom"
              />
              <input
                type="email"
                name="email"
                placeholder="Votre email"
                className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                required
                aria-label="Email"
              />
              <textarea
                name="message"
                placeholder="Votre message"
                className="w-full bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                required
                style={{ minHeight: "100px" }}
                aria-label="Message"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-lg text-white"
                style={{ backgroundColor: userPreferences.primaryColor }}
                aria-label="Envoyer le message"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border">
        <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
          <Star className="mr-2" style={{ color: userPreferences.primaryColor }} />
          Notation du Service
        </h2>
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-800 dark:text-gray-200">Notez votre coursier</p>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={star <= 4 ? "text-yellow-400" : "text-gray-400"}
                  onClick={() => {
                    const deliveredOrder = orders.find((order) => order.status === "DELIVERED");
                    if (deliveredOrder) {
                      handleFeedbackSubmit(
                        deliveredOrder.id,
                        star,
                        "Livraison rapide et coursier sympathique."
                      );
                    }
                  }}
                  aria-label={`Noter ${star} étoile${star > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <textarea
            className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
            placeholder="Votre commentaire..."
            defaultValue="Livraison rapide et coursier sympathique."
            style={{ minHeight: "100px" }}
            aria-label="Commentaire sur la livraison"
          />
          <button
            className="mt-3 w-full py-3 rounded-lg text-white"
            style={{ backgroundColor: userPreferences.primaryColor }}
            onClick={() => {
              const deliveredOrder = orders.find((order) => order.status === "DELIVERED");
              if (deliveredOrder) {
                const comment = (document.querySelector("textarea") as HTMLTextAreaElement)?.value ||
                  "Livraison rapide et coursier sympathique.";
                handleFeedbackSubmit(deliveredOrder.id, 4, comment);
              }
            }}
            aria-label="Envoyer l'avis"
          >
            Envoyer mon Avis
          </button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border">
        <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
          <Clock className="mr-2" style={{ color: userPreferences.primaryColor }} />
          Historique des Interactions
        </h2>
        <div className="space-y-3">
          {interactions.map((interaction, index) => (
            <div
              key={index}
              className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between"
            >
              <div>
                <p className="text-gray-800 dark:text-gray-200">{interaction.message}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {new Date(interaction.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-gray-600 dark:text-gray-400 capitalize">{interaction.type}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-gray-900 to-purple-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="w-16 h-16 border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.h2
            className="text-2xl font-semibold text-white"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            Chargement
          </motion.h2>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Erreur : {error}</div>;
  }

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      } text-gray-900 dark:text-gray-100 p-4 font-sans relative`}
    >
      <Toaster position="top-center" />
      {renderPersonalizationModal()}
      {renderNotifications()}
      {renderMenu()}

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Espace Client</h1>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          </button>
        </div>

        <div className="mb-6">{activeSection === "dashboard" ? renderDashboard() : renderSupport()}</div>
      </div>

      <motion.div
        className="fixed bottom-20 right-4 z-30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="relative bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg"
          style={{ border: `2px solid ${userPreferences.primaryColor}` }}
          aria-label="Ouvrir les notifications"
        >
          <Bell className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          {unreadCount > 0 && (
            <span
              className="absolute top-0 right-0 text-xs text-white rounded-full h-5 w-5 flex items-center justify-center"
              style={{ backgroundColor: userPreferences.primaryColor }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </motion.div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-20 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around p-3">
          <button
            onClick={() => setActiveSection("dashboard")}
            className={`flex flex-col items-center p-3 rounded-lg ${
              activeSection === "dashboard" ? "text-white" : "text-gray-600 dark:text-gray-400"
            }`}
            style={{
              backgroundColor: activeSection === "dashboard" ? userPreferences.primaryColor : "transparent",
            }}
            aria-label="Tableau de bord"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Tableau de bord</span>
          </button>
          <button
            onClick={() => setActiveSection("support")}
            className={`flex flex-col items-center p-3 rounded-lg ${
              activeSection === "support" ? "text-white" : "text-gray-600 dark:text-gray-400"
            }`}
            style={{
              backgroundColor: activeSection === "support" ? userPreferences.primaryColor : "transparent",
            }}
            aria-label="Support"
          >
            <HelpCircle className="w-6 h-6" />
            <span className="text-xs mt-1">Support</span>
          </button>
        </div>
      </div>

      {showCookieBanner && (
        <CookieConsentBanner onAccept={handleCookieAccept} onLearnMore={handleCookieLearnMore} />
      )}
    </div>
  );
};

export default Client;