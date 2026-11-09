import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Building2,
  ShieldAlert,
  ArrowLeft,
  Printer,
  ExternalLink,
  MessageSquare,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import ClinicalSheetModal from './ClinicalSheetModal';

// Strict color mappings per technical specification
const SEVERITY_THEMES = {
  CRITICAL: {
    hex: '#EF4444',
    title: 'NIVEL CRÍTICO (EMERGENCIA INMEDIATA)',
    sublabel: 'Riesgo Vital Inminente',
    badgeBg: 'bg-red-600',
    border: 'border-red-500/70',
    bannerBg: 'bg-urgency-critical',
    accentText: 'text-red-200',
    icon: AlertTriangle,
  },
  MODERATE: {
    hex: '#F59E0B',
    title: 'NIVEL MODERADO (ATENCIÓN PRIORITARIA)',
    sublabel: 'Urgencia Intermedia',
    badgeBg: 'bg-amber-500',
    border: 'border-amber-400/70',
    bannerBg: 'bg-urgency-watch',
    accentText: 'text-amber-100',
    icon: AlertTriangle,
  },
  MILD: {
    hex: '#10B981',
    title: 'NIVEL LEVE (MANEJO RUTINARIO)',
    sublabel: 'Baja Urgencia / Ambulatorio',
    badgeBg: 'bg-emerald-500',
    border: 'border-emerald-400/60',
    bannerBg: 'bg-urgency-preventive',
    accentText: 'text-emerald-100',
    icon: CheckCircle2,
  },
};

export function DiagnosisResult({ diagnosis, onReset, petType = 'Mascota', onOpenChat }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (!diagnosis) return null;

  const currentTheme =
    SEVERITY_THEMES[diagnosis.urgency_level] || SEVERITY_THEMES.MODERATE;
  const BadgeIcon = currentTheme.icon;

  const handleConsultAssistant = () => {
    if (onOpenChat) {
      onOpenChat(diagnosis);
    }
  };

  return (
    <>
      <div
        className={`backdrop-blur-md bg-slate-900/75 rounded-2xl shadow-xl shadow-emerald-950/20 border ${currentTheme.border} overflow-hidden space-y-6 transition-all duration-300`}
        style={{ borderColor: currentTheme.hex }}
      >
        {/* Dynamic Urgency Level Top Banner */}
        <div
          className={`p-6 border-b ${currentTheme.bannerBg} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
          style={{
            borderBottomColor: `${currentTheme.hex}40`,
          }}
        >
          <div className="flex items-center space-x-3.5">
            <div
              className="p-3 rounded-2xl text-white shadow-lg flex-shrink-0"
              style={{ backgroundColor: currentTheme.hex }}
            >
              <BadgeIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className="text-xs font-black tracking-wider uppercase"
                  style={{ color: currentTheme.hex }}
                >
                  Triaje Multimodal IA
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-slate-100">
                  {currentTheme.sublabel}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5 leading-snug">
                {currentTheme.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-950/60 border border-white/20 text-white shadow-sm flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-cyan-300" />
              <span>{diagnosis.recommended_facility_type || 'Clínica Veterinaria'}</span>
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 sm:px-8 space-y-6">
          {/* Preliminary Clinical Assessment */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <HeartPulse className="w-4 h-4 text-emerald-300" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Síntomas identificados
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/45 border border-slate-700/60 text-slate-100 leading-relaxed text-sm">
              {diagnosis.preliminary_assessment}
            </div>
          </div>

          {/* Immediate First-Aid & Care Tips */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Tratamiento sugerido / Manejo
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {diagnosis.immediate_care_tips?.length || 0} pautas prioritarias
              </span>
            </div>

            <ul className="space-y-2.5">
              {diagnosis.immediate_care_tips?.map((tip, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-700/60 text-sm text-slate-100 hover:border-emerald-500/30 transition"
                >
                  <div
                    className="w-6 h-6 rounded-lg text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 shadow-sm"
                    style={{ backgroundColor: currentTheme.hex }}
                  >
                    {index + 1}
                  </div>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Featured AI Assistant CTA Button */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white shadow-lg shadow-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Recomendación de visita médica
                </span>
              </div>
              <h4 className="font-bold text-base text-white">
                ¿Tienes dudas sobre los cuidados de tu mascota?
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pregunta al asistente IA con todo el contexto clínico de esta evaluación.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConsultAssistant}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all duration-200 active:scale-95 flex items-center justify-center space-x-2 flex-shrink-0 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              <span>Consultar dudas con el Asistente IA sobre este caso</span>
            </button>
          </div>

          {/* Cloud Stored Image Reference if available */}
          {diagnosis.image_url && (
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
              <span className="truncate max-w-xs sm:max-w-md">
                Evidencia gráfica resguardada en el registro médico
              </span>
              <a
                href={diagnosis.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 font-semibold hover:underline flex items-center space-x-1 flex-shrink-0"
              >
                <span>Ver Fotografía Analizada</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Clinical Sheet Download Section */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div>
              <h4 className="font-bold text-sm">Ficha Clínica de Triaje</h4>
              <p className="text-xs text-slate-300">
                Imprime o exporta el informe para presentarlo al equipo veterinario.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSheetOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 shadow-sm transition flex items-center justify-center space-x-1.5 flex-shrink-0"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Descargar Ficha Médica</span>
            </button>
          </div>

          {/* Medical & Legal Disclaimer */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-50 space-y-1">
            <div className="flex items-center space-x-2 font-bold text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span>Aviso Médico y Responsabilidad</span>
            </div>
            <p className="leading-relaxed opacity-90">
              {diagnosis.warning_disclaimer ||
                'VetIA proporciona una guía orientativa de triaje basada en IA y no reemplaza la evaluación clínica directa de un médico veterinario colegiado.'}
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-950/40 px-6 sm:px-8 py-4 border-t border-slate-700/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-emerald-500/40 hover:text-emerald-200 text-sm font-semibold transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Nueva Consulta de Triaje</span>
          </button>

          <span className="text-xs text-slate-400">
            Registro ID: {diagnosis.record_id ? diagnosis.record_id.slice(0, 8) : 'Caso Activo'}
          </span>
        </div>
      </div>

      {/* Printable Clinical Sheet Modal */}
      <ClinicalSheetModal
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        diagnosis={diagnosis}
        petType={petType}
      />
    </>
  );
}

export default DiagnosisResult;
