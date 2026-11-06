import { API_BASE_URL } from './api';

/**
 * Resolved base API URL with fallback to local development server
 */
export const VOICE_API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  API_BASE_URL ||
  'http://localhost:8000/api/v1';

/**
 * Heuristic mapping to detect rural species from transcription text
 * when backend does not directly provide a detected_species tag.
 */
export function inferSpeciesFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();

  if (/\b(bovino|vaca|toro|ternero|ternera|novillo|novilla|ceb[uú]|rumiante mayor)\b/i.test(lower)) {
    return 'bovino';
  }
  if (/\b(equino|caballo|yegua|potro|potranca|mula|mulo|asno|burro)\b/i.test(lower)) {
    return 'equino';
  }
  if (/\b(porcino|cerdo|cerda|marrano|lech[oó]n|chancho|cochino)\b/i.test(lower)) {
    return 'porcino';
  }
  if (/\b(ovino|caprino|oveja|cordero|carnero|cabra|cabrito|chivo)\b/i.test(lower)) {
    return 'ovino_caprino';
  }
  if (/\b(ave|gallina|gallo|pollo|pollita|pavo|patos|av[ií]cola)\b/i.test(lower)) {
    return 'aves_corral';
  }
  if (/\b(cuy|cuyes|conejo|conejos|cobayo|cobaya|curiel)\b/i.test(lower)) {
    return 'cuyes_conejos';
  }
  if (/\b(canino|perro|perra|perrito|cachorro|can)\b/i.test(lower)) {
    return 'canino';
  }
  if (/\b(felino|gato|gata|gatito|minino)\b/i.test(lower)) {
    return 'felino';
  }
  return null;
}

/**
 * Sends a recorded audio blob and real-time live transcript to the backend voice evaluation endpoint.
 *
 * Primary Endpoint: POST /api/v1/triage/voice-eval
 * Fallback Endpoint: POST /api/v1/voice-eval
 *
 * @param {Blob} audioBlob - Recorded audio blob from MediaRecorder
 * @param {Object} [metadata={}] - Optional metadata (liveTranscript, userId, currentSpecies)
 * @returns {Promise<{
 *   transcription: string,
 *   detected_species: string|null,
 *   extracted_symptoms: string,
 *   raw?: any
 * }>}
 */
export async function sendVoiceTriageAudio(audioBlob, metadata = {}) {
  if (!audioBlob) {
    throw new Error('No se proporcionó ningún archivo de audio para transcribir.');
  }

  const formData = new FormData();
  // Standard filename with appropriate extension based on MIME type
  const extension = audioBlob.type?.includes('mp4') ? 'mp4' : 'webm';
  formData.append('audio_file', audioBlob, `voice_triage_${Date.now()}.${extension}`);

  // Attach live transcript from Web Speech API if captured in real-time
  const liveText = metadata.liveTranscript || metadata.live_transcript || '';
  if (liveText && liveText.trim()) {
    formData.append('live_transcript', liveText.trim());
  }

  if (metadata.userId) {
    formData.append('user_id', metadata.userId);
  }
  if (metadata.currentSpecies) {
    formData.append('species_hint', metadata.currentSpecies);
  }

  const primaryUrl = `${VOICE_API_BASE_URL}/triage/voice-eval`;
  const fallbackUrl = `${VOICE_API_BASE_URL}/voice-eval`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout for AI transcription

  try {
    let response;
    let endpointUsed = primaryUrl;

    try {
      response = await fetch(primaryUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
    } catch (primaryErr) {
      if (primaryErr.name === 'AbortError') {
        throw new Error('El tiempo de espera para transcribir el audio ha expirado (35s).');
      }
      console.warn(`[voiceTriageService] Falló solicitud a ${primaryUrl}, reintentando en ${fallbackUrl}:`, primaryErr);
      endpointUsed = fallbackUrl;
      response = await fetch(fallbackUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    // If HTTP error, extract exact details without silencing causes
    if (!response.ok) {
      const status = response.status;
      let errorDetail = '';

      try {
        const errorJson = await response.json();
        errorDetail =
          errorJson.detail ||
          errorJson.message ||
          (typeof errorJson === 'object' ? JSON.stringify(errorJson) : String(errorJson));
      } catch {
        errorDetail = await response.text().catch(() => '');
      }

      // If backend route is 404 (endpoint not configured) but we have live transcript, use it with notice
      if (status === 404 && liveText) {
        console.warn(`[voiceTriageService] ${endpointUsed} devolvió 404. Usando transcripción en vivo: "${liveText}"`);
        return {
          transcription: liveText,
          detected_species: metadata.currentSpecies || inferSpeciesFromText(liveText) || null,
          extracted_symptoms: liveText,
          fallback: true,
          backendNote: 'Transcrito localmente mediante Web Speech API (endpoint 404 en backend)',
        };
      }

      const statusMap = {
        400: 'Solicitud inválida o archivo de audio corrupto',
        401: 'No autorizado / credenciales inválidas',
        403: 'Acceso denegado al servicio de voz',
        404: `Endpoint de voz no encontrado (${endpointUsed})`,
        413: 'El archivo de audio supera el límite de tamaño permitido',
        422: 'Error de validación en parámetros de audio o transcripción',
        500: 'Error interno en el servidor de inferencia de voz',
        502: 'Puerta de enlace o servidor de voz no responde',
        503: 'Servicio de inferencia de voz temporalmente fuera de línea',
      };

      const friendlyPrefix = statusMap[status] || `Error HTTP ${status}`;
      const fullError = errorDetail ? `${friendlyPrefix}: ${errorDetail}` : friendlyPrefix;
      throw new Error(`[${status}] ${fullError}`);
    }

    const data = await response.json();

    const transcription =
      data.transcription ||
      data.text ||
      data.transcription_text ||
      liveText ||
      '';

    const detected_species =
      data.detected_species ||
      data.species ||
      inferSpeciesFromText(transcription) ||
      null;

    const extracted_symptoms =
      data.extracted_symptoms ||
      data.symptoms ||
      transcription ||
      '';

    return {
      transcription,
      detected_species,
      extracted_symptoms,
      confidence: data.confidence ?? 0.95,
      raw: data,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[voiceTriageService] Error durante transcripción de voz:', err);

    if (err.name === 'AbortError') {
      throw new Error('La transcripción de voz tardó demasiado tiempo (35s timeout). Por favor intenta de nuevo.');
    }

    const isNetworkError =
      err.message?.includes('Failed to fetch') || err.name === 'TypeError';
    if (isNetworkError) {
      // If we have live transcript despite backend down, rescue user's spoken words
      if (liveText) {
        console.warn(`[voiceTriageService] Error de red en backend. Usando texto en vivo: "${liveText}"`);
        return {
          transcription: liveText,
          detected_species: metadata.currentSpecies || inferSpeciesFromText(liveText) || null,
          extracted_symptoms: liveText,
          fallback: true,
          backendNote: 'Servidor backend no disponible; texto preservado desde el micrófono',
        };
      }

      throw new Error(
        `No se pudo conectar con el servidor backend en ${primaryUrl}. Verifica que esté encendido en http://localhost:8000.`
      );
    }

    throw err;
  }
}

export default {
  sendVoiceTriageAudio,
  inferSpeciesFromText,
  VOICE_API_BASE_URL,
};
