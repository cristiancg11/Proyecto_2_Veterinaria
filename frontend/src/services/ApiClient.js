import { sendTriageDiagnosis, sendChatMessage } from './api';

/**
 * ApiClient Service Class
 * Handles all HTTP REST communication with the FastAPI backend.
 */
export class ApiClient {
  constructor(
    baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
      'http://localhost:8000/api/v1'
  ) {
    this.baseUrl = baseUrl;
  }

  /**
   * Submit pet condition image and symptoms for multimodal triage evaluation.
   * @param {FormData} formData
   * @returns {Promise<Object>} TriageAssessmentResponse
   */
  async diagnose(formData) {
    return sendTriageDiagnosis(formData);
  }

  /**
   * Alias for sendTriageDiagnosis
   * @param {FormData} formData
   */
  async sendTriageDiagnosis(formData) {
    return sendTriageDiagnosis(formData);
  }

  /**
   * Fetch nearby veterinary clinics based on coordinates and urgency.
   * @param {number} lat
   * @param {number} lng
   * @param {string} urgency
   * @returns {Promise<Array>} List of ClinicLocationResponse
   */
  async getNearbyClinics(lat, lng, urgency = 'MODERATE') {
    const endpoint = `${this.baseUrl}/clinics/nearby`;
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        urgency: urgency,
      });

      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Nearby clinics request failed with status ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.warn(`[ApiClient.getNearbyClinics] Aviso al conectar con ${endpoint}:`, error.message);
      // Return empty clinics gracefully if backend is offline
      return [];
    }
  }

  /**
   * Fetch triage records from Supabase database, optionally filtered by authenticated user.
   * @param {number} limit
   * @param {string} [userId]
   * @returns {Promise<Array>} List of TriageRecordDBResponse
   */
  async getHistory(limit = 10, userId = null) {
    const endpoint = `${this.baseUrl}/history`;
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (userId) {
        params.append('user_id', userId);
      }

      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `History fetch failed with status ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.warn(`[ApiClient.getHistory] Aviso al conectar con ${endpoint}:`, error.message);
      return [];
    }
  }

  /**
   * Send follow-up contextual inquiry for an evaluated triage case.
   * @param {string} triageId
   * @param {string} message
   * @param {Array} conversationHistory
   * @returns {Promise<Object>} { reply, timestamp, triage_id }
   */
  async followUpChat(triageId, message, conversationHistory = []) {
    return sendChatMessage({
      history: conversationHistory,
      user_message: message,
      triage_context: { record_id: triageId, id: triageId },
    });
  }

  /**
   * Send chat message with full triage context
   * @param {Object} params
   */
  async sendChatMessage({ history, user_message, triage_context }) {
    return sendChatMessage({ history, user_message, triage_context });
  }
}

// Export singleton instance as default
export const apiClient = new ApiClient();
export { sendTriageDiagnosis, sendChatMessage };
export default apiClient;
