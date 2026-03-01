"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import MainLayout from "@/components/layout/MainLayout";
import GlassCard from "@/components/ui/GlassCard";
import GlowButton from "@/components/ui/GlowButton";
import StatusBadge from "@/components/ui/StatusBadge";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

interface Application {
  id: string;
  student_id: string;
  eligibility: boolean;
  verified: boolean;
  audit_required: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
    } else {
      setApplications(data || []);
    }
    setFetching(false);
  };

  const toggleVerified = async (id: string, current: boolean) => {
    setLoadingId(id);
    const { error } = await supabase
      .from("applications")
      .update({ verified: !current })
      .eq("id", id)
      .select();

    if (error) console.error("Update error:", error);
    await fetchApplications();
    setLoadingId(null);
  };

  const toggleAudit = async (id: string, current: boolean) => {
    setLoadingId(id);
    const { error } = await supabase
      .from("applications")
      .update({ audit_required: !current })
      .eq("id", id)
      .select();

    if (error) console.error("Update error:", error);
    await fetchApplications();
    setLoadingId(null);
  };

  const stats = {
    total: applications.length,
    verified: applications.filter((a) => a.verified).length,
    pending: applications.filter((a) => !a.verified && !a.audit_required).length,
    audit: applications.filter((a) => a.audit_required).length,
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
        >
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-white/40">
            Review and verify anonymized scholarship applications
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total", value: stats.total, icon: Users, color: "text-white/60" },
            { label: "Verified", value: stats.verified, icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-400" },
            { label: "Audit", value: stats.audit, icon: AlertTriangle, color: "text-indigo-400" },
          ].map((s, i) => (
            <GlassCard
              key={s.label}
              className="p-5"
              transition={{ delay: 0.05 * i }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-white/30">
                    {s.label}
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${s.color}`}>
                    {s.value}
                  </p>
                </div>
                <s.icon className={`h-6 w-6 ${s.color} opacity-40`} />
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Applications table */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Applications
          </h2>
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-white/20" />
            </div>
          ) : applications.length === 0 ? (
            <GlassCard className="px-6 py-12 text-center" hover={false}>
              <Users className="mx-auto mb-3 h-8 w-8 text-white/20" />
              <p className="text-sm text-white/40">
                No applications submitted yet.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {applications.map((app, i) => (
                <GlassCard
                  key={app.id}
                  className="p-5"
                  transition={{ delay: 0.03 * i }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          app.verified
                            ? "bg-emerald-500/10"
                            : app.audit_required
                            ? "bg-indigo-500/10"
                            : "bg-amber-500/10"
                        }`}
                      >
                        {app.verified ? (
                          <ShieldCheck className="h-5 w-5 text-emerald-400" />
                        ) : app.audit_required ? (
                          <AlertTriangle className="h-5 w-5 text-indigo-400" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          Student {app.student_id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-white/30">
                          {new Date(app.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge
                        status={app.eligibility ? "verified" : "rejected"}
                        label={app.eligibility ? "Eligible" : "Ineligible"}
                      />
                      <StatusBadge status={getStatus(app)} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <GlowButton
                        variant={app.verified ? "secondary" : "emerald"}
                        className="text-xs px-4 py-2"
                        disabled={loadingId === app.id}
                        onClick={() => toggleVerified(app.id, app.verified)}
                      >
                        {loadingId === app.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : app.verified ? (
                          "Unverify"
                        ) : (
                          "Verify"
                        )}
                      </GlowButton>
                      <GlowButton
                        variant="secondary"
                        className="text-xs px-4 py-2"
                        disabled={loadingId === app.id}
                        onClick={() => toggleAudit(app.id, app.audit_required)}
                      >
                        {loadingId === app.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : app.audit_required ? (
                          "Clear Audit"
                        ) : (
                          "Flag Audit"
                        )}
                      </GlowButton>
                    </div>
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