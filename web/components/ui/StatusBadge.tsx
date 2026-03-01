"use client";

import { motion } from "framer-motion";

type StatusType = "verified" | "pending" | "rejected" | "audit";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const config: Record<StatusType, { bg: string; dot: string; text: string; defaultLabel: string }> = {
  verified: {
    bg: "bg-emerald-500/10 border-emerald-500/30",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    defaultLabel: "Verified",
  },
  pending: {
    bg: "bg-amber-500/10 border-amber-500/30",
    dot: "bg-amber-400",
    text: "text-amber-400",
    defaultLabel: "Pending",
  },
  rejected: {
    bg: "bg-red-500/10 border-red-500/30",
    dot: "bg-red-400",
    text: "text-red-400",
    defaultLabel: "Rejected",
  },
  audit: {
    bg: "bg-indigo-500/10 border-indigo-500/30",
    dot: "bg-indigo-400",
    text: "text-indigo-400",
    defaultLabel: "Audit Required",
  },
};

export default function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
  const c = config[status];
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-1.5
        rounded-full border px-3 py-1
        text-xs font-medium
        ${c.bg} ${c.text}
        ${className}
      `}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {label ?? c.defaultLabel}
    </motion.span>
  );
}
