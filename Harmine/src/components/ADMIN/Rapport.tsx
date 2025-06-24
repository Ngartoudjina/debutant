import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";

interface Order {
  id: string;
  date: string;
  amount: string;
  status: string;
  clientId: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface ReportData {
  totalOrders: number;
  totalRevenue: number;
  deliveredOrders: number;
  activeClients: number;
  ordersByDate: { date: string; count: number; revenue: number }[];
}

const Rapport: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalOrders: 0,
    totalRevenue: 0,
    deliveredOrders: 0,
    activeClients: 0,
    ordersByDate: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<string>('week');
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const fetchReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
      }

      const ordersResponse = await fetch('https://debutant.onrender.com/api/commandes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!ordersResponse.ok) {
        const errorData = await ordersResponse.json().catch(() => ({ error: "Erreur de communication" }));
        throw new Error(errorData.error || 'Erreur lors de la récupération des commandes');
      }

      const ordersData = await ordersResponse.json();
      const fetchedOrders: Order[] = ordersData.data || [];
      setOrders(fetchedOrders);

      const clientsResponse = await fetch('https://debutant.onrender.com/api/clients', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!clientsResponse.ok) {
        const errorData = await clientsResponse.json().catch(() => ({ error: "Erreur de communication" }));
        throw new Error(errorData.error || 'Erreur lors de la récupération des clients');
      }

      const clientsData = await clientsResponse.json();
      setClients(clientsData.data || []);

      // Calculer les métriques
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }

      const filteredOrders = fetchedOrders.filter(
        (order) => new Date(order.date) >= startDate
      );

      const totalOrders = filteredOrders.length;
      const totalRevenue = filteredOrders.reduce(
        (sum, order) => sum + parseFloat(order.amount.replace(' €', '') || '0'),
        0
      );
      const deliveredOrders = filteredOrders.filter(
        (order) => order.status === 'Livrée'
      ).length;
      const activeClients = new Set(
        filteredOrders.map((order) => order.clientId)
      ).size;

      // Agrégation par date pour le graphique
      const ordersByDateMap = filteredOrders.reduce((acc, order) => {
        const date = new Date(order.date).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { count: 0, revenue: 0 };
        }
        acc[date].count += 1;
        acc[date].revenue += parseFloat(order.amount.replace(' €', '') || '0');
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      const ordersByDate = Object.entries(ordersByDateMap)
        .map(([date, { count, revenue }]) => ({ date, count, revenue }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setReportData({
        totalOrders,
        totalRevenue,
        deliveredOrders,
        activeClients,
        ordersByDate,
      });

      
    } catch (error: any) {
      console.error(error.message || 'Erreur lors du chargement du rapport');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExportCSV = () => {
    const headers = ['ID Commande', 'Date', 'Montant', 'Statut', 'Client'];
    const rows = orders.map((order) => {
      const client = clients.find((c) => c.id === order.clientId);
      return [
        order.id,
        new Date(order.date).toLocaleDateString(),
        order.amount,
        order.status,
        client ? client.name : 'Inconnu',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `rapport_${period}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-sm sm:text-base">Chargement du rapport...</span>
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4">
      <Card className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-lg sm:text-xl">Rapport d'activité</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 space-y-4">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="space-y-1.5 w-full sm:w-auto">
              <Label className="text-sm">Période</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full sm:w-[180px] h-8 sm:h-9 text-sm">
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="all">Tout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleExportCSV}
                className="h-8 sm:h-9 text-sm mr-2 sm:mr-3"
              >
                Exporter en CSV
              </Button>
            </motion.div>
          </div>

          {/* Métriques clés */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="w-full">
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-sm">Total des commandes</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <p className="text-lg sm:text-xl font-bold">{reportData.totalOrders}</p>
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-sm">Revenus totaux</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <p className="text-lg sm:text-xl font-bold">{reportData.totalRevenue.toFixed(2)} €</p>
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-sm">Commandes livrées</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <p className="text-lg sm:text-xl font-bold">{reportData.deliveredOrders}</p>
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-sm">Clients actifs</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <p className="text-lg sm:text-xl font-bold">{reportData.activeClients}</p>
              </CardContent>
            </Card>
          </div>

          {/* Graphique */}
          <Card className="w-full">
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-base">Évolution des commandes et revenus</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.ordersByDate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line yAxisId="left" type="monotone" dataKey="count" name="Commandes" stroke="#8884d8" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenus (€)" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des commandes récentes */}
          <Card className="w-full">
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-base">Commandes récentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">ID Commande</TableHead>
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm">Montant</TableHead>
                      <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                      <TableHead className="text-xs sm:text-sm">Client</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500 text-xs sm:text-sm">
                          Aucune commande disponible
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.slice(0, 10).map((order) => {
                        const client = clients.find((c) => c.id === order.clientId);
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="text-xs sm:text-sm">{order.id}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{new Date(order.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{order.amount}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{order.status}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{client ? client.name : 'Inconnu'}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default Rapport;