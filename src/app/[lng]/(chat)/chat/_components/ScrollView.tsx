"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { FC, LegacyRef, MutableRefObject, useContext, useEffect } from "react";
import { ChatContext } from "./Client";

export const ScrollView: FC<{
  children: React.ReactNode;
  scrollDom: MutableRefObject<HTMLDivElement | null>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}> = ({ children, scrollDom, onScroll }) => {
  const state = useContext(ChatContext);
  return (
    <div
      id="scroll-dom"
      ref={scrollDom}
      dir="ltr"
      className={cn(
        "relative z-10 p-5 pb-0 flex-1 overflow-y-auto",
        state.bg ? "no-bg" : "",
        state.isTransparent ? "isTransparent" : ""
      )}
      onScroll={onScroll}
    >
      {children}
    </div>
  );
};
