"use client";

import React, { useState, useEffect, useRef } from "react";
import { cleanMessageText } from "@/lib/utils";
import {
  MessageSquare,
  X,
  Send,
  User,
  Bot,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Phone,
  Search,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export interface WhatsAppThread {
  id: number;
  phone_number: string;
  customer_name: string | null;
  dni_cuit: string | null;
  status: "bot_active" | "requires_human" | "in_human_call" | "resolved";
  assigned_operator: string | null;
  unread_count: number;
  last_message_preview: string | null;
  last_activity: string;
  created_at: string;
}

export interface WhatsAppMessage {
  id: number;
  thread_id: number;
  sender_type: "customer" | "bot" | "operator";
  content: string;
  media_url: string | null;
  created_at: string;
}

export default function WhatsAppInboxModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [threads, setThreads] = useState<WhatsAppThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<WhatsAppThread | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [inputContent, setInputContent] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar lista de hilos
  const fetchThreads = async () => {
    setIsLoadingThreads(true);
    try {
      const res = await fetch("/api/whatsapp/threads");
      const data = await res.json();
      if (data.success && Array.isArray(data.threads)) {
        setThreads(data.threads);
        // Si no hay seleccionado, seleccionamos el primero
        if (!selectedThread && data.threads.length > 0) {
          setSelectedThread(data.threads[0]);
        }
      }
    } catch (e) {
      console.error("Error al cargar hilos de WhatsApp:", e);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  // Cargar mensajes del hilo seleccionado
  const fetchMessages = async (threadId: number) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/whatsapp/threads/${threadId}/messages`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error("Error al cargar mensajes:", e);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchThreads();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
    }
  }, [selectedThread?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enviar mensaje como Operador Humano
  const handleSendMessage = async () => {
    if (!selectedThread || !inputContent.trim() || isSending) return;
    setIsSending(true);
    const contentToSend = inputContent.trim();
    setInputContent("");

    try {
      const res = await fetch(`/api/whatsapp/threads/${selectedThread.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: contentToSend,
          operator_name: "Admin NOC",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        // Actualizar estado local a in_human_call
        setSelectedThread((prev) => (prev ? { ...prev, status: "in_human_call" } : null));
        fetchThreads();
      }
    } catch (e) {
      console.error("Error enviando mensaje:", e);
    } finally {
      setIsSending(false);
    }
  };

  // Cambiar estado (Devolver control a Caralita o Marcar Resuelto)
  const handleUpdateStatus = async (newStatus: "bot_active" | "resolved") => {
    if (!selectedThread) return;
    try {
      const res = await fetch(`/api/whatsapp/threads/${selectedThread.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          operator_name: "Admin NOC",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedThread(data.thread);
        fetchMessages(selectedThread.id);
        fetchThreads();
      }
    } catch (e) {
      console.error("Error actualizando estado:", e);
    }
  };

  if (!isOpen) return null;

  // Filtrado de hilos
  const filteredThreads = threads.filter((t) => {
    const matchesFilter = filterStatus === "all" || t.status === filterStatus;
    const matchesSearch =
      (t.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone_number.includes(searchTerm) ||
      (t.dni_cuit || "").includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-6xl h-[92vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header Superior Consola */}
        <div className="h-14 px-5 border-b border-neutral-800 bg-neutral-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Mesa de Entrada Unificada (WhatsApp NOC)
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/60 uppercase">
                  Live Inbox
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchThreads}
              className="p-1.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Actualizar bandeja"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingThreads ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Cerrar mesa de entrada"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Layout de 2 Columnas */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Columna Izquierda: Lista de Hilos */}
          <div className="w-80 sm:w-96 border-r border-neutral-800 flex flex-col bg-neutral-950/50">
            {/* Buscador y Filtros */}
            <div className="p-3 border-b border-neutral-800 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar abonado o teléfono..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-1 overflow-x-auto no-scrollbar text-[10px] font-semibold">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-2 py-0.5 rounded-md transition ${
                    filterStatus === "all"
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Todos ({threads.length})
                </button>
                <button
                  onClick={() => setFilterStatus("requires_human")}
                  className={`px-2 py-0.5 rounded-md transition flex items-center gap-1 ${
                    filterStatus === "requires_human"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "text-rose-400 hover:text-rose-300"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                  Requiere Asesor
                </button>
                <button
                  onClick={() => setFilterStatus("bot_active")}
                  className={`px-2 py-0.5 rounded-md transition ${
                    filterStatus === "bot_active"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-cyan-400 hover:text-cyan-300"
                  }`}
                >
                  Caralita al mando
                </button>
              </div>
            </div>

            {/* Listado de Hilos */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-900">
              {filteredThreads.map((t) => {
                const isSelected = selectedThread?.id === t.id;
                const isUrgent = t.status === "requires_human";
                const isCall = t.status === "in_human_call";

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedThread(t)}
                    className={`p-3 cursor-pointer transition flex items-start gap-3 ${
                      isSelected
                        ? "bg-neutral-800/80 border-l-2 border-cyan-400"
                        : "hover:bg-neutral-900/60"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-300">
                        {t.customer_name ? t.customer_name.slice(0, 2).toUpperCase() : "WA"}
                      </div>
                      {isUrgent && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-neutral-950 animate-pulse" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-white truncate">
                          {t.customer_name || t.phone_number}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {new Date(t.last_activity).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-400 truncate mb-1">
                        {t.last_message_preview || "Sin mensajes"}
                      </p>

                      {/* Badges de Estado */}
                      <div className="flex items-center gap-1.5">
                        {isUrgent ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Requiere Asesor
                          </span>
                        ) : isCall ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Headphones className="h-2.5 w-2.5" />
                            Humano al Mando
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            Caralita IA
                          </span>
                        )}
                        {t.unread_count > 0 && (
                          <span className="ml-auto text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-cyan-500 text-black">
                            {t.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Conversación Activa */}
          <div className="flex-1 flex flex-col bg-neutral-900/60 min-w-0">
            {selectedThread ? (
              <>
                {/* Cabecera del Chat Activo */}
                <div className="h-14 px-5 border-b border-neutral-800 bg-neutral-950/40 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {selectedThread.customer_name
                        ? selectedThread.customer_name.slice(0, 2).toUpperCase()
                        : "WA"}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        {selectedThread.customer_name || "Abonado WhatsApp"}
                        <span className="text-[10px] text-neutral-400 font-mono font-normal">
                          {selectedThread.phone_number}
                        </span>
                      </h3>
                      <span className="text-[10px] text-neutral-400">
                        {selectedThread.dni_cuit ? `DNI/CUIT: ${selectedThread.dni_cuit}` : "Abonado sin registrar"}
                      </span>
                    </div>
                  </div>

                  {/* Acciones de Human Handoff */}
                  <div className="flex items-center gap-2">
                    {selectedThread.status !== "bot_active" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("bot_active")}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 transition"
                      >
                        <Bot className="h-3.5 w-3.5" />
                        <span>Devolver control a Caralita</span>
                      </button>
                    )}
                    {selectedThread.status !== "resolved" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("resolved")}
                        className="px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Marcar Resuelto</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Banner de Estado del Hilo */}
                {selectedThread.status === "requires_human" && (
                  <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 flex items-center justify-between text-xs text-rose-300 shrink-0">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                      <span>
                        <strong>Atención Requerida:</strong> El abonado solicitó intervención humana o reportó un incidente crítico. Caralita ha pausado las respuestas automáticas.
                      </span>
                    </div>
                  </div>
                )}

                {/* Historial de Mensajes */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full text-neutral-400 text-xs">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2 text-cyan-400" />
                      Cargando conversación...
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isCustomer = m.sender_type === "customer";
                      const isBot = m.sender_type === "bot";
                      const isOperator = m.sender_type === "operator";

                      return (
                        <div
                          key={m.id}
                          className={`flex gap-2.5 ${isCustomer ? "justify-start" : "justify-end"}`}
                        >
                          {isCustomer && (
                            <div className="h-7 w-7 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
                              <User className="h-4 w-4" />
                            </div>
                          )}

                          <div
                            className={`max-w-[78%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                              isCustomer
                                ? "bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700/60"
                                : isBot
                                ? "bg-cyan-950/70 border border-cyan-500/40 text-cyan-100 rounded-tr-none"
                                : "bg-emerald-600 text-white rounded-tr-none font-medium shadow-md shadow-emerald-950/40"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold font-mono">
                              {isBot ? (
                                <span className="text-cyan-400 flex items-center gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  Caralita IA
                                </span>
                              ) : isOperator ? (
                                <span className="text-emerald-200 flex items-center gap-1">
                                  <Headphones className="h-3 w-3" />
                                  Operador Humano (NOC)
                                </span>
                              ) : (
                                <span className="text-neutral-400">Cliente</span>
                              )}
                              <span className="text-neutral-500 ml-auto font-normal">
                                {new Date(m.created_at).toLocaleTimeString("es-AR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p>{cleanMessageText(m.content)}</p>
                          </div>

                          {!isCustomer && (
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                isBot
                                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                  : "bg-emerald-500 text-black font-bold"
                              }`}
                            >
                              {isBot ? <Bot className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de Respuesta como Operador */}
                <div className="p-3 border-t border-neutral-800 bg-neutral-950/80">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputContent}
                      onChange={(e) => setInputContent(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Escribe una respuesta como Operador Humano (toma el control inmediato)..."
                      className="flex-1 h-12 rounded-xl bg-neutral-900 border border-neutral-700 px-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!inputContent.trim() || isSending}
                      className="h-12 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-40 shadow-lg shadow-emerald-950/50 active:scale-95 transition"
                    >
                      <Send className="h-4 w-4" />
                      <span>Enviar</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-xs">
                <MessageSquare className="h-10 w-10 text-neutral-700 mb-2" />
                <span>Selecciona una conversación de la lista para ver los mensajes</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

