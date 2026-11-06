import React, { useState } from 'react';
import {
  Mic,
  Square,
  X,
  Loader2,
  Volume2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { sendVoiceTriageAudio } from '../services/voiceTriageService';

/**
 * Interactive Voice Record Button component for field triage.
 * Allows rural tutors and farmers to record their voice description
 * of the veterinary emergency, triggering AI speech-to-text.
 */
export function VoiceRecordButton({
  onTranscriptionComplete,
  onLiveTranscriptChange,
  currentSpecies = '',
  userId = null,
  disabled = false,
  className = '',
}) {
  const {
    isRecording,
    recordingTime,
    liveTranscript,
    permissionError,
    clearError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Notify parent component of live transcript stream updates in real-time
  React.useEffect(() => {
    if (isRecording && onLiveTranscriptChange) {
      onLiveTranscriptChange(liveTranscript);
    }
  }, [liveTranscript, isRecording, onLiveTranscriptChange]);

  // Handle start recording
  const handleStart = async () => {
    setErrorMessage(null);
    const started = await startRecording();
    if (!started) {
      console.warn('[VoiceRecordButton] No se pudo iniciar la grabación.');
    }
  };

  // Handle finish recording and submit to AI
  const handleFinish = async () => {
    try {
      const blob = await stopRecording();
      if (!blob || blob.size < 200) {
        // If there's live transcript captured by Web Speech API, use it even if audio blob is very small
        if (liveTranscript && liveTranscript.trim()) {
          if (onTranscriptionComplete) {
            onTranscriptionComplete({
              transcription: liveTranscript.trim(),
              detected_species: currentSpecies || null,
              extracted_symptoms: liveTranscript.trim(),
            });
          }
          return;
        }
        setErrorMessage('El audio fue demasiado corto. Por favor graba de nuevo.');
        return;
      }

      setIsProcessing(true);
      const result = await sendVoiceTriageAudio(blob, {
        liveTranscript,
        currentSpecies,
        userId,
      });

      if (onTranscriptionComplete && result) {
        onTranscriptionComplete(result);
      }
    } catch (err) {
      console.error('[VoiceRecordButton] Error al procesar audio:', err);
      // Fallback: if we have live transcript, pass it to avoid user losing their speech
      if (liveTranscript && liveTranscript.trim() && onTranscriptionComplete) {
        console.info('[VoiceRecordButton] Usando transcripción en vivo tras fallo del backend.');
        onTranscriptionComplete({
          transcription: liveTranscript.trim(),
          detected_species: currentSpecies || null,
          extracted_symptoms: liveTranscript.trim(),
          fallback: true,
        });
      } else {
        setErrorMessage(err.message || 'Error al procesar el audio con la IA.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    cancelRecording();
    setErrorMessage(null);
  };

  // 1. Processing state
  if (isProcessing) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`inline-flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin text-amber-600" aria-hidden="true" />
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" aria-hidden="true" />
          <span>IA transcribiendo y evaluando síntomas...</span>
        </span>
      </div>
    );
  }

  // 2. Recording state
  if (isRecording) {
    return (
      <div
        className={`flex flex-col gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-950 border-2 border-emerald-500 shadow-xl w-full max-w-xl transition-all ${className}`}
      >
        {/* ARIA Live Region for screen readers */}
        <div role="status" aria-live="polite" className="sr-only">
          Grabando audio de urgencia. Tiempo transcurrido: {recordingTime}. Texto reconocido: {liveTranscript || 'Escuchando'}.
        </div>

        {/* Header: Pulsing indicator, timer & Soundwave bars */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2.5">
            <div
              role="timer"
              aria-label={`Tiempo de grabación actual: ${recordingTime}`}
              className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-rose-950/80 border border-rose-500/60"
            >
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-mono font-bold text-xs text-rose-300">
                Grabando: {recordingTime}
              </span>
            </div>

            {/* Audio soundwave bars */}
            <div className="flex items-center space-x-1 px-1.5 h-5" aria-hidden="true">
              <div className="w-1 bg-emerald-400 rounded-full animate-wave-bar-1"></div>
              <div className="w-1 bg-emerald-400 rounded-full animate-wave-bar-2"></div>
              <div className="w-1 bg-emerald-300 rounded-full animate-wave-bar-3"></div>
              <div className="w-1 bg-emerald-400 rounded-full animate-wave-bar-4"></div>
              <div className="w-1 bg-emerald-500 rounded-full animate-wave-bar-5"></div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFinish}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFinish();
                }
              }}
              aria-label="Confirmar y analizar dictado con IA"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 focus:ring-offset-slate-900"
            >
              <span>Confirmar y Analizar ✅</span>
            </button>

            <button
              type="button"
              onClick={handleCancel}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCancel();
                }
              }}
              aria-label="Cancelar y descartar grabación"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 focus:ring-offset-slate-900"
            >
              <span>Cancelar ❌</span>
            </button>
          </div>
        </div>

        {/* Live speech-to-text dictation box */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/50 shadow-inner min-h-[64px] flex flex-col justify-center">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>🎙️ Escuchando:</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed italic break-words">
            {liveTranscript ? (
              <>
                &ldquo;{liveTranscript}&rdquo;
                <span className="inline-block w-2 h-3.5 ml-1 bg-emerald-400 animate-pulse align-middle" />
              </>
            ) : (
              <span className="text-slate-400 not-italic">
                Describe los síntomas de tu animal en voz alta (ej: &ldquo;Mi ternero tiene fiebre y no se levanta...&rdquo;)
                <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-400 animate-pulse align-middle" />
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  // 3. Resting idle state
  return (
    <div className={`inline-flex flex-col ${className}`}>
      {/* ARIA Live Region for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        Grabador de voz en espera. Presiona el botón para iniciar grabación de síntomas.
      </div>

      <button
        type="button"
        onClick={handleStart}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleStart();
          }
        }}
        disabled={disabled}
        aria-label="Iniciar grabación de voz para describir urgencia veterinaria"
        className="group inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Mic className="w-3.5 h-3.5 text-white" aria-hidden="true" />
        </div>
        <span>Describir urgencia por voz 🎙️</span>
      </button>

      {permissionError && (
        <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs shadow-sm max-w-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-950">Acceso al micrófono restringido</p>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  {permissionError}
                </p>
                <p className="text-amber-700 text-[10px]">
                  💡 Haz clic en el candado 🔒 en la barra de tu navegador para permitir el micrófono, o continúa escribiendo tus síntomas abajo sin problema.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-amber-700 hover:text-amber-900 font-bold px-1 py-0.5 text-xs"
              aria-label="Cerrar aviso de permisos"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <span className="text-[11px] text-rose-600 mt-1 font-medium">
          {errorMessage}
        </span>
      )}
    </div>
  );
}

export default VoiceRecordButton;
