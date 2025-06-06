import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Configuration Firebase avec variables d'environnement
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialisation de l'application Firebase seulement si elle n'existe pas
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Initialisation asynchrone de messaging
let messagingInstance: any = null;
const initializeMessaging = async () => {
  if (typeof window !== 'undefined' && !messagingInstance) {
    const supported = await isSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
    }
  }
  return messagingInstance;
};

// Exporter une fonction pour récupérer messaging
export const getMessagingInstance = async () => {
  await initializeMessaging();
  return messagingInstance;
};

export const signInWithCustomTokenAuth = async (token: string) => {
  try {
    const userCredential = await signInWithCustomToken(auth, token);
    return userCredential.user;
  } catch (error) {
    console.error('Erreur lors de la connexion avec le token personnalisé:', error);
    throw error;
  }
};

export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error("L'utilisateur n'existe pas dans la base de données");
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de réinitialisation:", error);
    throw error;
  }
};

export const authStateObserver = (callback: (data: { user: any; isAuthenticated: boolean }) => void) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({ user, isAuthenticated: true });
    } else {
      callback({ user: null, isAuthenticated: false });
    }
  });
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const idToken = await user.getIdToken();
    localStorage.setItem('authToken', idToken);
  } else {
    localStorage.removeItem('authToken');
  }
});

export const requestNotificationPermission = async () => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.log('FCM non supporté sur ce navigateur');
      return null;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Permission de notification accordée');
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_VAPID_KEY, // Utiliser Vite env
      });
      return token;
    } else {
      console.log('Permission de notification refusée');
      return null;
    }
  } catch (error) {
    console.error('Erreur lors de la demande de permission:', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    getMessagingInstance().then((messaging) => {
      if (messaging) {
        onMessage(messaging, (payload) => {
          resolve(payload);
        });
      } else {
        resolve(null);
      }
    });
  });

export { app, auth, db };