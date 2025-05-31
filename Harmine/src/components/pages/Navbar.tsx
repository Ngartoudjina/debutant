import React, { useState, useEffect, useRef, useCallback } from 'react';
import logo from '/logo-dynamism1.png';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Bell, MapPin, Package, User, Moon, Sun } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import NotificationsPanel from './NotificationsPanel';
import { toast } from 'react-toastify';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig';
import { Notification } from '../types/notification'
// Interfaces
interface ListItemProps extends React.ComponentPropsWithoutRef<'a'> {
  title: string;
  children: React.ReactNode;
  href: string;
}

interface ComponentItem {
  title: string;
  href: string;
  description: string;
  icon?: React.ReactNode;
}


const components: ComponentItem[] = [
  {
    title: 'À propos',
    href: '/propos',
    description:
      'Découvrez notre mission et notre engagement envers l’excellence du service de livraison.',
    icon: <Package className="h-4 w-4" />,
  },
  {
    title: 'Contact',
    href: '/contact',
    description:
      'Notre équipe est disponible 24/7 pour répondre à toutes vos questions.',
    icon: <User className="h-4 w-4" />,
  },
  {
    title: 'Clients',
    href: '/client',
    description:
      'Gérez vos commandes, suivez vos livraisons et personnalisez vos préférences.',
    icon: <MapPin className="h-4 w-4" />,
  },
];

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 focus:bg-blue-50 focus:text-blue-600 ${className}`}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-gray-500 dark:text-gray-400">
              {children}
            </p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = 'ListItem';

export default function Navbar(): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const previousCountRef = useRef<number>(0);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        console.log('✅ Utilisateur connecté:', user.uid);
      } else {
        setUserId(null);
        setNotificationsCount(0);
        setNotifications([]);
        previousCountRef.current = 0;
        console.log('⚠️ Aucun utilisateur connecté');
      }
    });

    return () => unsubscribe();
  }, []);

  // Set up Firestore real-time listener for notifications
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setNotificationsCount(0);
      previousCountRef.current = 0;
      return;
    }

    console.log('📡 Configuration du listener pour userId:', userId);
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const updatedNotifications: Notification[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          read: doc.data().read || false,
          userId: doc.data().userId || '',
          title: doc.data().title || 'Sans titre',
          message: doc.data().message || 'Aucun message',
          type: doc.data().type || 'UNKNOWN',
          createdAt: doc.data().createdAt || new Date().toISOString(),
          data: doc.data().data || {},
        }));

        setNotifications(updatedNotifications);
        const unreadCount = updatedNotifications.filter((n) => !n.read).length;
        setNotificationsCount(unreadCount);

        // Trigger toast only for new notifications
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && !change.doc.data().read) {
            console.log('🆕 Nouvelle notification:', change.doc.data().title);
            toast.info(`Nouvelle notification: ${change.doc.data().title || 'Vous avez une nouvelle notification'}`);
          }
        });

        previousCountRef.current = unreadCount;
        console.log(`🔔 ${unreadCount} notifications non lues`);
      },
      (error) => {
        console.error('❌ Erreur listener:', error);
        toast.error('Erreur lors du chargement des notifications');
        setNotifications([]);
        setNotificationsCount(0);
        previousCountRef.current = 0;
      }
    );

    return () => {
      console.log('🛑 Arrêt du listener');
      unsubscribe();
    };
  }, [userId]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Manage body scroll when menu or notifications panel is open
  useEffect(() => {
    if (isMenuOpen || showNotifications) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isMenuOpen, showNotifications]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
    console.log('Menu ouvert ?', !isMenuOpen);
  };

  const handleNotificationsClick = () => {
    setShowNotifications(true);
    console.log('🔔 Ouverture du panneau de notifications');
  };

  const handleCloseNotifications = useCallback(() => {
    setShowNotifications(false);
    console.log('🔔 Fermeture du panneau de notifications');
  }, []);

  return (
    <>
      <nav
        className={`fixed w-full top-0 z-[99999] transition-all duration-300 ${
          isScrolled
            ? 'bg-white dark:bg-gray-900 shadow-lg'
            : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md'
        }`}
      >
        <div className="container mx-auto flex justify-between items-center sm:px-10 sm:py-4 p-4">
          {/* Logo */}
          <a href="/" className="flex items-center group">
            <img
              src={logo}
              alt="Logo"
              className="w-16 h-16 transition-transform group-hover:scale-105"
            />
            <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Dynamism Express
            </span>
          </a>

          {/* Notification and dark mode icons for larger screens */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
            >
              {isDarkMode ? (
                <Sun className="w-6 h-6 text-yellow-400" />
              ) : (
                <Moon className="w-6 h-6 text-gray-900 dark:text-gray-100" />
              )}
            </button>
            <button
              className="relative p-2 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-colors"
              onClick={handleNotificationsClick}
              aria-label="Ouvrir les notifications"
            >
              <Bell className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              {notificationsCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 bg-red-500 text-white"
                  variant="default"
                >
                  {notificationsCount}
                </Badge>
              )}
            </button>
          </div>

          {/* Hamburger menu for mobile */}
          <button
            className="md:hidden focus:outline-none z-50"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <div className="space-y-2">
              <div
                className={`w-8 h-1 bg-gray-800 dark:bg-gray-100 transition-transform duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                }`}
              ></div>
              <div
                className={`w-8 h-1 bg-gray-800 dark:bg-gray-100 transition-opacity duration-300 ${
                  isMenuOpen ? 'opacity-0' : ''
                }`}
              ></div>
              <div
                className={`w-8 h-1 bg-gray-800 dark:bg-gray-100 transition-transform duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                }`}
              ></div>
            </div>
          </button>

          {/* Navigation for medium and large screens */}
          <div className="hidden md:flex">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 focus:bg-blue-50">
                    Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-br from-blue-50 dark:from-gray-700 via-blue-100 dark:via-gray-600 to-blue-50 dark:to-gray-700 p-6 no-underline outline-none focus:shadow-md transition-all hover:shadow-lg"
                            href="/services"
                          >
                            <Package className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-4" />
                            <div className="mb-2 mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                              Services de livraison
                            </div>
                            <p className="text-sm leading-tight text-gray-500 dark:text-gray-400">
                              Solutions de livraison rapides et fiables pour tous vos besoins.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="/reserv" title="Réservation express">
                        Réservez un coursier en quelques clics pour une livraison immédiate
                      </ListItem>
                      <ListItem href="/suivi" title="Suivi en temps réel">
                        Suivez vos colis en temps réel avec notre système GPS
                      </ListItem>
                      <ListItem href="/entreprise" title="Solutions entreprise">
                        Services personnalisés pour les professionnels
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 focus:bg-blue-50">
                    Ressources
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {components.map((component) => (
                        <ListItem
                          key={component.title}
                          title={component.title}
                          href={component.href}
                        >
                          {component.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 focus:bg-blue-50">
                    Devenir coursier
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="w-[300px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <div className="p-4">
                      <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">
                        Rejoignez notre équipe
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Devenez coursier partenaire et bénéficiez de nombreux avantages :
                      </p>
                      <ul className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          Horaires flexibles
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          Revenus attractifs
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          Support 24/7
                        </li>
                      </ul>
                      <a
                        href="/coursier"
                        className="block w-full text-center bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors rounded-md"
                      >
                        S'inscrire comme coursier
                      </a>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <a
                    href="/login"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none bg-blue-600 text-white hover:bg-blue-700 px-4 py-2"
                  >
                    Se connecter
                  </a>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 bg-white dark:bg-gray-900 z-[60] transition-all duration-300 ease-in-out ${
          isMenuOpen
            ? 'opacity-100 translate-x-0 visible'
            : 'opacity-0 translate-x-full invisible'
        } md:hidden`}
        style={{ height: isMenuOpen ? '100vh' : '0' }}
      >
        <div className="h-full overflow-y-auto px-4 pt-20 pb-6 bg-white dark:bg-gray-900">
          <button
            className="absolute top-6 right-4 p-2 focus:outline-none"
            onClick={toggleMenu}
            aria-label="Close menu"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-300"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="services"
              className="border-b border-gray-200 dark:border-gray-700"
            >
              <AccordionTrigger className="text-xl font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
                Services
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <a
                  href="/reserv"
                  className="block py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Réservation express
                </a>
                <a
                  href="/suivi"
                  className="block py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Suivi en temps réel
                </a>
                <a
                  href="/entreprise"
                  className="block py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Solutions entreprise
                </a>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="resources"
              className="border-b border-gray-200 dark:border-gray-700"
            >
              <AccordionTrigger className="text-xl font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
                Ressources
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {components.map((component) => (
                  <a
                    key={component.title}
                    href={component.href}
                    className="block py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {component.icon}
                      {component.title}
                    </span>
                  </a>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="courier"
              className="border-b border-gray-200 dark:border-gray-700"
            >
              <AccordionTrigger className="text-xl font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
                Devenir coursier
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Rejoignez notre équipe de coursiers et profitez de :
                  </p>
                  <ul className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Horaires flexibles
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Revenus attractifs
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Support 24/7
                    </li>
                  </ul>
                  <a
                    href="/coursier"
                    className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    S'inscrire comme coursier
                  </a>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-6 space-y-4">
            <a
              href="/login"
              className="block w-full text-center bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Se connecter
            </a>
            <button
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              onClick={handleNotificationsClick}
              aria-label="Ouvrir les notifications"
            >
              <span className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                Notifications
              </span>
              {notificationsCount > 0 && (
                <Badge variant="default" className="bg-red-500">
                  {notificationsCount}
                </Badge>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications panel */}
      {showNotifications && (
        <NotificationsPanel
          notifications={notifications}
          onClose={handleCloseNotifications}
        />
      )}
    </>
  );
}