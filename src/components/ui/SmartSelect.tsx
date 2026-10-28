"use client";

import React, { useState, useEffect } from "react";
import { Edit3, List, ChevronDown } from "lucide-react";

interface SmartSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  customPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const OTRO_OPTION = "__OTRO_MANUAL__";

export default function SmartSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Seleccionar opción...",
  customPlaceholder = "Escribir valor manualmente...",
  required = false,
  disabled = false,
  className = "",
}: SmartSelectProps) {
  // Si el valor actual no está en la lista de opciones y no está vacío, arranca en modo custom
  const [isCustom, setIsCustom] = useState<boolean>(() => {
    return Boolean(value && !options.includes(value));
  });

  useEffect(() => {
    if (value && !options.includes(value)) {
      setIsCustom(true);
    }
  }, [value, options]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === OTRO_OPTION) {
      setIsCustom(true);
      onChange("");
    } else {
      setIsCustom(false);
      onChange(val);
    }
  };

  const handleSwitchToList = () => {
    setIsCustom(false);
    onChange(options[0] || "");
  };

  if (isCustom) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {label && (
          <div className="flex items-center justify-between">
            <span className="block text-xs font-semibold text-slate-300">{label}</span>
            <button
              type="button"
              onClick={handleSwitchToList}
              disabled={disabled}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
              title="Volver a seleccionar de la lista de sugerencias"
            >
              <List className="h-3 w-3" />
              <span>Ver sugerencias</span>
            </button>
          </div>
        )}
        <div className="relative flex items-center">
          <input
            type="text"
            required={required}
            disabled={disabled}
            placeholder={customPlaceholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-cyan-500/50 bg-slate-800/90 px-3.5 py-2.5 pr-9 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition disabled:opacity-50"
          />
          <Edit3 className="absolute right-3 h-3.5 w-3.5 text-cyan-400 pointer-events-none" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <span className="block text-xs font-semibold text-slate-300">{label}</span>}
      <div className="relative">
        <select
          value={options.includes(value) ? value : ""}
          onChange={handleSelectChange}
          required={required}
          disabled={disabled}
          className="w-full appearance-none rounded-xl border border-slate-700/80 bg-slate-800/80 px-3.5 py-2.5 pr-9 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition disabled:opacity-50 cursor-pointer"
        >
          <option value="" disabled className="bg-slate-900 text-slate-500">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-slate-900 text-slate-100">
              {opt}
            </option>
          ))}
          <option value={OTRO_OPTION} className="bg-slate-900 font-semibold text-cyan-400">
            ✍️ Otro (Ingresar manualmente)...
          </option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

