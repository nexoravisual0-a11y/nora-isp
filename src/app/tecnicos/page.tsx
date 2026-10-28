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
} from "lucide-react";

export interface TechnicalItem {
  label: string;
  valor: string;
  alerta?: boolean;
  critico?: boolean;
}

export interface TechnicalPayload {
  tipo: "cliente" | "nodo" | "ticket";
  titulo: string;
  subtitulo?: string;
  datos: TechnicalItem[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  photoUrl?: string | null;
  technicalPayload?: TechnicalPayload | null;
}

interface CoordenadasGPS {
  lat: number;
  lng: number;
  precision: number;
}

function TecnicoPWAInner() {
  const searchParams = useSearchParams();
  const techParam = searchParams.get("tech") || "";

  // Estado de Jornada Técnica y Geolocalización
  const [jornadaActiva, setJornadaActiva] = useState(false);
  const [coordenadasGPS, setCoordenadasGPS] = useState<CoordenadasGPS | null>(null);
  const [direccionLegible, setDireccionLegible] = useState<string | null>(null);
  const [cargandoGPS, setCargandoGPS] = useState(false);
  const [cargandoDireccion, setCargandoDireccion] = useState(false);
  const [errorGPS, setErrorGPS] = useState<string | null>(null);

  // Estado del Chat y Adjuntos
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: techParam
        ? `¡Hola ${techParam.replace("_", " ")}! Caralita IA Nivel 3 en línea. Estoy lista para asistirte en campo con telemetría óptica de NAPs, ONUs y apertura de tickets con geolocalización activa.`
        : "Caralita NOC lista para asistencia en campo. Envía ID de cliente, caja NAP o captura una foto del splitter/power meter para diagnóstico instantáneo.",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [attachedPhoto, setAttachedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll en nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Manejo de previsualización de foto
  useEffect(() => {
    if (!attachedPhoto) {
      setPhotoPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(attachedPhoto);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [attachedPhoto]);

  /**
   * Misión 2: Conexión del Módulo GPS (API Nativa) + Reverse Geocoding
   */
  const handleToggleJornada = () => {
    if (jornadaActiva) {
      setJornadaActiva(false);
      setCoordenadasGPS(null);
      setDireccionLegible(null);
      setErrorGPS(null);
      return;
    }

    if (!navigator.geolocation) {
      setErrorGPS("La API de Geolocalización no está soportada en este navegador.");
      return;
    }

    setCargandoGPS(true);
    setErrorGPS(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const lat = Number(latitude.toFixed(6));
        const lng = Number(longitude.toFixed(6));
        const prec = Math.round(accuracy);

        setCoordenadasGPS({
          lat,
          lng,
          precision: prec,
        });
        setJornadaActiva(true);
        setCargandoGPS(false);

        // Reverse Geocoding con Nominatim OpenStreetMap
        setCargandoDireccion(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            {
              headers: {
                "Accept-Language": "es",
              },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const calle = addr.road || addr.street || addr.pedestrian || "";
            const numero = addr.house_number || "";
            const barrio =
              addr.suburb ||
              addr.neighbourhood ||
              addr.city_district ||
              addr.quarter ||
              "";
            const ciudad =
              addr.city ||
              addr.town ||
              addr.municipality ||
              addr.village ||
              "";

            const partes: string[] = [];
            if (calle) {
              partes.push(numero ? `${calle} ${numero}` : calle);
            }
            if (barrio) {
              partes.push(barrio);
            } else if (ciudad) {
              partes.push(ciudad);
            }

            const direccionFinal =
              partes.length > 0
                ? partes.join(", ")
                : (data.display_name?.split(",").slice(0, 2).join(",") || "Ubicación GPS capturada");

            setDireccionLegible(direccionFinal);
          } else {
            setDireccionLegible("Ubicación GPS capturada");
          }
        } catch (geoErr) {
          console.warn("[REVERSE_GEOCODING_WARN]:", geoErr);
          setDireccionLegible("Ubicación GPS capturada");
        } finally {
          setCargandoDireccion(false);
        }
      },
      (err) => {
        console.error("[GPS_ERROR]:", err);
        setCargandoGPS(false);
        let mensajeError = "No se pudo obtener la ubicación GPS.";
        if (err.code === err.PERMISSION_DENIED) {
          mensajeError =
            "Permiso de ubicación denegado. Habilita los permisos de GPS en tu navegador o dispositivo para registrar la guardia.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          mensajeError = "Señal de GPS no disponible en esta zona.";
        } else if (err.code === err.TIMEOUT) {
          mensajeError = "Tiempo de espera agotado al consultar el sensor de GPS.";
        }
        setErrorGPS(mensajeError);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  /**
   * Misión 3 & 4: Conexión Multimodal e Inyección de Identidad de Cuadrilla
   */
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedText = inputMessage.trim();
    if ((!trimmedText && !attachedPhoto) || isSending) return;

    setChatError(null);
    setIsSending(true);

    let base64Image: string | null = null;

    try {
      if (attachedPhoto) {
        base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(attachedPhoto);
        });
      }

      const promptText =
        trimmedText ||
        (base64Image
          ? "Analiza técnicamente esta imagen capturada en campo e indica diagnóstico, fallas visibles o atenuación."
          : "");

      const userMsg: Message = {
        role: "user",
        content: promptText,
        photoUrl: photoPreview,
      };

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInputMessage("");
      setAttachedPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Tarea 4: Empaquetar información técnica de forma oculta en el payload para la API
      const direccionTraducida =
        direccionLegible ||
        (coordenadasGPS
          ? `Lat ${coordenadasGPS.lat}, Lng ${coordenadasGPS.lng} (±${coordenadasGPS.precision}m)`
          : "Ubicación GPS no reportada");

      const payloadOculto = `[Técnico: ${techParam || "Desconocido"}, Ubicación: ${direccionTraducida}] - Mensaje: ${promptText}`;

      // Envío a /api/chat con source: 'noc'
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m, idx) => ({
            role: m.role,
            content: idx === nextMessages.length - 1 ? payloadOculto : m.content,
          })),
          source: "noc",
          image: base64Image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Error al comunicarse con Caralita IA en el NOC.");
      }

      if (data.content) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.content,
            technicalPayload: data.technicalPayload || null,
          },
        ]);
      } else {
        throw new Error("Respuesta vacía del servidor.");
      }
    } catch (err) {
      console.error("[PWA_TECNICOS_ERROR]:", err);
      const msg = err instanceof Error ? err.message : "Error de comunicación en campo.";
      setChatError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickAction = (texto: string) => {
    setInputMessage(texto);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Header PWA Móvil */}
      <header className="h-16 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between backdrop-blur-md shrink-0 shadow-lg z-20">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Volver al NOC"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 font-black text-white shadow-md shadow-cyan-500/25">
            C
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white">CARALE</span>
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/60 font-mono">
                PWA Técnicos
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              {techParam ? (
                <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                  <UserCheck className="h-3 w-3 text-emerald-400" />
                  {techParam.replace("_", " ")}
                </span>
              ) : (
                <span>Cuadrilla & Operaciones FTTH</span>
              )}
            </div>
          </div>
        </div>

        {/* Toggle de Jornada y Estado GPS */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleJornada}
            disabled={cargandoGPS}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
              jornadaActiva
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            }`}
          >
            {cargandoGPS ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
            ) : (
              <Power
                className={`h-3.5 w-3.5 ${jornadaActiva ? "text-emerald-400" : "text-slate-400"}`}
              />
            )}
            <span>{jornadaActiva ? "En Jornada" : "Iniciar Guardia"}</span>
          </button>
        </div>
      </header>

      {/* Barra de Estado GPS en Vivo con Dirección Legible */}
      {jornadaActiva && coordenadasGPS && (
        <div className="bg-slate-900/90 border-b border-slate-800/90 px-4 py-2 flex items-center justify-between text-xs text-slate-300 backdrop-blur shrink-0 shadow-inner">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-white truncate block">
                {cargandoDireccion ? (
                  <span className="text-slate-400 italic font-mono text-[11px]">
                    Identificando calle y barrio...
                  </span>
                ) : (
                  direccionLegible || "Ubicación GPS capturada"
                )}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50 block">
              ±{coordenadasGPS.precision}m
            </span>
          </div>
        </div>
      )}

      {/* Alerta de Error de GPS */}
      {errorGPS && (
        <div className="bg-rose-950/70 border-b border-rose-800/80 px-4 py-2 flex items-center justify-between text-xs text-rose-300 shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
            <span className="line-clamp-1">{errorGPS}</span>
          </div>
          <button
            onClick={() => setErrorGPS(null)}
            className="text-[10px] text-rose-400 hover:text-white underline ml-2"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Acciones Rápidas para Cuadrilla */}
      <div className="bg-slate-950/60 border-b border-slate-800/60 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => handleQuickAction("Auditar potencia óptica y puertos en Caja NAP-04")}
          className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-800 hover:border-cyan-500/30 transition flex items-center gap-1.5"
        >
          <Layers className="h-3 w-3 text-cyan-400" />
          <span>Auditar NAP</span>
        </button>
        <button
          onClick={() => handleQuickAction("Verificar estado de cliente CLI-1045 y potencia ONU")}
          className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-800 hover:border-cyan-500/30 transition flex items-center gap-1.5"
        >
          <Activity className="h-3 w-3 text-emerald-400" />
          <span>Estado ONU</span>
        </button>
        <button
          onClick={() =>
            handleQuickAction("Crear ticket de urgencia por atenuación crítica en splitter")
          }
          className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-800 hover:border-rose-500/30 transition flex items-center gap-1.5"
        >
          <AlertTriangle className="h-3 w-3 text-rose-400" />
          <span>Abrir Ticket</span>
        </button>
      </div>

      {/* Contenedor Principal del Chat */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={index}
              className={`flex gap-3 max-w-[92%] sm:max-w-[80%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  isUser
                    ? "bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-sm"
                    : "bg-slate-900 border border-slate-800 text-cyan-400"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div className="space-y-2">
                <div
                  className={`rounded-2xl p-3.5 text-xs leading-relaxed shadow-md ${
                    isUser
                      ? "bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-white rounded-tr-none"
                      : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none backdrop-blur-sm"
                  }`}
                >
                  {msg.photoUrl && (
                    <div className="mb-2.5 rounded-xl overflow-hidden border border-white/20 max-w-xs">
                      <img
                        src={msg.photoUrl}
                        alt="Captura técnica de campo"
                        className="w-full h-auto max-h-56 object-cover"
                      />
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {msg.technicalPayload && (
                  <div className="rounded-xl border border-cyan-500/30 bg-slate-900/95 p-3 text-xs shadow-lg backdrop-blur space-y-2 max-w-sm">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-bold text-white text-[11px]">
                        {msg.technicalPayload.titulo}
                      </span>
                      {msg.technicalPayload.subtitulo && (
                        <span className="text-[10px] text-slate-400">
                          {msg.technicalPayload.subtitulo}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {msg.technicalPayload.datos.map((item, idx) => (
                        <div key={idx} className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="block text-slate-400 uppercase tracking-wider text-[9px]">
                            {item.label}
                          </span>
                          <span
                            className={`font-semibold ${
                              item.critico
                                ? "text-rose-400"
                                : item.alerta
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {item.valor}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-in fade-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 px-4 py-2.5 text-xs text-slate-400 rounded-tl-none flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Caralita auditando telemetría óptica y visión de campo...</span>
            </div>
          </div>
        )}

        {chatError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{chatError}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Vista previa de foto adjunta lista para enviar */}
      {photoPreview && (
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={photoPreview}
              alt="Preview"
              className="h-12 w-12 rounded-lg object-cover border border-cyan-500/50"
            />
            <div className="text-xs">
              <span className="font-semibold text-white block">Foto lista para auditoría</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {attachedPhoto?.name} ({(Number(attachedPhoto?.size || 0) / 1024).toFixed(1)} KB)
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setAttachedPhoto(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Quitar foto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Barra Inferior Fija para Input y Cámara */}
      <footer className="p-3 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md shrink-0 space-y-2">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setAttachedPhoto(file);
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 rounded-xl border transition shadow-sm ${
              attachedPhoto
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
            title="Tomar o adjuntar foto técnica de la instalación"
          >
            <Camera className="h-5 w-5" />
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              attachedPhoto
                ? "Describe la imagen o envía directo..."
                : "Consultar NAP, abonado o falla técnica..."
            }
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
          />

          <button
            type="submit"
            disabled={(!inputMessage.trim() && !attachedPhoto) || isSending}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-cyan-500/25 transition"
            title="Enviar reporte a Caralita"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>

        {/* Tarea 2: Branding y Firma Global en PWA */}
        <div className="text-center text-[10px] text-zinc-500 truncate pt-1 border-t border-slate-800/60">
          Desarrollado por: <strong className="text-zinc-400">Nexora One</strong> | Soporte:{" "}
          <a href="tel:3786414533" className="hover:text-cyan-400 text-zinc-400 font-mono">
            3786414533
          </a>{" "}
          | Email:{" "}
          <a
            href="mailto:nexoraone@nexativanews.com.ar"
            className="hover:text-cyan-400 text-zinc-400 font-mono"
          >
            nexoraone@nexativanews.com.ar
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function TecnicoPWAUI() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-cyan-400 text-xs">
          Cargando PWA Técnicos Carale...
        </div>
      }
    >
      <TecnicoPWAInner />
    </Suspense>
  );
}
