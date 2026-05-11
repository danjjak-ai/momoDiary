"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const TamagotchiFrame = ({ 
  children, 
  className,
  shellColor = "#25262b"
}: { 
  children: React.ReactNode; 
  className?: string;
  shellColor?: string;
}) => {
  return (
    <div 
      className={cn(
        "relative w-[390px] h-[800px] rounded-[42px] border-[12px] border-[#25262b] shadow-2xl flex flex-col items-center p-3 transition-colors duration-500",
        "before:absolute before:inset-0 before:rounded-[30px] before:border-[1px] before:border-white/10 before:pointer-events-none",
        className
      )}
      style={{ backgroundColor: shellColor }}
    >
      {/* Device Brand/Name */}
      <div className="status w-full flex justify-between px-6 py-2 text-[10px] text-white/40 font-pixel">
        <span>21:00</span>
        <span className="tracking-widest uppercase">DANJJAK v1.0</span>
        <span>82%</span>
      </div>

      {/* The Screen Area */}
      <div className="w-full h-[640px] lcd-screen rounded-[32px] relative overflow-hidden flex flex-col mt-2">
        {children}
      </div>

      {/* Modern Touch Bar instead of buttons */}
      <div className="w-32 h-1.5 bg-white/20 rounded-full mt-auto mb-4" />
    </div>
  );
};
