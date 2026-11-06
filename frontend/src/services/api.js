/**
 * VetIA API Service
 * Handles HTTP REST communication for multimodal veterinary triage and interactive follow-up chat.
 */

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://localhost:8000/api/v1';

/**
 * Submit pet condition image and symptoms for multimodal triage evaluation.
 * Sends multipart form data to POST /diagnose.
 *
 * @param {FormData} formData - Multipart form data containing image, pet_type, symptoms_description, user coordinates, etc.
 * @returns {Promise<Object>} Structured triage assessment response
 */
export async function sendTriageDiagnosis(formData) {
  const endpoint = `${API_BASE_URL}/diagnose`;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Diagnosis request failed with status ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    const isNetworkError =
      error.message?.includes('Failed to fetch') || error.name === 'TypeError';
    const friendlyMessage = isNetworkError
      ? `No se pudo conectar con el servidor backend en ${endpoint}. Verifica que el servidor FastAPI esté encendido en http://localhost:8000.`
      : error.message;

    console.error(`[sendTriageDiagnosis] Error al conectar con ${endpoint}:`, error);
    throw new Error(friendlyMessage);
  }
}

/**
 * Submit pet condition image, species, weight and symptoms for multimodal triage analysis.
 * Sends multipart form data to POST /triage/analyze with fallback to /diagnose.
 *
 * @param {FormData} formData
 * @returns {Promise<Object>} TriageAnalysisResponse
 */
export async function analyzeTriage(formData) {
  const primaryEndpoint = `${API_BASE_URL}/triage/analyze`;
  try {
    const response = await fetch(primaryEndpoint, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      return await response.json();
    }

    // Graceful fallback to /diagnose if /triage/analyze returned 404
    if (response.status === 404) {
      const fallbackEndpoint = `${API_BASE_URL}/diagnose`;
      const fallbackResponse = await fetch(fallbackEndpoint, {
        method: 'POST',
        body: formData,
      });
      if (fallbackResponse.ok) {
        return await fallbackResponse.json();
      }
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Triage analyze failed with status ${response.status}`
    );
  } catch (error) {
    const isNetworkError =
      error.message?.includes('Failed to fetch') || error.name === 'TypeError';
    const friendlyMessage = isNetworkError
      ? `No se pudo conectar con el servidor backend en ${primaryEndpoint}. Verifica que el servidor FastAPI esté encendido en http://localhost:8000.`
      : error.message;

    console.error(`[analyzeTriage] Error al conectar con ${primaryEndpoint}:`, error);
    throw new Error(friendlyMessage);
  }
}

/**
 * Rutina de rescate que entrega pautas básicas de estabilización médica según la especie
 * en caso de caídas de conexión o fallos en el servicio de chat IA.
 */
export function getFirstAidSpeciesFallback(species = '', userMessage = '') {
  const norm = String(species).toLowerCase();

  let advice = '';
  if (norm.includes('bovino') || norm.includes('vaca') || norm.includes('toro') || norm.includes('ternero')) {
    advice =
      "1. Si hay sospecha de timpanismo ruminal: mantén al animal de pie o con el pecho elevado (postura esternal). No permitas que se eche sobre el flanco izquierdo.\n" +
      "2. En heridas o cortes: lava con abundante agua limpia o suero fisiológico, aplica presión directa con gasa limpia y evita remedios caseros abrasivos.\n" +
      "3. Hidratación: en terneros lactantes con diarrea, ofrece suero oral con sales rehidratantes en tomas tibias y pequeñas.\n" +
      "4. Prohibición estricta: NO suministres analgésicos de consumo humano como ibuprofeno o paracetamol (altamente tóxicos para rumiantes).";
  } else if (norm.includes('equino') || norm.includes('caballo') || norm.includes('mula') || norm.includes('asno')) {
    advice =
      "1. Ante sospecha de cólico o dolor abdominal: retira de inmediato agua y forraje. Camina al caballo a paso suave y no dejes que se revuelque bruscamente para prevenir torsión de colon.\n" +
      "2. En hemorragias por alambre o clavos: aplica compresión directa sostenida con vendaje limpio y mantén la calma.\n" +
      "3. Evita la automedicación con antiinflamatorios potentes antes de que el veterinario tome signos vitales, pues enmascara la gravedad del cólico.\n" +
      "4. Facilita ventilación continua y abrigo en clima frío mientras te trasladas.";
  } else if (norm.includes('porcino') || norm.includes('cerdo') || norm.includes('lech')) {
    advice =
      "1. En caso de fiebre o estrés calórico: proporciona sombra, rocía con agua fresca las patas y el suelo, nunca directamente agua helada en la cabeza.\n" +
      "2. Diarrea en lechones: aísla en corral seco y templado, suministra soluciones electrolíticas tibias y cama seca.\n" +
      "3. Problemas respiratorios: maximiza la ventilación del galpón y reduce el polvo del alimento.";
  } else if (norm.includes('ovino') || norm.includes('caprino') || norm.includes('cabra') || norm.includes('oveja')) {
    advice =
      "1. Si observas mucosas conjuntivales pálidas (anemia severa): mantén al animal en reposo absoluto, sin estrés ni arreos forzados.\n" +
      "2. En miasis o gusaneras: limpia cuidadosamente la zona con agua hervida tibia, retira restos de lana húmeda y cubre con gasa limpia.\n" +
      "3. En timpanismo: coloca un bocado de madera suave en la boca para inducir salivación y eructo.";
  } else if (norm.includes('aves') || norm.includes('gallina') || norm.includes('pollo')) {
    advice =
      "1. Aísla de inmediato al ejemplar afectado en una caja o jaula individual con calefacción moderada y cama seca.\n" +
      "2. Ofrece agua fresca con electrolitos o azúcar diluida con gotero en la comisura del pico si puede tragar.\n" +
      "3. Desinfecta bebederos y comederos del lote para evitar contagios rápidos.";
  } else if (norm.includes('cuy') || norm.includes('conejo')) {
    advice =
      "1. En timpanismo por forraje mojado: suspende el forraje verde, suministra heno seco y realiza masajes suaves y circulares en el vientre.\n" +
      "2. Mantén temperatura tibia y evita corrientes de aire directas (la hipotermia en cuyes es fatal en pocas horas).\n" +
      "3. Rehidrata con gotas de suero oral tibio en jeringa sin aguja.";
  } else {
    // Caninos, Felinos o general
    advice =
      "1. Mantén al animal en reposo sobre una superficie acolchada y en posición lateral con el cuello extendido para favorecer la vía aérea.\n" +
      "2. En heridas sangrantes: comprime directamente con un apósito o paño limpio de 3 a 5 minutos ininterrumpidos.\n" +
      "3. Si sospechas intoxicación o envenenamiento: NO induzcas el vómito sin saber la sustancia (puede causar quemaduras esofágicas).\n" +
      "4. Prohibido dar medicamentos de uso humano (acetaminofén e ibuprofeno causan fallas letales).";
  }

  return (
    `ℹ️ *PAUTAS INMEDIATAS DE ESTABILIZACIÓN VETIA (${species || 'Paciente'}):*\n\n` +
    advice +
    `\n\n📌 *Nota:* Respuesta de contingencia médica inmediata entregada automáticamente mientras se restablece la conexión completa con el asistente en la nube.`
  );
}

/**
 * Send interactive follow-up chat message with clinical triage context.
 * Communicates with POST /triage/chat, with graceful fallback to /chat.
 *
 * @param {Object} params
 * @param {Array<{role: string, content: string}>} params.history - Conversational message history
 * @param {string} params.user_message - User's follow-up inquiry
 * @param {Object} params.triage_context - Evaluated case context (urgency, assessment, tips, etc.)
 * @param {string} [params.triage_id] - Supabase triage_records record ID
 * @param {AbortSignal} [params.signal] - AbortController signal
 * @returns {Promise<{reply: string, timestamp?: string, triage_id?: string, is_fallback?: boolean}>}
 */
export async function sendChatMessage({
  history = [],
  user_message = '',
  triage_context = {},
  triage_id = null,
  signal = null,
}) {
  if (!user_message.trim()) {
    throw new Error('user_message cannot be empty');
  }

  const triageId =
    triage_id ||
    triage_context?.record_id ||
    triage_context?.id ||
    'active-case';

  // 1. Primary endpoint: /triage/chat
  const primaryEndpoint = `${API_BASE_URL}/triage/chat`;
  try {
    const response = await fetch(primaryEndpoint, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: user_message,
        triage_id: triageId,
        conversation_history: history,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.reply || data?.message) return data;
    }

    // 2. Graceful fallback: /chat
    if (response.status === 404 || !response.ok) {
      const fallbackEndpoint = `${API_BASE_URL}/chat`;
      const fallbackResponse = await fetch(fallbackEndpoint, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history,
          user_message,
          triage_context,
        }),
      });

      if (fallbackResponse.ok) {
        const fbData = await fallbackResponse.json();
        if (fbData?.reply || fbData?.message) return fbData;
      }
    }

    throw new Error(`Chat backend returned status ${response.status}`);
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    console.warn(`[sendChatMessage] Fallo de backend (${error.message}). Activando pautas de estabilización médica de rescate.`);
    const species = triage_context?.species || triage_context?.pet_type || '';
    const fallbackText = getFirstAidSpeciesFallback(species, user_message);

    return {
      reply: fallbackText,
      is_fallback: true,
      triage_id: triageId,
      timestamp: new Date().toISOString(),
    };
  }
}

export default {
  API_BASE_URL,
  sendTriageDiagnosis,
  analyzeTriage,
  sendChatMessage,
};
