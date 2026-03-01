"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlowButton from "@/components/ui/GlowButton";
import { motion } from "framer-motion";
import { Shield, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async () => {
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) {
      setError(err.message);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        <GlassCard className="w-full max-w-md p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10"
            >
              <Shield className="h-6 w-6 text-emerald-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-white/40">
              Sign in to your ZK-Aid account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <GlassInput
              label="Email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <GlassInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="mt-6 space-y-3">
            <GlowButton
              variant="primary"
              className="w-full"
              disabled={loading}
              onClick={handleEmailLogin}
            >
              <Mail className="h-4 w-4" />
              {loading ? "Signing in..." : "Sign In"}
            </GlowButton>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0E1117] px-3 text-white/30">or</span>
              </div>
            </div>

            <GlowButton
              variant="secondary"
              className="w-full"
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </GlowButton>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-white/30">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Sign up
            </Link>
          </p>
        </GlassCard>
      </div>
    </MainLayout>
  );
}