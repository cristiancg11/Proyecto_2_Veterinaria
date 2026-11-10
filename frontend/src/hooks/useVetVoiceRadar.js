import { useState, useEffect, useRef, useCallback } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import {
  findNearestClinic,
  speakVeterinaryAlert,
  cancelVoiceAlert,
} from '../services/vetVoiceRadarService';

/**
 * Hook React reactivo para el sistema táctico VetRadar Voice
 * Monitorea las coordenadas GPS en tiempo real y sintetiza alertas de audio
 * en el idioma activo del usuario hacia el centro veterinario más próximo.
 *
 * @param {Array} clinics Lista de clínicas o almacenes veterinarios
 * @param {[number, number] | {lat: number, lng: number}} defaultCoords Coordenadas de respaldo
 * @returns {Object} Controles y estado reactivo del radar por voz
 */
export function useVetVoiceRadar(clinics = [], defaultCoords = null) {
  const { language } = usePreferences();
  const [isRadarActive, setIsRadarActive] = useState(false);
  const [nearestClinic, setNearestClinic] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [liveCoords, setLiveCoords] = useState(() => defaultCoords || [1.2136, -77.2811]);

  // Referencias para evitar repeticiones en bucle y manejar el observador GPS
  const lastAnnouncedIdRef = useRef(null);
  const lastAnnouncedDistanceRef = useRef(null);
  const watchIdRef = useRef(null);
  const isSpeakingRef = useRef(false);

  // Sincronizar coordenadas por defecto si cambian
  useEffect(() => {
    if (defaultCoords) {
      setLiveCoords(defaultCoords);
    }
  }, [defaultCoords]);

  // Función para evaluar y reproducir anuncio si corresponde
  const triggerVoiceAnnouncement = useCallback(
    (coords, force = false) => {
      if (!coords || !clinics || clinics.length === 0) return;

      const nearest = findNearestClinic(coords, clinics);
      if (!nearest) return;

      setNearestClinic(nearest.clinic);
      setDistanceMeters(nearest.distanceMeters);
      setDistanceKm(nearest.distanceKm);

      const clinicId = nearest.clinic.id || nearest.clinic.name;
      const lastId = lastAnnouncedIdRef.current;
      const lastDist = lastAnnouncedDistanceRef.current;

      // Condiciones para anunciar: forzado, cambio de clínica o desplazamiento > 250m
      const shouldAnnounce =
        force ||
        lastId !== clinicId ||
        lastDist === null ||
        Math.abs(lastDist - nearest.distanceMeters) >= 250;

      if (shouldAnnounce) {
        lastAnnouncedIdRef.current = clinicId;
        lastAnnouncedDistanceRef.current = nearest.distanceMeters;
        isSpeakingRef.current = true;

        const utterance = speakVeterinaryAlert(nearest.clinic, nearest.distanceMeters, language);
        if (utterance) {
          utterance.onend = () => {
            isSpeakingRef.current = false;
          };
          utterance.onerror = () => {
            isSpeakingRef.current = false;
          };
        }
      }
    },
    [clinics, language]
  );

  // Iniciar radar
  const startRadar = useCallback(() => {
    setIsRadarActive(true);
    // Anuncio inmediato con las coordenadas actuales
    triggerVoiceAnnouncement(liveCoords, true);
  }, [liveCoords, triggerVoiceAnnouncement]);

  // Detener radar
  const stopRadar = useCallback(() => {
    setIsRadarActive(false);
    cancelVoiceAlert();
    lastAnnouncedIdRef.current = null;
    lastAnnouncedDistanceRef.current = null;
    isSpeakingRef.current = false;

    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Alternar radar
  const toggleRadar = useCallback(() => {
    if (isRadarActive) {
      stopRadar();
    } else {
      startRadar();
    }
  }, [isRadarActive, startRadar, stopRadar]);

  // Anuncio manual bajo demanda
  const announceNow = useCallback(
    (targetClinic = null) => {
      const clinicToAnnounce = targetClinic || nearestClinic;
      if (clinicToAnnounce) {
        const dist = distanceMeters || 100;
        lastAnnouncedIdRef.current = clinicToAnnounce.id || clinicToAnnounce.name;
        lastAnnouncedDistanceRef.current = dist;
        speakVeterinaryAlert(clinicToAnnounce, dist, language);
      } else {
        triggerVoiceAnnouncement(liveCoords, true);
      }
    },
    [distanceMeters, language, liveCoords, nearestClinic, triggerVoiceAnnouncement]
  );

  // Efecto que activa o desactiva el observador GPS continuo cuando el radar está activo
  useEffect(() => {
    if (!isRadarActive) return;

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newCoords = [lat, lng];
          setLiveCoords(newCoords);
          triggerVoiceAnnouncement(newCoords, false);
        },
        (err) => {
          console.warn('[useVetVoiceRadar] Advertencia de geolocalización:', err.message);
          // Fallback con coordenadas existentes
          triggerVoiceAnnouncement(liveCoords, false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    } else {
      triggerVoiceAnnouncement(liveCoords, true);
    }

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isRadarActive, liveCoords, triggerVoiceAnnouncement]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      cancelVoiceAlert();
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isRadarActive,
    toggleRadar,
    startRadar,
    stopRadar,
    nearestClinic,
    distanceMeters,
    distanceKm,
    liveCoords,
    announceNow,
    cancelVoice: cancelVoiceAlert,
  };
}

export default useVetVoiceRadar;
