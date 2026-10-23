import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";

export const metadata: Metadata = {
  title: "Nexora ISP • Core Cloud ERP & Soporte FTTH",
  description: "Sistema integral de gestión ISP con motor de IA Nora Nivel 3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased dark">
      <body className="h-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
        <DashboardLayout>{children}</DashboardLayout>
        
        {/* Chatwoot Live Chat SDK */}
        <Script
          id="chatwoot-sdk"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.chatwootSettings = {"position":"right","type":"standard","launcherTitle":""};
              (function(d,t) {
                var BASE_URL="https://app.chatwoot.com";
                var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
                g.src=BASE_URL+"/packs/js/sdk.js";
                g.async = true;
                s.parentNode.insertBefore(g,s);
                g.onload=function(){
                  window.chatwootSDK.run({
                    websiteToken: 'HiC89kukzeKVmhDsmMSehPBa',
                    baseUrl: BASE_URL
                  })
                }
              })(document,"script");
            `,
          }}
        />
      </body>
    </html>
  );
}
