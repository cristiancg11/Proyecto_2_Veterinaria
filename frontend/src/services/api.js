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
 * Send interactive follow-up chat message with clinical triage context.
 * Communicates with POST /chat, with graceful fallback to /triage/:id/chat.
 *
 * @param {Object} params
 * @param {Array<{role: string, content: string}>} params.history - Conversational message history
 * @param {string} params.user_message - User's follow-up inquiry
 * @param {Object} params.triage_context - Evaluated case context (urgency, assessment, tips, etc.)
 * @returns {Promise<{reply: string, timestamp?: string, triage_id?: string}>}
 */
export async function sendChatMessage({
  history = [],
  user_message = '',
  triage_context = {},
}) {
  if (!user_message.trim()) {
    throw new Error('user_message cannot be empty');
  }

  const primaryEndpoint = `${API_BASE_URL}/chat`;
  try {
    // 1. Primary endpoint: /chat
    const response = await fetch(primaryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history,
        user_message,
        triage_context,
      }),
    });

    if (response.ok) {
      return await response.json();
    }

    // 2. Graceful fallback for backend instances exposing /triage/{triage_id}/chat
    const triageId =
      triage_context?.record_id ||
      triage_context?.id ||
      'active-case';

    const fallbackEndpoint = `${API_BASE_URL}/triage/${encodeURIComponent(triageId)}/chat`;
    const fallbackResponse = await fetch(fallbackEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: user_message,
        conversation_history: history,
      }),
    });

    if (!fallbackResponse.ok) {
      const errorData = await fallbackResponse.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Chat request failed with status ${fallbackResponse.status}`
      );
    }

    return await fallbackResponse.json();
  } catch (error) {
    const isNetworkError =
      error.message?.includes('Failed to fetch') || error.name === 'TypeError';
    const friendlyMessage = isNetworkError
      ? `No se pudo conectar con el servicio de chat en ${API_BASE_URL}. Verifica que el servidor backend esté encendido.`
      : error.message;

    console.error(`[sendChatMessage] Error al conectar con ${primaryEndpoint}:`, error);
    throw new Error(friendlyMessage);
  }
}

export default {
  API_BASE_URL,
  sendTriageDiagnosis,
  analyzeTriage,
  sendChatMessage,
};
