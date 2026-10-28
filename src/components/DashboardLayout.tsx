"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  QrCode,
  ExternalLink,
  X,
  Wrench,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import NoraCopilot from "@/components/NoraCopilot";

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
  { name: "PWA Técnicos", href: "/tecnicos", icon: Wrench, badge: "Móvil" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotification, setShowNotification] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showTechQrModal, setShowTechQrModal] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      const term = searchTerm.trim();
      setSearchTerm("");
      router.push(
        '/nora?prompt=Busca en la base de datos la siguiente información, cliente o equipo: ' +
          encodeURIComponent(term)
      );
    }
  };

  // Si estamos en el portal público o en la PWA de técnicos, renderizamos sin el layout del NOC interno
  if (pathname === "/portal" || pathname === "/tecnicos") {
    return (
      <div className="h-full w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
        {children}
      </div>
    );
  }

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

            {/* Acceso Comercial / Demostración QR Portal en Menú Lateral */}
            <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="w-full group flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 border border-dashed border-slate-800 hover:border-cyan-500/40 transition-all duration-150"
                title="Generar QR para demostraciones comerciales"
              >
                <div className="flex items-center gap-2.5">
                  <QrCode className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>Compartir Portal (QR)</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 font-mono font-bold">
                  Demo
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowTechQrModal(true)}
                className="w-full group flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/30 border border-dashed border-rose-900/40 hover:border-rose-500/40 transition-all duration-150"
                title="Acceso seguro exclusivo para Cuadrilla 1"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-4 w-4 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span>QR Cuadrilla 1</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60 font-mono font-bold">
                  NOC
                </span>
              </button>
            </div>
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
          <div className="px-1 text-[10px] text-zinc-400 leading-relaxed border-t border-slate-800/70 pt-2.5">
            <div>
              Desarrollado por: <strong className="text-slate-200">Nexora One</strong> | Soporte:{" "}
              <a href="tel:3786414533" className="hover:text-cyan-400 text-zinc-300 transition font-mono">
                3786414533
              </a>{" "}
              | Email:{" "}
              <a
                href="mailto:nexoraone@nexativanews.com.ar"
                className="hover:text-cyan-400 text-zinc-300 transition font-mono"
              >
                nexoraone@nexativanews.com.ar
              </a>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
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

            {/* Botón Nora Copilot (Drawer Asistente NOC) */}
            <button
              onClick={() => setShowCopilot(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-cyan-500/20 hover:from-indigo-500/30 hover:to-cyan-500/30 text-xs font-bold text-indigo-300 hover:text-white shadow-md shadow-indigo-500/15 transition-all"
              title="Abrir Nora Copilot - Asistente Operativo del NOC"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">Nora Copilot</span>
            </button>

            {/* Botón Compartir Portal (QR) */}
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/70 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-cyan-300 shadow-sm transition"
              title="Código QR para acceso de clientes al Portal"
            >
              <QrCode className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Compartir Portal (QR)</span>
            </button>

            {/* Botón QR Acceso Cuadrilla 1 (Uso Interno) */}
            <button
              onClick={() => setShowTechQrModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/50 bg-rose-500/15 hover:bg-rose-500/25 text-xs font-semibold text-rose-300 hover:text-white shadow-sm transition"
              title="Código QR de autenticación e identidad para Cuadrilla 1"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden sm:inline">QR Acceso Cuadrilla 1</span>
            </button>

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

      {/* Modal QR Portal Público */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-2xl p-6 text-slate-100 text-center">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 mb-4 shadow-inner">
              <QrCode className="h-6 w-6" />
            </div>

            <h3 className="text-base font-bold text-white tracking-tight">
              Portal Público de Clientes
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Escanea el código QR para ingresar a la autogestión y soporte con Caralita
            </p>

            <div className="mx-auto w-[250px] h-[250px] bg-white p-2 rounded-2xl shadow-xl border border-slate-700 flex items-center justify-center">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://nora-isp.vercel.app/portal"
                alt="QR Portal"
                className="mx-auto rounded-lg"
              />
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
              <a
                href="/portal"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-mono hover:underline"
              >
                <span>https://nora-isp.vercel.app/portal</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Seguridad Técnica Cuadrilla 1 */}
      {showTechQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl border border-rose-500/50 bg-slate-900/95 shadow-2xl backdrop-blur-2xl p-6 text-slate-100 text-center">
            <button
              type="button"
              onClick={() => setShowTechQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500/20 to-amber-600/20 text-rose-400 border border-rose-500/30 mb-4 shadow-inner">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <h3 className="text-base font-bold text-white tracking-tight">
              QR Acceso Cuadrilla 1
            </h3>
            <p className="text-xs text-rose-300/90 mt-1 mb-5">
              Escaneo técnico exclusivo para Javier_C1 con geolocalización y credenciales
            </p>

            <div className="mx-auto w-[250px] h-[250px] bg-white p-2 rounded-2xl shadow-xl border border-rose-500/40 flex items-center justify-center">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://nora-isp.vercel.app/tecnicos?tech=Javier_C1"
                alt="QR Cuadrilla 1"
                className="mx-auto rounded-lg"
              />
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
              <a
                href="/tecnicos?tech=Javier_C1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-mono hover:underline"
              >
                <span>https://nora-isp.vercel.app/tecnicos?tech=Javier_C1</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Parche Aislado: Nora Copilot Overlay / Drawer Lateral */}
      <NoraCopilot isOpen={showCopilot} onClose={() => setShowCopilot(false)} />
    </div>
  );
}
