"use client";

import { type ReactNode } from "react";
import Navbar from "./Navbar";

interface MainLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export default function MainLayout({ children, showNav = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-zkaid bg-data-lines">
      {showNav && <Navbar />}
      <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
