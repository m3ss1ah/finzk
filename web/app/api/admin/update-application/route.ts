export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, verified, audit_required } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing application id" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updates: Record<string, boolean> = {};
    if (typeof verified === "boolean") updates.verified = verified;
    if (typeof audit_required === "boolean") updates.audit_required = audit_required;

    const { data, error } = await supabase
      .from("applications")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ application: data?.[0] ?? null });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
