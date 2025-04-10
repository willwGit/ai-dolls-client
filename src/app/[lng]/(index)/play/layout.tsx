"use client";

import { FC, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f17]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f17]/95 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">Feed</h1>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 pt-6 pb-16">
        {children}
      </main>
    </div>
  );
};

export default Layout;
