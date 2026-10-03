/**
 * ApiClient Service Class
 * Handles all HTTP REST communication with the FastAPI backend.
 */
export class ApiClient {
  constructor(baseUrl = 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Submit pet condition image and symptoms for multimodal triage evaluation.
   * @param {FormData} formData
   * @returns {Promise<Object>} TriageAssessmentResponse
   */
  async diagnose(formData) {
    try {
      const response = await fetch(`${this.baseUrl}/diagnose`, {
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
      console.error('[ApiClient.diagnose] Error:', error);
      throw error;
    }
  }

  /**
   * Fetch nearby veterinary clinics based on coordinates and urgency.
   * @param {number} lat
   * @param {number} lng
   * @param {string} urgency
   * @returns {Promise<Array>} List of ClinicLocationResponse
   */
  async getNearbyClinics(lat, lng, urgency = 'MODERATE') {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        urgency: urgency,
      });

      const response = await fetch(`${this.baseUrl}/clinics/nearby?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Nearby clinics request failed with status ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('[ApiClient.getNearbyClinics] Error:', error);
      throw error;
    }
  }

  /**
   * Fetch triage records from Supabase database, optionally filtered by authenticated user.
   * @param {number} limit
   * @param {string} [userId]
   * @returns {Promise<Array>} List of TriageRecordDBResponse
   */
  async getHistory(limit = 10, userId = null) {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (userId) {
        params.append('user_id', userId);
      }

      const response = await fetch(`${this.baseUrl}/history?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `History fetch failed with status ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('[ApiClient.getHistory] Error:', error);
      throw error;
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
    try {
      const response = await fetch(`${this.baseUrl}/triage/${triageId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Follow-up chat failed with status ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('[ApiClient.followUpChat] Error:', error);
      throw error;
    }
  }
}

// Export singleton instance as default
export const apiClient = new ApiClient();
export default apiClient;
