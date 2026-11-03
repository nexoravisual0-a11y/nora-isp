import React from "react";

export function CaraleLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Onda superior externa */}
      <path
        d="M20 12C24.5 8 39.5 8 44 12"
        stroke="#06b6d4"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Onda superior interna */}
      <path
        d="M25 18C28 15 36 15 39 18"
        stroke="#67e8f9"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Estructura A / Antena central */}
      <path
        d="M32 23L17 53H25L32 38L39 53H47L32 23Z"
        fill="#ffffff"
      />
      {/* Barra transversal */}
      <path
        d="M23 44H41"
        stroke="#06b6d4"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CaraleBrand() {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 group-hover:border-cyan-400/50 transition-all duration-300">
        <CaraleLogo className="h-8 w-8 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider text-white text-lg leading-tight group-hover:text-cyan-50 transition-colors">
            CARALE
          </span>
          <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60 uppercase tracking-wider">
            Fibra Pura
          </span>
        </div>
        <span className="block text-[9px] tracking-[0.22em] text-cyan-400 font-semibold uppercase truncate mt-0.5">
          TELECOMUNICACIONES & DATOS
        </span>
      </div>
    </div>
  );
}

export default CaraleLogo;
