export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Missing required server configuration" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "No auth header" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { proof, publicSignals } = body;

    // Ensure FK target exists for applications.student_id -> profiles.id.
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error: profileError } = await serviceClient
      .from("profiles")
      .upsert(
        {
          id: user.id,
          role: "student",
        },
        {
          onConflict: "id",
          ignoreDuplicates: true,
        }
      );

    if (profileError) {
      return NextResponse.json(
        { error: `Profile setup failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    const { error } = await supabase.from("applications").insert({
      student_id: user.id,
      proof,               // stored as string
      public_signals: publicSignals, // stored as string
      status: "pending",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}