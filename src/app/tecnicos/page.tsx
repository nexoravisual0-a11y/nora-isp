"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Camera,
  Send,
  Bot,
  User,
  Power,
  AlertTriangle,
  CheckCircle2,
  X,
  Upload,
  RefreshCw,
  Activity,
  Layers,
  ChevronLeft,
  Navigation,
  ShieldAlert,
  UserCheck,
  MessageSquare,
  Sparkles,
  PhoneCall,
  Clock,
  Sliders,
  ExternalLink,
  Radio,
  FileText,
  ChevronDown,
  Wrench,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  getOrdenesTrabajo,
  reportarCierreOrden,
  getMensajesInternos,
  enviarMensajeInterno,
  OrdenTrabajoTecnico,
  MensajeInterno,
} from "@/actions/ispcube-actions";
import NexoraBadge from "@/components/ui/NexoraBadge";

/**
 * Compresión nativa de imágenes en cliente con HTML5 Canvas (max 1280px / 60% JPEG)
 */
async function compressImageClient(file: File): Promise<{ compressedBlob: Blob; compressedDataUrl: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve({ compressedBlob: file, compressedDataUrl: reader.result as string });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1280;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ compressedBlob: file, compressedDataUrl: e.target?.result as string });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.6);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ compressedBlob: blob, compressedDataUrl });
            } else {
              resolve({ compressedBlob: file, compressedDataUrl });
            }
          },
          "image/jpeg",
          0.6
        );
      };
      img.onerror = () => resolve({ compressedBlob: file, compressedDataUrl: e.target?.result as string });
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function TecnicoPWATrincheraInner() {
  const searchParams = useSearchParams();
  const techParam = searchParams.get("tech") || "Cuadrilla 1";
  const tecnicoId = techParam.replace(/_/g, " ");

  // Estado de órdenes de trabajo
  const [ordenes, setOrdenes] = useState<OrdenTrabajoTecnico[]>([]);
  const [isLoadingOrdenes, setIsLoadingOrdenes] = useState(true);
  const [errorOrdenes, setErrorOrdenes] = useState<string | null>(null);

  // Estado del Drawer / Modal de Cierre y Telemetría Óptica
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenTrabajoTecnico | null>(null);
  const [rxPowerInput, setRxPowerInput] = useState<string>("-19.5");
  const [estadoFinal, setEstadoFinal] = useState<"Resuelto" | "Requiere Fusión / Derivación">("Resuelto");
  const [observacionesCierre, setObservacionesCierre] = useState<string>("");
  const [isSubmittingCierre, setIsSubmittingCierre] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null);

  // Estado del Chat Interno (internal_messages)
  const [isChatInternoOpen, setIsChatInternoOpen] = useState(false);
  const [mensajesInternos, setMensajesInternos] = useState<MensajeInterno[]>([]);
  const [inputChatInterno, setInputChatInterno] = useState("");
  const [isSendingMensaje, setIsSendingMensaje] = useState(false);

  // Estado del Copilot Flotante de Caralita (Wiki RAG)
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: `Hola ${tecnicoId}. ¿En qué te ayudo en esta orden?`,
    },
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [attachedPhoto, setAttachedPhoto] = useState<File | null>(null);
  const [compressedPhotoUrl, setCompressedPhotoUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInternoEndRef = useRef<HTMLDivElement>(null);
  const copilotEndRef = useRef<HTMLDivElement>(null);

  // Cargar órdenes y mensajes al montar
  const fetchOrdenes = async () => {
    setIsLoadingOrdenes(true);
    setErrorOrdenes(null);
    try {
      const data = await getOrdenesTrabajo(tecnicoId);
      setOrdenes(data);
    } catch (err) {
      setErrorOrdenes("Error cargando órdenes de trabajo.");
    } finally {
      setIsLoadingOrdenes(false);
    }
  };

  const fetchMensajes = async () => {
    try {
      const data = await getMensajesInternos();
      setMensajesInternos(data);
    } catch (e) {
      console.warn("Error cargando mensajes internos:", e);
    }
  };

  useEffect(() => {
    fetchOrdenes();
    fetchMensajes();
  }, [tecnicoId]);

  useEffect(() => {
    if (isChatInternoOpen) {
      chatInternoEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajesInternos, isChatInternoOpen]);

  useEffect(() => {
    if (isCopilotOpen) {
      copilotEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [copilotMessages, isCopilotLoading, isCopilotOpen]);

  // Manejo de Semáforo de Potencia Óptica
  const numRx = parseFloat(rxPowerInput);
  const rxColorClass =
    isNaN(numRx)
      ? "text-slate-400 bg-slate-800 border-slate-700"
      : numRx >= -24.0 && numRx <= -15.0
      ? "text-emerald-400 bg-emerald-950/80 border-emerald-500 shadow-emerald-900/50"
      : numRx < -24.0 && numRx > -27.0
      ? "text-amber-300 bg-amber-950/80 border-amber-500 shadow-amber-900/50"
      : "text-rose-400 bg-rose-950/80 border-rose-500 shadow-rose-900/50";

  const rxStatusLabel =
    isNaN(numRx)
      ? "Ingrese valor"
      : numRx >= -24.0 && numRx <= -15.0
      ? "ÓPTIMO (-15 a -24 dBm)"
      : numRx < -24.0 && numRx > -27.0
      ? "DEGRADADO (-25 a -26.9 dBm)"
      : "CRÍTICO (<= -27 dBm)";

  // Enviar Cierre de Orden
  const handleReportarCierre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenSeleccionada) return;

    const valRx = parseFloat(rxPowerInput);
    if (isNaN(valRx)) {
      alert("Por favor ingresa un valor numérico para la potencia óptica (dBm).");
      return;
    }

    setIsSubmittingCierre(true);
    setMensajeFeedback(null);

    try {
      const res = await reportarCierreOrden({
        ticketId: ordenSeleccionada.id,
        customerId: ordenSeleccionada.customerId || ordenSeleccionada.cliente,
        tecnicoId,
        rxPower: valRx,
        estadoFinal,
        observaciones: observacionesCierre,
      });

      setMensajeFeedback(res.message);
      // Actualizar orden localmente
      setOrdenes((prev) =>
        prev.map((o) =>
          o.id === ordenSeleccionada.id
            ? { ...o, estado: estadoFinal === "Resuelto" ? "Cerrado" : "Derivado", rxPower: valRx }
            : o
        )
      );

      setTimeout(() => {
        setOrdenSeleccionada(null);
        setMensajeFeedback(null);
        setObservacionesCierre("");
      }, 1800);
    } catch (err: any) {
      alert("Error al reportar cierre: " + err.message);
    } finally {
      setIsSubmittingCierre(false);
    }
  };

  // Enviar mensaje interno rápido
  const handleSendMensajeInterno = async (contenidoTexto?: string) => {
    const texto = (contenidoTexto || inputChatInterno).trim();
    if (!texto || isSendingMensaje) return;

    setIsSendingMensaje(true);
    try {
      const nuevo = await enviarMensajeInterno({
        senderId: tecnicoId,
        role: "Técnico Campo",
        ticketId: ordenSeleccionada?.id,
        content: texto,
      });
      setMensajesInternos((prev) => [...prev, nuevo]);
      if (!contenidoTexto) setInputChatInterno("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingMensaje(false);
    }
  };

  // Enviar consulta a Caralita Copilot
  const handleSendCopilot = async (promptDirecto?: string) => {
    const query = (promptDirecto || copilotInput).trim();
    if ((!query && !compressedPhotoUrl) || isCopilotLoading) return;

    const userMsg = { role: "user" as const, content: query };
    const nuevosMensajes = [...copilotMessages, userMsg];
    setCopilotMessages(nuevosMensajes);
    if (!promptDirecto) setCopilotInput("");
    setIsCopilotLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nuevosMensajes,
          source: "noc",
          role: "tecnico_calle",
          screen: "/tecnicos",
          image: compressedPhotoUrl || undefined,
        }),
      });

      const data = await res.json();
      if (data.content) {
        setCopilotMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
      }
      setAttachedPhoto(null);
      setCompressedPhotoUrl(null);
    } catch (err) {
      setCopilotMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error al conectar con Caralita. Reintentando por fallback..." },
      ]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // Captura de imagen comprimida con Canvas
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const { compressedBlob, compressedDataUrl } = await compressImageClient(file);
      setAttachedPhoto(new File([compressedBlob], file.name, { type: "image/jpeg" }));
      setCompressedPhotoUrl(compressedDataUrl);
    } catch (err) {
      console.warn("Fallo compresión:", err);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-20">
      {/* 1. Header Táctil de Trinchera (Alto Contraste) */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b-2 border-cyan-500/80 px-4 py-3 flex items-center justify-between shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition"
            title="Volver al NOC"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-sm font-black tracking-tight text-white uppercase">TRINCHERA FTTH</h1>
            </div>
            <span className="text-[11px] font-mono font-bold text-cyan-400">{tecnicoId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Chat Interno */}
          <button
            onClick={() => setIsChatInternoOpen(!isChatInternoOpen)}
            className="relative h-11 px-3.5 flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs active:scale-95 transition shadow-sm"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="hidden sm:inline">Interno</span>
            {mensajesInternos.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-cyan-400 absolute top-2 right-2" />
            )}
          </button>

          {/* Botón Refrescar */}
          <button
            onClick={fetchOrdenes}
            disabled={isLoadingOrdenes}
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 active:scale-95 transition disabled:opacity-50"
            title="Recargar órdenes"
          >
            <RefreshCw className={`h-5 w-5 ${isLoadingOrdenes ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </header>

      {/* 2. Contenedor de Órdenes de Trabajo (Mobile-First / Botones Grandes) */}
      <main className="flex-1 p-3 sm:p-5 max-w-2xl mx-auto w-full space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Órdenes Asignadas ({ordenes.length})
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
            GPS Activo
          </span>
        </div>

        {isLoadingOrdenes ? (
          <div className="p-12 text-center text-cyan-400 flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="text-xs font-bold font-mono">Sincronizando órdenes con Shadow DB...</span>
          </div>
        ) : ordenes.length === 0 ? (
          <div className="p-10 rounded-2xl border-2 border-dashed border-slate-800 text-center text-slate-500 font-medium">
            No tienes órdenes de trabajo pendientes en esta cuadrilla.
          </div>
        ) : (
          ordenes.map((orden) => {
            const isCritica = orden.prioridad === "Alta";
            const isCerrada = orden.estado === "Cerrado";
            const isDerivada = orden.estado === "Derivado";

            return (
              <div
                key={orden.id}
                className={`rounded-2xl border-2 p-4 transition shadow-lg ${
                  isCerrada
                    ? "bg-slate-900/40 border-slate-800 opacity-60"
                    : isCritica
                    ? "bg-slate-900/90 border-rose-500/80 shadow-rose-950/20"
                    : "bg-slate-900/90 border-slate-700/80 shadow-slate-950/40"
                }`}
              >
                {/* Cabecera Tarjeta: ID y Estado */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
                      {orden.id}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        isCritica ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "bg-cyan-500/20 text-cyan-300"
                      }`}
                    >
                      Prioridad {orden.prioridad}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isCerrada
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : isDerivada
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {orden.estado}
                  </span>
                </div>

                {/* Abonado y Dirección */}
                <h2 className="text-base font-black text-white leading-snug">{orden.cliente}</h2>
                <div className="flex items-start gap-1.5 text-xs text-slate-300 mt-1 mb-2 font-medium">
                  <MapPin className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{orden.direccion}</span>
                </div>

                {/* Problema Reportado */}
                <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-2.5 my-3 text-xs text-slate-300 leading-relaxed font-sans">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Motivo de Reclamo:</span>
                  {orden.problema}
                </div>

                {/* Botones de Acción Táctil (Mínimo 48px de alto táctil) */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {/* Botón de Navegación GPS (Google Maps) */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${orden.lat || -27.5924},${orden.lng || -56.6845}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border-2 border-slate-700 text-cyan-300 flex items-center justify-center gap-2 font-bold text-xs shadow-md transition"
                  >
                    <Navigation className="h-5 w-5 text-cyan-400" />
                    <span>Navegar GPS</span>
                  </a>

                  {/* Botón Reportar Cierre / Telemetría */}
                  <button
                    onClick={() => {
                      setOrdenSeleccionada(orden);
                      if (orden.rxPower !== null && orden.rxPower !== undefined) {
                        setRxPowerInput(String(orden.rxPower));
                      }
                    }}
                    className={`h-12 min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition ${
                      isCerrada
                        ? "bg-slate-800 text-slate-400 border border-slate-700"
                        : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-950/50"
                    }`}
                  >
                    <Sliders className="h-5 w-5" />
                    <span>{isCerrada ? "Ver Telemetría" : "Cierre / Rx dBm"}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* 3. Modal / Drawer Rápido de Cierre y Telemetría Óptica */}
      {ordenSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border-t-2 sm:border-2 border-cyan-500/80 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-cyan-400" />
                  Reporte de Potencia y Cierre
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {ordenSeleccionada.id} • {ordenSeleccionada.cliente}
                </span>
              </div>
              <button
                onClick={() => setOrdenSeleccionada(null)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {mensajeFeedback ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto animate-bounce" />
                <p className="text-sm font-bold text-white">{mensajeFeedback}</p>
              </div>
            ) : (
              <form onSubmit={handleReportarCierre} className="space-y-4">
                {/* Semáforo de Potencia Óptica Rx */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Potencia Óptica Rx en Roseta / ONU (dBm)
                    </label>
                    <span className="text-[11px] font-bold font-mono text-cyan-400">{rxStatusLabel}</span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={rxPowerInput}
                      onChange={(e) => setRxPowerInput(e.target.value)}
                      required
                      placeholder="-19.5"
                      className={`w-full h-14 text-2xl font-black font-mono text-center rounded-2xl border-2 transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${rxColorClass}`}
                    />
                  </div>
                </div>

                {/* Selector de Estado Rápido */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Resolución de la Intervención
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEstadoFinal("Resuelto")}
                      className={`h-12 min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-2 transition ${
                        estadoFinal === "Resuelto"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      <Check className="h-5 w-5" />
                      <span>Resuelto (OK)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEstadoFinal("Requiere Fusión / Derivación")}
                      className={`h-12 min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border-2 transition text-center px-2 ${
                        estadoFinal === "Requiere Fusión / Derivación"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <span>Derivar Fusión</span>
                    </button>
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Notas Técnicas / Conector / Splice
                  </label>
                  <textarea
                    rows={2}
                    value={observacionesCierre}
                    onChange={(e) => setObservacionesCierre(e.target.value)}
                    placeholder="Ej. Conector SC/APC rearmado, potencia normalizada en roseta..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Botón de Envío Instantáneo */}
                <button
                  type="submit"
                  disabled={isSubmittingCierre}
                  className="w-full h-14 min-h-[48px] rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-950/60 disabled:opacity-50 transition active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmittingCierre ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Sincronizando con Shadow DB...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Guardar Cierre de Orden</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 4. Chat Interno Colapsable (internal_messages) */}
      {isChatInternoOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-slate-900 border-t-2 border-cyan-500/80 shadow-2xl rounded-t-3xl max-w-2xl mx-auto h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-200">
          {/* Header Chat */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Canal Interno de Guardia NOC</h3>
            </div>
            <button
              onClick={() => setIsChatInternoOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Botones de Mensajes Rápidos de Trinchera */}
          <div className="p-2 bg-slate-950/60 border-b border-slate-800 flex gap-2 overflow-x-auto text-xs no-scrollbar">
            {[
              "Llegué al domicilio",
              "Punto NAP saturado",
              "Necesito corte de señal",
              "Potencia normalizada",
            ].map((msgRapido) => (
              <button
                key={msgRapido}
                onClick={() => handleSendMensajeInterno(msgRapido)}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold border border-slate-700 active:scale-95"
              >
                {msgRapido}
              </button>
            ))}
          </div>

          {/* Lista de Mensajes */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {mensajesInternos.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-8">
                No hay mensajes recientes en el canal de guardia.
              </div>
            ) : (
              mensajesInternos.map((m) => {
                const esMio = m.sender_id === tecnicoId;
                return (
                  <div key={m.id} className={`flex flex-col ${esMio ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mb-0.5">
                      <span className="font-bold text-cyan-400">{m.sender_id}</span>
                      <span>• {m.created_at}</span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs font-medium leading-relaxed ${
                        esMio
                          ? "bg-cyan-600 text-white rounded-tr-none shadow-md"
                          : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatInternoEndRef} />
          </div>

          {/* Input Mensaje */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
            <input
              type="text"
              value={inputChatInterno}
              onChange={(e) => setInputChatInterno(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMensajeInterno()}
              placeholder="Escribe a la guardia técnica..."
              className="flex-1 h-12 rounded-xl bg-slate-900 border border-slate-800 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => handleSendMensajeInterno()}
              disabled={!inputChatInterno.trim() || isSendingMensaje}
              className="h-12 w-12 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center disabled:opacity-40 transition"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Botón Flotante y Modal de Caralita Copilot (RAG Wiki) */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center border-2 border-cyan-400 active:scale-95 transition"
          title="Consultar a Caralita"
          aria-label="Consultar a Caralita"
        >
          <Sparkles className="h-7 w-7 text-white" />
        </button>
      </div>

      {isCopilotOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t-2 border-cyan-400 rounded-t-3xl shadow-2xl max-w-2xl mx-auto h-[82vh] flex flex-col animate-in slide-in-from-bottom duration-200">
          {/* Header Copilot */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Caralita Copilot - Cuadrillas
                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En línea
                  </span>
                </h3>
                <span className="text-[10px] text-slate-400">Asistencia técnica y protocolos en calle</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCopilotMessages([
                  {
                    role: "assistant",
                    content: `Hola ${tecnicoId}. ¿En qué te ayudo en esta orden?`,
                  },
                ])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 transition"
                title="Reiniciar conversación"
                aria-label="Reiniciar chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCopilotOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
                aria-label="Cerrar chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Atajos Rápidos a la Wiki / Chips Táctiles */}
          <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex gap-2 overflow-x-auto text-xs no-scrollbar">
            {[
              "¿Cómo configurar ZTE F670L en bridge?",
              "Parámetros de potencia SC/APC aceptables",
              "Procedimiento de sangrado de fibra troncal",
              "Reportar problema o falla técnica",
            ].map((kw) => (
              <button
                key={kw}
                onClick={() => handleSendCopilot(kw)}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 hover:text-white font-semibold border border-cyan-500/25 active:scale-95 text-[11px] transition shadow-sm"
              >
                {kw}
              </button>
            ))}
          </div>

          {/* Historial de Chat */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
            {copilotMessages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap font-sans ${
                    m.role === "user"
                      ? "bg-cyan-600 text-white rounded-tr-none font-medium shadow-sm"
                      : "bg-slate-800/95 text-slate-100 rounded-tl-none border border-slate-700/80 font-normal shadow-sm"
                  }`}
                >
                  {m.content
                    .replace(/\*\*(.*?)\*\*/g, "$1")
                    .replace(/^#+\s+/gm, "")
                    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")}
                </div>
              </div>
            ))}
            {isCopilotLoading && (
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-sans p-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Buscando procedimiento...</span>
              </div>
            )}
            <div ref={copilotEndRef} />
          </div>

          {/* Formulario Consulta Copilot con soporte Canvas */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
            {isCompressing && (
              <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Comprimiendo foto con Canvas (1280px / 60% JPEG)...</span>
              </div>
            )}
            {attachedPhoto && (
              <div className="flex items-center justify-between bg-slate-800 px-3 py-1 rounded-lg text-xs text-slate-300">
                <span>Foto adjunta: {attachedPhoto.name}</span>
                <button onClick={() => setAttachedPhoto(null)} className="text-rose-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-12 w-12 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center shrink-0"
                title="Adjuntar foto de campo"
              >
                <Camera className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendCopilot()}
                placeholder="Pregunta a Caralita sobre un procedimiento..."
                className="flex-1 h-12 rounded-xl bg-slate-900 border border-slate-800 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleSendCopilot()}
                disabled={(!copilotInput.trim() && !compressedPhotoUrl) || isCopilotLoading}
                className="h-12 w-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding Nexora One y Badge QR Dinámico */}
      <footer className="fixed bottom-0 inset-x-0 bg-slate-950/95 border-t border-slate-800/80 p-2 text-center text-[10px] text-zinc-500 z-20 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <Link
          href="/guia"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 text-cyan-300 hover:text-white border border-cyan-500/30 text-[10px] font-semibold transition"
          title="Ver Guía de Validación Operativa y Protocolos"
        >
          <FileText className="h-3 w-3 text-cyan-400" />
          <span>Guía y Protocolos</span>
        </Link>
        <span className="text-slate-700">|</span>
        <NexoraBadge />
        <span className="hidden sm:inline text-slate-700">|</span>
        <span>
          Soporte:{" "}
          <a href="tel:3786414533" className="text-zinc-400 font-mono hover:text-cyan-400">
            3786414533
          </a>
        </span>
        <span className="text-slate-700">|</span>
        <span>
          Email:{" "}
          <a href="mailto:nexoraone@nexativanews.com.ar" className="text-zinc-400 font-mono hover:text-cyan-400">
            nexoraone@nexativanews.com.ar
          </a>
        </span>
      </footer>
    </div>
  );
}

export default function TecnicoPWAPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono text-xs">
          Cargando PWA Trinchera...
        </div>
      }
    >
      <TecnicoPWATrincheraInner />
    </Suspense>
  );
}
