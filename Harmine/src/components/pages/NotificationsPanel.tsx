import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, Bell } from 'lucide-react';
import { toast } from 'react-toastify';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; // Import depuis firebaseConfig
import { Notification } from '../types/notification';

interface NotificationsPanelProps {
  notifications: Notification[];
  onClose: () => void;
}

const formatDateSafely = (dateInput: string): string => {
  try {
    const date = new Date(dateInput);
    if (!isValid(date)) {
      console.warn('⚠️ Date invalide:', dateInput);
      return 'Date invalide';
    }
    return format(date, 'dd MMM yyyy, HH:mm', { locale: fr });
  } catch (error) {
    console.error('❌ Erreur formatage date:', error, 'Input:', dateInput);
    return 'Erreur date';
  }
};

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'SIGNUP':
      return '🎉';
    case 'LOGIN':
      return '🔑';
    case 'ORDER':
      return '📦';
    case 'COURIER_APPLICATION':
      return '🚴';
    case 'NEW_ORDER':
      return '🛒';
    case 'NEW_COURIER':
      return '👷';
    default:
      return '🔔';
  }
};

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onClose }) => {
  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      try {
        console.log('📨 Marquage de la notification comme lue:', notificationId);
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, { read: true });
        console.log('✅ Notification marquée comme lue');
      } catch (err) {
        console.error('❌ Erreur marquage notification:', err);
        toast.warn('Impossible de marquer la notification comme lue');
      }
    },
    []
  );

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const panelVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: 50 },
  };

  const notificationVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-md mx-4"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-xl border border-gray-200 dark:border-gray-700">
            <CardHeader className="relative">
              <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Bell className="w-6 h-6 text-blue-500" />
                <span>Mes Notifications</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={onClose}
                aria-label="Fermer le panneau des notifications"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Aucune notification pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          variants={notificationVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                        >
                          <div
                            className={`p-4 rounded-lg cursor-pointer ${
                              notification.read ? 'bg-gray-100 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900/50'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                    {notification.title}
                                  </h3>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDateSafely(notification.createdAt)}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                          </div>
                          {index < notifications.length - 1 && <Separator className="my-2" />}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationsPanel;