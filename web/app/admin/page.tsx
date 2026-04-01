"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type LifecycleFilter = "all" | "pending" | "verified" | "audit";

export default function AdminPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lifecycleFilter, setLifecycleFilter] =
    useState<LifecycleFilter>("all");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const getAccessToken = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      throw new Error("Not authenticated");
    }

    return token;
  }, []);

  const fetchApplications = useCallback(async () => {
    setFetching(true);
    try {
      const accessToken = await getAccessToken();

      const res = await fetch("/api/admin/applications", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Fetch error:", result.error);
        setFeedback({
          type: "error",
          message: result.error || "Unable to load applications.",
        });
        setApplications([]);
        return;
      }

      setFeedback(null);
      setApplications(result.applications || []);
    } catch (error) {
      console.error("Fetch error:", error);
      setFeedback({
        type: "error",
        message: "Unable to load applications right now.",
      });
      setApplications([]);
    }

    setFetching(false);
  }, [getAccessToken]);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    const ids = new Set(applications.map((app) => app.id));
    setSelectedIds((prev) => prev.filter((id) => ids.has(id)));
  }, [applications]);

  const getStatus = useCallback((app: Application) => {
    if (app.audit_required) return "audit" as const;
    if (app.verified) return "verified" as const;
    return "pending" as const;
  }, []);

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return applications.filter((app) => {
      const lifecycle = getStatus(app);

      if (lifecycleFilter !== "all" && lifecycle !== lifecycleFilter) {
        return false;
      }

      if (!query) return true;

      return (
        app.student_id.toLowerCase().includes(query) ||
        app.id.toLowerCase().includes(query)
      );
    });
  }, [applications, getStatus, lifecycleFilter, searchTerm]);

  const visibleIds = useMemo(
    () => filteredApplications.map((app) => app.id),
    [filteredApplications]
  );

  const allVisibleSelected = useMemo(() => {
    if (visibleIds.length === 0) return false;
    const selectedSet = new Set(selectedIds);
    return visibleIds.every((id) => selectedSet.has(id));
  }, [visibleIds, selectedIds]);

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const prevSet = new Set(prev);

      if (allVisibleSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }

      for (const id of visibleIds) {
        prevSet.add(id);
      }

      return Array.from(prevSet);
    });
  };

  const runBulkAction = async (
    updates: { verified?: boolean; audit_required?: boolean },
    successMessage: string
  ) => {
    if (selectedIds.length === 0) {
      setFeedback({ type: "error", message: "Select at least one application." });
      return;
    }

    setBulkLoading(true);

    try {
      const accessToken = await getAccessToken();

      const outcomes = await Promise.all(
        selectedIds.map(async (id) => {
          const res = await fetch("/api/admin/update-application", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ id, ...updates }),
          });

          if (res.ok) return { ok: true };

          const result = await res.json().catch(() => ({ error: "Request failed" }));
          return { ok: false, error: result.error as string | undefined };
        })
      );

      const successCount = outcomes.filter((o) => o.ok).length;
      const failCount = outcomes.length - successCount;

      if (successCount > 0 && failCount === 0) {
        setFeedback({ type: "success", message: `${successMessage} (${successCount})` });
      } else if (successCount > 0) {
        setFeedback({
          type: "error",
          message: `Updated ${successCount}, failed ${failCount}.`,
        });
      } else {
        setFeedback({
          type: "error",
          message: outcomes.find((o) => !o.ok)?.error || "Bulk update failed.",
        });
      }

      if (successCount > 0) {
        setSelectedIds([]);
        await fetchApplications();
      }
    } catch (error) {
      console.error("Bulk update failed:", error);
      setFeedback({ type: "error", message: "Bulk update failed." });
    } finally {
      setBulkLoading(false);
    }
  };

  const printDecisions = () => {
    const selectedSet = new Set(selectedIds);
    const sourceRows =
      selectedIds.length > 0
        ? filteredApplications.filter((app) => selectedSet.has(app.id))
        : filteredApplications;

    const printableRows = sourceRows.filter((app) => app.verified);

    if (printableRows.length === 0) {
      setFeedback({
        type: "error",
        message:
          selectedIds.length > 0
            ? "No verified applications in selected rows to print."
            : "No verified applications in current filter to print.",
      });
      return;
    }

    const generatedAt = new Date();
    const scopeLabel = selectedIds.length > 0 ? "Selected rows" : "Filtered rows";

    const tableRows = printableRows
      .map(
        (app, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${app.id}</td>
            <td>${app.student_id}</td>
            <td>${app.eligibility ? "Eligible" : "Ineligible"}</td>
            <td>${new Date(app.created_at).toLocaleString("en-US")}</td>
          </tr>
        `
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=1100,height=760");

    if (!printWindow) {
      setFeedback({
        type: "error",
        message: "Pop-up blocked. Allow pop-ups to use print.",
      });
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Verification Decisions</title>
          <style>
            body {
              font-family: "Segoe UI", Tahoma, sans-serif;
              color: #111;
              margin: 24px;
            }
            h1 {
              margin: 0 0 8px;
              font-size: 22px;
            }
            .meta {
              margin: 0 0 16px;
              font-size: 12px;
              color: #444;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            th,
            td {
              border: 1px solid #d6d6d6;
              padding: 8px;
              font-size: 12px;
              vertical-align: top;
              word-break: break-word;
              text-align: left;
            }
            th {
              background: #f6f6f6;
              font-weight: 700;
            }
            .footer {
              margin-top: 16px;
              font-size: 11px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>Admin Verification Decisions</h1>
          <p class="meta">Generated at: ${generatedAt.toLocaleString("en-US")}</p>
          <p class="meta">Scope: ${scopeLabel} | Records: ${printableRows.length}</p>
          <table>
            <thead>
              <tr>
                <th style="width: 42px;">#</th>
                <th>Application ID</th>
                <th>Student ID</th>
                <th style="width: 120px;">Decision</th>
                <th style="width: 185px;">Submitted At</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <p class="footer">This report only includes verified decisions.</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const toggleVerified = async (id: string, current: boolean) => {
    setLoadingId(id);
    try {
      const accessToken = await getAccessToken();

      const res = await fetch("/api/admin/update-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          id,
          verified: !current,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Update failed:", result.error);
        setFeedback({
          type: "error",
          message: result.error || "Unable to update verification.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: !current ? "Application verified." : "Application unverified.",
      });
      await fetchApplications();
    } catch (error) {
      console.error("Update failed:", error);
      setFeedback({
        type: "error",
        message: "Unable to update verification.",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const toggleAudit = async (id: string, current: boolean) => {
    setLoadingId(id);
    try {
      const accessToken = await getAccessToken();

      const res = await fetch("/api/admin/update-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          id,
          audit_required: !current,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Update failed:", result.error);
        setFeedback({
          type: "error",
          message: result.error || "Unable to update audit state.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: !current ? "Application flagged for audit." : "Audit cleared.",
      });
      await fetchApplications();
    } catch (error) {
      console.error("Update failed:", error);
      setFeedback({ type: "error", message: "Unable to update audit state." });
    } finally {
      setLoadingId(null);
    }
  };

  const stats = {
    total: applications.length,
    verified: applications.filter((a) => a.verified).length,
    pending: applications.filter((a) => !a.verified && !a.audit_required).length,
    audit: applications.filter((a) => a.audit_required).length,
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

        {/* Filters and bulk actions */}
        <GlassCard className="p-5" hover={false}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-white/40">
                  Search
                </label>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                  placeholder="Search by student or application id"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-emerald-400/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-white/40">
                  Lifecycle
                </label>
                <select
                  value={lifecycleFilter}
                  onChange={(e) =>
                    setLifecycleFilter(e.currentTarget.value as LifecycleFilter)
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-emerald-400/40 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="audit">Audit</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                disabled={visibleIds.length === 0 || bulkLoading}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {allVisibleSelected ? "Unselect Visible" : "Select Visible"}
              </button>
              <GlowButton
                variant="emerald"
                className="text-xs px-4 py-2"
                disabled={bulkLoading || selectedIds.length === 0}
                onClick={() =>
                  void runBulkAction({ verified: true }, "Verified selected applications")
                }
              >
                {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verify Selected"}
              </GlowButton>
              <GlowButton
                variant="secondary"
                className="text-xs px-4 py-2"
                disabled={bulkLoading || selectedIds.length === 0}
                onClick={() =>
                  void runBulkAction({ audit_required: true }, "Flagged selected applications for audit")
                }
              >
                {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Audit Selected"}
              </GlowButton>
              <GlowButton
                variant="primary"
                className="text-xs px-4 py-2"
                disabled={filteredApplications.length === 0 || bulkLoading}
                onClick={printDecisions}
              >
                Print Decisions
              </GlowButton>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/45">
            <p>
              Showing {filteredApplications.length} of {applications.length} applications
            </p>
            <p>{selectedIds.length} selected</p>
          </div>
        </GlassCard>

        {feedback ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        {/* Applications table */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Applications
          </h2>
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-white/20" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <GlassCard className="px-6 py-12 text-center" hover={false}>
              <Users className="mx-auto mb-3 h-8 w-8 text-white/20" />
              <p className="text-sm text-white/40">
                No applications match this filter.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app, i) => (
                <GlassCard
                  key={app.id}
                  className="p-5"
                  transition={{ delay: 0.03 * i }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(app.id)}
                        onChange={() => toggleSelectOne(app.id)}
                        disabled={bulkLoading}
                        className="h-4 w-4 rounded border-white/30 bg-transparent text-emerald-400"
                        aria-label={`Select application ${app.id}`}
                      />
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
                        disabled={loadingId === app.id || bulkLoading}
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
                        disabled={loadingId === app.id || bulkLoading}
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