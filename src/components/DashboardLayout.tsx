"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Network,
  LifeBuoy,
  Bot,
  Bell,
  Search,
  Cpu,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface SidebarLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAVIGATION_LINKS: SidebarLink[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clientes (CRM)", href: "/clientes", icon: Users },
  { name: "Red FTTH (OLT/NAP)", href: "/nodos", icon: Network, badge: "Alerta" },
  { name: "Tickets", href: "/tickets", icon: LifeBuoy, badge: "3" },
  { name: "Nora Copilot", href: "/nora", icon: Bot, badge: "AI" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showNotification, setShowNotification] = useState(true);

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Lateral */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/90 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo y Branding */}
          <div className="h-16 px-6 flex items-center border-b border-slate-800 gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 font-black text-white shadow-lg shadow-cyan-500/20">
              N
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base">Nexora ISP</span>
              <span className="block text-[10px] font-semibold tracking-wider text-cyan-400 uppercase">
                Core Cloud ERP
              </span>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-4 space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1">
              Operaciones ISP
            </div>
            {NAVIGATION_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`}
                    />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        link.badge === "AI"
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                          : link.badge === "Alerta"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <span>Nora Neural Core</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Groq Llama 3.3 70B</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Listo
              </span>
            </div>
          </div>
          <div className="text-center text-[10px] text-slate-500 font-medium">
            Powered by <span className="text-slate-400 font-semibold">Nexora One</span>
          </div>
        </div>
      </aside>

      {/* Área Central / Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 px-6 flex items-center justify-between backdrop-blur shrink-0">
          {/* Búsqueda rápida */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar cliente, IP, MAC, ONU o caja NAP..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-1.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>

          {/* Estado y Perfil */}
          <div className="flex items-center gap-4">
            {/* Notificaciones de red */}
            <div className="relative">
              <button
                onClick={() => setShowNotification(!showNotification)}
                className="relative p-2 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300 transition"
              >
                <Bell className="h-4 w-4 text-slate-300" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
              </button>
            </div>

            {/* Perfil Admin */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
                AD
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-semibold text-slate-200">Admin Nexora</span>
                <span className="block text-[10px] text-slate-400">Nivel 3 / NOC Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Notificación Alerta Global si está activa */}
        {showNotification && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2 flex items-center justify-between text-xs text-rose-300 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>
                <strong>Alerta Óptica Crítica:</strong> Caja NAP-04 (Barrio Centro) reporta -30.5 dBm de atenuación. ONU CLI-1045 desconectada.
              </span>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-[11px] underline hover:text-white"
            >
              Descartar
            </button>
          </div>
        )}

        {/* Contenido Dinámico */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
