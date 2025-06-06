import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "/logo-dynamism1.png";
import ThemeToggle from "../pages/ThemeToggle";
import {
  BarChart3 as ChartBarIcon,
  Users as UsersIcon,
  Package as PackageIcon,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  Mail as MailIcon,
  Settings as SettingsIcon,
  FileText as FileTextIcon,
  LogOut as LogOutIcon,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  XCircle,
  Bell,
  Menu,
  X,
  Sun,
  Moon as MoonIcon,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import axios from "axios";
import { format, isValid, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  auth,
  db,
  requestNotificationPermission,
  onMessageListener,
} from "../../../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import SettingsPage from "./SettingsPage";
import CouriersPage from "./CouriersPage";
import CommandePage from "./CommandePage";
import ClientsPage from "./ClientsPage";
import Rapport from "./Rapport";
import { Notification } from "../types/notification";

interface Order {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "DELIVERED" | "CANCELLED";
  deliveryAddress: { address: string; lat: number; lng: number };
  createdAt: string;
  estimatedTime?: number;
  amount?: number;
}

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  userId: string;
  createdAt: string;
}

const Admin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("PDG Victor Aguiah");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeCouriers: 0,
    avgDeliveryTime: 0,
    revenue: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [deliveryData, setDeliveryData] = useState([
    { name: "Lun", commandes: 0 },
    { name: "Mar", commandes: 0 },
    { name: "Mer", commandes: 0 },
    { name: "Jeu", commandes: 0 },
    { name: "Ven", commandes: 0 },
    { name: "Sam", commandes: 0 },
    { name: "Dim", commandes: 0 },
  ]);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    setIsDarkMode(false);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthenticated(true);
        try {
          const token = await user.getIdToken();
          localStorage.setItem("authToken", token);
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/users/me`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const displayName =
            response.data?.data?.displayName ||
            user.displayName ||
            "Administrateur";
          setUserName(displayName);
          await requestNotificationPermission(user.uid);
        } catch (error) {
          console.error("Erreur récupération utilisateur:", error);
          setUserName(user.displayName || "Administrateur");
          toast.error("Erreur lors de la récupération des données utilisateur");
        }
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setUserName("PDG Victor Aguiah");
        setNotifications([]);
        setNotificationsCount(0);
        localStorage.removeItem("authToken");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("type", "in", [
        "NEW_COURIER",
        "ORDER_UPDATE",
        "NEW_ORDER",
        "ADMIN_MESSAGE",
      ])
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updatedNotifications: Notification[] = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            read: doc.data().read || false,
            userId: doc.data().userId || "",
            title: doc.data().title || "Sans titre",
            message: doc.data().message || "Aucun message",
            type: doc.data().type || "UNKNOWN",
            createdAt: doc.data().createdAt || new Date().toISOString(),
            data: doc.data().data || {},
          })
        );
        updatedNotifications.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotifications(updatedNotifications);
        setNotificationsCount(
          updatedNotifications.filter((n) => !n.read).length
        );

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" && !change.doc.data().read) {
            toast.info(`Nouvelle notification: ${change.doc.data().title}`, {
              position: "top-right",
              autoClose: 5000,
            });
          }
        });
      },
      (error) => {
        console.error("Erreur listener notifications:", error);
        toast.error("Erreur lors du chargement des notifications");
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const fetchAllData = useCallback(async () => {
    if (!userId) return;
    try {
      const token =
        localStorage.getItem("authToken") ||
        (await auth.currentUser?.getIdToken());
      if (!token) throw new Error("Token d'authentification manquant");

      const [ordersResponse, couriersResponse, messagesResponse] =
        await Promise.all([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/commandes`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/truecoursiers`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      console.log("Messages response:", messagesResponse.data);

      const ordersData = Array.isArray(ordersResponse.data?.data)
        ? ordersResponse.data.data
        : [];
      const activeCouriers = Array.isArray(couriersResponse.data?.data)
        ? couriersResponse.data.data.filter((c: any) => c.status === "ACTIVE")
            .length
        : 0;
      const messagesData = Array.isArray(messagesResponse.data?.data)
        ? messagesResponse.data.data
        : [];

      console.log("Messages data to set:", messagesData);

      setStats({
        totalOrders: ordersData.length,
        activeCouriers,
        avgDeliveryTime: ordersData.length
          ? ordersData.reduce(
              (sum: number, order: any) => sum + (order.estimatedTime || 0),
              0
            ) / ordersData.length
          : 0,
        revenue: ordersData.reduce(
          (sum: number, order: any) => sum + (order.amount || 0),
          0
        ),
      });

      setOrders(ordersData.slice(0, 3));
      setMessages(messagesData);

      const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
      const counts = days.map((day, index) => ({
        name: day,
        commandes: ordersData.filter(
          (order: any) => new Date(order.createdAt).getDay() === (index + 1) % 7
        ).length,
      }));
      setDeliveryData(counts);
    } catch (error) {
      console.error("Erreur récupération données:", error);
      toast.error("Erreur lors du chargement des données");
      setStats({
        totalOrders: 0,
        activeCouriers: 0,
        avgDeliveryTime: 0,
        revenue: 0,
      });
      setOrders([]);
      setMessages([]);
      setDeliveryData([
        { name: "Lun", commandes: 0 },
        { name: "Mar", commandes: 0 },
        { name: "Mer", commandes: 0 },
        { name: "Jeu", commandes: 0 },
        { name: "Ven", commandes: 0 },
        { name: "Sam", commandes: 0 },
        { name: "Dim", commandes: 0 },
      ]);
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchAllData();
    }
  }, [isAuthenticated, userId, fetchAllData]);

  const markNotificationsAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length === 0) return;
      const token =
        localStorage.getItem("authToken") ||
        (await auth.currentUser?.getIdToken());
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/mark-read`,
        { notificationIds: unreadIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Notifications marquées comme lues");
    } catch (error) {
      console.error("Erreur marquage notifications:", error);
      toast.error("Erreur lors du marquage des notifications");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Déconnexion réussie");
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const formatDateRelative = (
    date: Date,
    formatType: string,
    options: { locale: typeof fr }
  ) => {
    if (!isValid(date)) return "Date invalide";
    if (formatType === "date-time") {
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: options.locale,
      });
    }
    return format(date, "dd MMM yyyy", { locale: options.locale });
  };

  const NotificationsPanel = () => {
    return (
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setShowNotifications(false)}
          >
            <motion.div
              className="w-11/12 max-w-[500px] mx-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-xl">
                <CardHeader className="relative flex flex-row items-center justify-between p-4">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Notifications</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 p-2"
                    onClick={() => setShowNotifications(false)}
                    aria-label="Fermer le panneau des notifications"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        Aucun message disponible
                      </p>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                        >
                          <div className="rounded-full bg-gray-200 dark:bg-gray-700 p-2">
                            <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {message.name} ({message.email})
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDateRelative(
                                  new Date(message.createdAt),
                                  "date-time",
                                  { locale: fr }
                                )}
                              </p>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {message.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              User ID: {message.userId || "anonyme"}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_COURIER":
        return "🚴";
      case "ORDER_UPDATE":
      case "NEW_ORDER":
        return "📦";
      case "ADMIN_MESSAGE":
        return "📩";
      default:
        return "🔔";
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Dynamism Express
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          aria-label={
            isDarkMode ? "Passer en mode clair" : "Passer en mode sombre"
          }
        >
          <AnimatePresence mode="wait">
            {isDarkMode ? (
              <motion.div
                key="sun"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -45, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MoonIcon className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {[
          { name: "Tableau de bord", icon: ChartBarIcon, page: "dashboard" },
          { name: "Commandes", icon: PackageIcon, page: "commandes" },
          { name: "Coursiers", icon: UsersIcon, page: "coursiers" },
          { name: "Clients", icon: MailIcon, page: "clients" },
          { name: "Paramètres", icon: SettingsIcon, page: "settings" },
          { name: "Rapports", icon: FileTextIcon, page: "rapports" },
        ].map((item) => (
          <motion.div
            key={item.name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant={activePage === item.page ? "default" : "ghost"}
              className={`w-full justify-start text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm py-2 ${
                activePage === item.page
                  ? "bg-blue-500 text-white dark:bg-blue-600"
                  : ""
              }`}
              onClick={() => {
                setActivePage(item.page);
                setSidebarOpen(false);
              }}
              aria-label={`Accéder à ${item.name}`}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </Button>
          </motion.div>
        ))}
      </nav>
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm py-2"
                aria-label="Ouvrir le menu utilisateur"
              >
                <Avatar className="h-7 w-7 mr-2">
                  <AvatarImage src={logo} alt="User avatar" />
                  <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-100">
                    {userName ? userName.charAt(0).toUpperCase() : "A"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{userName}</span>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DropdownMenuLabel className="text-gray-900 dark:text-white text-sm">
              Mon compte
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              onClick={() => {
                setActivePage("settings");
                setSidebarOpen(false);
              }}
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
              onClick={handleSignOut}
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {!isAuthenticated ? (
        <div className="flex items-center justify-center h-screen w-full p-4">
          <Card className="w-full max-w-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                Connexion requise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => (window.location.href = "/login")}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                Se connecter
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
            )}
          </AnimatePresence>
          <div className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen">
            <SidebarContent />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                className="fixed inset-y-0 left-0 w-3/4 max-w-[250px] z-50 lg:hidden"
              >
                <SidebarContent />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-col flex-1 lg:pl-64">
            <div className="sticky top-0 z-10 flex h-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-gray-900 dark:text-gray-100 lg:hidden">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="px-4 text-gray-600 dark:text-gray-300 flex items-center"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
              >
                <AnimatePresence mode="wait">
                  {sidebarOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -45, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 45, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: -45, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 45, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              <div className="flex flex-1 justify-between px-4 items-center">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  Dynamism Express
                </h1>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 h-8 w-8 p-0 relative"
                    onClick={() => setShowNotifications(true)}
                    aria-label="Ouvrir les notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {notificationsCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-xs">
                        {notificationsCount}
                      </Badge>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
            <main className="p-2 sm:p-4 flex-1">
              {activePage === "dashboard" && (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">
                      Tableau de bord
                    </h1>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 border-gray-300 dark:border-gray-600 text-sm"
                        onClick={() => setShowNotifications(true)}
                        aria-label="Voir les notifications"
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        Notifications{" "}
                        {notificationsCount > 0 && `(${notificationsCount})`}
                      </Button>
                    </motion.div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:gap-4 mb-4 sm:mb-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-gray-900 dark:text-white text-sm font-medium">
                          Total Commandes
                        </CardTitle>
                        <PackageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-semibold text-gray-900 dark:text-white">
                          {stats.totalOrders}
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +12.5% depuis hier
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-gray-900 dark:text-white text-sm font-medium">
                          Coursiers Actifs
                        </CardTitle>
                        <UsersIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-semibold text-gray-900 dark:text-white">
                          {stats.activeCouriers}
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Disponibles : {stats.activeCouriers}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-gray-900 dark:text-white text-sm font-medium">
                          Délai moyen
                        </CardTitle>
                        <ClockIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-semibold text-gray-900 dark:text-white">
                          {Math.round(stats.avgDeliveryTime)} min
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          -2 min depuis hier
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-gray-900 dark:text-white text-sm font-medium">
                          Chiffre d’affaires
                        </CardTitle>
                        <ChartBarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-semibold text-gray-900 dark:text-white">
                          {stats.revenue.toFixed(2)} €
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +8.2% cette semaine
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2 mb-4 sm:mb-6">
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-white text-base">
                          Évolution des commandes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={deliveryData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                                strokeOpacity={0.2}
                              />
                              <XAxis
                                dataKey="name"
                                stroke="#6b7280"
                                strokeWidth={1}
                                tick={{ fontSize: 12 }}
                              />
                              <YAxis
                                stroke="#6b7280"
                                strokeWidth={1}
                                tick={{ fontSize: 10 }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: isDarkMode
                                    ? "#1f2937"
                                    : "#ffffff",
                                  border: `1px solid ${
                                    isDarkMode
                                      ? "rgba(255,255,255,0.2)"
                                      : "#e5e7eb"
                                  }`,
                                }}
                                labelStyle={{
                                  color: isDarkMode ? "#ffffff" : "#000000",
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="commandes"
                                stroke="#3b82f6"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-gray-900 dark:text-white text-base">
                          Commandes récentes
                        </CardTitle>
                        <Button
                          variant="ghost"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                          onClick={() => setActivePage("commandes")}
                          aria-label="Voir toutes les commandes"
                        >
                          Voir tout
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {orders.map((order) => (
                            <div
                              key={order.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                {order.status === "DELIVERED" && (
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                )}
                                {order.status === "PENDING" && (
                                  <ClockIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                )}
                                {order.status === "CANCELLED" && (
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                )}
                                {order.status === "IN_PROGRESS" && (
                                  <PackageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Commande #{order.id.slice(0, 6)}
                                  </p>
                                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                    <MapPinIcon className="h-3 w-3 mr-1" />
                                    <span className="truncate max-w-sm">
                                      {order.deliveryAddress.address}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs"
                                aria-label={`Voir les détails de la commande ${order.id}`}
                              >
                                Détails
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2 mb-2">
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-gray-900 dark-dark:text-white text-base font-semibold">
                          Messages
                        </CardTitle>
                        <Button
                          variant="ghost"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                          onClick={() => setActivePage("messages")}
                          aria-label="Voir tous les messages"
                        >
                          Voir tout
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {messages.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                              Aucun message disponible
                            </p>
                          ) : (
                            messages.map((message) => (
                              <div
                                key={message.id}
                                className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                              >
                                <div className="rounded-full bg-gray-200 dark:bg-gray-700 p-2">
                                  <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {message.name} ({message.email})
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatDateRelative(
                                        new Date(message.createdAt),
                                        "date-time",
                                        { locale: fr }
                                      )}
                                    </p>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                    {message.message}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    User ID: {message.userId || "anonyme"}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-gray-900 dark:text-white text-base font-semibold">
                          Notifications récentes
                        </CardTitle>
                        <Button
                          variant="ghost"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                          onClick={markNotificationsAsRead}
                          aria-label="Marquer toutes les notifications comme lues"
                        >
                          Tout marquer comme lu
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {notifications.slice(0, 3).map((notif) => (
                            <div
                              key={notif.id}
                              className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg"
                            >
                              <div className="flex items-center rounded-full bg-gray-200 dark:bg-gray-700 p-2">
                                <span className="text-blue-600 dark:text-blue-400 text-sm">
                                  {getNotificationIcon(notif.type)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {notif.title}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {formatDateRelative(
                                    new Date(notif.createdAt),
                                    "date-time",
                                    { locale: fr }
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
              {activePage === "coursiers" && <CouriersPage />}
              {activePage === "clients" && <ClientsPage />}
              {activePage === "commandes" && <CommandePage />}
              {activePage === "settings" && <SettingsPage />}
              {activePage === "rapports" && <Rapport />}
              {activePage === "messages" && (
                <div>Page des messages (à implémenter)</div>
              )}
            </main>
            <ThemeToggle
              darkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
            />
          </div>
          {showNotifications && <NotificationsPanel />}
        </>
      )}
    </div>
  );
};

export default Admin;
