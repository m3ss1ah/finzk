"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlowButton from "@/components/ui/GlowButton";
import { motion } from "framer-motion";
import { UserPlus, Shield } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
      });

      if (err) {
        setError(err.message);
        return;
      }

      if (data.user) {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-2xl font-bold text-white">Create account</h1>
            <p className="mt-1 text-sm text-white/40">
              Start verifying your eligibility privately
            </p>
          </div>

          {success ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-6 text-center">
              <p className="text-sm text-emerald-400">
                Signup successful! Check your email to confirm your account.
              </p>
              <Link
                href="/auth/login"
                className="mt-3 inline-block text-sm text-emerald-400 underline transition-colors hover:text-emerald-300"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <>
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

              <div className="mt-6">
                <GlowButton
                  variant="emerald"
                  className="w-full"
                  disabled={loading}
                  onClick={handleSignup}
                >
                  <UserPlus className="h-4 w-4" />
                  {loading ? "Creating account..." : "Create Account"}
                </GlowButton>
              </div>

              {/* Footer */}
              <p className="mt-6 text-center text-sm text-white/30">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </GlassCard>
      </div>
    </MainLayout>
  );
}