export interface Notification {
    id: string;
    read: boolean;
    userId: string;
    title: string; // Rendre requis avec valeur par défaut si nécessaire
    message: string; // Idem
    type: 'SIGNUP' | 'LOGIN' | 'ORDER' | 'COURIER_APPLICATION' | 'NEW_ORDER' | 'NEW_COURIER' | 'UNKNOWN';
    createdAt: string; // Chaîne ISO
    data?: Record<string, any>;
  }