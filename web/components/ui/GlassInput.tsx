"use client";

import { type InputHTMLAttributes } from "react";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function GlassInput({ label, className = "", ...props }: GlassInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs text-white/50 font-medium tracking-wide uppercase">
          {label}
        </label>
      )}
      <input
        className={`
          w-full rounded-xl
          bg-white/5 backdrop-blur-xl
          border border-white/10
          px-4 py-3
          text-sm text-white/90
          placeholder:text-white/30
          outline-none
          transition-all duration-300
          focus:border-white/20 focus:bg-white/[0.07]
          focus:ring-1 focus:ring-emerald-500/30
          ${className}
        `}
        {...props}
      />
    </div>
  );
}
