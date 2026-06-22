import { getToken, onMessage } from "firebase/messaging";
import { API_URL } from '../pages/config';
import { getMessagingInstance } from "../../../firebaseConfig";
import axios from "axios";
import type { User as FirebaseUser } from "firebase/auth";

export const setupFCM = async (user: FirebaseUser) => {
  console.log("🔔 Début setupFCM pour userId:", user?.uid || "UNDEFINED!");
  let fcmToken = null;

  try {
    if (!user || !user.uid) {
      console.error("❌ user ou user.uid manquant:", { user: !!user, uid: user?.uid });
      throw new Error("Utilisateur ou identifiant utilisateur manquant");
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("⚠️ Notifications non supportées");
      throw new Error("Notifications non supportées par ce navigateur");
    }

    // Demander la permission immédiatement
    console.log("📜 Demande de permission notifications...");
    const permission = await Notification.requestPermission();
    console.log("📜 Permission notification:", permission);
    if (permission !== "granted") {
      console.warn("⚠️ Permission notifications refusée");
    }

    const messaging = await getMessagingInstance();
    if (!messaging) {
      throw new Error("Impossible d'initialiser Firebase Messaging");
    }

    const vapidKey = import.meta.env.VITE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error("VITE_VAPID_KEY non définie");
    }

    console.log("📡 Enregistrement Service Worker...");
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/firebase-cloud-messaging-push-scope",
    });
    console.log("✅ Service Worker enregistré:", registration);

    // Attendre l'activation
    await new Promise<void>((resolve, reject) => {
      if (registration.active) {
        console.log("✅ Service Worker déjà actif");
        resolve();
      } else {
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "activated") {
                console.log("✅ Service Worker activé");
                resolve();
              }
            });
          }
        });
        setTimeout(() => reject(new Error("Timeout: Service Worker non activé")), 10000);
      }
    });

    if (permission === "granted") {
      console.log("🔑 Génération token FCM...");
      fcmToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      console.log("✅ Token FCM généré:", fcmToken);

      onMessage(messaging, (payload) => {
        console.log("📨 Notification reçue:", payload);
        if (document.visibilityState === "visible") {
          const notificationTitle = payload.notification?.title || "Nouvelle notification";
          const notificationOptions = {
            body: payload.notification?.body || "Vous avez reçu un message",
            icon: "/logo-dynamism1.png",
            tag: "coursier-notification",
          };
          new Notification(notificationTitle, notificationOptions);
        }
      });
    }

    // Envoyer le token au backend
    const idToken = await user.getIdToken(true);
    console.log("🌐 Envoi token pour userId:", user.uid);
    await axios.post(
      `${API_URL}/api/notifications/register`,
      {
        fcmToken: fcmToken || null,
        userId: user.uid,
      },
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    console.log("✅ Token FCM envoyé au backend:", fcmToken || "null");
  } catch (error: any) {
    console.error("❌ Erreur setupFCM:", error);
    
    
    if (user && user.uid) {
      try {
        const idToken = await user.getIdToken(true);
        await axios.post(
          `${API_URL}/api/notifications/register`,
          {
            fcmToken: null,
            userId: user.uid,
          },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );
        console.log("✅ Token null envoyé au backend");
      } catch (fallbackError) {
        console.error("❌ Erreur envoi token null:", fallbackError);
      }
    }
  }

  return fcmToken;
};