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
  Database,
  AlertTriangle,
} from "lucide-react";

interface SidebarLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAVIGATION_LINKS: SidebarLink[] = [
  { name: "Dashboard NOC", href: "/", icon: LayoutDashboard },
  { name: "Clientes CRM", href: "/clientes", icon: Users },
  { name: "Red FTTH (OLT/NAP)", href: "/nodos", icon: Network, badge: "Alerta" },
  { name: "Tickets de Soporte", href: "/tickets", icon: LifeBuoy, badge: "Activo" },
  { name: "Consola Caralita", href: "/nora", icon: Bot, badge: "AI N3" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showNotification, setShowNotification] = useState(true);

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Lateral - CARALE by Nora */}
      <aside className="w-64 border-r border-slate-800/90 bg-slate-900/95 flex flex-col justify-between shrink-0 shadow-2xl backdrop-blur-md">
        <div>
          {/* Logo y Branding CARALE by Nora */}
          <div className="h-16 px-5 flex items-center border-b border-slate-800/80 gap-3 bg-slate-950/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-600 font-black text-white shadow-lg shadow-cyan-500/25">
              C
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-sm">CARALE</span>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/50">
                  by Nora
                </span>
              </div>
              <span className="block text-[10px] font-medium tracking-wider text-slate-400 uppercase truncate">
                Cloud ISP Core & FTTH
              </span>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-3.5 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5 flex items-center justify-between">
              <span>Módulos de Gestión</span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </div>
            {NAVIGATION_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        link.badge === "AI N3"
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm"
                          : link.badge === "Alerta"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700/60"
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

        {/* Footer Sidebar con Firma Oficial de la Agencia */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
          <div className="rounded-xl border border-slate-800/90 bg-slate-900/80 p-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
              <div className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                <span>Caralita AI Core</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Base de Datos Central</span>
              <span className="text-cyan-400 font-semibold">Online</span>
            </div>
          </div>

          {/* Firma Oficial de la Agencia Desarrolladora */}
          <div className="px-1 text-[10px] text-zinc-500 leading-relaxed space-y-0.5 border-t border-slate-800/70 pt-2.5">
            <div className="font-semibold text-zinc-400">
              Desarrollado por: <span className="text-slate-300">Nexora One</span>
            </div>
            <div>
              Soporte: <a href="tel:3786414533" className="hover:text-cyan-400 text-zinc-400 transition font-mono">3786414533</a>
            </div>
            <div className="truncate">
              Email: <a href="mailto:nexoraone@nexativanews.com.ar" className="hover:text-cyan-400 text-zinc-400 transition font-mono">nexoraone@nexativanews.com.ar</a>
            </div>
          </div>
        </div>
      </aside>

      {/* Área Central / Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar con Buscador Global y Estado */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 px-6 flex items-center justify-between backdrop-blur shrink-0">
          {/* Buscador global con atajo visual */}
          <div className="relative w-80 md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar cliente, IP, MAC, ONU o caja NAP..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2 pl-9 pr-12 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] text-slate-500 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
              <span>⌘</span>K
            </div>
          </div>

          {/* Estado de Red y Perfil de Operador */}
          <div className="flex items-center gap-4">
            {/* Pill de Base de Datos */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Database className="h-3.5 w-3.5" />
              <span>Core Sincronizado</span>
            </div>

            {/* Notificaciones */}
            <button
              onClick={() => setShowNotification(!showNotification)}
              className="relative p-2 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300 transition"
              title="Notificaciones del NOC"
            >
              <Bell className="h-4 w-4 text-slate-300" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
            </button>

            {/* Perfil Admin CARALE */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-cyan-900/30">
                CR
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-slate-200">Admin CARALE</span>
                <span className="block text-[10px] text-slate-400">NOC & Soporte N3</span>
              </div>
            </div>
          </div>
        </header>

        {/* Notificación Alerta Global */}
        {showNotification && (
          <div className="bg-rose-500/10 border-b border-rose-500/25 px-6 py-2 flex items-center justify-between text-xs text-rose-300 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>
                <strong>Alerta Óptica Activa:</strong> Caja NAP-04 (Barrio Centro) reporta -30.5 dBm. Pérdida severa de potencia detectada en splitter de segundo nivel.
              </span>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-[11px] underline hover:text-white font-medium"
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
