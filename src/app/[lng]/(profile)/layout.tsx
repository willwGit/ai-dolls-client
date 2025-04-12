"use client";

import { FC, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  return <main className="h-full">{children}</main>;
};

export default Layout;
