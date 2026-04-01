"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Info,
} from "lucide-react";

interface Application {
  id: string;
  eligibility: boolean;
  verified: boolean;
  audit_required: boolean;
  created_at: string;
}

type FinancialForm = {
  family_income: string;
  cost_of_attendance: string;
  liquid_assets: string;
  dependents: string;
  family_size: string;
};

type BadgeStatus = "verified" | "pending" | "rejected" | "audit";

const SCALE = 1000;

export default function StudentPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [fetching, setFetching] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [latestInterpretation, setLatestInterpretation] =
    useState<string | null>(null);
  const [activeHelp, setActiveHelp] = useState<keyof FinancialForm | null>(null);
  const [form, setForm] = useState<FinancialForm>({
    family_income: "",
    cost_of_attendance: "",
    liquid_assets: "",
    dependents: "",
    family_size: "",
  });

  const computedRatios = useMemo(() => {
    const familyIncome = Number(form.family_income.replace(/,/g, ""));
    const costOfAttendance = Number(form.cost_of_attendance.replace(/,/g, ""));
    const liquidAssets = Number(form.liquid_assets.replace(/,/g, ""));
    const dependents = Number(form.dependents.replace(/,/g, ""));
    const familySize = Number(form.family_size.replace(/,/g, ""));

    const x1 =
      Number.isFinite(familyIncome) &&
      Number.isFinite(costOfAttendance) &&
      costOfAttendance > 0
        ? familyIncome / costOfAttendance
        : null;

    const x2 =
      Number.isFinite(liquidAssets) &&
      Number.isFinite(costOfAttendance) &&
      costOfAttendance > 0
        ? liquidAssets / costOfAttendance
        : null;

    const x3 =
      Number.isFinite(dependents) &&
      Number.isFinite(familySize) &&
      familySize > 0
        ? dependents / familySize
        : null;

    return { x1, x2, x3 };
  }, [form]);

  const buildInterpretation = useCallback((x1: number, x2: number, x3: number) => {
    const factors: string[] = [];

    if (x1 >= 1) factors.push("high income relative to cost");
    if (x2 >= 0.5) factors.push("significant financial assets");
    if (x3 <= 0.25) factors.push("low dependency burden");

    if (factors.length === 0) {
      return "Eligibility profile appears balanced across income, assets, and family burden.";
    }

    return `Eligibility may be reduced due to ${factors.join(", ")}.`;
  }, []);

  const ratioExplanation = useMemo(() => {
    if (
      computedRatios.x1 === null ||
      computedRatios.x2 === null ||
      computedRatios.x3 === null
    ) {
      return "Enter all values to preview a local interpretability explanation.";
    }
    return buildInterpretation(
      computedRatios.x1,
      computedRatios.x2,
      computedRatios.x3,
    );
  }, [buildInterpretation, computedRatios]);

  const hasRejectedApplication = useMemo(
    () => applications.some((app) => app.verified && !app.eligibility),
    [applications],
  );

  const hasActiveApplication = useMemo(
    () =>
      applications.some(
        (app) => app.audit_required || !app.verified || app.eligibility,
      ),
    [applications],
  );

  const canSubmit = !loading && !hasActiveApplication;

  const syncText = useMemo(() => {
    if (!lastSyncedAt) return "Last synced: --";
    const minutes = Math.max(0, Math.floor((nowMs - lastSyncedAt) / 60000));
    if (minutes === 0) return "Last synced: just now";
    return `Last synced: ${minutes}m ago`;
  }, [lastSyncedAt, nowMs]);

  const fetchMyApplications = useCallback(async () => {
    setFetching(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setApplications([]);
        return;
      }

      const res = await fetch("/api/my-applications", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch applications.");

      const data = await res.json();
      setApplications(data.applications ?? []);
      setLastSyncedAt(Date.now());
    } catch (err) {
      console.error("Fetch applications error:", err);
      setStep("Error: Unable to sync applications right now.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    void fetchMyApplications();
  }, [fetchMyApplications]);

  useEffect(() => {
    const ticker = setInterval(() => {
      setNowMs(Date.now());
    }, 60000);

    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let pollId: ReturnType<typeof setInterval> | null = null;
    let cleanupRealtime = () => undefined;

    const setupRealtime = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!isMounted || !userId) return;

      const channel = supabase
        .channel(`student-applications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "applications",
          },
          () => {
            void fetchMyApplications();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "applications",
          },
          () => {
            void fetchMyApplications();
          },
        )
        .subscribe();

      cleanupRealtime = () => {
        void supabase.removeChannel(channel);
      };

      // Polling fallback keeps UI fresh if realtime is delayed.
      pollId = setInterval(() => {
        void fetchMyApplications();
      }, 60000);
    };

    void setupRealtime();

    return () => {
      isMounted = false;
      cleanupRealtime();
      if (pollId) clearInterval(pollId);
    };
  }, [fetchMyApplications]);

  useEffect(() => {
    const onVisibilityOrFocus = () => {
      void fetchMyApplications();
    };

    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    return () => {
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [fetchMyApplications]);

  const handleSubmitApplication = async () => {
    if (loading) return;

    if (hasActiveApplication) {
      setStep("Error: You already have an active application.");
      return;
    }

    setLoading(true);
    setStep("Validating inputs...");

    try {
      const values = {
        family_income: Number(form.family_income.replace(/,/g, "")),
        cost_of_attendance: Number(form.cost_of_attendance.replace(/,/g, "")),
        liquid_assets: Number(form.liquid_assets.replace(/,/g, "")),
        dependents: Number(form.dependents.replace(/,/g, "")),
        family_size: Number(form.family_size.replace(/,/g, "")),
      };

      if (Object.values(form).some((value) => value.trim() === "")) {
        throw new Error("Please fill in all financial input fields.");
      }

      if (Object.values(values).some((value) => !Number.isFinite(value))) {
        throw new Error("All financial inputs must be valid numbers.");
      }

      if (Object.values(values).some((value) => value < 0)) {
        throw new Error("Financial inputs cannot be negative.");
      }

      if (values.cost_of_attendance <= 0) {
        throw new Error("Cost of attendance must be greater than 0.");
      }

      if (values.family_size <= 0) {
        throw new Error("Family size must be greater than 0.");
      }

      if (values.dependents > values.family_size) {
        throw new Error("Dependents cannot exceed family size.");
      }

      setStep("Computing financial ratios...");

      const x1 = values.family_income / values.cost_of_attendance;
      const x2 = values.liquid_assets / values.cost_of_attendance;
      const x3 = values.dependents / values.family_size;

      const x1_scaled = Math.floor(x1 * SCALE);
      const x2_scaled = Math.floor(x2 * SCALE);
      const x3_scaled = Math.floor(x3 * SCALE);

      setLatestInterpretation(buildInterpretation(x1, x2, x3));

      setStep("Generating zero-knowledge proof...");

      const { proof, publicSignals } = await generateProof({
        x1: x1_scaled,
        x2: x2_scaled,
        x3: x3_scaled,
      });

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Not authenticated");

      const accessToken = sessionData.session.access_token;
      setStep("Submitting application...");

      const response = await fetch("/api/submit-application", {
        method: "POST",
        cache: "no-store",
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
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: keyof FinancialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatIntegerWithCommas = (value: string) => {
    if (!value) return "";
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) return "";
    return new Intl.NumberFormat("en-IN").format(Number(digitsOnly));
  };

  const formatDecimalWithCommas = (value: string) => {
    if (!value) return "";

    const sanitized = value.replace(/,/g, "").replace(/[^\d.]/g, "");
    const [intRaw = "", ...rest] = sanitized.split(".");
    const decimalRaw = rest.join("").slice(0, 2);
    const hasTrailingDot = sanitized.endsWith(".");

    const intPart = intRaw ? new Intl.NumberFormat("en-IN").format(Number(intRaw)) : "";

    if (hasTrailingDot) return `${intPart}.`;
    if (decimalRaw.length > 0) return `${intPart}.${decimalRaw}`;
    return intPart;
  };

  const fieldHelpText: Record<keyof FinancialForm, string> = {
    family_income:
      "Total annual household income before deductions. Include all earning members. (INR)",
    cost_of_attendance:
      "Estimated yearly education cost: tuition, books, housing, transport, and essentials. (INR)",
    liquid_assets:
      "Immediately accessible funds such as bank balances and cash equivalents. (INR)",
    dependents:
      "Number of family members financially dependent on household income.",
    family_size:
      "Total number of people in the household, including dependents and earners.",
  };

  const getLifecycleStatus = (app: Application): { status: BadgeStatus; label: string } => {
    if (app.audit_required) return { status: "audit", label: "Under Audit" };
    if (app.verified) return { status: "verified", label: "Verified" };
    return { status: "pending", label: "Pending" };
  };

  const getDecisionStatus = (app: Application): { status: BadgeStatus; label: string } => {
    if (!app.verified || app.audit_required) {
      return { status: "pending", label: "Awaiting Decision" };
    }
    if (app.eligibility) return { status: "verified", label: "Eligible" };
    return { status: "rejected", label: "Ineligible" };
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
        </motion.div>

        <GlassCard className="p-5 sm:p-6" hover={false}>
          <h2 className="text-lg font-semibold text-white">Financial Inputs</h2>
          <p className="mt-1 text-sm text-white/40">
            Enter your financial data to generate privacy-preserving eligibility
            features locally.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label htmlFor="family_income" className="text-xs text-white/60">
                  Family Income (INR)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setActiveHelp((prev) =>
                      prev === "family_income" ? null : "family_income",
                    )
                  }
                  className="text-white/40 transition hover:text-white/70"
                  aria-label="What is family income"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                id="family_income"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 45000"
                value={form.family_income}
                onChange={(e) =>
                  handleFormChange(
                    "family_income",
                    formatIntegerWithCommas(e.currentTarget.value),
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-emerald-400/40 focus:outline-none"
              />
              {activeHelp === "family_income" ? (
                <p className="text-xs text-white/50">{fieldHelpText.family_income}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="cost_of_attendance"
                  className="text-xs text-white/60"
                >
                  Cost of Attendance (INR)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setActiveHelp((prev) =>
                      prev === "cost_of_attendance" ? null : "cost_of_attendance",
                    )
                  }
                  className="text-white/40 transition hover:text-white/70"
                  aria-label="What is cost of attendance"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                id="cost_of_attendance"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 3,00,000"
                value={form.cost_of_attendance}
                onChange={(e) =>
                  handleFormChange(
                    "cost_of_attendance",
                    formatDecimalWithCommas(e.currentTarget.value),
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-emerald-400/40 focus:outline-none"
              />
              {activeHelp === "cost_of_attendance" ? (
                <p className="text-xs text-white/50">
                  {fieldHelpText.cost_of_attendance}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label htmlFor="liquid_assets" className="text-xs text-white/60">
                  Liquid Assets (INR)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setActiveHelp((prev) =>
                      prev === "liquid_assets" ? null : "liquid_assets",
                    )
                  }
                  className="text-white/40 transition hover:text-white/70"
                  aria-label="What are liquid assets"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                id="liquid_assets"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 50,000"
                value={form.liquid_assets}
                onChange={(e) =>
                  handleFormChange(
                    "liquid_assets",
                    formatIntegerWithCommas(e.currentTarget.value),
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-emerald-400/40 focus:outline-none"
              />
              {activeHelp === "liquid_assets" ? (
                <p className="text-xs text-white/50">{fieldHelpText.liquid_assets}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label htmlFor="dependents" className="text-xs text-white/60">
                  Number of Dependents
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setActiveHelp((prev) =>
                      prev === "dependents" ? null : "dependents",
                    )
                  }
                  className="text-white/40 transition hover:text-white/70"
                  aria-label="What are dependents"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                id="dependents"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 2"
                value={form.dependents}
                onChange={(e) =>
                  handleFormChange(
                    "dependents",
                    formatIntegerWithCommas(e.currentTarget.value),
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-emerald-400/40 focus:outline-none"
              />
              {activeHelp === "dependents" ? (
                <p className="text-xs text-white/50">{fieldHelpText.dependents}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label htmlFor="family_size" className="text-xs text-white/60">
                  Family Size
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setActiveHelp((prev) =>
                      prev === "family_size" ? null : "family_size",
                    )
                  }
                  className="text-white/40 transition hover:text-white/70"
                  aria-label="What is family size"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                id="family_size"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 4"
                value={form.family_size}
                onChange={(e) =>
                  handleFormChange(
                    "family_size",
                    formatIntegerWithCommas(e.currentTarget.value),
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-emerald-400/40 focus:outline-none"
              />
              {activeHelp === "family_size" ? (
                <p className="text-xs text-white/50">{fieldHelpText.family_size}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/3 p-4">
            <p className="text-xs uppercase tracking-wide text-white/50">
              Ratio Preview (Local)
            </p>
            <div className="mt-3 grid gap-2 text-sm text-white/75 sm:grid-cols-3">
              <p>
                Income-to-Cost Ratio:{" "}
                <span className="font-mono text-white">
                  {computedRatios.x1 === null
                    ? "-"
                    : computedRatios.x1.toFixed(4)}
                </span>
              </p>
              <p>
                Asset Ratio:{" "}
                <span className="font-mono text-white">
                  {computedRatios.x2 === null
                    ? "-"
                    : computedRatios.x2.toFixed(4)}
                </span>
              </p>
              <p>
                Dependency Ratio:{" "}
                <span className="font-mono text-white">
                  {computedRatios.x3 === null
                    ? "-"
                    : computedRatios.x3.toFixed(4)}
                </span>
              </p>
            </div>
            <p className="mt-3 text-xs text-white/55">{ratioExplanation}</p>
          </div>
        </GlassCard>

        <div className="flex flex-col items-end gap-2">
          <p className="text-xs text-white/40">{syncText}</p>
          {hasActiveApplication ? (
            <p className="text-xs text-amber-300">
              You already have an active application
            </p>
          ) : hasRejectedApplication ? (
            <p className="text-xs text-white/45">
              Previous application was ineligible. You may resubmit.
            </p>
          ) : null}
          <GlowButton
            variant="primary"
            disabled={!canSubmit}
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
                {hasRejectedApplication ? "Resubmit Application" : "Submit Application"}
              </>
            )}
          </GlowButton>
        </div>

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
                      {app.verified && app.eligibility ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : app.audit_required ? (
                        <Shield className="h-5 w-5 text-indigo-400" />
                      ) : app.verified && !app.eligibility ? (
                        <XCircle className="h-5 w-5 text-red-400" />
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
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="flex items-center gap-3">
                      <StatusBadge
                        status={getLifecycleStatus(app).status}
                        label={getLifecycleStatus(app).label}
                      />
                      {app.verified && !app.audit_required ? (
                        <StatusBadge
                          status={getDecisionStatus(app).status}
                          label={getDecisionStatus(app).label}
                        />
                      ) : null}
                    </div>
                    {app.verified && !app.eligibility ? (
                      <p className="max-w-xs text-xs text-white/50 sm:text-right">
                        {i === 0 && latestInterpretation
                          ? latestInterpretation
                          : "Eligibility reduced due to financial profile ratios."}
                      </p>
                    ) : null}
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