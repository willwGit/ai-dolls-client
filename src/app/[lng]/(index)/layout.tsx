"use client";
import { type Lng } from "@/locales/i18n";

export default function IndexLayout({
  children,
  params: { lng },
}: {
  children: React.ReactNode;
  params: { lng: Lng };
}) {
  return <div className="min-h-screen bg-[#181425]">{children}</div>;
}
