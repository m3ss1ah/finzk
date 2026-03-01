"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="
        sticky top-0 z-50
        border-b border-white/5
        bg-[#0E1117]/80 backdrop-blur-xl
      "
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Shield className="h-5 w-5 text-emerald-400 transition-colors group-hover:text-emerald-300" />
          <span className="text-lg font-semibold tracking-tight text-white">
            ZK-Aid
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="
                  flex items-center gap-1.5
                  rounded-lg px-3 py-2
                  text-sm text-white/60
                  transition-colors duration-300
                  hover:text-white hover:bg-white/5
                "
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="
                  flex items-center gap-1.5
                  rounded-lg px-3 py-2
                  text-sm text-white/60
                  transition-colors duration-300
                  hover:text-white hover:bg-white/5
                  cursor-pointer
                "
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="
                  rounded-lg px-3 py-2
                  text-sm text-white/60
                  transition-colors duration-300
                  hover:text-white hover:bg-white/5
                "
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="
                  rounded-xl px-4 py-2
                  text-sm font-medium text-white
                  bg-gradient-to-r from-amber-500 to-amber-600
                  shadow-lg shadow-amber-500/20
                  transition-all duration-300
                  hover:shadow-amber-500/40
                "
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </motion.header>
  );
}
