import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
      }

      // Récupérer les commandes
      const ordersResponse = await fetch('http://localhost:5000/api/commandes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!ordersResponse.ok) {
        const errorData = await ordersResponse.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des commandes');
      }

      const ordersData = await ordersResponse.json();
      const fetchedOrders: Order[] = ordersData.data;
      setOrders(fetchedOrders);

      // Récupérer les clients
      const clientsResponse = await fetch('http://localhost:5000/api/clients', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!clientsResponse.ok) {
        const errorData = await clientsResponse.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des clients');
      }

      const clientsData = await clientsResponse.json();
      setClients(clientsData.data);

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
        (sum, order) => sum + parseFloat(order.amount.replace(' €', '')),
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
        acc[date].revenue += parseFloat(order.amount.replace(' €', ''));
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

      toast.success('Rapport chargé avec succès');
    } catch (error: any) {
      console.error('Erreur lors du chargement du rapport:', error);
      toast.error(error.message || 'Erreur lors du chargement du rapport');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [period]);

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

    toast.success('Rapport exporté en CSV');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement du rapport...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Rapport d'activité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtres */}
          <div className="flex items-center space-x-4">
            <div className="space-y-2">
              <Label>Période</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
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
            <Button onClick={handleExportCSV} className="mt-6">
              Exporter en CSV
            </Button>
          </div>

          {/* Métriques clés */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total des commandes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{reportData.totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Revenus totaux</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{reportData.totalRevenue.toFixed(2)} €</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Commandes livrées</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{reportData.deliveredOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Clients actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{reportData.activeClients}</p>
              </CardContent>
            </Card>
          </div>

          {/* Graphique */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des commandes et revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart width={600} height={300} data={reportData.ordersByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="count" name="Commandes" stroke="#8884d8" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenus (€)" stroke="#82ca9d" />
              </LineChart>
            </CardContent>
          </Card>

          {/* Tableau des commandes récentes */}
          <Card>
            <CardHeader>
              <CardTitle>Commandes récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Commande</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Client</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                        Aucune commande disponible
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.slice(0, 10).map((order) => {
                      const client = clients.find((c) => c.id === order.clientId);
                      return (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                          <TableCell>{order.amount}</TableCell>
                          <TableCell>{order.status}</TableCell>
                          <TableCell>{client ? client.name : 'Inconnu'}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default Rapport;