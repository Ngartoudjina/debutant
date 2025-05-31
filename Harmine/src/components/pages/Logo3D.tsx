import { motion } from "framer-motion";
import React from "react";

// Définir les props du composant
interface Logo3DProps {
  img: string; // `img` est une chaîne de caractères représentant l'URL de l'image
}

const Logo3D: React.FC<Logo3DProps> = ({ img }) => (
  <motion.div
    style={{
      perspective: 1000, // Ajoute une perspective
      width: "100%",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <motion.img
      src={img} // Utilise l'URL de l'image passée en prop
      alt="Logo"
      style={{
        width: 120,
        height: 120,
      }}
      animate={{
        rotateY: 360, // Rotation en 3D autour de l'axe Y
        rotateX: 0, // Rotation en 3D autour de l'axe X
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  </motion.div>
);

export default Logo3D;