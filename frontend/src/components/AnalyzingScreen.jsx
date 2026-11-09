import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Sparkles,
  Cpu,
  Activity,
  ShieldCheck,
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
    <div className="backdrop-blur-md bg-slate-900/70 rounded-3xl shadow-xl shadow-indigo-950/20 border border-indigo-500/20 overflow-hidden p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-8 min-h-[500px]">
      {/* Central Pulsing Biometric Radar */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-44 h-44 rounded-full bg-indigo-500/10 animate-ping" />
        <div className="absolute w-36 h-36 rounded-full bg-cyan-500/15 animate-pulse" />
        <div className="absolute w-28 h-28 rounded-full bg-indigo-500/25 animate-pulse" />

        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 border border-indigo-300/40">
          <HeartPulse className="w-12 h-12 animate-pulse text-white" />
        </div>
      </div>

      {/* Title & Tagline */}
      <div className="space-y-2 max-w-md">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
          <span>Inferencia Clínica Activa</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-50 tracking-tight">
          Analizando muestra con Gemini AI...
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Evaluando la evidencia fotográfica de tu paciente ({petType}, {weight} kg) según los protocolos estandarizados de triaje veterinario.
        </p>
      </div>

      {/* Rotating Progress Step */}
      <div className="w-full max-w-sm bg-slate-950/50 border border-slate-700/60 rounded-2xl p-4 space-y-3">
        <div className="flex items-center space-x-3 text-xs text-slate-200 font-semibold">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-70" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-400" />
          </span>
          <span className="truncate">{ANALYSIS_STEPS[currentStepIndex]}</span>
        </div>

        <div className="space-y-2 animate-pulse">
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${((currentStepIndex + 1) / ANALYSIS_STEPS.length) * 100}%` }}
            />
          </div>
          <div className="h-2 w-2/3 rounded-full bg-slate-800" />
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
          <Activity className="w-3.5 h-3.5 text-cyan-300" />
          <span>Visión por Computadora</span>
        </span>
        <span>•</span>
        <span className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Clasificación WSAVA</span>
        </span>
      </div>
    </div>
  );
}

export default AnalyzingScreen;
