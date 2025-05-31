import { useEffect, useRef } from "react";
import { auth } from "../../../firebaseConfig";
import { toast } from "react-toastify";
import { setupFCM } from "../utils/fcm";

const NotificationsSetup = () => {
  const isSetupRef = useRef(false);

  useEffect(() => {
    // Éviter l'exécution sur la page d'inscription
    if (window.location.pathname.includes("/inscription")) {
      console.log("NotificationsSetup ignoré sur la page d'inscription");
      return;
    }

    // Éviter les exécutions multiples
    if (isSetupRef.current) {
      console.log("NotificationsSetup déjà exécuté, ignoré");
      return;
    }
    isSetupRef.current = true;

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.uid) {
        console.log("🔍 Utilisateur détecté, lancement setupFCM:", user.uid);
        // Afficher un message incitatif avant de demander la permission
        toast.info(
          "Activez les notifications pour recevoir des mises à jour en temps réel sur vos commandes !",
          {
            autoClose: 5000,
            onClose: () => {
              // Lancer setupFCM après l'affichage du toast
              setupFCM(user).catch((error) => {
                console.error("❌ Erreur setupFCM:", error);
                toast.warn(
                  "Impossible de configurer les notifications. Vérifiez les paramètres de votre navigateur.",
                  {
                    onClick: () =>
                      window.open(
                        "https://support.google.com/chrome/answer/6148059?hl=fr",
                        "_blank"
                      ),
                  }
                );
              });
            },
          }
        );
      } else {
        console.log("ℹ️ Aucun utilisateur connecté, setupFCM ignoré");
      }
    });

    return () => {
      unsubscribe();
      isSetupRef.current = false;
    };
  }, []);

  return null;
};

export default NotificationsSetup;