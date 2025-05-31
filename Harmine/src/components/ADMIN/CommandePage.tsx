import React, { useState, useEffect } from 'react';
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
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { getAuth } from 'firebase/auth';

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

enum OrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

const CommandePage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCourier, setFilterCourier] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const fetchOrders = async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }
  
      const response = await fetch('http://localhost:5000/api/commandes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      console.log('Fetch Orders Response Status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Fetch Orders Error Data:', errorData);
        if (errorData.error === 'Token invalide' && retryCount < MAX_RETRIES) {
          const auth = getAuth();
          if (auth.currentUser) {
            console.log('Tentative de rafraîchissement du token, essai:', retryCount + 1);
            const newToken = await auth.currentUser.getIdToken(true);
            console.log('New Token:', newToken);
            localStorage.setItem('authToken', newToken);
            return fetchOrders(retryCount + 1); // Réessayer avec le nouveau token
          } else {
            throw new Error('Utilisateur non connecté');
          }
        }
        throw new Error(errorData.error || 'Erreur lors de la récupération des commandes');
      }
  
      const data = await response.json();
      console.log('Raw Orders Data:', data.data);
      const mappedOrders: Order[] = data.data.map((order: any) => ({
        id: order.id || 'unknown',
        clientName: order.clientName || 'Inconnu',
        address: order.address || 'Inconnue',
        status: order.status || OrderStatus.PENDING,
        date: order.date || new Date().toISOString(),
        amount: order.amount || 0,
        courierId: order.courierId || undefined,
      }));
      console.log('Mapped Orders:', mappedOrders);
      setOrders(mappedOrders);
      toast.success('Commandes chargées avec succès');
    } catch (error: any) {
      console.error('Erreur lors du chargement des commandes:', error);
      toast.error(error.message || 'Erreur lors du chargement des commandes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCouriers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const response = await fetch('http://localhost:5000/api/truecoursiers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Fetch Couriers Response Status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Fetch Couriers Error Data:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la récupération des coursiers');
      }

      const data = await response.json();
      console.log('Raw Couriers Data:', data.data);
      const mappedCouriers: Courier[] = data.data.map((courier: any) => ({
        id: courier.id || 'unknown',
        name: courier.name || 'Inconnu',
      }));
      console.log('Mapped Couriers:', mappedCouriers);
      setCouriers(mappedCouriers);
    } catch (error: any) {
      console.error('Erreur lors du chargement des coursiers:', error);
      toast.error(error.message || 'Erreur lors du chargement des coursiers');
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCouriers();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const response = await fetch(`http://localhost:5000/api/commandes/${orderId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log(`Update Order ${orderId} Response Status:`, response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`Update Order ${orderId} Error Data:`, errorData);
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de la commande');
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success(`Commande ${orderId} mise à jour avec succès`);
    } catch (error: any) {
      console.error(`Erreur lors de la mise à jour de la commande ${orderId}:`, error);
      toast.error(error.message || 'Erreur lors de la mise à jour de la commande');
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      const response = await fetch(`http://localhost:5000/api/commandes/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`Cancel Order ${orderId} Response Status:`, response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`Cancel Order ${orderId} Error Data:`, errorData);
        throw new Error(errorData.error || 'Erreur lors de l\'annulation de la commande');
      }

      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      toast.success(`Commande ${orderId} annulée avec succès`);
    } catch (error: any) {
      console.error(`Erreur lors de l'annulation de la commande ${orderId}:`, error);
      toast.error(error.message || 'Erreur lors de l\'annulation de la commande');
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const filteredOrders = orders.filter((order) =>
    (filterStatus === 'all' || order.status === filterStatus) &&
    (filterCourier === 'all' || order.courierId === filterCourier)
  );

  const getCourierName = (courierId?: string) => {
    if (!courierId) return 'Non assigné';
    const courier = couriers.find((c) => c.id === courierId);
    return courier ? courier.name : 'Inconnu';
  };

  console.log('Filtered Orders:', filteredOrders);

  const renderTable = () => {
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
                      <Badge
                        variant={
                          order.status === OrderStatus.DELIVERED
                            ? 'default'
                            : order.status === OrderStatus.CANCELLED
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
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
                          {order.status !== OrderStatus.DELIVERED &&
                            order.status !== OrderStatus.CANCELLED && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      updateOrderStatus(
                                        order.id,
                                        order.status === OrderStatus.PENDING
                                          ? OrderStatus.IN_PROGRESS
                                          : OrderStatus.DELIVERED
                                      )
                                    }
                                    aria-label="Mettre à jour le statut de la commande"
                                  >
                                    <Edit size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Mettre à jour statut</TooltipContent>
                              </Tooltip>
                            )}
                          {order.status !== OrderStatus.CANCELLED && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => cancelOrder(order.id)}
                                  className="text-red-600 border-red-600"
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
                      variant={
                        order.status === OrderStatus.DELIVERED
                          ? 'default'
                          : order.status === OrderStatus.CANCELLED
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="mt-1"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRow(order.id)}
                    aria-label={expandedRows.includes(order.id) ? 'Réduire' : 'Agrandir'}
                  >
                    {expandedRows.includes(order.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </Button>
                </CardHeader>
                {expandedRows.includes(order.id) && (
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
                        {order.status !== OrderStatus.DELIVERED &&
                          order.status !== OrderStatus.CANCELLED && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateOrderStatus(
                                      order.id,
                                      order.status === OrderStatus.PENDING
                                        ? OrderStatus.IN_PROGRESS
                                        : OrderStatus.DELIVERED
                                    )
                                  }
                                  aria-label="Mettre à jour le statut de la commande"
                                >
                                  <Edit size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Mettre à jour statut</TooltipContent>
                            </Tooltip>
                          )}
                        {order.status !== OrderStatus.CANCELLED && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cancelOrder(order.id)}
                                className="text-red-600 border-red-600"
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
            onClick={fetchOrders}
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
              <Select value={filterStatus} onValueChange={setFilterStatus}>
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
              <Select value={filterCourier} onValueChange={setFilterCourier}>
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