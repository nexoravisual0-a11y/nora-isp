"use client";

import React, { useState, useEffect } from "react";
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
  BookOpen,
  Tag,
  MessageSquare,
  Menu,
} from "lucide-react";
import NoraCopilot from "@/components/NoraCopilot";
import NexoraBadge from "@/components/ui/NexoraBadge";
import AdminCommercialPlansModal from "@/components/AdminCommercialPlansModal";
import WhatsAppInboxModal from "@/components/WhatsAppInboxModal";
import { CaraleLogo } from "@/components/ui/CaraleLogo";

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
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [unreadHandoffCount, setUnreadHandoffCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cerrar el drawer en navegación
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Bloqueo de scroll exclusivo cuando el drawer mobile está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Consultar hilos de WhatsApp periódicamente para alertar al operador
  useEffect(() => {
    async function checkHandoffThreads() {
      try {
        const res = await fetch("/api/whatsapp/threads?status=requires_human");
        const data = await res.json();
        if (data.success && Array.isArray(data.threads)) {
          setUnreadHandoffCount(data.threads.length);
        }
      } catch (e) {
        // Silencioso
      }
    }
    checkHandoffThreads();
    const interval = setInterval(checkHandoffThreads, 20000);
    return () => clearInterval(interval);
  }, []);

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

  // Si estamos en el portal público o en la PWA de técnicos, renderizamos sin ningún contenedor limitante
  if (pathname === "/portal" || pathname === "/tecnicos") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-[#090b0e] text-slate-100 flex flex-col lg:flex-row overflow-x-hidden font-sans relative">
      {/* Backdrop oscuro para mobile cuando el drawer está abierto */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Lateral - CARALE by Nora (Responsive Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800/90 bg-slate-900/95 flex flex-col justify-between shrink-0 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-screen lg:sticky lg:top-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo y Branding CARALE by Nora */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center shrink-0">
                <CaraleLogo className="h-7 w-7 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]" />
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

            {/* Botón cerrar sidebar en mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition"
              title="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
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
                  onClick={() => setIsMobileMenuOpen(false)}
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
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        link.badge === "Alerta"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : link.badge === "AI N3"
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          : "bg-slate-800 text-slate-300 border border-slate-700/60"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Accesos Rápidos de Operación */}
            <div className="pt-3 border-t border-slate-800/80 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5 flex items-center justify-between">
                <span>Herramientas del NOC</span>
              </div>

              {/* Protocolo UAT de Campo */}
              <Link
                href="/guia"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  pathname === "/guia"
                    ? "bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  <span>Protocolo UAT Campo</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  DOCS
                </span>
              </Link>

              {/* Botón Gestión de Planes Comerciales */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowPlansModal(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  <span>Planes Comerciales</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
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

          {/* Firma Oficial de la Agencia Desarrolladora y Badge QR */}
          <div className="px-1 text-[10px] text-zinc-400 leading-relaxed border-t border-slate-800/70 pt-2.5 space-y-1.5">
            <div>
              <NexoraBadge />
            </div>
            <div>
              Soporte:{" "}
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
      <div className="flex-1 flex flex-col w-full min-w-0">
        {/* Top Bar con Acciones Rápidas del NOC y Estado */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 px-3 sm:px-4 w-full max-w-full flex items-center justify-between gap-2 overflow-hidden backdrop-blur shrink-0 sticky top-0 z-30">
          {/* Lado Izquierdo: Botón Hamburguesa Mobile + Estado de Red Central */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/80 transition"
              title="Abrir menú"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5 text-cyan-400" />
            </button>

            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold shadow-sm">
              <Database className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Core Sincronizado</span>
              <span className="sm:hidden text-[11px]">Core OK</span>
            </div>
          </div>

          {/* Acciones Centrales y Perfil de Operador */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-1">
            {/* Botón Mesa de Entrada / WhatsApp */}
            <button
              onClick={() => setShowInboxModal(true)}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition shrink-0 ${
                unreadHandoffCount > 0
                  ? "bg-rose-500/15 border-rose-500/50 text-rose-300 hover:bg-rose-500/25"
                  : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 hover:text-white"
              }`}
              title="Mesa de Entrada Unificada (WhatsApp con Human Handoff)"
            >
              <MessageSquare className={`h-3.5 w-3.5 ${unreadHandoffCount > 0 ? "text-rose-400" : "text-emerald-400"}`} />
              <span className="hidden md:inline">Mesa de Entrada</span>
              {unreadHandoffCount > 0 && (
                <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-white font-extrabold text-[9px] animate-pulse">
                  {unreadHandoffCount}
                </span>
              )}
            </button>

            {/* Botón Copilot Flotante/NOC Header */}
            <button
              onClick={() => setShowCopilot(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-xs font-semibold text-cyan-300 hover:text-white shadow-sm transition shrink-0"
              title="Abrir Asistente Copilot para Operadores del NOC"
            >
              <Bot className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Nora Copilot</span>
              <span className="lg:hidden hidden sm:inline">Copilot</span>
            </button>

            {/* Buscador Técnico Rápido */}
            <div className="relative hidden xl:block w-52 2xl:w-64 shrink-0">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar DNI, ONU, NAP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-inner"
              />
            </div>

            {/* Botón Compartir Portal Público */}
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-semibold text-cyan-300 hover:text-white shadow-sm transition shrink-0"
              title="Compartir enlace público del Portal de Clientes con Caralita"
            >
              <QrCode className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden 2xl:inline">Compartir Portal</span>
              <span className="2xl:hidden hidden sm:inline">Portal QR</span>
            </button>

            {/* Botón QR Acceso Cuadrilla 1 (Uso Interno) */}
            <button
              onClick={() => setShowTechQrModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-rose-500/50 bg-rose-500/15 hover:bg-rose-500/25 text-xs font-semibold text-rose-300 hover:text-white shadow-sm transition shrink-0"
              title="Código QR de autenticación e identidad para Cuadrilla 1"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden xl:inline">QR Cuadrilla 1</span>
              <span className="xl:hidden hidden sm:inline">Cuadrilla 1</span>
            </button>

            {/* Perfil Admin CARALE */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800 shrink-0">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-cyan-900/30 shrink-0">
                CR
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-slate-200 whitespace-nowrap">Admin CARALE</span>
                <span className="block text-[10px] text-slate-400 whitespace-nowrap">NOC & Soporte</span>
              </div>
            </div>
          </div>
        </header>

        {/* Notificación Alerta Global */}
        {showNotification && (
          <div className="bg-rose-500/10 border-b border-rose-500/25 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-rose-300 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span className="line-clamp-1 sm:line-clamp-none">
                <strong>Alerta Óptica Activa:</strong> Caja NAP-04 (Barrio Centro) reporta -30.5 dBm. Pérdida severa de potencia detectada en splitter de segundo nivel.
              </span>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-[11px] underline hover:text-white font-medium shrink-0 ml-2"
            >
              Descartar
            </button>
          </div>
        )}

        {/* Contenido Dinámico */}
        <main className="flex-1 w-full min-w-0 overflow-y-visible lg:overflow-y-auto">{children}</main>
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

      {/* Modal de Gestión de Planes Comerciales */}
      <AdminCommercialPlansModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
      />

      {/* Modal de Mesa de Entrada Unificada / WhatsApp */}
      <WhatsAppInboxModal
        isOpen={showInboxModal}
        onClose={() => {
          setShowInboxModal(false);
          // Actualizar conteo al cerrar
          fetch("/api/whatsapp/threads?status=requires_human")
            .then((r) => r.json())
            .then((d) => {
              if (d.success) setUnreadHandoffCount(d.threads.length);
            })
            .catch(() => {});
        }}
      />

      {/* Parche Aislado: Nora Copilot Overlay / Drawer Lateral */}
      <NoraCopilot isOpen={showCopilot} onClose={() => setShowCopilot(false)} />
    </div>
  );
}
