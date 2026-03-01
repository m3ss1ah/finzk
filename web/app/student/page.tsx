"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { generateProof } from "@/lib/zk/prove";

export default function StudentPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleSubmitApplication = async () => {
    setLoading(true);
    setStatus("Generating zero-knowledge proof...");

    try {
      const { proof, publicSignals } = await generateProof({
        x1: 10,
        x2: 20,
        x3: 5,
      });

      setStatus("Proof generated. Preparing submission...");

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        throw new Error("Not authenticated");
      }

      const accessToken = sessionData.session.access_token;

      setStatus("Submitting application...");

      const response = await fetch("/api/submit-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          proof: JSON.stringify(proof),              // 🔥 stringify
          publicSignals: JSON.stringify(publicSignals), // 🔥 stringify
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Submission failed");
      }

      setStatus("Application submitted successfully! Pending verification.");
    } catch (err: any) {
      console.error("Submission error:", err);
      alert(err.message || "Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>

      <button
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 disabled:opacity-50"
        onClick={handleSubmitApplication}
      >
        {loading ? "Processing..." : "Submit Application (ZK Verified)"}
      </button>

      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}