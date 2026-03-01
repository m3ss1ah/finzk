"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { generateProof } from "@/lib/zk/prove";
import MainLayout from "@/components/layout/MainLayout";
import GlassCard from "@/components/ui/GlassCard";
import GlowButton from "@/components/ui/GlowButton";
import StatusBadge from "@/components/ui/StatusBadge";
import { motion } from "framer-motion";
import {
  Shield,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
} from "lucide-react";

interface Application {
  id: string;
  eligibility: boolean;
  verified: boolean;
  audit_required: boolean;
  created_at: string;
}

export default function StudentPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    setFetching(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const res = await fetch("/api/my-applications", {
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setApplications(data.applications ?? []);
    }
    setFetching(false);
  };

  const handleSubmitApplication = async () => {
    setLoading(true);
    setStep("Generating zero-knowledge proof...");

    try {
      const { proof, publicSignals } = await generateProof({
        x1: 10,
        x2: 20,
        x3: 5,
      });

      setStep("Proof generated. Preparing submission...");

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Not authenticated");

      const accessToken = sessionData.session.access_token;
      setStep("Submitting application...");

      const response = await fetch("/api/submit-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          proof: JSON.stringify(proof),
          publicSignals: JSON.stringify(publicSignals),
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed");

      setStep("Application submitted successfully!");
      await fetchMyApplications();
    } catch (err: any) {
      console.error("Submission error:", err);
      setStep(`Error: ${err.message || "Something went wrong."}`);
    }

    setLoading(false);
  };

  const getStatus = (app: Application) => {
    if (app.audit_required) return "audit" as const;
    if (app.verified) return "verified" as const;
    return "pending" as const;
  };

  return (
    <MainLayout>
      <div className="py-10 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Student Dashboard</h1>
            <p className="mt-1 text-sm text-white/40">
              Submit your eligibility proof privately
            </p>
          </div>
          <GlowButton
            variant="primary"
            disabled={loading}
            onClick={handleSubmitApplication}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Application
              </>
            )}
          </GlowButton>
        </motion.div>

        {/* Step indicator */}
        {step && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              rounded-xl border px-4 py-3 text-sm font-mono
              ${
                step.startsWith("Error")
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : step.includes("successfully")
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 bg-white/5 text-white/60"
              }
            `}
          >
            {step}
          </motion.div>
        )}

        {/* How it works */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Shield,
              title: "Generate Proof",
              desc: "Your financial data stays on-device while a ZK proof is created.",
            },
            {
              icon: FileCheck,
              title: "Submit Privately",
              desc: "Only the cryptographic proof is sent — never your raw data.",
            },
            {
              icon: CheckCircle2,
              title: "Get Verified",
              desc: "Admins verify the proof mathematically, with zero personal access.",
            },
          ].map((item, i) => (
            <GlassCard
              key={item.title}
              className="p-5"
              transition={{ delay: 0.05 * i }}
            >
              <item.icon className="mb-3 h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/40">
                {item.desc}
              </p>
            </GlassCard>
          ))}
        </div>

        {/* Applications list */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Your Applications
          </h2>
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-white/20" />
            </div>
          ) : applications.length === 0 ? (
            <GlassCard className="px-6 py-12 text-center" hover={false}>
              <Clock className="mx-auto mb-3 h-8 w-8 text-white/20" />
              <p className="text-sm text-white/40">
                No applications yet. Submit your first proof above.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {applications.map((app, i) => (
                <GlassCard
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
                  transition={{ delay: 0.05 * i }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        app.verified
                          ? "bg-emerald-500/10"
                          : app.audit_required
                          ? "bg-indigo-500/10"
                          : "bg-amber-500/10"
                      }`}
                    >
                      {app.verified ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : app.audit_required ? (
                        <Shield className="h-5 w-5 text-indigo-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Application #{app.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-white/30">
                        {new Date(app.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      status={app.eligibility ? "verified" : "rejected"}
                      label={app.eligibility ? "Eligible" : "Ineligible"}
                    />
                    <StatusBadge status={getStatus(app)} />
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}