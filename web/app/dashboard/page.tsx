"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function DashboardRouter() {
  const router = useRouter();

  useEffect(() => {
    const routeUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sessionData.session.user.id)
        .single();

      if (profile?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/student");
      }
    };

    routeUser();
  }, [router]);

  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-emerald-400" />
        </motion.div>
        <p className="text-sm text-white/40">Routing to your dashboard...</p>
      </div>
    </MainLayout>
  );
}