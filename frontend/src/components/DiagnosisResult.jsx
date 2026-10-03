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
} from 'lucide-react';
import ClinicalSheetModal from './ClinicalSheetModal';
import TriageChat from './TriageChat';

export function DiagnosisResult({ diagnosis, onReset, petType = 'Mascota' }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('assessment'); // 'assessment' | 'chat'

  if (!diagnosis) return null;

  const badgeConfig = {
    CRITICAL: {
      bg: 'bg-rose-50',
      border: 'border-rose-300',
      text: 'text-rose-700',
      badgeBg: 'bg-rose-600',
      title: 'CRITICAL EMERGENCY (NIVEL CRÍTICO)',
      icon: AlertTriangle,
    },
    MODERATE: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-800',
      badgeBg: 'bg-amber-500',
      title: 'MODERATE URGENCY (NIVEL MODERADO)',
      icon: AlertTriangle,
    },
    MILD: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      text: 'text-emerald-800',
      badgeBg: 'bg-emerald-600',
      title: 'MILD / ROUTINE CARE (NIVEL LEVE)',
      icon: CheckCircle2,
    },
  }[diagnosis.urgency_level] || {
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-800',
    badgeBg: 'bg-slate-600',
    title: diagnosis.urgency_level,
    icon: CheckCircle2,
  };

  const BadgeIcon = badgeConfig.icon;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-6">
        {/* Urgency Level Top Banner */}
        <div className={`p-6 border-b ${badgeConfig.bg} ${badgeConfig.border}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${badgeConfig.badgeBg} text-white shadow-md`}>
                <BadgeIcon className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold tracking-wider uppercase opacity-80">
                  AI Multimodal Triage Assessment
                </span>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  {badgeConfig.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/80 border border-slate-300 text-slate-700 shadow-sm flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>{diagnosis.recommended_facility_type}</span>
              </span>
            </div>
          </div>
        </div>

        {/* View Toggle Tabs: Assessment vs Follow-up Chat */}
        <div className="px-6 sm:px-8 border-b border-slate-200 flex space-x-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'assessment'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Evaluación y Primeros Auxilios
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'chat'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat de Seguimiento IA</span>
          </button>
        </div>

        {activeTab === 'assessment' ? (
          <div className="px-6 sm:px-8 space-y-6">
            {/* Preliminary Clinical Assessment */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                Evaluación Clínica Preliminar
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed text-sm">
                {diagnosis.preliminary_assessment}
              </div>
            </div>

            {/* Immediate First-Aid & Care Tips */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                Pautas Inmediatas de Primeros Auxilios y Estabilización
              </h3>
              <ul className="space-y-2.5">
                {diagnosis.immediate_care_tips?.map((tip, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-sm text-slate-700"
                  >
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cloud Stored Image Reference if available */}
            {diagnosis.image_url && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span className="truncate max-w-xs sm:max-w-md">
                  Evidencia respaldada en Supabase Storage
                </span>
                <a
                  href={diagnosis.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-600 font-semibold hover:underline flex items-center space-x-1 flex-shrink-0"
                >
                  <span>Ver Foto Original</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Action Bar for Clinical Sheet */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
              <div>
                <h4 className="font-bold text-sm">Ficha Clínica de Triage para Urgencias</h4>
                <p className="text-xs text-slate-300">
                  Descarga o imprime el resumen médico para presentar en la clínica veterinaria.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSheetOpen(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow transition flex items-center justify-center space-x-1.5 flex-shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>Descargar Ficha para Urgencias</span>
              </button>
            </div>

            {/* Medical & Legal Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center space-x-2 font-bold text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Aviso Médico Legal Obligatorio</span>
              </div>
              <p className="leading-relaxed opacity-90">{diagnosis.warning_disclaimer}</p>
            </div>
          </div>
        ) : (
          <div className="px-6 sm:px-8 pb-6">
            <TriageChat
              triageId={diagnosis.record_id}
              petType={petType}
            />
          </div>
        )}

        {/* Footer Navigation */}
        <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onReset}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-sm font-semibold transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Nueva Consulta de Triage</span>
          </button>

          <span className="text-xs text-slate-400">
            Registro ID: {diagnosis.record_id ? diagnosis.record_id.slice(0, 8) : 'Local'}
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
