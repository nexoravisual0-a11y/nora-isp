"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Printer,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Layers,
  Activity,
  Terminal,
  ExternalLink,
  LifeBuoy,
  Wifi,
  Database,
  Radio,
  BookOpen,
} from "lucide-react";

export default function GuiaOperativaPage() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 print:bg-white print:text-neutral-900">
      {/* Barra Superior de Navegación y Acciones */}
      <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5 print:hidden">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 text-xs font-semibold transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver al NOC</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-neutral-400">
              <span className="text-neutral-600">/</span>
              <span>Documentación Oficial</span>
              <span className="text-neutral-600">/</span>
              <span className="text-cyan-400 font-semibold">UAT v2.6</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/tecnicos"
              className="px-3 py-1.5 rounded-xl border border-neutral-700/80 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-cyan-300 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
              <span>PWA Cuadrillas</span>
            </Link>
            <Link
              href="/portal"
              className="px-3 py-1.5 rounded-xl border border-neutral-700/80 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-emerald-300 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
              <span>Portal Público</span>
            </Link>
            <button
              onClick={handlePrint}
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal del Documento UAT */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 print:py-0 print:px-0">
        {/* Badge Superior Protocolo UAT */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span>PROTOCOLO OFICIAL UAT — CARALE INTERNET</span>
          </div>
          <span className="text-xs font-mono text-neutral-500 print:text-neutral-700">
            Revisión Operativa: Noviembre 2026 | Ref: UAT-ISP-NORA-2.6
          </span>
        </div>

        {/* Portada y Título */}
        <div className="space-y-3 mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight print:text-black">
            Guía de Validación y Manual Operativo
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal print:text-neutral-800">
            Procedimiento integral de inducción, contingencia offline y estándares de trinchera para la guardia técnica,
            operadores del NOC y cuadrillas de planta externa.
          </p>
        </div>

        {/* Resumen Ejecutivo */}
        <section className="mb-10 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-3 print:border-neutral-300 print:bg-neutral-50">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 print:text-black">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span>Propósito de la Guía</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed print:text-neutral-800">
            Este documento estandariza la operación del software de gestión <strong>Nora ISP</strong> y garantiza
            la autonomía operativa del personal de <strong>Carale Internet</strong>. Cubre los cuatro pilares críticos del
            ecosistema: la arquitectura de contingencia Shadow DB, la operación de la PWA de trinchera, la supervisión en
            tiempo real desde el NOC y el protocolo de reporte de incidentes asistido por Nora Copilot.
          </p>
        </section>

        {/* BLOQUE 1: Lógica de Shadow DB y Contingencia */}
        <section className="mb-12 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-sm">
              01
            </span>
            <h2 className="text-xl font-black text-white tracking-tight print:text-black">
              Lógica de Shadow DB y Contingencia Offline
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed print:text-neutral-800">
            El sistema está diseñado para que la guardia y las cuadrillas de campo <strong>nunca se detengan</strong>,
            incluso si la API de ISPCube se encuentra fuera de servicio, presenta saturación de tokens o la conexión troncal
            a internet sufre cortes temporales.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2 print:border-neutral-300">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-mono">
                <Database className="h-4 w-4" />
                <span>1. Persistencia Local</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed print:text-neutral-700">
                Toda mutación (nuevo ticket, cierre de orden o cambio de estado) impacta en <strong>menos de 800 ms</strong> en
                la base local <strong>isp_tickets</strong> de Neon Postgres.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2 print:border-neutral-300">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                <Layers className="h-4 w-4" />
                <span>2. Cola sync_queue</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed print:text-neutral-700">
                Si ISPCube no responde en 6 segundos o devuelve error, la transacción se deposita en la tabla{" "}
                <strong>sync_queue</strong> con estado <code className="text-amber-300 font-mono font-bold">pending</code> sin arrojar error al usuario.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2 print:border-neutral-300">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                <Radio className="h-4 w-4" />
                <span>3. Sincronización Automática</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed print:text-neutral-700">
                Al reanudarse la conectividad externa, el proceso en background vacía la cola y sincroniza con el ERP sin
                duplicidad de registros ni intervención manual.
              </p>
            </div>
          </div>
        </section>

        {/* BLOQUE 2: PWA de Trinchera para Cuadrillas */}
        <section className="mb-12 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-sm">
              02
            </span>
            <h2 className="text-xl font-black text-white tracking-tight print:text-black">
              Uso de la PWA de Trinchera para Técnicos (/tecnicos)
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed print:text-neutral-800">
            La interfaz para móviles de campo está optimizada para trabajo en poste, luz solar directa y botones táctiles
            de gran tamaño (mínimo 48px de altura).
          </p>

          <div className="space-y-3">
            {/* Semáforo Óptico */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3 print:border-neutral-300">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 print:text-black">
                <Activity className="h-4 w-4 text-cyan-400" />
                <span>Semáforo Óptico y Reglas de Potencia (Rx dBm)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-sans">
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                  <span className="font-bold font-mono block mb-1">VERDE ÓPTIMO</span>
                  <span>-15.0 a -24.9 dBm</span>
                  <p className="text-[11px] text-emerald-400/80 mt-1 font-normal">
                    Potencia ideal. La ONU modula a máxima velocidad nominal simétrica.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300">
                  <span className="font-bold font-mono block mb-1">AMARILLO DEGRADADO</span>
                  <span>-25.0 a -26.9 dBm</span>
                  <p className="text-[11px] text-amber-400/80 mt-1 font-normal">
                    Atenuación. Requiere limpieza con casete SC/APC o rearmado de conector drop.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300">
                  <span className="font-bold font-mono block mb-1">ROJO CRÍTICO</span>
                  <span>&lt;= -27.0 dBm</span>
                  <p className="text-[11px] text-rose-400/80 mt-1 font-normal">
                    Pérdida de sincronismo o corte físico. Requiere derivar a fusión troncal si en NAP persiste la falla.
                  </p>
                </div>
              </div>
            </div>

            {/* GPS y Chat Interno */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-1.5 print:border-neutral-300">
                <strong className="text-xs text-white block font-bold print:text-black">Navegación GPS Inmediata:</strong>
                <p className="text-xs text-neutral-400 leading-relaxed print:text-neutral-700">
                  Al pulsar <strong>Navegar GPS</strong> en una orden de trabajo, la app abre directamente Google Maps
                  trazando la ruta hasta las coordenadas geográficas del abonado.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-1.5 print:border-neutral-300">
                <strong className="text-xs text-white block font-bold print:text-black">Chat Interno de Cuadrillas:</strong>
                <p className="text-xs text-neutral-400 leading-relaxed print:text-neutral-700">
                  Permite reportar cambios de estado y novedades al NOC en tiempo real, almacenando los mensajes en{" "}
                  <strong>internal_messages</strong> sin necesidad de intercambiar datos por WhatsApp personal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE 3: Navegación del Panel NOC / ERP */}
        <section className="mb-12 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-sm">
              03
            </span>
            <h2 className="text-xl font-black text-white tracking-tight print:text-black">
              Navegación y Operación del Panel NOC (/)
            </h2>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-neutral-300 print:text-neutral-800">
            <p>
              El tablero del NOC centraliza la supervisión de la infraestructura FTTH en cinco módulos principales:
            </p>
            <ul className="space-y-2.5 pl-4 list-disc marker:text-cyan-400">
              <li>
                <strong>Abonados en Vivo (/clientes):</strong> Registro integral de clientes con sesión MikroTik PPPoE,
                IP asignada, estado de facturación y potencia óptica recibida en la ONU.
              </li>
              <li>
                <strong>Red FTTH y Nodos (/nodos):</strong> Telemetría de OLTs Huawei/FiberHome y cajas NAP de distribución.
                Alerta visual cuando la capacidad supera el 90% o la atenuación excede lo normal.
              </li>
              <li>
                <strong>Tickets de Soporte (/tickets):</strong> Órdenes de trabajo técnicas, filtrables por prioridad y
                estado (Abierto, En Proceso, Cerrado, Derivado).
              </li>
              <li>
                <strong>Radar de Cuadrillas:</strong> Monitoreo de los técnicos en calle que han reportado su ubicación GPS.
              </li>
              <li>
                <strong>Nora Copilot (Drawer Lateral):</strong> Asistente disponible con el atajo superior o flotante,
                capaz de consultar la Wiki técnica, crear tickets autónomamente y registrar fallas de sistema.
              </li>
            </ul>
          </div>
        </section>

        {/* BLOQUE 4: Resolución y Cierre de Órdenes */}
        <section className="mb-12 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-sm">
              04
            </span>
            <h2 className="text-xl font-black text-white tracking-tight print:text-black">
              Procedimiento de Cierre y Derivación a Fusión
            </h2>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3 text-xs sm:text-sm text-neutral-300 print:border-neutral-300 print:text-neutral-800">
            <ol className="space-y-2.5 list-decimal pl-4 marker:text-cyan-400">
              <li>
                <strong>Medición en Roseta:</strong> Medir con Power Meter calibrado en 1490 nm directamente en el drop del abonado.
              </li>
              <li>
                <strong>Apertura de Modal de Cierre:</strong> En la PWA o en el listado de tickets, pulsar{" "}
                <strong>Cierre / Rx dBm</strong>.
              </li>
              <li>
                <strong>Ingreso de Potencia:</strong> Escribir el valor en dBm (ej. <code>-19.5</code>). El indicador mostrará
                automáticamente el estado del semáforo.
              </li>
              <li>
                <strong>Selección de Resolución:</strong>
                <ul className="mt-1 pl-4 list-disc text-neutral-400 print:text-neutral-700">
                  <li>
                    <span className="text-emerald-400 font-bold">Resuelto:</span> El cliente recuperó señal óptima. El ticket
                    pasa a <em>Cerrado</em>.
                  </li>
                  <li>
                    <span className="text-amber-400 font-bold">Requiere Fusión / Derivación:</span> Si la falla está en el sangrado
                    o splitter de la NAP, se pasa a <em>Derivado</em> y se adjunta nota para la cuadrilla de empalme troncal.
                  </li>
                </ul>
              </li>
            </ol>
          </div>
        </section>

        {/* BLOQUE 5: Asistencia y Captura Remota de Incidentes */}
        <section className="mb-12 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-sm">
              05
            </span>
            <h2 className="text-xl font-black text-white tracking-tight print:text-black">
              Soporte Inteligente y Reporte Remoto de Fallas
            </h2>
          </div>

          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/10 p-5 space-y-2.5 text-xs sm:text-sm text-neutral-300 print:border-neutral-300 print:text-neutral-800">
            <p>
              Cualquier anomalía visual, lentitud o error en la interfaz puede informarse directamente a{" "}
              <strong>Nora Copilot</strong> escribiendo en el chat:
            </p>
            <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-3 font-mono text-xs text-cyan-300 print:bg-neutral-100 print:text-black">
              "Nora, la pantalla de tickets no carga las órdenes de la Cuadrilla 1" o "Se trabó el botón de navegación GPS"
            </div>
            <p className="text-xs text-neutral-400 print:text-neutral-700">
              El motor activará de forma automática la herramienta interna de telemetría{" "}
              <code>reportar_falla_o_feedback</code>, guardando el reporte en la tabla central{" "}
              <strong>system_feedback_telemetry</strong> para auditoría inmediata del equipo de ingeniería.
            </p>
          </div>
        </section>

        {/* Footer Institucional del Documento */}
        <footer className="mt-14 pt-6 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-neutral-500 print:border-neutral-300 print:text-neutral-700">
          <div>
            Carale Internet &copy; 2026. Todos los derechos reservados.
          </div>
          <div>
            Desarrollado y Audita: <strong>Nexora One Engine</strong>
          </div>
        </footer>
      </main>
    </div>
  );
}

