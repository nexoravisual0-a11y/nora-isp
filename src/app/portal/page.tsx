"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import {
  Send,
  Paperclip,
  Bot,
  User,
  AlertCircle,
  CheckCircle2,
  Wifi,
  FileCheck,
  LifeBuoy,
  X,
  Image as ImageIcon,
  ShieldCheck,
  PhoneCall,
  Sparkles,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  attachmentName?: string | null;
  technicalPayload?: {
    tipo: "cliente" | "nodo" | "ticket";
    titulo: string;
    subtitulo?: string;
    datos: Array<{ label: string; valor: string; alerta?: boolean; critico?: boolean }>;
  } | null;
}

export default function PublicPortalPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "¡Hola! 👋 Te damos la bienvenida a Carale Internet. Soy Caralita, tu asistente virtual oficial.\n\nPara poder ayudarte a verificar el estado de tu conexión de fibra óptica, gestionar reclamos o registrar tus comprobantes de pago, ¿me podrías indicar tu número de DNI (o CUIT) o tu número de teléfono registrado?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedInput = input.trim();
    if ((!trimmedInput && !selectedFile) || isLoading) return;

    setErrorMsg(null);

    let messageContent = trimmedInput;
    const attachmentName = selectedFile ? selectedFile.name : null;

    if (selectedFile) {
      const fileNotice = `[Comprobante/Archivo adjunto: ${selectedFile.name}]`;
      messageContent = messageContent ? `${messageContent}\n${fileNotice}` : fileNotice;
    }

    const updatedMessages: Message[] = [
      ...messages,
      {
        role: "user",
        content: messageContent,
        attachmentName,
      },
    ];

    setMessages(updatedMessages);
    setInput("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsLoading(true);

    try {
      // Cableado API real con source: 'portal' para activar el System Prompt empático
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          source: "portal",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Error al comunicarse con Caralita.");
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
        throw new Error("No se recibió respuesta del asistente.");
      }
    } catch (err: unknown) {
      console.error("[PORTAL_CHAT_ERROR]:", err);
      const msg = err instanceof Error ? err.message : "Error inesperado de comunicación.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 font-sans text-slate-100">
      {/* Barra Superior del Portal Público */}
      <header className="border-b border-slate-800/90 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-600 font-bold text-white shadow-md shadow-cyan-500/25">
            <Bot className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Carale Internet
              </h1>
              <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/50">
                Portal de Clientes
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>Caralita • Asistente Virtual Oficial</span>
              <span className="text-emerald-400 font-medium">• En línea</span>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Atención Segura y Directa</span>
          </div>
        </div>
      </header>

      {/* Área Central de Conversación */}
      <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Banner de bienvenida interactivo */}
          <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 to-cyan-950/20 p-4 shadow-sm text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-1.5 flex-1">
                <p className="font-semibold text-slate-200">
                  ¿Cómo puedo ayudarte en este momento?
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleQuickPrompt("Hola Caralita, quiero consultar el estado de mi conexión de internet.")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-cyan-300 transition"
                  >
                    🔍 Consultar mi servicio
                  </button>
                  <button
                    onClick={() => handleQuickPrompt("Tengo problemas de lentitud o corte en mi fibra óptica.")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-cyan-300 transition"
                  >
                    ⚠️ Reportar problema técnico
                  </button>
                  <button
                    onClick={() => handleQuickPrompt("Quiero informar o enviar mi comprobante de pago.")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-cyan-300 transition"
                  >
                    📄 Enviar comprobante de pago
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Listado de Mensajes */}
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl text-xs font-bold ${
                    isUser
                      ? "bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40"
                      : "bg-slate-800 border border-cyan-500/30 text-cyan-400"
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className="max-w-[85%] sm:max-w-[78%] space-y-2.5">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none"
                        : "bg-slate-900 border border-slate-800/90 text-slate-200 rounded-tl-none whitespace-pre-wrap"
                    }`}
                  >
                    {/* Adjunto si fue enviado por el usuario */}
                    {isUser && msg.attachmentName && (
                      <div className="mb-2 flex items-center gap-2 rounded-xl bg-black/20 p-2 border border-white/10 text-xs">
                        <ImageIcon className="h-4 w-4 text-cyan-200 shrink-0" />
                        <span className="truncate font-medium">{msg.attachmentName}</span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 ml-auto shrink-0" />
                      </div>
                    )}

                    <div>{msg.content}</div>

                    {!isUser && (
                      <div className="mt-2 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Carale Internet • Soporte Oficial</span>
                        <span>Caralita</span>
                      </div>
                    )}
                  </div>

                  {/* Tarjeta de Reclamo o Telemetría si la IA devolvió technicalPayload */}
                  {!isUser && msg.technicalPayload && (
                    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-xl backdrop-blur">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          {msg.technicalPayload.tipo === "ticket" ? (
                            <LifeBuoy className="h-4 w-4 text-amber-400" />
                          ) : (
                            <Wifi className="h-4 w-4 text-cyan-400" />
                          )}
                          <h4 className="text-xs font-bold text-white">
                            {msg.technicalPayload.titulo}
                          </h4>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {msg.technicalPayload.tipo === "ticket" ? "Reclamo Registrado" : "Estado Conexión"}
                        </span>
                      </div>

                      {msg.technicalPayload.subtitulo && (
                        <p className="text-[11px] text-slate-400 mb-2.5 font-medium">
                          {msg.technicalPayload.subtitulo}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {msg.technicalPayload.datos.map((item, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-xl border ${
                              item.critico
                                ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
                                : item.alerta
                                ? "bg-amber-950/30 border-amber-500/40 text-amber-300"
                                : "bg-slate-800/50 border-slate-700/60 text-slate-200"
                            }`}
                          >
                            <span className="block text-[10px] text-slate-400">
                              {item.label}
                            </span>
                            <span className="font-semibold text-[11px] truncate block mt-0.5 text-slate-100">
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

          {/* Loader de razonamiento */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-cyan-500/30 text-cyan-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-none border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse [animation-delay:200ms]" />
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse [animation-delay:400ms]" />
                  <span className="ml-2 text-xs text-slate-300">
                    Caralita está verificando tu información en el sistema...
                  </span>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 p-3.5 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input de Mensajes y Botón para Adjuntar Comprobantes */}
      <footer className="border-t border-slate-800 bg-slate-900/90 p-4 backdrop-blur-md shrink-0">
        <div className="mx-auto max-w-3xl space-y-2">
          {/* Previsualización del archivo adjunto */}
          {selectedFile && (
            <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3.5 py-2 text-xs text-cyan-200">
              <div className="flex items-center gap-2 truncate">
                <FileCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="truncate font-medium">{selectedFile.name}</span>
                <span className="text-[10px] text-cyan-400/80 font-mono">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Quitar archivo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Formulario de envío */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Input oculto para subir comprobante / imagen */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
              id="file-upload"
            />

            {/* Botón para adjuntar comprobante */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Adjuntar comprobante de pago o imagen"
              className={`p-3 rounded-xl border transition flex items-center justify-center shrink-0 ${
                selectedFile
                  ? "border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/20"
                  : "border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Escribe tu mensaje, DNI o consulta aquí..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 transition"
            />

            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedFile)}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-500">
            Carale Internet • Sistema de Autogestión Asistido por Caralita
          </p>
        </div>
      </footer>
    </div>
  );
}

