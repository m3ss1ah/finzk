"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

const LINES = [
  { prompt: "zkaid", text: "Loading financial profile..." },
  { prompt: "zkaid", text: "Generating zero-knowledge proof..." },
  { prompt: "snarkjs", text: "groth16.fullProve() → ✓ proof generated" },
  { prompt: "zkaid", text: "Eligibility: VERIFIED" },
  { prompt: "zkaid", text: "Private data disclosed: NONE" },
];

export default function HeroTerminal() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines < LINES.length) {
      const timer = setTimeout(() => setVisibleLines((v) => v + 1), 800);
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="
        w-full max-w-xl mx-auto
        rounded-2xl overflow-hidden
        bg-black/40 backdrop-blur-xl
        border border-white/10
        shadow-2xl shadow-black/40
        font-mono text-sm
      "
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-amber-500/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        <span className="ml-3 text-xs text-white/30">zk-aid-terminal</span>
      </div>

      {/* Output */}
      <div className="p-4 space-y-1.5 min-h-[180px]">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="flex gap-2"
          >
            <span className="text-emerald-400/70 select-none">{line.prompt} $</span>
            <span
              className={
                line.text.includes("VERIFIED")
                  ? "text-emerald-400 font-semibold"
                  : line.text.includes("NONE")
                  ? "text-amber-400"
                  : "text-white/70"
              }
            >
              {line.text}
            </span>
          </motion.div>
        ))}

        {/* Blinking cursor */}
        {visibleLines >= LINES.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-2 h-4 bg-emerald-400/80 ml-1"
          />
        )}
      </div>
    </motion.div>
  );
}
