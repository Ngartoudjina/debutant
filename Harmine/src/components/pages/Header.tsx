import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, PhoneCall, Award, Zap, Shield, Clock } from "lucide-react";

// Import your original images
import header from "../../img/logo-dynamism2.png";
import vector from "../../img/vector.jpeg";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  
  // Parallax effects
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const textY = useTransform(scrollY, [0, 500], [0, -50]);

  useEffect(() => {
    const checkScroll = () => setIsScrolled(window.innerWidth > 400);
    checkScroll();
    window.addEventListener("resize", checkScroll);
    
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      setMousePosition({ 
        x: (clientX / innerWidth - 0.5) * 100, 
        y: (clientY / innerHeight - 0.5) * 100 
      });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("resize", checkScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 20,
        mass: 1
      }
    }
  };

  const floatingAnimation = {
    y: [0, -15, 0],
    rotate: [0, 2, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Composant pour les icônes avec gradient
  const GradientIcon = ({ IconComponent, gradientId, colors }) => (
    <div className="relative">
      <svg className="w-6 h-6 absolute opacity-0">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        </defs>
      </svg>
      <IconComponent 
        className="w-6 h-6" 
        style={{ fill: `url(#${gradientId})`, stroke: `url(#${gradientId})` }}
      />
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-gray-900 to-purple-900">
      {/* Définitions SVG pour les gradients */}
      <svg className="absolute w-0 h-0">
        <defs>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>

      {/* Enhanced Background Elements */}
      <motion.div 
        className="absolute inset-0 overflow-hidden"
        style={{ y: backgroundY }}
      >
        {/* Animated background pattern */}
        <div 
          className="absolute w-full h-full opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/40 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600),
            }}
            animate={{
              y: [0, -80, 0],
              x: [0, Math.random() * 60 - 30, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>

      {/* Interactive Grid Background */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          x: mousePosition.x * 0.02,
          y: mousePosition.y * 0.02,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
      >
        <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      </motion.div>

      <div className="relative container mx-auto px-6 py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col lg:flex-row items-center justify-between gap-16"
        >
          {/* Left Content Section */}
          <motion.div
            style={{ y: textY }}
            className="flex flex-col gap-y-8 lg:w-1/2"
          >
            {/* Premium Badge */}
            <motion.div
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "rgba(255, 255, 255, 0.15)"
              }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full w-fit border border-white/20 cursor-pointer"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <Sparkles className="text-yellow-400 w-4 h-4" />
              </motion.div>
              <span className="text-sm font-medium text-gray-200">
                Service Premium de Livraison
              </span>
            </motion.div>

            {/* Enhanced Title */}
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-6xl font-bold leading-tight tracking-tight"
            >
              <motion.span 
                className="block mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: "300% 300%"
                }}
              >
                Livraison Rapide
              </motion.span>
              <span className="block text-white relative">
                et Sécurisée
                <motion.span
                  className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "100%", opacity: 1 }}
                  transition={{ delay: 1.5, duration: 1.2, ease: "easeOut" }}
                />
                <motion.span
                  className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-white to-transparent rounded-full"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: ["0%", "30%", "0%"], opacity: [0, 1, 0] }}
                  transition={{ delay: 2.5, duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              variants={itemVariants}
              className="text-xl text-gray-300 leading-relaxed max-w-xl"
            >
              Confiez-nous vos colis et profitez d'une livraison express, fiable
              et à votre porte. Notre engagement: votre satisfaction.
            </motion.p>

            {/* Enhanced Action Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap gap-6 mt-8"
            >
              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => console.log('Navigate to /propos')}
                className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full overflow-hidden font-medium cursor-pointer"
              >
                <span className="relative z-10">En savoir plus</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.div>
                <motion.div 
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>

              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  borderColor: "rgba(255, 255, 255, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => console.log('Navigate to /coursier')}
                className="group relative inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-full backdrop-blur-lg transition-colors font-medium cursor-pointer"
              >
                <span>Devenir Coursier</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 1 }}
                />
              </motion.div>
            </motion.div>

            {/* Enhanced Statistics - 10k+ Livraisons, 98% Satisfaction, 24/7 Support */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10"
            >
              {[
                { 
                  number: "10k+", 
                  label: "Livraisons", 
                  description: "Colis livrés avec succès",
                  icon: Zap, 
                  gradientId: "blueGradient",
                  bgGradient: "from-blue-500/20 to-cyan-500/20"
                },
                { 
                  number: "98%", 
                  label: "Satisfaction", 
                  description: "Clients satisfaits",
                  icon: Shield, 
                  gradientId: "greenGradient",
                  bgGradient: "from-green-500/20 to-emerald-500/20"
                },
                { 
                  number: "24/7", 
                  label: "Support", 
                  description: "Assistance disponible",
                  icon: Clock, 
                  gradientId: "purpleGradient",
                  bgGradient: "from-purple-500/20 to-pink-500/20"
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: 2 + index * 0.2,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  className={`relative text-center group cursor-pointer flex flex-col items-center p-6 rounded-xl bg-gradient-to-br ${stat.bgGradient} border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300`}
                >
                  {/* Icône avec animation */}
                  <motion.div
                    className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-white/10 backdrop-blur-lg border border-white/20"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 3, -3, 0],
                      boxShadow: [
                        "0 0 20px rgba(255,255,255,0.1)",
                        "0 0 30px rgba(255,255,255,0.2)",
                        "0 0 20px rgba(255,255,255,0.1)"
                      ]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.5
                    }}
                  >
                    <stat.icon 
                      className="w-7 h-7" 
                      style={{ 
                        fill: `url(#${stat.gradientId})`,
                        stroke: `url(#${stat.gradientId})`,
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                      }}
                    />
                  </motion.div>

                  {/* Chiffre principal */}
                  <motion.div 
                    className="text-4xl font-bold mb-2"
                    animate={{
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1 + index * 0.3
                    }}
                    style={{
                      background: `linear-gradient(135deg, 
                        ${stat.gradientId === 'blueGradient' ? '#60a5fa, #22d3ee' : 
                          stat.gradientId === 'greenGradient' ? '#4ade80, #10b981' : 
                          '#a855f7, #ec4899'})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}
                  >
                    {stat.number}
                  </motion.div>

                  {/* Label principal */}
                  <div className="text-lg font-semibold text-white mb-1">
                    {stat.label}
                  </div>

                  {/* Description */}
                  <div className="text-sm text-gray-300 opacity-80">
                    {stat.description}
                  </div>

                  {/* Effet de brillance au survol */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />

                  {/* Particules flottantes */}
                  <motion.div
                    className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full"
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.7
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Texte de confiance additionnel */}
            <motion.div
              variants={itemVariants}
              className="text-center mt-8"
            >
              <motion.p 
                className="text-gray-400 text-sm"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                Plus de <span className="text-blue-400 font-semibold">10 000</span> clients nous font confiance • 
                <span className="text-green-400 font-semibold"> 98%</span> de satisfaction client • 
                Support <span className="text-purple-400 font-semibold">24h/24 et 7j/7</span>
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Right Content - Image Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ 
              duration: 1.2, 
              delay: 0.5, 
              type: "spring", 
              stiffness: 60,
              damping: 20
            }}
            className="relative lg:w-1/2"
          >
            <motion.div 
              className="relative"
              animate={floatingAnimation}
            >
              {/* Enhanced Glowing Background */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/20 to-pink-500/30 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Main Image with Enhanced Effects */}
              <motion.img
                src={header}
                alt="Illustration livraison"
                className="relative z-10 w-full max-w-[600px] h-auto object-cover rounded-3xl shadow-2xl border border-white/20 backdrop-blur-xl"
                whileHover={{ 
                  scale: 1.02, 
                  rotateY: 8,
                  rotateX: 2,
                  boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)"
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />

              {/* Enhanced Support Card */}
              <AnimatePresence>
                {isScrolled && (
                  <motion.div
                    initial={{ opacity: 0, x: -120, rotate: -15, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -120, scale: 0.8 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 100, 
                      damping: 20,
                      delay: 1 
                    }}
                    whileHover={{ 
                      y: -10, 
                      scale: 1.05,
                      rotateY: 8,
                      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.4)"
                    }}
                    className="absolute -left-16 bottom-8 w-72 bg-gradient-to-br from-blue-900/80 to-purple-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-2xl cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <motion.img
                          src={vector}
                          alt="Contact"
                          className="w-16 h-16 rounded-xl object-cover border-2 border-white/30"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.3 }}
                        />
                        <motion.div 
                          className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"
                          animate={{ 
                            scale: [1, 1.3, 1],
                            boxShadow: ["0 0 0 0 rgba(34, 197, 94, 0.7)", "0 0 0 8px rgba(34, 197, 94, 0)", "0 0 0 0 rgba(34, 197, 94, 0)"]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <div>
                        <h3 className="text-white font-bold flex items-center gap-2">
                          <motion.div
                            animate={{ 
                              rotate: [0, 15, -15, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <PhoneCall className="w-5 h-5 text-green-400" />
                          </motion.div>
                          Support 24/7
                        </h3>
                        <p className="text-gray-300 text-sm mt-1">
                          Assistance immédiate
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced Award Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.3, rotate: -60 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15,
                  delay: 1.5 
                }}
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 8,
                  y: -8
                }}
                className="absolute -right-4 md:-right-12 top-1/4 w-48 md:w-64 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-yellow-400/30 shadow-2xl cursor-pointer z-20"
              >
                <div className="flex flex-col items-center gap-3 md:gap-4">
                  <div className="relative">
                    <motion.div 
                      className="bg-gradient-to-br from-yellow-400 to-orange-500 w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center shadow-2xl"
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(251, 191, 36, 0.5)",
                          "0 0 40px rgba(251, 191, 36, 0.8)",
                          "0 0 20px rgba(251, 191, 36, 0.5)"
                        ],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <motion.span 
                        className="text-4xl md:text-5xl font-bold text-white"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        1
                      </motion.span>
                    </motion.div>
                    <motion.div
                      animate={{ 
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.2, 1],
                        y: [0, -2, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Award className="absolute -top-2 -right-2 w-6 h-6 md:w-8 md:h-8 text-yellow-300 drop-shadow-lg" />
                    </motion.div>
                  </div>
                  <motion.p 
                    className="text-white text-xs md:text-sm font-medium text-center"
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Leader National des Services de Livraison
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}