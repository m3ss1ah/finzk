"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      alert(error.message);
    } else {
      setApplications(data || []);
    }
  };

  const toggleVerified = async (id: string, current: boolean) => {
    setLoadingId(id);

    const { data, error } = await supabase
      .from("applications")
      .update({ verified: !current })
      .eq("id", id)
      .select(); // important

    if (error) {
      console.error("Update error:", error);
      alert(error.message);
    } else {
      console.log("Updated row:", data);
      await fetchApplications();
    }

    setLoadingId(null);
  };

  const toggleAudit = async (id: string, current: boolean) => {
    setLoadingId(id);

    const { data, error } = await supabase
      .from("applications")
      .update({ audit_required: !current })
      .eq("id", id)
      .select(); // important

    if (error) {
      console.error("Update error:", error);
      alert(error.message);
    } else {
      console.log("Updated row:", data);
      await fetchApplications();
    }

    setLoadingId(null);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {applications.map((app) => (
        <div key={app.id} className="border p-4 mb-4 rounded shadow">
          <p><strong>Student ID:</strong> {app.student_id}</p>
          <p><strong>Eligibility:</strong> {app.eligibility ? "Eligible" : "Not Eligible"}</p>
          <p><strong>Verified:</strong> {app.verified ? "Yes" : "No"}</p>
          <p><strong>Audit Required:</strong> {app.audit_required ? "Yes" : "No"}</p>

          <div className="mt-2 flex gap-2">
            <button
              disabled={loadingId === app.id}
              className="bg-green-500 text-white px-3 py-1 disabled:opacity-50"
              onClick={() => toggleVerified(app.id, app.verified)}
            >
              {loadingId === app.id ? "Updating..." : "Toggle Verified"}
            </button>

            <button
              disabled={loadingId === app.id}
              className="bg-yellow-500 text-white px-3 py-1 disabled:opacity-50"
              onClick={() => toggleAudit(app.id, app.audit_required)}
            >
              {loadingId === app.id ? "Updating..." : "Toggle Audit"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}