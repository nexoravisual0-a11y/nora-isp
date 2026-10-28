"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Radio,
  ShieldAlert,
  FileText,
  QrCode,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
} from "lucide-react";

interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
}

interface NoraCopilotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NoraCopilot({ isOpen, onClose }: NoraCopilotProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      role: "assistant",
      content:
        "Hola, soy **Nora**, tu Copilot operativo del NOC en Carale Internet. Estoy a tu disposición para asistirte en el manejo de la consola, rastreo de cuadrillas, validación de accesos seguros y entrenamiento del modelo con documentación técnica.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleQuickQuestion = (pregunta: string) => {
    setInput(pregunta);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setErrorMsg(null);
    const userMsg: CopilotMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          source: "admin-copilot",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error al comunicarse con Nora Copilot.");
      }

      if (data.content) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content },
        ]);
      } else {
        throw new Error("Respuesta vacía del Copilot.");
      }
    } catch (err) {
      console.error("[NORA_COPILOT_ERROR]:", err);
      const msg = err instanceof Error ? err.message : "Error de comunicación con el Copilot.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-200">
      {/* Backdrop Translúcido Oscuro */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Deslizante Lateral Derecho */}
      <div className="absolute inset-y-0 right-0 w-full sm:w-[460px] bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header del Copilot */}
        <div className="h-16 px-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white tracking-tight">Nora Copilot</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 uppercase">
                  NOC Core
                </span>
              </div>
              <span className="block text-[10px] text-slate-400 font-medium">
                Asistente Interno de Operaciones & Cuadrillas
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Cerrar Nora Copilot (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Guía Rápida / Chips de Manual Operativo */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 shrink-0">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Comandos y Funciones Rápidas:
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <button
              onClick={() => handleQuickQuestion("¿Cómo funciona y qué muestra el Radar de Cuadrillas en vivo?")}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-left text-slate-300 transition flex items-center gap-2 group"
            >
              <Radio className="h-3.5 w-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate">1. Radar Cuadrillas</span>
            </button>
            <button
              onClick={() => handleQuickQuestion("¿Cómo se utiliza el QR de Acceso Seguro para la Cuadrilla 1?")}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-rose-500/40 text-left text-slate-300 transition flex items-center gap-2 group"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate">2. QR Cuadrilla 1</span>
            </button>
            <button
              onClick={() => handleQuickQuestion("¿Cómo se realiza el entrenamiento de Caralita subiendo manuales y PDFs técnicos?")}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/40 text-left text-slate-300 transition flex items-center gap-2 group"
            >
              <FileText className="h-3.5 w-3.5 text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate">3. Entrenamiento IA</span>
            </button>
            <button
              onClick={() => handleQuickQuestion("¿Dónde y cómo se comparte el código QR del Portal Público para clientes?")}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-left text-slate-300 transition flex items-center gap-2 group"
            >
              <QrCode className="h-3.5 w-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate">4. QR Portal Público</span>
            </button>
          </div>
        </div>

        {/* Historial de Mensajes del Copilot */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[90%] ${
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isUser
                      ? "bg-gradient-to-tr from-cyan-600 to-blue-600 text-white"
                      : "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-sm"
                  }`}
                >
                  {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                <div
                  className={`rounded-2xl p-3 leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none"
                      : "bg-slate-800/90 border border-slate-700/70 text-slate-200 rounded-tl-none whitespace-pre-wrap"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white animate-spin">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-2xl bg-slate-800/90 border border-slate-700/70 px-3.5 py-2 text-xs text-slate-400 rounded-tl-none flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Nora consultando manual operativo del NOC...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar del Copilot */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0 space-y-2">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntale a Nora sobre procedimientos del NOC..."
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:opacity-90 disabled:opacity-40 text-white shadow-md shadow-indigo-500/25 transition"
              title="Consultar Copilot"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* Firma Oficial Nexora One */}
          <div className="text-center text-[10px] text-zinc-500 truncate pt-1 border-t border-slate-900">
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
        </div>
      </div>
    </div>
  );
}

