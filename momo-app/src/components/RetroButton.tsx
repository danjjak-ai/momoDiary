"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg" | "icon";
}

export const RetroButton = ({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: RetroButtonProps) => {
  const variants = {
    primary: "bg-[#ffff00] text-black border-[#000]",
    secondary: "bg-[#00ffff] text-black border-[#000]",
    accent: "bg-[#ff00ff] text-white border-[#000]",
  };

  const sizes = {
    sm: "px-2 py-1 text-[10px]",
    md: "px-4 py-2 text-[12px]",
    lg: "px-6 py-3 text-[14px]",
    icon: "w-10 h-10 flex items-center justify-center rounded-full",
  };

  return (
    <button
      className={cn(
        "font-pixel beveled-button border-2 active:shadow-none active:translate-y-[2px] active:translate-x-[2px]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
