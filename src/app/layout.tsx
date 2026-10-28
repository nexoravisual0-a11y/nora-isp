import type { Metadata } from "next";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";

export const metadata: Metadata = {
  title: "CARALE by Nora • Core Cloud ERP & Soporte FTTH",
  description: "Sistema integral de gestión ISP con motor de IA Caralita Nivel 3 y persistencia en Sistema Central",
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
      </body>
    </html>
  );
}
