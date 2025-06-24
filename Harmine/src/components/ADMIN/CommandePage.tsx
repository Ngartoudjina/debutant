import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import {
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Search,
  Filter,
  Trash2,
} from "lucide-react";
import { getAuth } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

// Types et interfaces
enum OrderStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

interface Order {
  id: string;
  clientName: string;
  address: string;
  status: OrderStatus;
  date: string;
  amount: number;
  courierId?: string;
}

interface Courier {
  id: string;
  name: string;
}

interface ApiResponse<T> {
  data: T;
  error?: string;
}

interface ApiError {
  error: string;
}

interface RawOrderData {
  id?: string;
  clientName?: string;
  address?: string;
  status?: OrderStatus;
  date?: string;
  amount?: number;
  courierId?: string;
}

interface RawCourierData {
  id?: string;
  name?: string;
}

type FilterStatus = "all" | OrderStatus;
type FilterCourier = "all" | "none" | string;

const CommandePage: React.FC = () => {
  // États
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterCourier, setFilterCourier] = useState<FilterCourier>("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Constantes
  const MAX_RETRIES = 2;
  const API_BASE_URL = "https://debutant.onrender.com/api";

  // Fonction utilitaire pour obtenir le token
  const getAuthToken = (): string | null => {
    return localStorage.getItem("authToken");
  };

  // Fonction utilitaire pour les headers d'authentification
  const getAuthHeaders = (token: string): HeadersInit => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  // Fonction pour gérer les erreurs d'API
  const handleApiError = async (response: Response): Promise<never> => {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: "Erreur de communication avec le serveur" };
    }
    toast.error(errorData.error || "Erreur inconnue");
    throw new Error(errorData.error || "Erreur inconnue");
  };

  // Fonction pour récupérer les commandes avec retry
  const fetchOrders = useCallback(
    async (retryCount: number = 0): Promise<void> => {
      try {
        setIsLoading(true);
        const token = getAuthToken();
        if (!token) {
          throw new Error("Aucun token d'authentification trouvé");
        }

        const response = await fetch(`${API_BASE_URL}/commandes`, {
          headers: getAuthHeaders(token),
        });

        if (!response.ok) {
          if (response.status === 401 && retryCount < MAX_RETRIES) {
            const auth = getAuth();
            if (auth.currentUser) {
              const newToken = await auth.currentUser.getIdToken(true);
              localStorage.setItem("authToken", newToken);
              return fetchOrders(retryCount + 1);
            }
            throw new Error("Utilisateur non connecté");
          }
          await handleApiError(response);
        }

        const data: ApiResponse<RawOrderData[]> = await response.json();
        const mappedOrders: Order[] = data.data.map(
          (order: RawOrderData): Order => ({
            id: order.id || "unknown",
            clientName: order.clientName || "Inconnu",
            address: order.address || "Inconnue",
            status: order.status || OrderStatus.PENDING,
            date: order.date || new Date().toISOString(),
            amount: order.amount || 0,
            courierId: order.courierId,
          })
        );
        setOrders(mappedOrders);
      } catch (error) {
        // Erreur déjà affichée via toast
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fonction pour récupérer les coursiers
  const fetchCouriers = useCallback(async (): Promise<void> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const response = await fetch(`${API_BASE_URL}/truecoursiers`, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      const data: ApiResponse<RawCourierData[]> = await response.json();
      const mappedCouriers: Courier[] = data.data.map(
        (courier: RawCourierData): Courier => ({
          id: courier.id || "unknown",
          name: courier.name || "Inconnu",
        })
      );
      setCouriers(mappedCouriers);
    } catch (error) {
      // Erreur déjà affichée via toast
    }
  }, []);

  // Effet pour charger les données initiales
  useEffect(() => {
    fetchOrders();
    fetchCouriers();
  }, [fetchOrders, fetchCouriers]);

  // Fonction pour mettre à jour le statut d'une commande
  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus
  ): Promise<void> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const response = await fetch(`${API_BASE_URL}/commandes/${orderId}`, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success(`Commande ${orderId} mise à jour avec succès`);
    } catch (error) {
      // Erreur déjà affichée via toast
    }
  };

  // Fonction pour annuler une commande
  const cancelOrder = async (orderId: string): Promise<void> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const response = await fetch(`${API_BASE_URL}/commandes/${orderId}`, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== orderId)
      );
      toast.success(`Commande ${orderId} annulée avec succès`);
    } catch (error) {
      // Erreur déjà affichée via toast
    }
  };

  // Fonction pour basculer l'état d'expansion d'une ligne
  const toggleRow = (id: string): void => {
    setExpandedRows((prevExpanded) => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  };

  // Filtrage des commandes
  const filteredOrders = orders.filter((order) => {
    const statusMatch = filterStatus === "all" || order.status === filterStatus;
    const courierMatch =
      filterCourier === "all" ||
      (filterCourier === "none" && !order.courierId) ||
      order.courierId === filterCourier;
    const searchMatch =
      searchQuery === "" ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && courierMatch && searchMatch;
  });

  // Fonction pour obtenir le nom du coursier
  const getCourierName = (courierId?: string): string => {
    if (!courierId) return "Non assigné";
    const courier = couriers.find((c) => c.id === courierId);
    return courier?.name || "Inconnu";
  };

  // Fonction pour obtenir la variante du badge selon le statut
  const getBadgeVariant = (
    status: OrderStatus
  ): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case OrderStatus.DELIVERED:
        return "default";
      case OrderStatus.CANCELLED:
        return "destructive";
      case OrderStatus.PENDING:
        return "outline";
      default:
        return "secondary";
    }
  };

  // Fonction pour déterminer le prochain statut
  const getNextStatus = (currentStatus: OrderStatus): OrderStatus => {
    return currentStatus === OrderStatus.PENDING
      ? OrderStatus.IN_PROGRESS
      : OrderStatus.DELIVERED;
  };

  // Fonction pour vérifier si une commande peut être mise à jour
  const canUpdateOrder = (status: OrderStatus): boolean => {
    return status !== OrderStatus.DELIVERED && status !== OrderStatus.CANCELLED;
  };

  // Fonction pour vérifier si une commande peut être annulée
  const canCancelOrder = (status: OrderStatus): boolean => {
    return status !== OrderStatus.CANCELLED;
  };

  // Rendu de la table
  const renderTable = (): JSX.Element => {
    return (
      <>
        {/* Affichage en tableau pour grands écrans */}
        <div className="hidden lg:block">
          <Table className="min-w-full rounded-lg overflow-hidden">
            <TableCaption className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {filteredOrders.length} commande(s) trouvée(s)
            </TableCaption>
            <TableHeader className="bg-gray-100 dark:bg-gray-800/50">
              <TableRow className="border-b border-gray-200 dark:border-gray-700">
                <TableHead className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">ID</TableHead>
                <TableHead className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Client</TableHead>
                <TableHead className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Adresse</TableHead>
                <TableHead className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Statut</TableHead>
                <TableHead className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Coursier</TableHead>
                <TableHead className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Date</TableHead>
                <TableHead className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Montant</TableHead>
                <TableHead className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {isLoading ? (
                      <div className="flex justify-center items-center gap-2">
                        <Skeleton className="h-5 w-48 rounded-md" />
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Aucune commande correspondante
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-200"
                  >
                    <TableCell className="px-4 py-3 font-medium text-sm text-gray-900 dark:text-gray-100">{order.id}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">{order.clientName}</TableCell>
                    <TableCell className="px-4 py-3 max-w-[200px] truncate text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{order.address}</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-2">
                            <p>{order.address}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant={getBadgeVariant(order.status)}
                        className="capitalize text-xs px-2 py-1"
                      >
                        {order.status.toLowerCase().replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">{getCourierName(order.courierId)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {new Date(order.date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">{order.amount.toFixed(2)} €</TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                onClick={() => console.log("View details:", order.id)}
                                aria-label="Voir les détails"
                              >
                                <Eye className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Détails</TooltipContent>
                          </Tooltip>
                          {canUpdateOrder(order.status) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                  onClick={() =>
                                    updateOrderStatus(order.id, getNextStatus(order.status))
                                  }
                                  aria-label="Mettre à jour le statut"
                                >
                                  <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Mettre à jour</TooltipContent>
                            </Tooltip>
                          )}
                          {canCancelOrder(order.status) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                  onClick={() => cancelOrder(order.id)}
                                  aria-label="Annuler la commande"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Annuler</TooltipContent>
                            </Tooltip>
                          )}
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Affichage en cartes pour mobile et tablette */}
        <div className="lg:hidden space-y-3">
          {filteredOrders.length === 0 ? (
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
              <div className="p-4 text-center">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-3/4 mx-auto rounded-md" />
                    <Skeleton className="h-5 w-1/2 mx-auto rounded-md" />
                    <Skeleton className="h-5 w-2/3 mx-auto rounded-md" />
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    Aucune commande correspondante
                  </span>
                )}
              </div>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Card className="w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <CardHeader className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getBadgeVariant(order.status)}
                          className="capitalize text-xs px-2 py-1"
                        >
                          {order.status.toLowerCase().replace("_", " ")}
                        </Badge>
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {order.id.substring(0, 8)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => toggleRow(order.id)}
                        aria-label={expandedRows.has(order.id) ? "Réduire" : "Agrandir"}
                      >
                        {expandedRows.has(order.id) ? (
                          <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <AnimatePresence>
                    {expandedRows.has(order.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <CardContent className="px-4 py-4 space-y-3">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                Client
                              </span>
                              <p className="text-sm text-gray-900 dark:text-gray-100">{order.clientName}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                Montant
                              </span>
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {order.amount.toFixed(2)} €
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                Coursier
                              </span>
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {getCourierName(order.courierId)}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                Date
                              </span>
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {new Date(order.date).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                Adresse
                              </span>
                              <p className="text-sm text-gray-900 dark:text-gray-100">{order.address}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9 text-xs rounded-md border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                              onClick={() => console.log("View details:", order.id)}
                            >
                              <Eye className="h-4 w-4 mr-1.5" />
                              Détails
                            </Button>
                            {canUpdateOrder(order.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-9 text-xs rounded-md border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                onClick={() =>
                                  updateOrderStatus(order.id, getNextStatus(order.status))
                                }
                              >
                                <Edit className="h-4 w-4 mr-1.5" />
                                Mettre à jour
                              </Button>
                            )}
                            {canCancelOrder(order.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-9 text-xs rounded-md border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                                onClick={() => cancelOrder(order.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1.5" />
                                Annuler
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Package className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400" />
          Gestion des commandes
        </h1>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders()}
            disabled={isLoading}
            className="w-full sm:w-auto h-10 px-4 text-sm font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
        </motion.div>
      </div>

      <Card className="w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <CardHeader className="px-4 sm:px-6 py-4 space-y-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une commande..."
              className="pl-10 h-10 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                <Filter className="h-4 w-4" />
                Statut
              </Label>
              <Select
                value={filterStatus}
                onValueChange={(value: FilterStatus) => setFilterStatus(value)}
              >
                <SelectTrigger className="h-10 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md">
                  <SelectItem value="all" className="text-sm">Tous les statuts</SelectItem>
                  <SelectItem value={OrderStatus.PENDING} className="text-sm">En attente</SelectItem>
                  <SelectItem value={OrderStatus.IN_PROGRESS} className="text-sm">En cours</SelectItem>
                  <SelectItem value={OrderStatus.DELIVERED} className="text-sm">Livré</SelectItem>
                  <SelectItem value={OrderStatus.CANCELLED} className="text-sm">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                <Filter className="h-4 w-4" />
                Coursier
              </Label>
              <Select
                value={filterCourier}
                onValueChange={(value: FilterCourier) => setFilterCourier(value)}
              >
                <SelectTrigger className="h-10 text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                  <SelectValue placeholder="Filtrer par coursier" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md">
                  <SelectItem value="all" className="text-sm">Tous les coursiers</SelectItem>
                  <SelectItem value="none" className="text-sm">Non assigné</SelectItem>
                  {couriers.map((courier) => (
                    <SelectItem key={courier.id} value={courier.id} className="text-sm">
                      {courier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-4">{renderTable()}</CardContent>
      </Card>
    </div>
  );
};

export default CommandePage;