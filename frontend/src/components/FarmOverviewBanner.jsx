import React from 'react';
import {
  CloudRain,
  ShieldAlert,
  BookOpen,
  ClipboardList,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  HeartPulse,
  Info,
} from 'lucide-react';

export function FarmOverviewBanner({
  historyCount = 0,
  userName = '',
  onOpenFieldFirstAid,
  onOpenHistory,
}) {
  return (
    <div className="space-y-4">
      {/* Main Grid: Alerta Sanitaria Estacional + Panel de Métricas Zootécnicas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Banner de Alerta Sanitaria Estacional (Col 8) */}
        <div className="lg:col-span-8 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-7 text-white shadow-md border border-emerald-500/30 relative overflow-hidden flex flex-col justify-between space-y-5">
          {/* Background Decorative Accents */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

          {/* Top Row: Badge & Header */}
          <div className="relative space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider">
                <CloudRain className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Alerta Sanitaria Estacional: Temporada Húmeda y Lluvias</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Región Pecuaria & Zootecnia
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Prevención Sanitaria Activa en Campo
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              El aumento de humedad y encharcamientos incrementa el riesgo de <strong>claudicaciones y pododermatitis (gabarro)</strong> en bovinos y ovinos, así como <strong>diarreas neonatales</strong> en terneros y crías en corrales de destete.
            </p>
          </div>

          {/* Key Quick Tips */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 backdrop-blur-xs">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Manejo de Cascos y Pezuñas</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Inspecciona el espacio interdigital en potreros con barro. Realiza pediluvios con sulfato de cobre y aísla animales que claudiquen en terreno seco.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 backdrop-blur-xs">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Crías y Cama Seca</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Refuerza la ingesta de calostro temprano y renueva la cama de paja en parideras para evitar brotes de diarrea acuosa e hipotermia en terneros.
              </p>
            </div>
          </div>

          {/* Action Button: Guía de Primeros Auxilios de Campo */}
          <div className="relative pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10">
            <div className="text-xs text-slate-400 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>Consulta pautas de soporte antes del arribo veterinario</span>
            </div>

            <button
              type="button"
              onClick={onOpenFieldFirstAid}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2 transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Abrir Guía de Primeros Auxilios de Campo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Panel Lateral: Contador de Expedientes Evaluados & Estado (Col 4) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Panel del Productor / Finca
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Contador de Expedientes Evaluados */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Expedientes Evaluados
                </span>
                <div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline space-x-1.5">
                  <span>{historyCount}</span>
                  <span className="text-xs font-semibold text-slate-400">casos clínicos</span>
                </div>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shadow-xs">
                <ClipboardList className="w-6 h-6" />
              </div>
            </div>

            {/* Metadatos Rápidos */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Especies Habilitadas:</span>
                <span className="font-bold text-slate-800">8 Especies Rurales</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Inferencia Diagnóstica:</span>
                <span className="font-bold text-emerald-600 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Gemini 2.5 Multimodal</span>
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 font-medium">Red de Atención:</span>
                <span className="font-bold text-slate-800">Clínicas & Almacenes Agro</span>
              </div>
            </div>
          </div>

          {/* Quick link to view history */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 text-slate-500" />
            <span>Ver Historial de Triajes Registrados</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default FarmOverviewBanner;

