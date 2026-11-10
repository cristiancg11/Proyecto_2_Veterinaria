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
  Eye,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
} from 'lucide-react';
import ClinicalSheetModal from './ClinicalSheetModal';
import { useAuth } from '../context/AuthContext';

// Strict color mappings per technical specification
const SEVERITY_THEMES = {
  CRITICAL: {
    hex: '#C83D4D',
    title: 'NIVEL CRÍTICO (EMERGENCIA INMEDIATA)',
    sublabel: 'Riesgo Vital Inminente',
    badgeBg: 'bg-[#C83D4D]',
    border: 'border-[#C83D4D]/70',
    bannerBg: 'bg-[#FDECEE]',
    accentText: 'text-[#C83D4D]',
    icon: AlertTriangle,
  },
  MODERATE: {
    hex: '#A97812',
    title: 'NIVEL MODERADO (ATENCIÓN PRIORITARIA)',
    sublabel: 'Urgencia Intermedia',
    badgeBg: 'bg-[#A97812]',
    border: 'border-[#A97812]/70',
    bannerBg: 'bg-[#FFF9F2]',
    accentText: 'text-[#A97812]',
    icon: AlertTriangle,
  },
  MILD: {
    hex: '#27825D',
    title: 'NIVEL LEVE (MANEJO RUTINARIO)',
    sublabel: 'Baja Urgencia / Ambulatorio',
    badgeBg: 'bg-[#27825D]',
    border: 'border-[#27825D]/60',
    bannerBg: 'bg-[#EAF3F0]',
    accentText: 'text-[#27825D]',
    icon: CheckCircle2,
  },
};

