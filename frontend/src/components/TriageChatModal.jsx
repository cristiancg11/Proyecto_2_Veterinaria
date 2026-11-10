import React, { useEffect } from 'react';
import { X, Sparkles, MessageSquare, Bot, AlertTriangle, CheckCircle2 } from 'lucide-react';
import TriageChat from './TriageChat';

export function TriageChatModal({ isOpen, onClose, diagnosis, petType = 'Mascota' }) {
  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Urgency color indicator
  const urgencyLevel = diagnosis?.urgency_level || 'MODERATE';
  const urgencyTheme = {
    CRITICAL: {
      hex: '#C83D4D',
      bg: 'bg-[#FDECEE] text-[#C83D4D] border-[#C83D4D]/30',
      label: 'Nivel Crítico',
      icon: AlertTriangle,
    },
    MODERATE: {
      hex: '#A97812',
      bg: 'bg-[#FFF9F2] text-[#A97812] border-[#A97812]/30',
      label: 'Nivel Moderado',
      icon: AlertTriangle,
    },
    MILD: {
      hex: '#27825D',
      bg: 'bg-[#EAF3F0] text-[#27825D] border-[#27825D]/30',
      label: 'Nivel Leve',
      icon: CheckCircle2,
    },
  }[urgencyLevel] || {
    hex: '#A97812',
    bg: 'bg-[#FFF9F2] text-[#A97812] border-[#A97812]/30',
    label: urgencyLevel,
    icon: AlertTriangle,
  };

  const UrgencyIcon = urgencyTheme.icon;

  // Build the clinical triage context to retain in conversation
  const triageContext = {
    record_id: diagnosis?.record_id,
    id: diagnosis?.record_id,
    pet_type: petType,
    species: petType,
    weight: diagnosis?.weight,
    urgency_level: diagnosis?.urgency_level,
    preliminary_assessment: diagnosis?.preliminary_assessment,
    primary_diagnosis: diagnosis?.primary_diagnosis || diagnosis?.diagnosis || diagnosis?.preliminary_assessment,
    differential_diagnoses: diagnosis?.differential_diagnoses || diagnosis?.differentials,
    immediate_care_tips: diagnosis?.immediate_care_tips,
    recommended_facility_type: diagnosis?.recommended_facility_type,
    image_url: diagnosis?.image_url,
    system_prompt:
      'Eres el Asistente Clínico de VetIA. Tienes en contexto los datos del paciente. Responde con precisión clínica directa a cualquier duda del médico o tutor sobre el diagnóstico, tratamiento, cuidados en casa o medicación.',
    system_instruction:
      'Eres el Asistente Clínico de VetIA. Tienes en contexto los datos del paciente. Responde con precisión clínica directa a cualquier duda del médico o tutor sobre el diagnóstico, tratamiento, cuidados en casa o medicación.',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-[#162420] w-full max-w-3xl rounded-2xl shadow-xl border border-[#DCE6E0] dark:border-[#233630] overflow-hidden flex flex-col h-[85vh] max-h-[700px] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-4 sm:p-5 border-b border-[#DCE6E0] dark:border-[#233630] bg-[#F4F7F5] dark:bg-[#162420] flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#176B55] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-[#123B32] dark:text-white truncate">
                  Asistente IA: Consulta de Triaje
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${urgencyTheme.bg}`}
                >
                  <UrgencyIcon className="w-3 h-3" />
                  <span>{urgencyTheme.label}</span>
                </span>
              </div>
              <p className="text-xs text-[#66756F] dark:text-[#A3B8B0] truncate">
                Contexto activo: {petType} • Caso #{diagnosis?.record_id ? diagnosis.record_id.slice(0, 8) : 'En vivo'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#66756F] hover:text-[#1F2D29] dark:hover:text-white hover:bg-white dark:hover:bg-[#1F2D29] border border-transparent hover:border-[#DCE6E0] transition flex-shrink-0 cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Chat Body */}
        <div className="flex-1 overflow-hidden">
          <TriageChat
            triageId={diagnosis?.record_id}
            petType={petType}
            triageContext={triageContext}
          />
        </div>
      </div>
    </div>
  );
}

export default TriageChatModal;

