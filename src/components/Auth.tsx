"use client";
import { Auth0Provider } from "@auth0/auth0-react";
import React, { FC } from "react";
import { AppConfigEnv } from "@/lib/utils";
import { Lng } from "@/locales/i18n";
import { TonConnectUIProvider } from "@tonconnect/ui-react";

export const AuthProvider: FC<{
  children: React.ReactNode;
  lng: Lng;
}> = ({ children, lng }) => {
  return (
    <Auth0Provider
      domain={AppConfigEnv.DOMAIN!}
      clientId={AppConfigEnv.CLIENTID!}
      authorizationParams={{
        ui_locales: lng,
        prompt: "login",
        redirect_uri:
          typeof window != "undefined"
            ? window.origin + `/${lng}` + "/login/"
            : "",
      }}
      cacheLocation={"localstorage"}
    >
      {children}
    </Auth0Provider>
  );
};

export const TonProvider: FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <TonConnectUIProvider
      manifestUrl={`https://www.telegramloveai.com/tonconnect-manifest.json`}
    >
      {children}
    </TonConnectUIProvider>
  );
};
