"use client";

import MainLayout from "@/components/layout/MainLayout";
import HeroTerminal from "@/components/ui/HeroTerminal";
import GlowButton from "@/components/ui/GlowButton";
import GlassCard from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Shield,
    title: "Zero-Knowledge Proofs",
    description:
      "Prove your scholarship eligibility without revealing any personal financial data.",
  },
  {
    icon: Lock,
    title: "End-to-End Privacy",
    description:
      "Your income, grades, and identity stay on your device. Only the proof leaves.",
  },
  {
    icon: Eye,
    title: "Transparent Verification",
    description:
      "Admins verify eligibility cryptographically — no access to underlying records.",
  },
];

export default function HomePage() {
  return (
    <MainLayout>
      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <Shield className="h-3 w-3" />
            Privacy-First Scholarship Platform
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]"
        >
          Verified Eligibility.{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
            Zero Disclosure.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 max-w-xl text-base sm:text-lg text-white/50 leading-relaxed"
        >
          ZK-Aid lets students prove scholarship eligibility using zero-knowledge proofs —
          no financial data leaves your device.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row gap-3"
        >
          <Link href="/auth/signup">
            <GlowButton variant="primary">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </Link>
          <Link href="/auth/login">
            <GlowButton variant="secondary">Log In</GlowButton>
          </Link>
        </motion.div>

        {/* Terminal */}
        <div className="mt-16 w-full">
          <HeroTerminal />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <GlassCard key={f.title} className="p-6" transition={{ delay: 0.1 * i }}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <f.icon className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/40">
                {f.description}
              </p>
            </GlassCard>
          ))}
        </div>
      </section>
    </MainLayout>
  );
}
