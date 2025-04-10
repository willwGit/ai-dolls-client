"use client";
import { FC, useEffect } from "react";
import { AuthProvider, TonProvider } from "@/components/Auth";
import InitRequest from "@/lib/Init-request";
import { AppConfigEnv } from "@/lib/utils";
import { TGInitScript } from "@/components/TGInitScript";
import { Lng } from "@/locales/i18n";
import { GoogleTagScript } from "./GooGleTagScript";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const Search = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    /**
     * 存储params 避免被重定向删除
     */
    if (searchParams.get("inviteCode")) {
      localStorage.setItem("inviteCode", searchParams.get("inviteCode")!);
    }
    if (searchParams.get("uid")) {
      localStorage.setItem("uid", searchParams.get("uid")!);
    }
    if (searchParams.get("c")) {
      localStorage.setItem("userPlatform", searchParams.get("c")!);
    }
  }, [searchParams]);

  return <></>;
};

export const Condition: FC<{
  children: React.ReactNode;
  lng: Lng;
}> = ({ children, lng }) => {
  const path = usePathname();
  return (
    <>
      <Suspense>
        <Search></Search>
      </Suspense>

      <TonProvider>
        <AuthProvider lng={lng}>
          <InitRequest lng={lng}></InitRequest>
          <div
            className={`h-[calc(100%-theme(height.12))] ${path.replace(
              /\//gi,
              "_"
            )}`}
          >
            {children}
          </div>
        </AuthProvider>
      </TonProvider>

      {AppConfigEnv.isTG && <TGInitScript></TGInitScript>}

      <GoogleTagScript></GoogleTagScript>
    </>
  );
};
