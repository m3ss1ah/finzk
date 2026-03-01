"use client";

import { motion } from "framer-motion";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "emerald";
  className?: string;
}

const variants = {
  primary:
    "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40",
  secondary:
    "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20",
  emerald:
    "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40",
};

export default function GlowButton({
  children,
  variant = "primary",
  className = "",
  disabled,
  ...props
}: GlowButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl px-6 py-3
        font-medium text-sm
        transition-all duration-300
        cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
