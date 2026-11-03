"use client";

import React, { useState, useEffect } from "react";
import { QrCode, X, ExternalLink, Sparkles, Smartphone } from "lucide-react";

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
    "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=https://nexora-one.vercel.app";

  return (
    <>
      {/* Boton / Badge Discreto */}
      <div className={`inline-flex items-center gap-1.5 text-[10px] text-zinc-400 font-sans ${className}`}>
        <span>Desarrollado por:</span>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400 transition font-semibold group cursor-pointer active:scale-95 shadow-sm"
          title="Ver Nexora One Store y soluciones aplicadas"
        >
          <strong className="text-zinc-200 group-hover:text-cyan-200">Nexora One</strong>
          <span className="text-slate-500">|</span>
          <span className="flex items-center gap-1 text-cyan-400 font-mono text-[9px] uppercase tracking-wider">
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
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          {/* Tarjeta interna centrada */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-neutral-900 border border-cyan-500/30 rounded-2xl max-w-sm w-full mx-auto p-5 text-center space-y-4 shadow-2xl text-slate-100"
          >
            {/* Botón Cerrar discreto */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-neutral-400 hover:text-white p-1 rounded-lg transition"
              aria-label="Cerrar ventana modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Icono Badge */}
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-inner">
              <Sparkles className="h-5 w-5 text-cyan-400" />
            </div>

            {/* Título y Descripción */}
            <div>
              <h3 id="nexora-badge-title" className="text-base font-bold text-white tracking-tight">
                Nexora One Engine
              </h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed font-normal">
                Soluciones SaaS de alto rendimiento, Inteligencia Artificial aplicada y PWAs de trinchera para telecomunicaciones.
              </p>
            </div>

            {/* Contenedor Blanco de Alto Contraste con QR Proporcionado */}
            <div className="bg-white p-3 rounded-xl inline-flex items-center justify-center shadow-inner mx-auto">
              <img
                src={qrImageUrl}
                alt="Código QR hacia Nexora One Store"
                width={160}
                height={160}
                className="w-40 h-40 object-contain mx-auto"
              />
            </div>

            <span className="block text-[11px] font-mono text-cyan-400 font-semibold">
              Escanea con tu cámara o abre el enlace
            </span>

            {/* Botón de Acción Ancho Completo */}
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <a
                href="/store"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                <span>Abrir Nexora One Store</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 text-xs font-medium active:scale-95 transition"
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
