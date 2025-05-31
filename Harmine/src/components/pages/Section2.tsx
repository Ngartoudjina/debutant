import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Truck, PackageCheck, WalletCards, MapPin } from "lucide-react";

export default function Features() {
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial="hidden"
          whileInView="visible"
          variants={fadeIn}
          className="text-3xl font-bold text-center mb-8 dark:text-white"
        >
          Comment ça marche ?
        </motion.h2>

        <Tabs defaultValue="client" className="w-full">
          <TabsList className="grid grid-cols-2 max-w-md mx-auto mb-8 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger 
              value="client"
              className="data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              Client
            </TabsTrigger>
            <TabsTrigger 
              value="coursier"
              className="data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              Coursier
            </TabsTrigger>
          </TabsList>

          {/* Pour les Clients */}
          <TabsContent value="client">
            <div className="grid md:grid-cols-3 gap-6">
              {clientFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
                      <feature.icon size={24} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 dark:text-white">{feature.title}</h3>
                  <p className="text-muted-foreground dark:text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Pour les Coursiers */}
          <TabsContent value="coursier">
            <div className="grid md:grid-cols-3 gap-6">
              {courierFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <feature.icon size={24} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 dark:text-white">{feature.title}</h3>
                  <p className="text-muted-foreground dark:text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

// Données (inchangées)
const clientFeatures = [
  {
    icon: MapPin,
    title: "Suivi en temps réel",
    description: "Visualisez la position de votre coursier sur une carte en direct"
  },
  {
    icon: PackageCheck,
    title: "Livraison express",
    description: "Recevez vos colis en moins de 45 minutes en moyenne"
  },
  {
    icon: WalletCards,
    title: "Paiement sécurisé",
    description: "Cash à la livraison ou paiement mobile (Wave, Orange Money...)"
  }
];

const courierFeatures = [
  {
    icon: Truck,
    title: "Gains flexibles",
    description: "Jusqu'à 25 000 FCFA/jour selon vos disponibilités"
  },
  {
    icon: MapPin,
    title: "Commandes proches",
    description: "Système de géolocalisation pour minimiser les trajets"
  },
  {
    icon: WalletCards,
    title: "Paiement instantané",
    description: "Virements quotidiens sur votre compte mobile"
  }
];