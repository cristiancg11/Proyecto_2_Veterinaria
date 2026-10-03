import React from 'react';
import { X, Printer, HeartPulse, Building2, ShieldAlert } from 'lucide-react';

export function ClinicalSheetModal({ isOpen, onClose, diagnosis, petType = 'Mascota' }) {
  if (!isOpen || !diagnosis) return null;

  const handlePrint = () => {
    window.print();
  };

  const urgencyColors = {
    CRITICAL: {
      border: 'border-rose-600',
      badge: 'bg-rose-600 text-white',
      label: 'URGENCIA CRÍTICA / EMERGENCIA VITAL',
    },
    MODERATE: {
      border: 'border-amber-500',
      badge: 'bg-amber-500 text-white',
      label: 'URGENCIA MODERADA / PRIORITARIA',
    },
    MILD: {
      border: 'border-emerald-600',
      badge: 'bg-emerald-600 text-white',
      label: 'ATENCIÓN GENERAL / LEVE',
    },
  }[diagnosis.urgency_level] || {
    border: 'border-slate-600',
    badge: 'bg-slate-600 text-white',
    label: diagnosis.urgency_level,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800 text-sm">
              Clinical Triage Referral Sheet (Vista de Impresión / Descarga)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar como PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="printable-clinical-sheet" className="p-8 sm:p-10 overflow-y-auto space-y-6 text-slate-900 bg-white">
          {/* Sheet Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                <HeartPulse className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  VetIA / PetEmergency
                </h1>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Ficha de Triage y Orientación Médica Veterinaria
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500">
              <p>ID Registro: <span className="font-mono font-bold text-slate-800">{diagnosis.record_id || 'LOCAL-TRIAGE'}</span></p>
              <p>Fecha de Emisión: <span className="font-medium text-slate-800">{new Date().toLocaleString()}</span></p>
              <p>Generado con: <span className="font-semibold text-rose-600">Gemini 2.5 Flash Multimodal</span></p>
            </div>
          </div>

          {/* Severity Banner */}
          <div className={`p-4 rounded-xl border-2 ${urgencyColors.border} flex items-center justify-between bg-slate-50/50`}>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Clasificación de Severidad Preliminar:
              </span>
              <span className={`inline-block mt-1 px-3 py-1 rounded-lg text-sm font-black tracking-wide ${urgencyColors.badge}`}>
                {urgencyColors.label}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Derivación Sugerida:</span>
              <span className="text-xs font-bold text-slate-900 flex items-center justify-end space-x-1 mt-0.5">
                <Building2 className="w-4 h-4 text-slate-600 inline" />
                <span>{diagnosis.recommended_facility_type}</span>
              </span>
            </div>
          </div>

          {/* Clinical Case Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  1. Especie del Paciente
                </h4>
                <p className="text-sm font-semibold text-slate-800 bg-slate-100/60 p-2.5 rounded-lg border border-slate-200/60">
                  {petType}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  2. Evaluación Clínica Preliminar
                </h4>
                <div className="text-xs leading-relaxed text-slate-800 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {diagnosis.preliminary_assessment}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  3. Pautas de Primeros Auxilios Recomendadas
                </h4>
                <ul className="text-xs space-y-1.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-slate-700">
                  {diagnosis.immediate_care_tips?.map((tip, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="font-bold text-rose-600">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Photo preview */}
            <div className="sm:col-span-1 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Fotografía de la Lesión
              </h4>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center h-48">
                {diagnosis.image_url ? (
                  <img
                    src={diagnosis.image_url}
                    alt="Evidencia clínica"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Sin foto</span>
                )}
              </div>
            </div>
          </div>

          {/* Legal / Medical Disclaimer Box */}
          <div className="p-3 rounded-lg border border-slate-300 bg-slate-50 text-[11px] text-slate-600 leading-normal flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Aviso Médico Legal:</strong> Esta ficha es un instrumento preliminar generado por IA para facilitar la recepción y triage hospitalario del animal. No sustituye la auscultación, analítica sanguínea ni juicio clínico del médico veterinario colegiado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClinicalSheetModal;
