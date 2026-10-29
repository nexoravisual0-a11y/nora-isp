import type { Metadata } from "next";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";

export const metadata: Metadata = {
  title: "CARALE by Nora • Core Cloud ERP & Soporte FTTH",
  description: "Sistema integral de gestión ISP con motor de IA Caralita Nivel 3 y persistencia en Sistema Central",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
