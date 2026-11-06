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
  currentSpecies = '',
  userId = null,
  disabled = false,
  className = '',
}) {
  const {
    isRecording,
    recordingTime,
    permissionError,
    clearError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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
        setErrorMessage('El audio fue demasiado corto. Por favor graba de nuevo.');
        return;
      }

      setIsProcessing(true);
      const result = await sendVoiceTriageAudio(blob, {
        currentSpecies,
        userId,
      });

      if (onTranscriptionComplete && result) {
        onTranscriptionComplete(result);
      }
    } catch (err) {
      console.error('[VoiceRecordButton] Error al procesar audio:', err);
      setErrorMessage(err.message || 'Error al procesar el audio con la IA.');
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
        className={`inline-flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-semibold shadow-sm ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>IA transcribiendo y evaluando síntomas...</span>
        </span>
      </div>
    );
  }

  // 2. Recording state
  if (isRecording) {
    return (
      <div
        className={`flex flex-wrap items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-md ${className}`}
      >
        {/* Pulsing indicator & timer */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border border-rose-200">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
          </span>
          <span className="font-mono font-bold text-xs sm:text-sm text-rose-700">
            Grabando: {recordingTime}
          </span>
        </div>

        {/* Audio soundwave bars */}
        <div className="hidden sm:flex items-center space-x-1 px-2 h-6">
          <div className="w-1 bg-rose-500 rounded-full animate-wave-bar-1"></div>
          <div className="w-1 bg-rose-500 rounded-full animate-wave-bar-2"></div>
          <div className="w-1 bg-rose-600 rounded-full animate-wave-bar-3"></div>
          <div className="w-1 bg-rose-500 rounded-full animate-wave-bar-4"></div>
          <div className="w-1 bg-rose-500 rounded-full animate-wave-bar-5"></div>
        </div>

        {/* Finish button */}
        <button
          type="button"
          onClick={handleFinish}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow transition"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Terminar y Analizar ⏹️</span>
        </button>

        {/* Cancel button */}
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs transition"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancelar</span>
        </button>
      </div>
    );
  }

  // 3. Resting idle state
  return (
    <div className={`inline-flex flex-col ${className}`}>
      <button
        type="button"
        onClick={handleStart}
        disabled={disabled}
        className="group inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Mic className="w-3.5 h-3.5 text-white" />
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
