/**
 * Utilidades de Geolocalización, Distancia y Enlaces Profundos de Mapas para VetIA
 */

/**
 * Genera el enlace directo al punto GPS del paciente o tutor en Google Maps
 * @param {number|string} lat
 * @param {number|string} lng
 * @returns {string} URL de Google Maps para el pin
 */
export function getGoogleMapsLocationUrl(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return 'https://www.google.com/maps';
  }
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * Genera el enlace de navegación guiada origen-destino en Google Maps
 * @param {number|string} originLat
 * @param {number|string} originLng
 * @param {number|string} destLat
 * @param {number|string} destLng
 * @returns {string} URL de ruta en Google Maps
 */
export function getGoogleMapsDirectionsUrl(originLat, originLng, destLat, destLng) {
  if (
    originLat === null ||
    originLat === undefined ||
    originLng === null ||
    originLng === undefined ||
    destLat === null ||
    destLat === undefined ||
    destLng === null ||
    destLng === undefined
  ) {
    return 'https://www.google.com/maps/dir/?api=1';
  }
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}`;
}

/**
 * Fórmula de semiverseno (Haversine) para calcular distancia en kilómetros entre dos coordenadas GPS
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const toRad = (val) => (val * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

export default {
  getGoogleMapsLocationUrl,
  getGoogleMapsDirectionsUrl,
  haversineDistance,
};
