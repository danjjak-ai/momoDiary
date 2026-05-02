"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface PixelCharacterProps {
  mood?: "happy" | "neutral" | "sad";
  size?: number;
  hue?: number;
  accessory?: "none" | "hat" | "glasses" | "ribbon";
}

export const PixelCharacter = ({ 
  mood = "neutral", 
  size = 150, 
  hue = 0,
  accessory = "none" 
}: PixelCharacterProps) => {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div style={{ filter: `hue-rotate(${hue}deg)` }}>
        <Image
          src="/character.png"
          alt="Momo"
          width={size}
          height={size}
          className="pixelated object-contain"
          priority
        />
      </div>
      
      {/* Accessories */}
      {accessory === "hat" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-2xl">👒</div>
      )}
      {accessory === "glasses" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-4 text-2xl">🕶️</div>
      )}
      {accessory === "ribbon" && (
        <div className="absolute top-6 right-6 text-2xl">🎀</div>
      )}
      
      {mood === "happy" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-4 -right-4 text-2xl"
        >
          ✨
        </motion.div>
      )}
    </motion.div>
  );
};
