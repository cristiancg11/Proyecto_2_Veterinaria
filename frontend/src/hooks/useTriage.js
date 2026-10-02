import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/ApiClient';

/**
 * Helper to offload image resizing/compression to a dedicated Web Worker.
 * Automatically falls back to original file if Web Worker or OffscreenCanvas is unavailable.
 * @param {File} file
 * @returns {Promise<Blob|File>}
 */
function compressImageWithWorker(file) {
  return new Promise((resolve) => {
    try {
      const worker = new Worker(
        new URL('../workers/imageCompressor.worker.js', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event) => {
        worker.terminate();
        if (event.data?.success && event.data.blob) {
          resolve(event.data.blob);
        } else {
          console.warn('[Worker Fallback] Compression issue:', event.data?.error);
          resolve(file);
        }
      };

      worker.onerror = (error) => {
        worker.terminate();
        console.warn('[Worker Error] Worker execution error, using original file:', error);
        resolve(file);
      };

      worker.postMessage({
        file,
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.82,
      });
    } catch (err) {
      console.warn('[Worker Exception] Failed to initialize worker:', err);
      resolve(file);
    }
  });
}

/**
 * Custom Hook: useTriage
 * Encapsulates the entire medical triage lifecycle, worker compression,
 * API communication, nearby clinics retrieval, and history management.
 */
export function useTriage() {
  const [loading, setLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [currentDiagnosis, setCurrentDiagnosis] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  // Fetch consultation history from Supabase
  const fetchHistory = useCallback(async () => {
    try {
      const records = await apiClient.getHistory(10);
      setHistory(records || []);
    } catch (err) {
      console.warn('[useTriage.fetchHistory] Warning:', err);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /**
   * Submit complete triage inquiry
   */
  const submitTriage = useCallback(
    async ({ file, petType, symptomsDescription, userCoordinates }) => {
      setLoading(true);
      setError(null);

      try {
        // Step 1: Client-Side Concurrency via Web Worker
        setIsCompressing(true);
        const processedImageBlob = await compressImageWithWorker(file);
        setIsCompressing(false);

        // Step 2: Build MultiPart FormData payload
        const formData = new FormData();
        formData.append('image', processedImageBlob, file.name || 'pet_condition.jpg');
        formData.append('pet_type', petType);
        formData.append('symptoms_description', symptomsDescription);

        if (userCoordinates?.lat && userCoordinates?.lng) {
          formData.append('user_lat', userCoordinates.lat.toString());
          formData.append('user_lng', userCoordinates.lng.toString());
        }

        // Step 3: Call Multimodal Diagnosis API
        const diagnosisResult = await apiClient.diagnose(formData);
        setCurrentDiagnosis(diagnosisResult);

        // Step 4: Fetch Nearby Clinics prioritized by urgency
        if (userCoordinates?.lat && userCoordinates?.lng) {
          try {
            const nearbyClinics = await apiClient.getNearbyClinics(
              userCoordinates.lat,
              userCoordinates.lng,
              diagnosisResult.urgency_level
            );
            setClinics(nearbyClinics || []);
          } catch (clinicErr) {
            console.warn('[useTriage] Failed to fetch clinics:', clinicErr);
          }
        }

        // Step 5: Refresh Supabase historical records
        await fetchHistory();
      } catch (err) {
        console.error('[useTriage.submitTriage] Error:', err);
        setError(err.message || 'An unexpected error occurred during triage evaluation.');
      } finally {
        setIsCompressing(false);
        setLoading(false);
      }
    },
    [fetchHistory]
  );

  const resetDiagnosis = useCallback(() => {
    setCurrentDiagnosis(null);
    setClinics([]);
    setError(null);
  }, []);

  return {
    loading,
    isCompressing,
    currentDiagnosis,
    clinics,
    history,
    error,
    submitTriage,
    resetDiagnosis,
    fetchHistory,
  };
}

export default useTriage;
