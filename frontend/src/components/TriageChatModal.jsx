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
      hex: '#EF4444',
      bg: 'bg-red-500/15 text-red-300 border-red-500/40',
      label: 'Nivel Crítico',
      icon: AlertTriangle,
    },
    MODERATE: {
      hex: '#F59E0B',
      bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      label: 'Nivel Moderado',
      icon: AlertTriangle,
    },
    MILD: {
      hex: '#06b6d4',
      bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
      label: 'Nivel Leve',
      icon: CheckCircle2,
    },
  }[urgencyLevel] || {
    hex: '#F59E0B',
    bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    label: urgencyLevel,
    icon: AlertTriangle,
  };

  const UrgencyIcon = urgencyTheme.icon;

  // Build the clinical triage context to retain in conversation
  const triageContext = {
    record_id: diagnosis?.record_id,
    id: diagnosis?.record_id,
    pet_type: petType,
    urgency_level: diagnosis?.urgency_level,
    preliminary_assessment: diagnosis?.preliminary_assessment,
    immediate_care_tips: diagnosis?.immediate_care_tips,
    recommended_facility_type: diagnosis?.recommended_facility_type,
    image_url: diagnosis?.image_url,
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative backdrop-blur-xl bg-slate-900/95 w-full max-w-3xl rounded-3xl shadow-2xl shadow-indigo-950/40 border border-white/10 overflow-hidden flex flex-col h-[85vh] max-h-[700px] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-4 sm:p-5 border-b border-white/10 bg-white/[0.03] flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 flex-shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  Asistente IA: Consulta de Triaje
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${urgencyTheme.bg}`}
                >
                  <UrgencyIcon className="w-3 h-3" />
                  <span>{urgencyTheme.label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Contexto activo: {petType} • Caso #{diagnosis?.record_id ? diagnosis.record_id.slice(0, 8) : 'En vivo'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition flex-shrink-0"
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

