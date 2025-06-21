import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

// Interfaces TypeScript
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  orders: { id: string; date: string; amount: string; status: string }[];
}

interface Notification {
  title: string;
  message: string;
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [notification, setNotification] = useState<Notification>({ title: '', message: '' });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [isSendingNotification, setIsSendingNotification] = useState<boolean>(false);

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
      }

      console.log('📡 Envoi de la requête fetchClients avec token:', token.substring(0, 10) + '...');
      const response = await fetch('https://debutant.onrender.com/api/clients', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des clients');
      }

      const data = await response.json();
      console.log('✅ Données reçues de /api/clients:', data);
      setClients(data.data || []);
      toast.success('Clients chargés avec succès');
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des clients:', error);
      toast.error(error.message || 'Erreur lors du chargement des clients');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchClientOrders = useCallback(async (clientId: string) => {
    try {
      setIsLoadingOrders(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
      }

      console.log(`📡 Récupération des commandes pour clientId: ${clientId}`);
      const response = await fetch(`https://debutant.onrender.com/api/clients/${clientId}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des commandes');
      }

      const data = await response.json();
      console.log(`✅ Commandes du client ${clientId}:`, data.data);
      return data.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des commandes:', error);
      toast.error(error.message || 'Erreur lors de la récupération des commandes');
      return [];
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const handleViewOrders = async (client: Client) => {
    console.log(`👁️ Affichage des commandes pour client: ${client.id}`);
    const orders = await fetchClientOrders(client.id);
    setSelectedClient({ ...client, orders });
  };

  const sendNotificationToClient = async () => {
    if (!selectedClient) {
      toast.error('Aucun client sélectionné');
      return;
    }
    if (!notification.title.trim() || !notification.message.trim()) {
      toast.error('Le titre et le message ne peuvent pas être vides');
      return;
    }

    try {
      setIsSendingNotification(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé');
      }

      console.log('📩 Envoi de la notification:', {
        userId: selectedClient.id,
        title: notification.title,
        message: notification.message,
      });

      const response = await fetch('https://debutant.onrender.com/api/notifications/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedClient.id,
          title: notification.title,
          message: notification.message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur serveur:', errorData);
        if (errorData.error.includes('Aucun token FCM')) {
          throw new Error('Cet utilisateur n\'a pas activé les notifications');
        }
        if (errorData.error.includes('Token FCM invalide')) {
          throw new Error('Les notifications sont désactivées pour cet utilisateur. Demandez-lui de se reconnecter.');
        }
        if (errorData.error.includes('Utilisateur non trouvé')) {
          throw new Error('Utilisateur non trouvé');
        }
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de la notification');
      }

      const data = await response.json();
      console.log('✅ Réponse serveur:', data);
      toast.success('Notification envoyée avec succès');
      setNotification({ title: '', message: '' });
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi de la notification:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi de la notification');
    } finally {
      setIsSendingNotification(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <div className="p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Chargement des clients...</span>
            </div>
          ) : (
            <Table>
              <TableCaption>Liste des clients enregistrés</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                      Aucun client disponible
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar>
                            <AvatarFallback>{client.name[0]}</AvatarFallback>
                          </Avatar>
                          <span>{client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.address}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrders(client)}
                          disabled={isLoadingOrders}
                          aria-label={`Voir les commandes de ${client.name}`}
                        >
                          {isLoadingOrders && selectedClient?.id === client.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Chargement...
                            </>
                          ) : (
                            'Voir les commandes'
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500"
                          onClick={() => setSelectedClient(client)}
                          aria-label={`Contacter ${client.name}`}
                        >
                          Contacter
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle>Détails du client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={selectedClient.name} readOnly aria-label="Nom du client" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={selectedClient.email} readOnly aria-label="Email du client" />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={selectedClient.phone} readOnly aria-label="Téléphone du client" />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={selectedClient.address} readOnly aria-label="Adresse du client" />
            </div>

            <div className="space-y-2">
              <Label>Historique des commandes</Label>
              {isLoadingOrders ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Chargement des commandes...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Commande</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedClient.orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                          Aucune commande pour ce client
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedClient.orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                          <TableCell>{order.amount}</TableCell>
                          <TableCell>{order.status}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle>Envoyer une notification à {selectedClient.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Titre de la notification</Label>
              <Input
                value={notification.title}
                onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                placeholder="Entrez le titre de la notification"
                aria-label="Titre de la notification"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={notification.message}
                onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                placeholder="Écrivez votre message ici..."
                aria-label="Message de la notification"
              />
              <Button
                onClick={sendNotificationToClient}
                disabled={isSendingNotification}
                aria-label="Envoyer la notification"
              >
                {isSendingNotification ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Envoyer la notification'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientsPage;