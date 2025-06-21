import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { toast } from 'react-toastify';
import {
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { getAuth } from 'firebase/auth';

// Types et interfaces
enum OrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
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

// Types pour les réponses de l'API
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

type FilterStatus = 'all' | OrderStatus;
type FilterCourier = 'all' | 'none' | string;

const CommandePage: React.FC = () => {
  // États avec typage strict
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterCourier, setFilterCourier] = useState<FilterCourier>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Constantes
  const MAX_RETRIES = 2;
  const API_BASE_URL = 'https://debutant.onrender.com/api';

  // Fonction utilitaire pour obtenir le token
  const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
  };

  // Fonction utilitaire pour les headers d'authentification
  const getAuthHeaders = (token: string): HeadersInit => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  // Fonction pour gérer les erreurs d'API
  const handleApiError = async (response: Response): Promise<never> => {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: 'Erreur de communication avec le serveur' };
    }
    throw new Error(errorData.error || 'Erreur inconnue');
  };

  // Fonction pour récupérer les commandes avec retry
  const fetchOrders = useCallback(async (retryCount: number = 0): Promise<void> => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const response = await fetch(`${API_BASE_URL}/commandes`, {
        headers: getAuthHeaders(token),
      });

      console.log('Fetch Orders Response Status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur de communication' }));
        console.log('Fetch Orders Error Data:', errorData);
        
        // Gestion du retry pour les tokens invalides
        if (errorData.error === 'Token invalide' && retryCount < MAX_RETRIES) {
          const auth = getAuth();
          if (auth.currentUser) {
            console.log('Tentative de rafraîchissement du token, essai:', retryCount + 1);
            const newToken = await auth.currentUser.getIdToken(true);
            console.log('New Token:', newToken);
            localStorage.setItem('authToken', newToken);
            return fetchOrders(retryCount + 1);
          } else {
            throw new Error('Utilisateur non connecté');
          }
        }
        
        throw new Error(errorData.error || 'Erreur lors de la récupération des commandes');
      }

      const data: ApiResponse<RawOrderData[]> = await response.json();
      console.log('Raw Orders Data:', data.data);
      
      const mappedOrders: Order[] = data.data.map((order: RawOrderData): Order => ({
        id: order.id || 'unknown',
        clientName: order.clientName || 'Inconnu',
        address: order.address || 'Inconnue',
        status: order.status || OrderStatus.PENDING,
        date: order.date || new Date().toISOString(),
        amount: order.amount || 0,
        courierId: order.courierId,
      }));
      
      console.log('Mapped Orders:', mappedOrders);
      setOrders(mappedOrders);
      toast.success('Commandes chargées avec succès');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des commandes';
      console.error('Erreur lors du chargement des commandes:', error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

      console.log('Fetch Couriers Response Status:', response.status);
      
      if (!response.ok) {
        await handleApiError(response);
      }

      const data: ApiResponse<RawCourierData[]> = await response.json();
      console.log('Raw Couriers Data:', data.data);
      
      const mappedCouriers: Courier[] = data.data.map((courier: RawCourierData): Courier => ({
        id: courier.id || 'unknown',
        name: courier.name || 'Inconnu',
      }));
      
      console.log('Mapped Couriers:', mappedCouriers);
      setCouriers(mappedCouriers);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des coursiers';
      console.error('Erreur lors du chargement des coursiers:', error);
      toast.error(errorMessage);
    }
  }, []);

  // Effet pour charger les données initiales
  useEffect(() => {
    fetchOrders();
    fetchCouriers();
  }, [fetchOrders, fetchCouriers]);

  // Fonction pour mettre à jour le statut d'une commande
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<void> => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const response = await fetch(`${API_BASE_URL}/commandes/${orderId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ status: newStatus }),
      });

      console.log(`Update Order ${orderId} Response Status:`, response.status);
      
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
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la commande';
      console.error(`Erreur lors de la mise à jour de la commande ${orderId}:`, error);
      toast.error(errorMessage);
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
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      console.log(`Cancel Order ${orderId} Response Status:`, response.status);
      
      if (!response.ok) {
        await handleApiError(response);
      }

      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
      toast.success(`Commande ${orderId} annulée avec succès`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'annulation de la commande';
      console.error(`Erreur lors de l'annulation de la commande ${orderId}:`, error);
      toast.error(errorMessage);
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
    const statusMatch = filterStatus === 'all' || order.status === filterStatus;
    const courierMatch = 
      filterCourier === 'all' || 
      (filterCourier === 'none' && !order.courierId) ||
      order.courierId === filterCourier;
    
    return statusMatch && courierMatch;
  });

  // Fonction pour obtenir le nom du coursier
  const getCourierName = (courierId?: string): string => {
    if (!courierId) return 'Non assigné';
    const courier = couriers.find((c) => c.id === courierId);
    return courier?.name || 'Inconnu';
  };

  // Fonction pour obtenir la variante du badge selon le statut
  const getBadgeVariant = (status: OrderStatus): "default" | "destructive" | "secondary" => {
    switch (status) {
      case OrderStatus.DELIVERED:
        return 'default';
      case OrderStatus.CANCELLED:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Fonction pour déterminer le prochain statut
  const getNextStatus = (currentStatus: OrderStatus): OrderStatus => {
    return currentStatus === OrderStatus.PENDING ? OrderStatus.IN_PROGRESS : OrderStatus.DELIVERED;
  };

  // Fonction pour vérifier si une commande peut être mise à jour
  const canUpdateOrder = (status: OrderStatus): boolean => {
    return status !== OrderStatus.DELIVERED && status !== OrderStatus.CANCELLED;
  };

  // Fonction pour vérifier si une commande peut être annulée
  const canCancelOrder = (status: OrderStatus): boolean => {
    return status !== OrderStatus.CANCELLED;
  };

  console.log('Filtered Orders:', filteredOrders);

  // Rendu de la table
  const renderTable = (): JSX.Element => {
    return (
      <>
        {/* Affichage en tableau pour grands écrans */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableCaption className="mb-2">Liste des commandes</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden lg:table-cell">Adresse</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Coursier</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-gray-500 dark:text-gray-400">
                    Aucune commande disponible
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.clientName}</TableCell>
                    <TableCell className="hidden lg:table-cell">{order.address}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{getCourierName(order.courierId)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {new Date(order.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{order.amount.toFixed(2)} €</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => console.log('View details:', order.id)}
                                aria-label="Voir les détails de la commande"
                              >
                                <Eye size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Voir détails</TooltipContent>
                          </Tooltip>
                          {canUpdateOrder(order.status) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                                  aria-label="Mettre à jour le statut de la commande"
                                >
                                  <Edit size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Mettre à jour statut</TooltipContent>
                            </Tooltip>
                          )}
                          {canCancelOrder(order.status) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => cancelOrder(order.id)}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  aria-label="Annuler la commande"
                                >
                                  <Trash2 size={16} />
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

        {/* Affichage en cartes pour petits écrans */}
        <div className="md:hidden space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="text-center py-6 text-gray-500 dark:text-gray-400">
                Aucune commande disponible
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md"
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{order.id}</CardTitle>
                    <Badge
                      variant={getBadgeVariant(order.status)}
                      className="mt-1"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRow(order.id)}
                    aria-label={expandedRows.has(order.id) ? 'Réduire' : 'Agrandir'}
                  >
                    {expandedRows.has(order.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </Button>
                </CardHeader>
                {expandedRows.has(order.id) && (
                  <CardContent className="space-y-2">
                    <div>
                      <strong>Client:</strong> {order.clientName}
                    </div>
                    <div>
                      <strong>Adresse:</strong> {order.address}
                    </div>
                    <div>
                      <strong>Statut:</strong> {order.status}
                    </div>
                    <div>
                      <strong>Coursier:</strong> {getCourierName(order.courierId)}
                    </div>
                    <div>
                      <strong>Date:</strong> {new Date(order.date).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Montant:</strong> {order.amount.toFixed(2)} €
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => console.log('View details:', order.id)}
                              aria-label="Voir les détails de la commande"
                            >
                              <Eye size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Voir détails</TooltipContent>
                        </Tooltip>
                        {canUpdateOrder(order.status) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                                aria-label="Mettre à jour le statut de la commande"
                              >
                                <Edit size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Mettre à jour statut</TooltipContent>
                          </Tooltip>
                        )}
                        {canCancelOrder(order.status) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cancelOrder(order.id)}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                aria-label="Annuler la commande"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Annuler</TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </>
    );
  };

  return (
    <div className="p-6 space-y-8">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6" />
            Gestion des commandes
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders()}
            disabled={isLoading}
            className="flex items-center gap-1 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 w-full sm:w-1/3">
              <Label className="text-gray-900 dark:text-white">Filtrer par statut</Label>
              <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                <SelectTrigger className="border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value={OrderStatus.PENDING}>En attente</SelectItem>
                  <SelectItem value={OrderStatus.IN_PROGRESS}>En cours</SelectItem>
                  <SelectItem value={OrderStatus.DELIVERED}>Livré</SelectItem>
                  <SelectItem value={OrderStatus.CANCELLED}>Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-full sm:w-1/3">
              <Label className="text-gray-900 dark:text-white">Filtrer par coursier</Label>
              <Select value={filterCourier} onValueChange={(value: FilterCourier) => setFilterCourier(value)}>
                <SelectTrigger className="border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Filtrer par coursier" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {couriers.map((courier) => (
                    <SelectItem key={courier.id} value={courier.id}>
                      {courier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {renderTable()}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommandePage;