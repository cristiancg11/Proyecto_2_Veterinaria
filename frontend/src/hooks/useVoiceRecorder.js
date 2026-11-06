import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Helper to format seconds into MM:SS display string
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Determine supported audio MIME type across desktop and mobile browsers
 */
function getSupportedMimeType() {
  if (typeof window === 'undefined' || !window.MediaRecorder) {
    return '';
  }
  const candidateTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ];
  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

/**
 * Custom hook to record audio using the native MediaRecorder Web API.
 * Provides recording controls, elapsed duration, permission error handling,
 * and automatic audio stream cleanup.
 */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [audioBlob, setAudioBlob] = useState(null);
  const [permissionError, setPermissionError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const mimeTypeRef = useRef('');

  const isSupported =
    typeof window !== 'undefined' &&
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Cleanup media stream tracks
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Cancel recording and discard data
  const cancelRecording = useCallback(() => {
    clearTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('[useVoiceRecorder] Error al detener recorder en cancelación:', err);
      }
    }
    stopTracks();
    chunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
    setRecordingTime('00:00');
  }, [clearTimer, stopTracks]);

  // Start recording
  const startRecording = useCallback(async () => {
    setPermissionError(null);
    setAudioBlob(null);
    chunksRef.current = [];

    if (!isSupported) {
      setPermissionError('Tu navegador no soporta grabación de voz o la Web Audio API.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      const detectedMime = getSupportedMimeType();
      mimeTypeRef.current = detectedMime;

      const options = detectedMime ? { mimeType: detectedMime } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250); // Emit slices every 250ms for reliable chunks
      setIsRecording(true);
      setRecordingSeconds(0);
      setRecordingTime('00:00');

      // Setup duration timer
      let seconds = 0;
      clearTimer();
      timerIntervalRef.current = setInterval(() => {
        seconds += 1;
        setRecordingSeconds(seconds);
        setRecordingTime(formatTime(seconds));
      }, 1000);

      return true;
    } catch (err) {
      console.error('[useVoiceRecorder] Error al acceder al micrófono:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Permiso de micrófono denegado. Habilita el acceso en tu navegador para usar la voz.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No se encontró ningún micrófono conectado en este dispositivo.');
      } else {
        setPermissionError(`Error de micrófono: ${err.message || 'No se pudo iniciar la grabación.'}`);
      }
      stopTracks();
      return false;
    }
  }, [isSupported, clearTimer, stopTracks]);

  // Stop recording and return the recorded Blob
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      clearTimer();

      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setIsRecording(false);
        stopTracks();
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const finalMime = mimeTypeRef.current || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMime });
        chunksRef.current = [];
        setAudioBlob(blob);
        setIsRecording(false);
        stopTracks();
        resolve(blob);
      };

      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('[useVoiceRecorder] Excepción al invocar stop():', err);
        stopTracks();
        setIsRecording(false);
        resolve(null);
      }
    });
  }, [clearTimer, stopTracks]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      clearTimer();
      stopTracks();
    };
  }, [clearTimer, stopTracks]);

  return {
    isRecording,
    recordingSeconds,
    recordingTime,
    audioBlob,
    permissionError,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError: () => setPermissionError(null),
  };
}

export default useVoiceRecorder;
