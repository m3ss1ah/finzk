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

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      alert("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      // 🔹 For now using dummy test values
      // Later we will connect these to form inputs
      const { proof, publicSignals, eligible } = await generateProof({
        x1: 10,
        x2: 20,
        x3: 5,
      });

      setStatus("Proof generated. Submitting application...");

      const { error } = await supabase.from("applications").insert({
        student_id: sessionData.session.user.id,
        proof,
        public_signals: publicSignals,
        eligibility: eligible,
      });

      if (error) {
        console.error(error);
        alert(error.message);
      } else {
        setStatus("Application submitted with ZK proof successfully!");
      }
    } catch (err) {
      console.error("Proof generation failed:", err);
      alert("Proof generation failed. Check console.");
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
        {loading ? "Processing..." : "Submit Application (ZK)"}
      </button>

      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}