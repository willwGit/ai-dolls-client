import { Inter } from "next/font/google";
import { dir } from "i18next";
import { Toaster } from "sonner";
import "@/styles/index.scss";
import { languages, type Lng } from "@/locales/i18n";
import Script from "next/script";
import { Navbar } from "@/components/Navbar";
import { Loading } from "@/components/Loading";
import { Condition } from "@/components/Condition";
import { TokenSetter } from "@/components/TokenSetter";
import { Viewport } from "next";

const inter = Inter({ subsets: ["latin"] });

export function generateViewport(): Viewport {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  };
}

export default function RootLayout({
  children,
  params: { lng },
}: {
  children: React.ReactNode;
  params: { lng: Lng };
}) {
  return (
    <html
      lang={lng}
      data-theme={"dark"}
      dir={dir(lng)}
      className={inter.className}
    >
      <Script
        id="fbq-script"
        dangerouslySetInnerHTML={{
          __html: `!function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '3625984031061108');
      fbq('track', 'PageView');`,
        }}
      />

      <body className="bg-[#181425]">
        <TokenSetter />

        <main className="w-full h-[100vh] m-0">
          <Navbar></Navbar>

          <Condition lng={lng}>{children}</Condition>

          <Toaster
            dir={dir(lng)}
            toastOptions={{
              duration: 1500,
            }}
          />
        </main>

        <Loading></Loading>
      </body>
    </html>
  );
}
