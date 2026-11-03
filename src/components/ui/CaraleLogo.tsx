import React from "react";

export function CaraleLogo({ className = "h-8 w-8 text-white" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Onda superior externa */}
      <path
        d="M33 16C43 8 57 8 67 16"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Onda superior interna */}
      <path
        d="M39 24C46 19 54 19 61 24"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Curva envolvente exterior (brazos laterales que abrazan la A) */}
      <path
        d="M26 34C21 44 26 62 38 72L26 84"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M74 34C79 44 74 62 62 72L74 84"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Letra A central */}
      <path
        d="M32 73L48 33C49 31 51 31 52 33L68 73"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Barra transversal de la A */}
      <path
        d="M38 61H62"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CaraleBrand() {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 group-hover:border-cyan-400/50 transition-all duration-300">
        <CaraleLogo className="h-8 w-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold tracking-wider text-white text-lg leading-tight group-hover:text-cyan-300 transition-colors">
          CARALE
        </span>
        <span className="text-[9px] tracking-[0.22em] text-cyan-400 font-semibold uppercase leading-none">
          TELECOMUNICACIONES & DATOS
        </span>
      </div>
    </div>
  );
}

export default CaraleLogo;
