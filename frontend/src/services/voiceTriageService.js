import { API_BASE_URL } from './api';

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
 * Sends a recorded audio blob to the backend voice evaluation endpoint.
 *
 * Primary Endpoint: POST /api/v1/triage/voice-eval
 * Fallback Endpoint: POST /api/v1/voice-eval
 *
 * @param {Blob} audioBlob - Recorded audio blob from MediaRecorder
 * @param {Object} [metadata={}] - Optional context metadata (user_id, hint_species, coordinates)
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

  if (metadata.userId) {
    formData.append('user_id', metadata.userId);
  }
  if (metadata.currentSpecies) {
    formData.append('species_hint', metadata.currentSpecies);
  }

  const primaryUrl = `${API_BASE_URL}/triage/voice-eval`;
  const fallbackUrl = `${API_BASE_URL}/voice-eval`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout for AI audio transcription

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
      // If primary endpoint fails due to network/abort, check fallback
      if (primaryErr.name === 'AbortError') {
        throw new Error('El tiempo de espera para transcribir el audio ha expirado (35s).');
      }
      console.warn(`[voiceTriageService] Falló ${primaryUrl}, reintentando en ${fallbackUrl}`, primaryErr);
      endpointUsed = fallbackUrl;
      response = await fetch(fallbackUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    // If 404 or method not allowed, endpoint may not be implemented on server yet
    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errorMsg =
        errorJson.detail ||
        errorJson.message ||
        `Error del servidor al procesar el audio (${response.status})`;

      // If backend route isn't available yet (404), return helpful friendly fallback
      if (response.status === 404) {
        console.warn(`[voiceTriageService] ${endpointUsed} devolvió 404. Generando respuesta simulada.`);
        return {
          transcription: 'Audio registrado correctamente por el campesino. (El endpoint de IA de voz del backend no está disponible en este momento).',
          detected_species: metadata.currentSpecies || null,
          extracted_symptoms: 'Revisión clínica solicitada por audio de campo.',
          fallback: true,
        };
      }

      throw new Error(errorMsg);
    }

    const data = await response.json();

    const transcription =
      data.transcription || data.text || data.transcription_text || '';
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
      throw new Error('La transcripción de voz tardó demasiado tiempo. Por favor intenta de nuevo.');
    }

    const isNetworkError =
      err.message?.includes('Failed to fetch') || err.name === 'TypeError';
    if (isNetworkError) {
      throw new Error(
        `No se pudo conectar con el servicio de transcripción de voz en ${primaryUrl}. Verifica tu conexión a internet o el estado del servidor.`
      );
    }

    throw err;
  }
}

export default {
  sendVoiceTriageAudio,
  inferSpeciesFromText,
};
