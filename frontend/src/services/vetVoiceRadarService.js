/**
 * Servicio de Voz Clínica Táctica y Cálculo de Proximidad VetRadar
 * Utiliza Web Speech Synthesis y fórmulas de geodistancia para guiar al usuario
 * hacia la clínica veterinaria u hospital de urgencias más cercano.
 */

import { haversineDistance } from '../utils/geoDistance';

/**
 * Calcula la distancia en metros y kilómetros entre dos coordenadas GPS
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {{ meters: number, km: number }}
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const km = haversineDistance(lat1, lon1, lat2, lon2);
  const meters = Math.round(km * 1000);
  return { meters, km };
}

/**
 * Encuentra el centro veterinario más cercano a la ubicación del usuario
 * @param {{lat: number, lng: number} | [number, number]} userCoords
 * @param {Array} clinicsList
 * @returns {{ clinic: Object, distanceMeters: number, distanceKm: number } | null}
 */
export function findNearestClinic(userCoords, clinicsList = []) {
  if (!userCoords || !Array.isArray(clinicsList) || clinicsList.length === 0) {
    return null;
  }

  const uLat = Array.isArray(userCoords) ? userCoords[0] : userCoords.lat;
  const uLng = Array.isArray(userCoords) ? userCoords[1] : userCoords.lng;

  if (typeof uLat !== 'number' || typeof uLng !== 'number') {
    return null;
  }

  let nearest = null;
  let minMeters = Infinity;
  let minKm = Infinity;

  for (const clinic of clinicsList) {
    const cLat = clinic.lat !== undefined ? clinic.lat : clinic.coordinates?.[0];
    const cLng = clinic.lng !== undefined ? clinic.lng : clinic.coordinates?.[1];

    if (typeof cLat === 'number' && typeof cLng === 'number') {
      const { meters, km } = calculateDistance(uLat, uLng, cLat, cLng);
      if (meters < minMeters) {
        minMeters = meters;
        minKm = km;
        nearest = clinic;
      }
    }
  }

  if (!nearest) return null;

  return {
    clinic: nearest,
    distanceMeters: minMeters,
    distanceKm: minKm,
  };
}

/**
 * Detiene o silencia cualquier audio en curso del sintetizador de voz
 */
export function cancelVoiceAlert() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Sintetiza y reproduce por altavoz el anuncio táctico de la veterinaria más cercana
 * @param {Object} clinic
 * @param {number | { meters: number }} distance Distancia en metros
 * @param {string} lang 'es' o 'en'
 * @returns {SpeechSynthesisUtterance | null}
 */
export function speakVeterinaryAlert(clinic, distance, lang = 'es') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[vetVoiceRadarService] Web Speech Synthesis API no está disponible en este navegador.');
    return null;
  }

  if (!clinic || !clinic.name) {
    return null;
  }

  // Cancela audios previos en cola
  window.speechSynthesis.cancel();

  const meters = typeof distance === 'number'
    ? Math.round(distance)
    : Math.round(distance?.meters || 0);

  const isEn = lang?.toLowerCase().startsWith('en');

  // Mensajes clínicos requeridos por especificación
  const message = isEn
    ? `Emergency alert: ${clinic.name}, ${meters} meters away. 24-hour trauma unit available.`
    : `Alerta de auxilio: ${clinic.name}, a ${meters} metros de tu ubicación. Quirófano y urgencias disponibles.`;

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = isEn ? 'en-US' : 'es-CO';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Asignar voz natural si está disponible en el navegador
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const targetLang = isEn ? 'en' : 'es';
    const preferredVoice = voices.find((v) =>
      v.lang.toLowerCase().startsWith(targetLang) &&
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Sabina') || v.name.includes('Microsoft'))
    ) || voices.find((v) => v.lang.toLowerCase().startsWith(targetLang));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export default {
  calculateDistance,
  findNearestClinic,
  cancelVoiceAlert,
  speakVeterinaryAlert,
};
