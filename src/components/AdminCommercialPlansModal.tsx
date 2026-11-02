"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  CheckCircle2,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Sliders,
  Sparkles,
} from "lucide-react";

export interface CommercialPlan {
  id: number;
  category: string;
  title: string;
  badge: string | null;
  description: string;
  features: string[];
  cta_text: string;
  cta_action: string;
  display_order: number;
  is_active: boolean;
}

export default function AdminCommercialPlansModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CommercialPlan | null>(null);
  const [featureInput, setFeatureInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/commercial-plans");
      const data = await res.json();
      if (data.success && Array.isArray(data.plans)) {
        setPlans(data.plans);
      }
    } catch (e) {
      console.error("Error cargando planes comerciales:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const handleStartEdit = (p: CommercialPlan) => {
    setEditingPlan({ ...p, features: [...(p.features || [])] });
    setSuccessMsg(null);
  };

  const handleAddFeature = () => {
    if (!featureInput.trim() || !editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, featureInput.trim()],
    });
    setFeatureInput("");
  };

  const handleRemoveFeature = (idx: number) => {
    if (!editingPlan) return;
    const next = [...editingPlan.features];
    next.splice(idx, 1);
    setEditingPlan({ ...editingPlan, features: next });
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/commercial-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Plan "${editingPlan.title}" actualizado en el Portal.`);
        setEditingPlan(null);
        await fetchPlans();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert("Error al guardar: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Planes Comerciales del Portal
                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800/60 uppercase">
                  En Vivo
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Edita los planes, viñetas y llamados a la acción visibles en /portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notificación de éxito */}
        {successMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-5 py-2 text-xs text-emerald-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Contenido / Listado o Formulario */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {editingPlan ? (
            <div className="rounded-2xl border border-cyan-500/30 bg-neutral-950/70 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">
                  Editando: {editingPlan.category}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="text-xs text-neutral-400 hover:text-white font-medium"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Título del Plan</label>
                  <input
                    type="text"
                    value={editingPlan.title}
                    onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">
                    Badge Superior (opcional)
                  </label>
                  <input
                    type="text"
                    value={editingPlan.badge || ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value || null })}
                    placeholder="ej. Misión Crítica / Más Elegido"
                    className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 mb-1 font-semibold">Descripción</label>
                  <textarea
                    rows={2}
                    value={editingPlan.description}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Texto del Botón (CTA)</label>
                  <input
                    type="text"
                    value={editingPlan.cta_text}
                    onChange={(e) => setEditingPlan({ ...editingPlan, cta_text: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-white font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.is_active}
                      onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                      className="rounded accent-cyan-500 h-4 w-4"
                    />
                    <span>Plan Activo en Portal</span>
                  </label>
                </div>
              </div>

              {/* Editor de Viñetas / Features */}
              <div className="pt-2">
                <label className="block text-neutral-400 mb-1.5 font-semibold text-xs">
                  Características / Viñetas del Plan
                </label>
                <div className="space-y-2 mb-3">
                  {editingPlan.features.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200"
                    >
                      <span>• {f}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(i)}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddFeature()}
                    placeholder="Nueva característica (ej. IP Fija incluida)..."
                    className="flex-1 h-9 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-cyan-400 text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                        {p.category}
                      </span>
                      {p.badge && (
                        <span className="text-[9px] font-extrabold uppercase text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">{p.title}</h3>
                    <p className="text-xs text-neutral-400 line-clamp-2">{p.description}</p>
                    <ul className="text-[11px] text-neutral-300 space-y-1 pt-2">
                      {(p.features || []).slice(0, 3).map((f, idx) => (
                        <li key={idx} className="truncate">
                          ✓ {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        p.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {p.is_active ? "Activo" : "Inactivo"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(p)}
                      className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-cyan-500 hover:text-black text-xs font-semibold text-neutral-200 transition flex items-center gap-1.5"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

