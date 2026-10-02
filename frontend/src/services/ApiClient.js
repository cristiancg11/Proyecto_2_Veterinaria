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
   * Fetch the last triage records saved in Supabase database.
   * @param {number} limit
   * @returns {Promise<Array>} List of TriageRecordDBResponse
   */
  async getHistory(limit = 10) {
    try {
      const response = await fetch(`${this.baseUrl}/history?limit=${limit}`);
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
}

// Export singleton instance as default
export const apiClient = new ApiClient();
export default apiClient;
