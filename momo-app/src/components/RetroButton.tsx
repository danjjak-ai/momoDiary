"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const RetroButton = ({ 
  children, 
  onClick, 
  className,
  variant = "primary",
  size = "md",
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}) => {
  const variants = {
    primary: "bg-primary text-white border-primary shadow-[0_6px_0_#3d5a8c] active:shadow-none active:translate-y-[6px]",
    secondary: "bg-white text-ink border-line shadow-[0_6px_0_#e6ded2] active:shadow-none active:translate-y-[6px]",
    accent: "bg-accent-coral text-white border-accent-coral shadow-[0_6px_0_#b55a4a] active:shadow-none active:translate-y-[6px]",
  };

  const sizes = {
    sm: "px-4 py-2 text-[12px]",
    md: "px-6 py-3 text-[14px]",
    lg: "px-8 py-4 text-[16px]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "font-bold rounded-xl border transition-all duration-75 flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        disabled && "opacity-50 grayscale cursor-not-allowed shadow-none translate-y-0",
        className
      )}
    >
      {children}
    </button>
  );
};
