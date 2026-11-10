import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { translations } from '../data/translations';
import {
  getGoogleMapsLocationUrl,
  getGoogleMapsDirectionsUrl,
} from '../utils/geoDistance';
import {
  Phone,
  Navigation,
  Clock,
  MapPin,
  Compass,
  Crosshair,
  LocateFixed,
  ExternalLink,
  Car,
  CornerUpRight,
  CornerUpLeft,
  MoveUp,
  Flag,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * Haversine formula (semiverseno) to calculate distance between GPS coordinates in km
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
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

/**
 * Custom SVG DivIcon for the pulsating user location (Google Maps style animated radar)
 */
function createUserPulseIcon(gpsActive = false) {
  return L.divIcon({
    className: 'custom-user-pulse-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.22);
          animation: radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: absolute;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.35);
          animation: pulse-ring 2s infinite ease-in-out;
        "></div>
        <div style="
          position: relative;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2563eb;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.6), 0 0 14px rgba(37, 99, 235, 0.4);
        ">
          ${gpsActive ? '<span style="position: absolute; top: -3px; right: -3px; width: 7px; height: 7px; border-radius: 50%; background: #06b6d4; border: 1.5px solid #fff;"></span>' : ''}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

/**
 * Custom SVG DivIcon for emergency & general veterinary clinics & agricultural supply stores
 */
function createClinicIcon(isEmergency, isSelected = false, isStore = false) {
  const bgColor = isStore ? '#06b6d4' : isEmergency ? '#ef4444' : '#2563eb';
  const badgeBorder = isSelected ? '3px solid #f59e0b' : '2px solid #ffffff';
  const shadow = isSelected
    ? '0 0 14px rgba(245, 158, 11, 0.85), 0 3px 8px rgba(0,0,0,0.4)'
    : '0 3px 6px rgba(0,0,0,0.3)';
  const iconSymbol = isStore ? '🌾' : '+';

  return L.divIcon({
    className: 'custom-clinic-marker',
    html: `
      <div style="
        background: ${bgColor};
        color: white;
        width: ${isSelected ? '38px' : '32px'};
        height: ${isSelected ? '38px' : '32px'};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: ${badgeBorder};
        box-shadow: ${shadow};
      ">
        <span style="transform: rotate(45deg); font-weight: 900; font-size: ${isSelected ? '16px' : '14px'};">${iconSymbol}</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
}

/**
 * Helper component to re-center Leaflet view smoothly
 */
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

/**
 * Helper component to isolate scroll & wheel zoom within Leaflet container
 */
function MapScrollIsolation() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;
    L.DomEvent.disableScrollPropagation(container);
    const stopScroll = (e) => {
      e.stopPropagation();
    };
    container.addEventListener('wheel', stopScroll, { passive: true });
    container.addEventListener('touchmove', stopScroll, { passive: true });
    return () => {
      container.removeEventListener('wheel', stopScroll);
      container.removeEventListener('touchmove', stopScroll);
    };
  }, [map]);
  return null;
}

/**
 * Helper component to connect Leaflet map instance to external mapRef
 * Safely cleans up the reference upon unmounting to prevent memory leaks and container reuse errors
 */
function MapController({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    if (mapRef) {
      mapRef.current = map;
    }
    return () => {
      if (mapRef) {
        mapRef.current = null;
      }
    };
  }, [map, mapRef]);
  return null;
}

// Emergency Veterinary Clinics & Agricultural Supply Stores (Almacenes Agropecuarios)
const CLINIC_PRESETS = [
  {
    id: 'vet-urg-01',
    name: 'Hospital Veterinario de Urgencias 24H y Grandes Animales San Juan',
    category: 'Hospital de Urgencias Pecuarias',
    address: 'Vía Principal km 4, Sector Agropecuario Norte',
    phone: '+57 300 123 4567',
    hours: 'Abierto 24 Horas / Quirófano Bovinos & Equinos',
    isEmergency: true,
    isStore: false,
    dLat: 0.0085,
    dLng: -0.0075,
  },
  {
    id: 'vet-urg-02',
    name: "Almacén Agropecuario & Farmacia Veterinaria CampoSur",
    category: 'Almacén Agropecuario & Fármacos',
    address: 'Carrera 12 #45-30, Parque Central Agropecuario',
    phone: '+57 311 987 6543',
    hours: 'Lun - Dom: 6:00 AM - 9:00 PM / Sueros, Fármacos y Botiquín',
    isEmergency: false,
    isStore: true,
    dLat: -0.0050,
    dLng: 0.0065,
  },
  {
    id: 'vet-urg-03',
    name: "Centro Quirúrgico y Traumatología Animal 'La Cruz'",
    category: 'Clínica Quirúrgica de Urgencias',
    address: 'Calle 68 #22-80, Zona Médica Veterinaria',
    phone: '+57 311 555 4321',
    hours: 'Abierto 24 Horas / Cirugía de Emergencia',
    isEmergency: true,
    isStore: false,
    dLat: -0.0110,
    dLng: 0.0088,
  },
  {
    id: 'vet-urg-04',
    name: 'Distribuidora Agropecuaria & Botiquín Ganadero Central',
    category: 'Almacén de Insumos Agropecuarios',
    address: 'Transversal 23 #97-15, Sector Ferias Ganaderas',
    phone: '+57 301 555 9911',
    hours: 'Lun - Sáb: 6:30 AM - 7:30 PM / Electrolitos y Material de Campo',
    isEmergency: false,
    isStore: true,
    dLat: 0.0062,
    dLng: 0.0105,
  },
  {
    id: 'vet-urg-05',
    name: 'Hospital Clínico VET-SOS Emergencias 24/7 (Rumiantes y Menores)',
    category: 'Hospital Clínico Integral 24H',
    address: 'Avenida Ganadera #15-80, Vía Alterna',
    phone: '+57 315 456 7890',
    hours: 'Abierto 24 Horas / Cuidados Críticos y Laboratorio de Campo',
    isEmergency: true,
    isStore: false,
    dLat: 0.0038,
    dLng: -0.0048,
  },
  {
    id: 'vet-urg-06',
    name: 'Agroveterinaria & Servicios Zootécnicos del Oriente',
    category: 'Asistencia Técnica y Farmacia',
    address: 'Diagonal 40 #19-45, Vereda El Progreso',
    phone: '+57 320 654 3210',
    hours: 'Lun - Sáb: 7:00 AM - 6:00 PM / Asistencia Técnica y Fármacos',
    isEmergency: false,
    isStore: true,
    dLat: -0.0078,
    dLng: -0.0102,
  },
];

// Fallback GPS coordinate (Bogotá, Colombia)
const FALLBACK_LOCATION = { lat: 4.6533, lng: -74.0836 };

/**
 * Format OSRM maneuver step into friendly Spanish instructions
 */
function formatStepInstruction(step, index, total) {
  const type = step.maneuver?.type;
  const modifier = step.maneuver?.modifier;
  const street = step.name || 'la vía principal';
  const distM = Math.round(step.distance || 0);

  if (type === 'depart' || index === 0) {
    return {
      icon: 'depart',
      text: `Inicia la marcha saliendo por ${street}`,
      distance: distM > 0 ? `${distM} m` : '',
    };
  }

  if (type === 'arrive' || index === total - 1) {
    return {
      icon: 'arrive',
      text: `Llegada a la clínica veterinaria de destino`,
      distance: '',
    };
  }

  if (type === 'turn') {
    if (modifier?.includes('left')) {
      return {
        icon: 'left',
        text: `Gira a la izquierda hacia ${street}`,
        distance: `${distM} m`,
      };
    }
    if (modifier?.includes('right')) {
      return {
        icon: 'right',
        text: `Gira a la derecha hacia ${street}`,
        distance: `${distM} m`,
      };
    }
    return {
      icon: 'straight',
      text: `Continúa recto por ${street}`,
      distance: `${distM} m`,
    };
  }

  if (type === 'roundabout') {
    return {
      icon: 'right',
      text: `En la rotonda toma la salida hacia ${street}`,
      distance: `${distM} m`,
    };
  }

  return {
    icon: 'straight',
    text: `Avanza por ${street}`,
    distance: `${distM} m`,
  };
}

export function EmergencyMap({
  externalUserLocation = null,
  urgencyLevel = 'MODERATE',
  onBackToTriage = null,
  triageData = null,
}) {
  const { language } = usePreferences();
  const t = translations[language] || translations.es;
  const { user, userProfile: authProfile, tutorPhone: authTutorPhone } = useAuth();
  const tutorPhone = triageData?.tutor_phone || authTutorPhone || authProfile?.phone || user?.user_metadata?.phone || '';
  const userProfile = useMemo(
    () => ({
      full_name: authProfile?.full_name || user?.user_metadata?.full_name || 'Tutor registrado',
      phone: tutorPhone || 'No registrado',
    }),
    [authProfile, user, tutorPhone]
  );

  const triage = useMemo(
    () => ({
      species: triageData?.species || triageData?.pet_type || 'Paciente Animal',
      weight_kg: triageData?.weight_kg || triageData?.peso_kg || 'N/R',
      urgency_level: triageData?.urgency_level || urgencyLevel || 'MODERADO',
      description: triageData?.description || triageData?.symptoms_description || 'Evaluación de urgencia en camino',
    }),
    [triageData, urgencyLevel]
  );

  const initialCoords = useMemo(() => {
    if (externalUserLocation) {
      return Array.isArray(externalUserLocation)
        ? externalUserLocation
        : [externalUserLocation.lat, externalUserLocation.lng];
    }
    return [FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng];
  }, [externalUserLocation]);

  const [userLocation, setUserLocation] = useState(initialCoords);
  const [gpsActive, setGpsActive] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const userLat = Array.isArray(userLocation) ? userLocation[0] : (userLocation?.lat ?? FALLBACK_LOCATION.lat);
  const userLng = Array.isArray(userLocation) ? userLocation[1] : (userLocation?.lng ?? FALLBACK_LOCATION.lng);
  const userCoords = useMemo(() => [userLat, userLng], [userLat, userLng]);

  // Selected clinic for Turn-by-Turn navigation
  const [selectedClinicId, setSelectedClinicId] = useState(null);

  // Routing State
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDurationMin, setRouteDurationMin] = useState(null);
  const [routeDistanceKm, setRouteDistanceKm] = useState(null);
  const [routeSteps, setRouteSteps] = useState([]);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);
  const [showWaPreview, setShowWaPreview] = useState(false);

  // Map reference to access Leaflet map instance directly
  const mapRef = useRef(null);

  // Rastreo GPS continuo en tiempo real de alta precisión (watchPosition + getCurrentPosition)
  const startLiveTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      alert('Tu navegador no soporta geolocalización GPS.');
      setGeoError('Tu navegador no soporta geolocalización GPS.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    // 1. Lectura inmediata
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setGpsActive(true);
        setGeoLoading(false);
        setGeoError(null);
        if (mapRef.current) {
          if (typeof mapRef.current.flyTo === 'function') {
            mapRef.current.flyTo(coords, 15, { animate: true, duration: 1.5 });
          } else if (typeof mapRef.current.setView === 'function') {
            mapRef.current.setView(coords, 15);
          }
        }
      },
      (err) => {
        console.warn('GPS error:', err.message, 'code:', err.code);
        let errorMsg = 'GPS no disponible en tiempo real. Usando coordenadas urbanas de referencia.';
        if (err.code === 1) {
          errorMsg = 'Permiso de ubicación denegado. Habilita el GPS en la configuración del navegador para rastreo en vivo.';
        } else if (err.code === 2) {
          errorMsg = 'Sin señal satelital directa o satélites fuera de alcance en esta zona rural. Manteniendo coordenadas de referencia.';
        } else if (err.code === 3) {
          errorMsg = 'Tiempo de espera de señal GPS agotado. Reintentando sincronización con antenas de red...';
        }
        setGeoError(errorMsg);
        setGeoLoading(false);
      },
      geoOptions
    );

    // 2. Rastreo activo continuo (watchPosition)
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setGpsActive(true);
      },
      (err) => {
        console.warn('Watch GPS error:', err.message, 'code:', err.code);
        if (err.code === 2) {
          // Satélites no disponibles momentáneamente en área rural
          setGpsActive(false);
        }
      },
      geoOptions
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const clearWatch = startLiveTracking();
    return () => {
      if (typeof clearWatch === 'function') {
        clearWatch();
      }
    };
  }, [startLiveTracking]);

  const handleGpsSync = () => {
    startLiveTracking();
  };

  // Calculate dynamic coordinates for clinics relative to the user position
  // and compute distance via Haversine formula
  const clinicsWithDistance = useMemo(() => {
    return CLINIC_PRESETS.map((clinic) => {
      const clinicLat = parseFloat((userLat + clinic.dLat).toFixed(6));
      const clinicLng = parseFloat((userLng + clinic.dLng).toFixed(6));
      const distance = haversineDistance(userLat, userLng, clinicLat, clinicLng);

      return {
        ...clinic,
        lat: clinicLat,
        lng: clinicLng,
        distanceKm: distance,
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userLat, userLng]);

  // Default to nearest clinic if not selected
  const activeClinic = useMemo(() => {
    if (selectedClinicId) {
      const found = clinicsWithDistance.find((c) => c.id === selectedClinicId);
      if (found) return found;
    }
    return clinicsWithDistance[0];
  }, [selectedClinicId, clinicsWithDistance]);

  // Fetch real-time OSRM driving route with turn-by-turn steps
  useEffect(() => {
    if (!activeClinic || !userCoords) return;

    let isMounted = true;
    const controller = new AbortController();

    async function fetchOsrmRoute() {
      setIsRoutingLoading(true);

      const clinicLat = activeClinic.lat;
      const clinicLng = activeClinic.lng;

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${clinicLng},${clinicLat}?overview=full&geometries=geojson&steps=true`;

      try {
        const response = await fetch(osrmUrl, {
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.routes && data.routes[0]) {
            const bestRoute = data.routes[0];
            const coords = bestRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            const distKm = (bestRoute.distance / 1000).toFixed(1);
            const durationMin = Math.max(1, Math.round(bestRoute.duration / 60));

            const rawSteps = bestRoute.legs?.[0]?.steps || [];
            const formatted = rawSteps.map((step, idx) =>
              formatStepInstruction(step, idx, rawSteps.length)
            );

            if (isMounted) {
              setRouteCoordinates(coords);
              setRouteDistanceKm(distKm);
              setRouteDurationMin(durationMin);
              setRouteSteps(formatted);
              setIsRoutingLoading(false);
              return;
            }
          }
        }
        throw new Error('OSRM routing response failed or empty');
      } catch (err) {
        if (err.name === 'AbortError') return;

        // Fallback calculations with Haversine formula
        if (isMounted) {
          const distKm = haversineDistance(userLat, userLng, clinicLat, clinicLng);
          const estMin = Math.max(3, Math.round((distKm / 35) * 60)); // ~35 km/h urban speed

          setRouteCoordinates([
            [userLat, userLng],
            [clinicLat, clinicLng],
          ]);
          setRouteDistanceKm(distKm.toFixed(1));
          setRouteDurationMin(estMin);
          setRouteSteps([
            {
              icon: 'depart',
              text: 'Inicia el recorrido desde tu ubicación actual',
              distance: '100 m',
            },
            {
              icon: 'straight',
              text: `Avanza por el corredor principal hacia ${activeClinic.address}`,
              distance: `${(distKm * 0.7).toFixed(1)} km`,
            },
            {
              icon: 'right',
              text: `Gira hacia la entrada de ${activeClinic.name}`,
              distance: '200 m',
            },
            {
              icon: 'arrive',
              text: `Llegada a ${activeClinic.name}`,
              distance: '',
            },
          ]);
          setIsRoutingLoading(false);
        }
      }
    }

    fetchOsrmRoute();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activeClinic, userCoords, userLat, userLng]);

  // Helper para generar el texto del mensaje estructurado de WhatsApp con coordenadas GPS vivas
  const getWhatsAppMessageText = useCallback(
    (clinic) => {
      if (!clinic) return '';

      const uLat = Array.isArray(userLocation) ? userLocation[0] : (userLocation?.lat ?? userLat);
      const uLng = Array.isArray(userLocation) ? userLocation[1] : (userLocation?.lng ?? userLng);
      const distanceKm = clinic.distanceKm !== undefined ? clinic.distanceKm : haversineDistance(uLat, uLng, clinic.lat, clinic.lng);

      const patientLocationUrl = getGoogleMapsLocationUrl(uLat, uLng);
      const navigationRouteUrl = getGoogleMapsDirectionsUrl(uLat, uLng, clinic.lat, clinic.lng);

      const isGpsPending = geoLoading || (!gpsActive && !externalUserLocation);
      const gpsLocationSnippet = isGpsPending
        ? "📍 Coordenadas: Obteniendo señal GPS... (" + patientLocationUrl + ")"
        : "📍 Ubicación actual del paciente (GPS): " + patientLocationUrl;

      return (
        "🚨 *URGENCIA VETIA - PRE-INGRESO EN CAMINO* 🚨\n\n" +
        `🐾 Paciente: ${triage.species} (${triage.weight_kg} kg)\n` +
        `⚠️ Nivel: ${triage.urgency_level}\n` +
        `📋 Síntomas: ${triage.description}\n` +
        `👤 Tutor: ${userProfile.full_name || 'Tutor registrado'}\n` +
        "📞 Teléfono de contacto del tutor: " + (tutorPhone || "No registrado") + "\n\n" +
        gpsLocationSnippet + "\n" +
        "🏥 Veterinaria de destino: " + clinic.name + " (" + distanceKm + " km)\n" +
        "🗺️ Ruta de navegación hacia la clínica: " + navigationRouteUrl + "\n\n" +
        "📍 Voy en camino hacia su sede."
      );
    },
    [triage, userProfile, tutorPhone, userLocation, userLat, userLng, geoLoading, gpsActive, externalUserLocation]
  );

  // URLs for navigation and structured WhatsApp dispatch
  const getWhatsAppLink = useCallback(
    (clinic) => {
      const message = getWhatsAppMessageText(clinic);
      const encodedMsg = encodeURIComponent(message);

      // Si no hay clínica o no tiene teléfono registrado en base de datos,
      // usar el intent genérico nativo de WhatsApp para elegir contacto de la agenda
      if (!clinic || !clinic.phone) {
        return `https://api.whatsapp.com/send?text=${encodedMsg}`;
      }

      const cleanPhone = String(clinic.phone).replace(/[^0-9]/g, '');
      if (!cleanPhone || cleanPhone.length < 7) {
        return `https://api.whatsapp.com/send?text=${encodedMsg}`;
      }

      // Teléfono verificado con prefijo de Colombia (57)
      const waPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone.replace(/^0+/, '')}`;
      return `https://wa.me/${waPhone}?text=${encodedMsg}`;
    },
    [getWhatsAppMessageText]
  );

  const getGoogleMapsLink = useCallback(
    (clinic) => {
      if (!clinic) return '#';
      return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${clinic.lat},${clinic.lng}`;
    },
    [userLat, userLng]
  );

  const getWazeLink = useCallback(
    (clinic) => {
      if (!clinic) return '#';
      return `https://waze.com/ul?ll=${clinic.lat},${clinic.lng}&navigate=yes`;
    },
    []
  );

  const googleMapsUrl = activeClinic ? getGoogleMapsLink(activeClinic) : '#';
  const wazeUrl = activeClinic ? getWazeLink(activeClinic) : '#';
  const activeWhatsAppUrl = activeClinic ? getWhatsAppLink(activeClinic) : '#';
  const activeWhatsAppMessageText = activeClinic ? getWhatsAppMessageText(activeClinic) : '';

  const userIcon = createUserPulseIcon(gpsActive);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="backdrop-blur-md bg-slate-900/70 rounded-3xl p-6 border border-slate-700/50 shadow-xl shadow-indigo-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[#176B55] dark:text-[#45A987] text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4 animate-spin-slow" />
            <span>{t.guided_nav}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#123B32] dark:text-white tracking-tight">
            {t.map_title}
          </h2>
          <p className="text-xs sm:text-sm text-[#66756F] dark:text-[#A3B8B0]">
            {t.map_subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onBackToTriage && (
            <button
              type="button"
              onClick={onBackToTriage}
              className="px-4 py-2 rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#162420] hover:bg-[#F4F7F5] dark:hover:bg-[#1F2D29] text-[#1F2D29] dark:text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.view_ai_diagnosis}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleGpsSync}
            disabled={geoLoading}
            className="px-4 py-2.5 rounded-xl bg-[#176B55] hover:bg-[#135846] text-white text-xs font-semibold shadow-xs flex items-center space-x-2 transition cursor-pointer"
            title={t.enable_live_gps}
          >
            <Crosshair className={`w-4 h-4 text-white ${geoLoading ? 'animate-spin' : ''}`} />
            <span>{geoLoading ? t.connecting_gps : gpsActive ? t.live_gps_active : t.enable_live_gps}</span>
          </button>
        </div>
      </div>

      {geoError && (
        <div className="bg-[#FFF9F2] dark:bg-[#2A2114] px-4 py-3.5 border border-[#D77926]/40 rounded-2xl text-[#D77926] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-[#D77926] flex-shrink-0" />
            <span>{geoError}</span>
          </div>
          <button
            type="button"
            onClick={handleGpsSync}
            disabled={geoLoading}
            className="px-3.5 py-1.5 rounded-xl bg-[#D77926] hover:bg-[#C26B1E] text-white font-bold text-xs flex items-center space-x-1.5 self-start sm:self-auto transition shadow-xs cursor-pointer"
          >
            <Crosshair className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
            <span>{t.enable_live_gps}</span>
          </button>
        </div>
      )}

      {/* Main Grid: Interactive Map + Turn-by-Turn Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Leaflet Map Container */}
        <div
          className="lg:col-span-7 bg-white dark:bg-[#162420] rounded-2xl shadow-xs border border-[#DCE6E0] dark:border-[#233630] overflow-hidden touch-none flex flex-col h-[520px] relative"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Botón Flotante de Sincronización GPS Inmediata con flyTo */}
          <button
            type="button"
            onClick={handleGpsSync}
            disabled={geoLoading}
            className="absolute top-4 right-4 z-[1000] bg-white/95 dark:bg-[#162420]/95 hover:bg-white text-[#1F2D29] dark:text-white px-3.5 py-2 rounded-xl shadow-md border border-[#DCE6E0] dark:border-[#233630] text-xs font-bold flex items-center space-x-2 transition transform hover:scale-105 active:scale-95 cursor-pointer group"
            title={t.enable_live_gps}
          >
            <div className="w-6 h-6 rounded-lg bg-[#EAF3F0] group-hover:bg-[#D5E8E1] flex items-center justify-center text-[#176B55] transition border border-[#DCE6E0]">
              <Crosshair className={`w-4 h-4 text-[#176B55] ${geoLoading ? 'animate-spin' : ''}`} />
            </div>
            <span className="hidden sm:inline font-bold text-[#1F2D29] dark:text-white group-hover:text-[#176B55]">
              {geoLoading ? t.connecting_gps : gpsActive ? t.live_gps_active : t.enable_live_gps}
            </span>
            {gpsActive && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#176B55] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#176B55]"></span>
              </span>
            )}
          </button>

          <MapContainer
            center={userCoords}
            zoom={14}
            zoomControl={false}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <ZoomControl position="bottomright" />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapScrollIsolation />
            <MapRecenter center={userCoords} />
            <MapController mapRef={mapRef} />

            {/* User Pulsing Pin */}
            <Marker position={userCoords} icon={userIcon}>
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${gpsActive ? 'bg-[#176B55] animate-pulse' : 'bg-[#176B55]'}`}></span>
                    <span className="font-bold text-[#176B55] block">
                      {gpsActive ? 'Tu ubicación GPS en vivo' : 'Tu ubicación aproximada'}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] block">
                    {userLat.toFixed(5)}, {userLng.toFixed(5)}
                  </span>
                  <span className="text-[10px] text-[#176B55] font-semibold block">
                    {gpsActive ? '● Transmitiendo en tiempo real' : '○ GPS en espera'}
                  </span>
                </div>
              </Popup>
            </Marker>

            {/* OSRM Route Polyline */}
            {routeCoordinates.length > 1 && (
              <Polyline
                positions={routeCoordinates}
                pathOptions={{
                  color: '#C83D4D',
                  weight: 5,
                  opacity: 0.9,
                  dashArray: routeCoordinates.length === 2 ? '8, 8' : undefined,
                }}
              />
            )}

            {/* Clinics & Stores Markers */}
            {clinicsWithDistance.map((clinic) => {
              const isSelected = activeClinic?.id === clinic.id;
              const icon = createClinicIcon(clinic.isEmergency, isSelected, clinic.isStore);

              return (
                <Marker
                  key={clinic.id}
                  position={[clinic.lat, clinic.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => setSelectedClinicId(clinic.id),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-2 space-y-2 min-w-[220px] text-xs">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            clinic.isStore
                              ? 'bg-[#EAF3F0] text-[#176B55]'
                              : clinic.isEmergency
                              ? 'bg-[#FDECEE] text-[#C83D4D]'
                              : 'bg-[#EAF3F0] text-[#176B55]'
                          }`}
                        >
                          {clinic.category || (clinic.isEmergency ? t.emergency_24h : t.general_consult)}
                        </span>
                        <span className="font-bold text-[#1F2D29]">{clinic.distanceKm} km</span>
                      </div>
                      <h4 className="font-bold text-[#123B32] text-sm leading-tight">
                        {clinic.name}
                      </h4>
                      <p className="text-[11px] text-[#66756F]">{clinic.address}</p>

                      <button
                        type="button"
                        onClick={() => setSelectedClinicId(clinic.id)}
                        className="w-full py-1.5 bg-[#176B55] hover:bg-[#135846] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        {t.calculate_route_here}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Floating Live Navigation Pill */}
          {activeClinic && (
            <div className="absolute top-4 left-4 z-[1000] bg-white/95 dark:bg-[#162420]/95 backdrop-blur-xs text-[#1F2D29] dark:text-white p-3 rounded-xl shadow-md border border-[#DCE6E0] dark:border-[#233630] text-xs flex items-center space-x-3 max-w-sm">
              <div className="w-10 h-10 rounded-xl bg-[#C83D4D] flex items-center justify-center flex-shrink-0 text-white font-bold">
                <Car className="w-5 h-5" />
              </div>
              <div className="truncate">
                <span className="text-[10px] text-[#C83D4D] font-bold uppercase tracking-wider block">
                  {t.route_towards}
                </span>
                <span className="font-bold text-[#123B32] dark:text-white truncate block">
                  {activeClinic.name}
                </span>
                <span className="text-[11px] text-[#66756F] dark:text-[#A3B8B0]">
                  {routeDistanceKm} km • Est: {routeDurationMin || '~8'} min {t.in_vehicle}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Turn-by-Turn Routing Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Navigation Card */}
          <div className="bg-white dark:bg-[#162420] rounded-2xl p-6 border border-[#DCE6E0] dark:border-[#233630] shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FDECEE] text-[#C83D4D] border border-[#C83D4D]/30 inline-block mb-1">
                  {t.active_destination}
                </span>
                <h3 className="font-bold text-[#123B32] dark:text-white text-base leading-snug">
                  {activeClinic?.name}
                </h3>
                <p className="text-xs text-[#66756F] dark:text-[#A3B8B0] mt-0.5">{activeClinic?.address}</p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-[#123B32] dark:text-white">
                  {routeDurationMin ? `${routeDurationMin} min` : '--'}
                </div>
                <div className="text-xs font-semibold text-[#C83D4D]">
                  {routeDistanceKm ? `${routeDistanceKm} km` : `${activeClinic?.distanceKm} km`}
                </div>
              </div>
            </div>

            {/* Quick Phone Call & Hours */}
            <div className="flex flex-wrap items-center justify-between gap-2 w-full p-3 bg-[#F4F7F5] dark:bg-[#1F2D29]/40 rounded-xl border border-[#DCE6E0] dark:border-[#233630] text-xs">
              <div className="flex items-center space-x-2 text-[#1F2D29] dark:text-slate-200 min-w-0 flex-1">
                <Clock className="w-4 h-4 text-[#66756F] flex-shrink-0" />
                <span className="truncate">{activeClinic?.hours}</span>
              </div>
              <a
                href={`tel:${activeClinic?.phone}`}
                className="px-3 py-1.5 bg-white dark:bg-[#162420] border border-[#DCE6E0] dark:border-[#233630] text-[#123B32] dark:text-white rounded-lg font-bold flex items-center space-x-1 transition flex-shrink-0 hover:bg-[#F4F7F5]"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{t.call}</span>
              </a>
            </div>

            {/* Direct SOS Action Buttons: Phone, WhatsApp & Maps */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${activeClinic?.phone}`}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-[#C83D4D] hover:bg-[#A92E3C] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-white" />
                  <span>{t.call_emergency}</span>
                </a>

                <a
                  href={activeWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-[#176B55] hover:bg-[#135846] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <span className="text-sm">💬</span>
                  <span>{t.alert_whatsapp}</span>
                </a>
              </div>

              {/* Vista previa del mensaje con GPS incluido */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowWaPreview(!showWaPreview)}
                  className="w-full flex items-center justify-between py-1.5 px-3 bg-[#EAF3F0] hover:bg-[#D5E8E1] border border-[#DCE6E0] rounded-xl text-[11px] font-bold text-[#176B55] transition cursor-pointer"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>💬</span>
                    <span>{t.msg_preview_gps}</span>
                  </div>
                  {showWaPreview ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#176B55] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-[#176B55] flex-shrink-0" />
                  )}
                </button>

                {showWaPreview && (
                  <div className="mt-1.5 p-3 bg-[#F4F7F5] dark:bg-[#0F1A17] text-[#1F2D29] dark:text-slate-200 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed border border-[#DCE6E0] dark:border-[#233630] shadow-inner max-h-48 overflow-y-auto">
                    {activeWhatsAppMessageText || t.msg_preview_generating}
                  </div>
                )}
              </div>

              {/* External Navigation Shortcuts (Waze / Google Maps) */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-white dark:bg-[#1F2D29] border border-[#DCE6E0] dark:border-[#233630] hover:bg-[#F4F7F5] dark:hover:bg-[#162420] text-[#1F2D29] dark:text-white text-xs font-bold shadow-xs transition"
                >
                  <span>🗺️</span>
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-[#176B55]" />
                </a>

                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-[#2D8CFF] hover:bg-[#1E74E0] text-white text-xs font-bold shadow-xs transition"
                >
                  <span>🚗</span>
                  <span>{t.open_waze}</span>
                  <ExternalLink className="w-3 h-3 text-white" />
                </a>
              </div>
            </div>

            {/* Turn-by-Turn Steps List */}
            <div className="space-y-3 pt-2 border-t border-[#DCE6E0] dark:border-[#233630]">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#123B32] dark:text-slate-200 flex items-center space-x-1.5">
                  <Navigation className="w-3.5 h-3.5 text-[#176B55]" />
                  <span>{t.step_by_step_directions}</span>
                </h4>
                <span className="text-[10px] text-[#66756F] dark:text-[#A3B8B0]">
                  {routeSteps.length} {t.steps}
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {routeSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-3 p-2.5 rounded-xl bg-[#F4F7F5] dark:bg-[#1F2D29]/40 border border-[#DCE6E0] dark:border-[#233630] text-xs text-[#1F2D29] dark:text-slate-200"
                  >
                    <div className="w-6 h-6 rounded-lg bg-white dark:bg-[#162420] border border-[#DCE6E0] dark:border-[#233630] text-[#176B55] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      {step.icon === 'left' && <CornerUpLeft className="w-3.5 h-3.5 text-[#176B55]" />}
                      {step.icon === 'right' && <CornerUpRight className="w-3.5 h-3.5 text-[#176B55]" />}
                      {step.icon === 'straight' && <MoveUp className="w-3.5 h-3.5 text-[#176B55]" />}
                      {step.icon === 'depart' && <Navigation className="w-3.5 h-3.5 text-[#C83D4D]" />}
                      {step.icon === 'arrive' && <Flag className="w-3.5 h-3.5 text-[#C83D4D]" />}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-[#1F2D29] dark:text-slate-200 leading-tight">{step.text}</p>
                      {step.distance && (
                        <span className="text-[10px] text-[#66756F] dark:text-[#A3B8B0] font-mono mt-0.5 block">
                          {step.distance}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Clinics & Agro-Stores Cards List Ordered by Distance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-[#123B32] dark:text-white">
            {t.network_title}
          </h3>
          <span className="text-xs text-[#66756F] dark:text-[#A3B8B0]">
            {clinicsWithDistance.length} {t.care_points_identified}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clinicsWithDistance.map((clinic) => {
            const isSelected = activeClinic?.id === clinic.id;

            return (
              <div
                key={clinic.id}
                onClick={() => setSelectedClinicId(clinic.id)}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-4 render-pipeline-contain gpu-composite ${
                  isSelected
                    ? 'bg-[#EAF3F0]/60 dark:bg-[#176B55]/20 border-2 border-[#176B55] shadow-xs'
                    : 'bg-white dark:bg-[#162420] border-[#DCE6E0] dark:border-[#233630] hover:border-[#176B55]/50 shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                        clinic.isStore
                          ? 'bg-[#EAF3F0] text-[#176B55] border-[#176B55]/30'
                          : clinic.isEmergency
                          ? 'bg-[#FDECEE] text-[#C83D4D] border-[#C83D4D]/30'
                          : 'bg-[#EAF3F0] text-[#176B55] border-[#176B55]/30'
                      }`}
                    >
                      {clinic.category || (clinic.isEmergency ? t.emergency_24h : t.general_consult)}
                    </span>

                    <span className="text-xs font-bold text-[#1F2D29] dark:text-slate-200 bg-[#F4F7F5] dark:bg-[#1F2D29] border border-[#DCE6E0] dark:border-[#233630] px-2 py-0.5 rounded-md">
                      {clinic.distanceKm} km
                    </span>
                  </div>

                  <h4 className="font-bold text-[#123B32] dark:text-white text-sm leading-snug">
                    {clinic.name}
                  </h4>
                  <p className="text-xs text-[#66756F] dark:text-[#A3B8B0]">{clinic.address}</p>

                  <div className="text-[11px] text-[#66756F] dark:text-[#A3B8B0] flex items-center space-x-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5 text-[#66756F] flex-shrink-0" />
                    <span className="truncate">{clinic.hours}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-[#DCE6E0] dark:border-[#233630]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClinicId(clinic.id);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      isSelected
                        ? 'bg-[#176B55] text-white shadow-xs'
                        : 'bg-white dark:bg-[#1F2D29] border border-[#DCE6E0] dark:border-[#233630] hover:bg-[#F4F7F5] text-[#1F2D29] dark:text-white'
                    }`}
                  >
                    <span>{isSelected ? t.route_selected : t.view_route}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={`tel:${clinic.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl bg-[#C83D4D] hover:bg-[#A92E3C] text-white transition flex-shrink-0 shadow-xs"
                    title={`${t.call} ${clinic.name}`}
                  >
                    <Phone className="w-4 h-4 text-white" />
                  </a>

                  <a
                    href={getWhatsAppLink(clinic)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl bg-[#176B55] hover:bg-[#135846] text-white transition flex-shrink-0 shadow-xs"
                    title={t.alert_whatsapp}
                  >
                    <span className="text-xs">💬</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EmergencyMap;