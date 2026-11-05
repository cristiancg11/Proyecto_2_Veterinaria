import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Sparkles,
  Cpu,
  Activity,
  ShieldCheck,
  Loader2,
  Stethoscope,
} from 'lucide-react';

const ANALYSIS_STEPS = [
  'Iniciando canal de inferencia multimodal...',
  'Optimizando muestra fotográfica con Web Worker...',
  'Analizando imagen y síntomas con Google Gemini AI...',
  'Correlacionando cuadro clínico y nivel de riesgo...',
  'Generando reporte de triaje y pautas de primeros auxilios...',
];

export function AnalyzingScreen({ petType = 'Mascota', weight = '8' }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % ANALYSIS_STEPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-8 min-h-[500px]">
      {/* Central Pulsing Biometric Radar */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing rings */}
        <div className="absolute w-44 h-44 rounded-full bg-rose-500/10 animate-ping" />
        <div className="absolute w-36 h-36 rounded-full bg-rose-500/20 animate-pulse" />
        <div className="absolute w-28 h-28 rounded-full bg-rose-600/30 animate-pulse" />

        {/* Central Icon */}
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center text-white shadow-2xl shadow-rose-600/40 border-2 border-white/50">
          <HeartPulse className="w-12 h-12 animate-pulse text-white" />
        </div>
      </div>

      {/* Title & Tagline */}
      <div className="space-y-2 max-w-md">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-spin-slow" />
          <span>Inferencia Clínica Activa</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Analizando muestra con Gemini AI...
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Evaluando la evidencia fotográfica de tu paciente ({petType}, {weight} kg) según los protocolos estandarizados de triaje veterinario.
        </p>
      </div>

      {/* Rotating Progress Step */}
      <div className="w-full max-w-sm bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
        <div className="flex items-center space-x-3 text-xs text-slate-700 font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-rose-600 flex-shrink-0" />
          <span className="truncate">{ANALYSIS_STEPS[currentStepIndex]}</span>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((currentStepIndex + 1) / ANALYSIS_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Badges footer */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
        <span className="flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span>Gemini 2.5 Flash</span>
        </span>
        <span>•</span>
        <span className="flex items-center space-x-1.5">
          <Activity className="w-3.5 h-3.5 text-rose-500" />
          <span>Visión por Computadora</span>
        </span>
        <span>•</span>
        <span className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Clasificación WSAVA</span>
        </span>
      </div>
    </div>
  );
}

export default AnalyzingScreen;
