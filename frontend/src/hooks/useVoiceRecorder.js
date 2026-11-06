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
 * Custom hook to record audio using the native MediaRecorder Web API
 * and stream real-time text transcription using Web Speech API (SpeechRecognition).
 */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [audioBlob, setAudioBlob] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const mimeTypeRef = useRef('');
  const recognitionRef = useRef(null);
  const isManuallyStoppedRef = useRef(false);

  const isAudioSupported =
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

  // Stop Web Speech Recognition safely
  const stopRecognition = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Ignore stop errors if already stopped
      }
    }
  }, []);

  // Cancel recording and discard data
  const cancelRecording = useCallback(() => {
    clearTimer();
    stopRecognition();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore abort errors
      }
    }
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
    setLiveTranscript('');
  }, [clearTimer, stopTracks, stopRecognition]);

  // Start recording audio and live speech recognition
  const startRecording = useCallback(async () => {
    setPermissionError(null);
    setAudioBlob(null);
    setLiveTranscript('');
    chunksRef.current = [];
    isManuallyStoppedRef.current = false;

    if (!isAudioSupported) {
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

      // Initialize Web Speech API for real-time live transcription
      const SpeechRecognition =
        typeof window !== 'undefined'
          ? window.SpeechRecognition || window.webkitSpeechRecognition
          : null;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'es-CO';

          recognition.onresult = (event) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              fullTranscript += event.results[i][0].transcript;
            }
            if (fullTranscript.trim()) {
              setLiveTranscript(fullTranscript.trim());
            }
          };

          recognition.onerror = (event) => {
            console.warn('[useVoiceRecorder] SpeechRecognition error:', event.error);
          };

          recognition.onend = () => {
            // Automatically restart if user is still actively recording
            if (!isManuallyStoppedRef.current && mediaRecorderRef.current?.state === 'recording') {
              try {
                recognition.start();
              } catch (e) {
                // Ignore if restart fails
              }
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (speechErr) {
          console.warn('[useVoiceRecorder] Web Speech Recognition no pudo iniciarse:', speechErr);
        }
      }

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
      stopRecognition();
      return false;
    }
  }, [isAudioSupported, clearTimer, stopTracks, stopRecognition]);

  // Stop recording and return the recorded Blob
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      clearTimer();
      stopRecognition();

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
  }, [clearTimer, stopTracks, stopRecognition]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      clearTimer();
      stopTracks();
      stopRecognition();
    };
  }, [clearTimer, stopTracks, stopRecognition]);

  return {
    isRecording,
    recordingSeconds,
    recordingTime,
    audioBlob,
    liveTranscript,
    setLiveTranscript,
    permissionError,
    isSupported: isAudioSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError: () => setPermissionError(null),
  };
}

export default useVoiceRecorder;
