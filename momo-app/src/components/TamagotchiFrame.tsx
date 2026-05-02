"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const TamagotchiFrame = ({ 
  children, 
  className,
  shellColor = "#ff7eb9"
}: { 
  children: React.ReactNode; 
  className?: string;
  shellColor?: string;
}) => {
  return (
    <div 
      className={cn(
        "relative w-[340px] h-[460px] rounded-[100px] border-[12px] border-bezel shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center p-6 transition-colors duration-500",
        "before:absolute before:inset-0 before:rounded-[88px] before:border-[4px] before:border-white/20 before:pointer-events-none",
        className
      )}
      style={{ backgroundColor: shellColor }}
    >
      {/* Device Brand/Name */}
      <div className="absolute top-8 text-[10px] font-pixel text-white/80 tracking-widest uppercase">
        DANJJAK-01
      </div>

      {/* The Screen Area */}
      <div className="w-full h-[280px] lcd-screen rounded-xl relative overflow-hidden flex flex-col">
        <div className="scanline" />
        {children}
      </div>

      {/* Controls */}
      <div className="flex gap-8 mt-8">
        <div className="w-12 h-12 bg-[#333] rounded-full border-4 border-black/20 shadow-lg active:translate-y-1 transition-all" />
        <div className="w-12 h-12 bg-[#333] rounded-full border-4 border-black/20 shadow-lg active:translate-y-1 transition-all" />
        <div className="w-12 h-12 bg-[#333] rounded-full border-4 border-black/20 shadow-lg active:translate-y-1 transition-all" />
      </div>

      {/* Decorative details */}
      <div className="absolute bottom-6 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-black/20" />
        <div className="w-2 h-2 rounded-full bg-black/20" />
      </div>
    </div>
  );
};
