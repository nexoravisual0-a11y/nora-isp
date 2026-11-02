"use client";

import React, { useState, useEffect } from "react";
import { QrCode, X, ExternalLink, Sparkles, Smartphone, ShieldCheck } from "lucide-react";

interface NexoraBadgeProps {
  variant?: "sidebar" | "footer" | "inline";
  className?: string;
}

export default function NexoraBadge({ variant = "inline", className = "" }: NexoraBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const qrImageUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=https://tinyurl.com/nexora-one";

  return (
    <>
      {/* Botón / Badge Discreto */}
      <div className={`inline-flex items-center gap-1.5 text-[10px] text-zinc-400 font-sans ${className}`}>
        <span>Desarrollado por:</span>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400 transition font-semibold group cursor-pointer active:scale-95 shadow-sm"
          title="Ver App Store y ecosistema de Nexora One"
        >
          <strong className="text-zinc-200 group-hover:text-cyan-200">Nexora One</strong>
          <span className="text-slate-500">|</span>
          <span className="flex items-center gap-0.5 text-cyan-400 font-mono text-[9px] uppercase tracking-wider">
            <QrCode className="h-3 w-3" />
            <span>QR</span>
          </span>
        </button>
      </div>

      {/* Modal Táctil y Accesible de Nexora One */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="nexora-badge-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150"
        >
          {/* Backdrop click */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          <div className="relative w-full max-w-sm rounded-3xl border-2 border-cyan-500/70 bg-slate-900/95 shadow-2xl backdrop-blur-2xl p-6 text-slate-100 text-center z-10">
            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition"
              aria-label="Cerrar ventana modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Icono Badge */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-teal-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/40 mb-3.5 shadow-inner">
              <Sparkles className="h-6 w-6 text-cyan-400" />
            </div>

            {/* Título y Descripción */}
            <h3 id="nexora-badge-title" className="text-base font-black text-white tracking-tight">
              Nexora One Engine
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 mb-4 leading-relaxed font-normal">
              App Store & Ecosistema de Soluciones Inteligentes para ISPs y Telecomunicaciones.
            </p>

            {/* Contenedor Blanco de Alto Contraste para el QR */}
            <div className="mx-auto w-[240px] h-[240px] bg-white p-3 rounded-2xl shadow-xl border-2 border-cyan-500/40 flex items-center justify-center">
              <img
                src={qrImageUrl}
                alt="Código QR hacia Nexora One App Store"
                width={216}
                height={216}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            <span className="block text-[11px] font-mono text-cyan-400 font-semibold mt-3">
              Escanea con tu cámara o abre el enlace
            </span>

            {/* Botón de Acción Directo y Cierre */}
            <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-2.5">
              <a
                href="/store"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 min-h-[48px] rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/60 active:scale-95 transition"
              >
                <Smartphone className="h-4 w-4" />
                <span>Abrir Nexora One App Store</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold active:scale-95 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