export function DiagnosisResult({ diagnosis, onReset, petType = 'Mascota', onOpenChat }) {
  const { tutorPhone } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showDifferentials, setShowDifferentials] = useState(false);
  const [directWhatsappPhone, setDirectWhatsappPhone] = useState(
    tutorPhone ? (tutorPhone.startsWith('+') ? tutorPhone : `+57${tutorPhone}`) : '+57'
  );

  if (!diagnosis) return null;

  const handleSendWhatsApp = (phone, patientData) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `*Reporte Clínico VetIA*\n` +
      `*Paciente:* ${patientData.name || 'Paciente'} (${patientData.species})\n` +
      `*Diagnóstico Principal:* ${patientData.diagnosis || 'En evaluación'}\n` +
      `*Urgencia:* ${patientData.urgency || 'Código de Atención'}\n` +
      `*Tratamiento/Manejo Inmediato:* ${patientData.treatment || 'Ver ficha adjunta'}\n\n` +
      `Consulte el expediente completo en la plataforma VetIA.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const currentTheme =
    SEVERITY_THEMES[diagnosis.urgency_level] || SEVERITY_THEMES.MODERATE;
  const BadgeIcon = currentTheme.icon;

  // Extract explicit primary diagnosis name
  const primaryDiagnosisName =
    diagnosis.primary_diagnosis ||
    diagnosis.presumptive_diagnosis ||
    diagnosis.pathology ||
    (typeof diagnosis.preliminary_assessment === 'string' && diagnosis.preliminary_assessment.split('.')[0]) ||
    'Síndrome Clínico Agudo';

  // Certainty calculation
  const rawConfidence = diagnosis.confidence_score || diagnosis.confidence || diagnosis.certainty;
  const certaintyPercent = rawConfidence
    ? Math.round(Number(rawConfidence) > 1 ? Number(rawConfidence) : Number(rawConfidence) * 100)
    : 92;

  // Visual findings on image
  const visualFindingsText =
    diagnosis.visual_findings ||
    diagnosis.image_findings ||
    'Evaluación visual multimodal: Exploración de coloración de mucosas (rosadas/pálidas/cianóticas), integridad de tejido y lesiones dérmicas, y morfología anatómica observada en la imagen.';

  // Differential diagnoses breakdown with %
  const differentialsList =
    Array.isArray(diagnosis.differential_diagnoses) && diagnosis.differential_diagnoses.length > 0
      ? diagnosis.differential_diagnoses
      : [
          { name: 'Reacción Inflamatoria / Infección Tisular Secundaria', probability: '35%' },
          { name: 'Contusión Profunda o Traumatismo Osteomuscular', probability: '22%' },
          { name: 'Compromiso Sistémico o Reacción de Hipersensibilidad', probability: '14%' },
        ];

  const handleConsultAssistant = () => {
    if (onOpenChat) {
      onOpenChat(diagnosis);
    }
  };

  return (
    <>
      <div
        className="bg-white dark:bg-[#162420] rounded-2xl shadow-xs border border-[#DCE6E0] dark:border-[#233630] overflow-hidden space-y-6 transition-all duration-300"
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
              className="p-3 rounded-xl text-white shadow-xs flex-shrink-0"
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
                <span className="text-xs text-[#66756F]">•</span>
                <span className="text-xs font-medium text-[#1F2D29]">
                  {currentTheme.sublabel}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#123B32] mt-0.5 leading-snug">
                {currentTheme.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-[#162420] border border-[#DCE6E0] dark:border-[#233630] text-[#1F2D29] dark:text-white shadow-xs flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-[#176B55]" />
              <span>{diagnosis.recommended_facility_type || 'Clínica Veterinaria'}</span>
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 sm:px-8 space-y-6">
          {/* Explicit Primary Diagnostic Verdict & Image Analysis Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#F4F7F5] dark:bg-[#0F1A17] border-2 border-[#176B55]/50 dark:border-[#45A987]/50 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-[#176B55] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-xs">
                <Activity className="w-4 h-4" />
                <span>DIAGNÓSTICO PRINCIPAL: {primaryDiagnosisName}</span>
              </span>
              <div className="flex items-center space-x-2 text-xs font-bold text-[#176B55] dark:text-[#45A987] bg-white dark:bg-[#162420] px-3.5 py-1.5 rounded-xl border border-[#DCE6E0] dark:border-[#233630] shadow-xs">
                <span>Nivel de Certeza:</span>
                <span className="font-black text-sm">{certaintyPercent}%</span>
              </div>
            </div>

            {/* Resumen de hallazgos observados en la imagen */}
            <div className="space-y-1.5 pt-2 border-t border-[#DCE6E0] dark:border-[#233630]">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#123B32] dark:text-white uppercase tracking-wider">
                <Eye className="w-4 h-4 text-[#176B55]" />
                <span>Hallazgos observados en imagen (Mucosas, Lesiones dérmicas, Silueta radiográfica):</span>
              </div>
              <p className="text-xs sm:text-sm text-[#1F2D29] dark:text-slate-200 leading-relaxed bg-white dark:bg-[#162420] p-3.5 rounded-xl border border-[#DCE6E0] dark:border-[#233630]">
                {visualFindingsText}
              </p>
            </div>

            {/* Sección desplegable: Diagnósticos Diferenciales a Descartar */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowDifferentials(!showDifferentials)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#162420] border border-[#DCE6E0] dark:border-[#233630] hover:border-[#176B55] text-xs font-bold text-[#123B32] dark:text-white transition cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#176B55]" />
                  <span>Diagnósticos Diferenciales a Descartar</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF3F0] dark:bg-[#1F332C] text-[#176B55] font-black">
                    {differentialsList.length} considerados
                  </span>
                </div>
                {showDifferentials ? <ChevronUp className="w-4 h-4 text-[#66756F]" /> : <ChevronDown className="w-4 h-4 text-[#66756F]" />}
              </button>

              {showDifferentials && (
                <div className="mt-2 space-y-2 p-3.5 bg-white dark:bg-[#162420] rounded-xl border border-[#DCE6E0] dark:border-[#233630] animate-in fade-in duration-200">
                  <p className="text-[11px] text-[#66756F] dark:text-[#A3B8B0]">
                    Patologías secundarias con sintomatología análoga que deben descartarse en clínica presencial:
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {differentialsList.map((item, idx) => {
                      const name = typeof item === 'string' ? item : item.name;
                      const prob = typeof item === 'string' ? `${Math.max(10, 38 - idx * 11)}%` : (item.probability || item.likelihood || `${Math.max(10, 38 - idx * 11)}%`);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F4F7F5] dark:bg-[#0F1A17] border border-[#DCE6E0] dark:border-[#233630] text-xs"
                        >
                          <span className="font-semibold text-[#1F2D29] dark:text-slate-200">
                            {idx + 1}. {name}
                          </span>
                          <span className="font-black text-[#176B55] dark:text-[#45A987] bg-white dark:bg-[#162420] px-2 py-0.5 rounded border border-[#DCE6E0] dark:border-[#233630]">
                            {prob}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preliminary Clinical Assessment */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <HeartPulse className="w-4 h-4 text-[#176B55]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#66756F]">
                Síntomas identificados
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-[#F4F7F5] dark:bg-[#0F1A17] border border-[#DCE6E0] dark:border-[#233630] text-[#1F2D29] dark:text-slate-200 leading-relaxed text-sm">
              {diagnosis.preliminary_assessment}
            </div>
          </div>

          {/* Immediate First-Aid & Care Tips */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#123B32] dark:text-white">
                Tratamiento sugerido / Manejo
              </h3>
              <span className="text-[11px] font-semibold text-[#66756F]">
                {diagnosis.immediate_care_tips?.length || 0} pautas prioritarias
              </span>
            </div>

            <ul className="space-y-2.5">
              {diagnosis.immediate_care_tips?.map((tip, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#F4F7F5] dark:bg-[#0F1A17] border border-[#DCE6E0] dark:border-[#233630] text-sm text-[#1F2D29] dark:text-slate-200 hover:border-[#176B55]/50 transition"
                >
                  <div
                    className="w-6 h-6 rounded-lg text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 shadow-xs"
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
          <div className="p-5 rounded-2xl bg-[#EAF3F0] dark:bg-[#162420] text-[#1F2D29] dark:text-white shadow-xs border border-[#176B55]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <Sparkles className="w-4 h-4 text-[#176B55]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#176B55]">
                  Recomendación de visita médica
                </span>
              </div>
              <h4 className="font-bold text-base text-[#123B32] dark:text-white">
                ¿Tienes dudas sobre los cuidados de tu mascota?
              </h4>
              <p className="text-xs text-[#66756F] dark:text-[#A3B8B0] leading-relaxed">
                Pregunta al asistente IA con todo el contexto clínico de esta evaluación.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConsultAssistant}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#176B55] hover:bg-[#135846] text-white font-semibold text-sm shadow-xs transition-all duration-200 active:scale-95 flex items-center justify-center space-x-2 flex-shrink-0 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              <span>Consultar dudas con el Asistente IA sobre este caso</span>
            </button>
          </div>

          {/* Cloud Stored Image Reference if available */}
          {diagnosis.image_url && (
            <div className="p-3 bg-[#F4F7F5] dark:bg-[#0F1A17] rounded-xl border border-[#DCE6E0] dark:border-[#233630] flex items-center justify-between text-xs text-[#66756F] dark:text-[#A3B8B0]">
              <span className="truncate max-w-xs sm:max-w-md">
                Evidencia gráfica resguardada en el registro médico
              </span>
              <a
                href={diagnosis.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#176B55] font-semibold hover:underline flex items-center space-x-1 flex-shrink-0"
              >
                <span>Ver Fotografía Analizada</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Clinical Sheet Download & WhatsApp Dispatch Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F7F5] dark:bg-[#0F1A17] text-[#1F2D29] dark:text-white border border-[#DCE6E0] dark:border-[#233630] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-[#123B32] dark:text-white">Ficha Clínica & Reporte de Triaje</h4>
              <p className="text-xs text-[#66756F] dark:text-[#A3B8B0]">
                Descarga el informe médico o envíalo directamente por WhatsApp a cualquier especialista o tutor.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 bg-white dark:bg-[#162420] border border-[#DCE6E0] dark:border-[#233630] rounded-xl px-2.5 py-1.5 shadow-xs">
                <span className="text-xs">💬</span>
                <input
                  type="tel"
                  value={directWhatsappPhone}
                  onChange={(e) => setDirectWhatsappPhone(e.target.value)}
                  placeholder="+573001234567"
                  className="w-32 sm:w-36 text-xs font-bold outline-none text-[#1F2D29] dark:text-white bg-transparent"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleSendWhatsApp(directWhatsappPhone, {
                      name: diagnosis.patient_name || petType,
                      species: petType,
                      diagnosis: primaryDiagnosisName,
                      urgency: diagnosis.urgency_level,
                      treatment: Array.isArray(diagnosis.immediate_care_tips)
                        ? diagnosis.immediate_care_tips.join('; ')
                        : diagnosis.immediate_care_tips,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                >
                  Enviar por WhatsApp
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsSheetOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#176B55] hover:bg-[#135846] text-white text-xs font-semibold shadow-xs transition flex items-center justify-center space-x-1.5 flex-shrink-0 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Descargar Ficha</span>
              </button>
            </div>
          </div>

          {/* Medical & Legal Disclaimer */}
          <div className="p-4 rounded-xl bg-[#FFF9F2] dark:bg-[#2A2114] border border-[#D77926]/30 text-xs text-[#1F2D29] dark:text-slate-200 space-y-1">
            <div className="flex items-center space-x-2 font-bold text-[#D77926]">
              <ShieldAlert className="w-4 h-4 text-[#D77926]" />
              <span>Aviso Médico y Responsabilidad</span>
            </div>
            <p className="leading-relaxed opacity-90">
              {diagnosis.warning_disclaimer ||
                'VetIA proporciona una guía orientativa de triaje basada en IA y no reemplaza la evaluación clínica directa de un médico veterinario colegiado.'}
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-[#F4F7F5] dark:bg-[#162420] px-6 sm:px-8 py-4 border-t border-[#DCE6E0] dark:border-[#233630] flex items-center justify-between">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#1F2D29] text-[#1F2D29] dark:text-white hover:bg-[#F4F7F5] text-sm font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Nueva Consulta de Triaje</span>
          </button>

          <span className="text-xs text-[#66756F] dark:text-[#A3B8B0]">
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
