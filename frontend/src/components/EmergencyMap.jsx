import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import {
  getGoogleMapsLocationUrl,
  getGoogleMapsDirectionsUrl,
  haversineDistance,
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
          ${gpsActive ? '<span style="position: absolute; top: -3px; right: -3px; width: 7px; height: 7px; border-radius: 50%; background: #10b981; border: 1.5px solid #fff;"></span>' : ''}
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
  const bgColor = isStore ? '#059669' : isEmergency ? '#ef4444' : '#2563eb';
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
      if (!clinic) return '#';
      const cleanPhone = (clinic.phone || '').replace(/[^0-9]/g, '');
      const waPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone.replace(/^0+/, '')}`;
      const message = getWhatsAppMessageText(clinic);
      return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
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
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-rose-600 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4 animate-spin-slow" />
            <span>Navegación Guiada de Emergencia</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Centros Veterinarios & Almacenes Agropecuarios Cercanos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Hospitales pecuarios, clínicas de urgencia y distribuidores de insumos agropecuarios ordenados por cercanía GPS con ruta en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onBackToTriage && (
            <button
              type="button"
              onClick={onBackToTriage}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ver Diagnóstico IA</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleGpsSync}
            disabled={geoLoading}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs flex items-center space-x-2 transition cursor-pointer"
            title="Activar mi GPS en vivo"
          >
            <Crosshair className={`w-4 h-4 text-emerald-400 ${geoLoading ? 'animate-spin' : ''}`} />
            <span>{geoLoading ? 'Conectando GPS...' : gpsActive ? 'GPS en vivo activo' : 'Activar mi GPS en vivo'}</span>
          </button>
        </div>
      </div>

      {geoError && (
        <div className="bg-amber-50 px-4 py-3.5 border border-amber-200 rounded-2xl text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{geoError}</span>
          </div>
          <button
            type="button"
            onClick={handleGpsSync}
            disabled={geoLoading}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1.5 self-start sm:self-auto transition shadow-2xs cursor-pointer"
          >
            <Crosshair className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
            <span>Activar mi GPS en vivo</span>
          </button>
        </div>
      )}

      {/* Main Grid: Interactive Map + Turn-by-Turn Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Leaflet Map Container */}
        <div
          className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden touch-none flex flex-col h-[520px] relative"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Botón Flotante de Sincronización GPS Inmediata con flyTo */}
          <button
            type="button"
            onClick={handleGpsSync}
            disabled={geoLoading}
            className="absolute top-4 right-4 z-[1000] bg-white hover:bg-slate-50 text-slate-800 hover:text-emerald-600 px-3.5 py-2.5 rounded-2xl shadow-xl border border-slate-200/90 backdrop-blur-md text-xs font-bold flex items-center space-x-2 transition transform hover:scale-105 active:scale-95 cursor-pointer group"
            title="Activar mi GPS en vivo"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition">
              <Crosshair className={`w-4 h-4 text-emerald-600 ${geoLoading ? 'animate-spin' : ''}`} />
            </div>
            <span className="hidden sm:inline font-extrabold text-slate-800 group-hover:text-emerald-600">
              {geoLoading ? 'Conectando GPS...' : gpsActive ? 'GPS en vivo activo' : 'Activar mi GPS en vivo'}
            </span>
            {gpsActive && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
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
                    <span className={`w-2 h-2 rounded-full ${gpsActive ? 'bg-emerald-500 animate-pulse' : 'bg-blue-600'}`}></span>
                    <span className="font-bold text-blue-600 block">
                      {gpsActive ? 'Tu ubicación GPS en vivo' : 'Tu ubicación aproximada'}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] block">
                    {userLat.toFixed(5)}, {userLng.toFixed(5)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">
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
                  color: '#EF4444',
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
                              ? 'bg-emerald-100 text-emerald-800'
                              : clinic.isEmergency
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {clinic.category || (clinic.isEmergency ? '24H URGENCIAS' : 'CONSULTA GENERAL')}
                        </span>
                        <span className="font-bold text-slate-700">{clinic.distanceKm} km</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">
                        {clinic.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">{clinic.address}</p>

                      <button
                        type="button"
                        onClick={() => setSelectedClinicId(clinic.id)}
                        className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Trazar Ruta hacia Aquí
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Floating Live Navigation Pill */}
          {activeClinic && (
            <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-xs text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs flex items-center space-x-3 max-w-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                <Car className="w-5 h-5" />
              </div>
              <div className="truncate">
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
                  Ruta hacia:
                </span>
                <span className="font-bold text-slate-100 truncate block">
                  {activeClinic.name}
                </span>
                <span className="text-[11px] text-slate-300">
                  {routeDistanceKm} km • Est: {routeDurationMin || '~8'} min en vehículo
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Turn-by-Turn Routing Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Navigation Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 inline-block mb-1">
                  Destino Activo de Emergencia
                </span>
                <h3 className="font-black text-slate-900 text-base leading-snug">
                  {activeClinic?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeClinic?.address}</p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-slate-900">
                  {routeDurationMin ? `${routeDurationMin} min` : '--'}
                </div>
                <div className="text-xs font-semibold text-rose-600">
                  {routeDistanceKm ? `${routeDistanceKm} km` : `${activeClinic?.distanceKm} km`}
                </div>
              </div>
            </div>

            {/* Quick Phone Call & Hours */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
              <div className="flex items-center space-x-2 text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="truncate">{activeClinic?.hours}</span>
              </div>
              <a
                href={`tel:${activeClinic?.phone}`}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center space-x-1 transition flex-shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Llamar</span>
              </a>
            </div>

            {/* Direct SOS Action Buttons: Phone, WhatsApp & Maps */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${activeClinic?.phone}`}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-rose-400" />
                  <span>Llamar a Urgencias</span>
                </a>

                <a
                  href={activeWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <span className="text-sm">💬</span>
                  <span>Avisar por WhatsApp</span>
                </a>
              </div>

              {/* Vista previa del mensaje con GPS incluido */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowWaPreview(!showWaPreview)}
                  className="w-full flex items-center justify-between py-1.5 px-3 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/90 rounded-xl text-[11px] font-bold text-emerald-900 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>💬</span>
                    <span>Vista previa del mensaje con GPS incluido</span>
                  </div>
                  {showWaPreview ? (
                    <ChevronUp className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                  )}
                </button>

                {showWaPreview && (
                  <div className="mt-1.5 p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed border border-slate-700 shadow-inner max-h-48 overflow-y-auto scrollbar-dark">
                    {activeWhatsAppMessageText || 'Generando vista previa del mensaje con GPS...'}
                  </div>
                )}
              </div>

              {/* External Navigation Shortcuts (Waze / Google Maps) */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-2xs transition"
                >
                  <span>🗺️</span>
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition"
                >
                  <span>🚗</span>
                  <span>Abrir en Waze</span>
                  <ExternalLink className="w-3 h-3 text-blue-200" />
                </a>
              </div>
            </div>

            {/* Turn-by-Turn Steps List */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                  <Navigation className="w-3.5 h-3.5 text-rose-500" />
                  <span>Instrucciones de Giro Paso a Paso</span>
                </h4>
                <span className="text-[10px] text-slate-400">
                  {routeSteps.length} pasos
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {routeSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-800"
                  >
                    <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                      {step.icon === 'left' && <CornerUpLeft className="w-3.5 h-3.5 text-blue-600" />}
                      {step.icon === 'right' && <CornerUpRight className="w-3.5 h-3.5 text-blue-600" />}
                      {step.icon === 'straight' && <MoveUp className="w-3.5 h-3.5 text-emerald-600" />}
                      {step.icon === 'depart' && <Navigation className="w-3.5 h-3.5 text-rose-600" />}
                      {step.icon === 'arrive' && <Flag className="w-3.5 h-3.5 text-red-600" />}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-slate-800 leading-tight">{step.text}</p>
                      {step.distance && (
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
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
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Red de Centros Veterinarios y Almacenes Agropecuarios Cercanos
          </h3>
          <span className="text-xs text-slate-500">
            {clinicsWithDistance.length} puntos de atención identificados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clinicsWithDistance.map((clinic) => {
            const isSelected = activeClinic?.id === clinic.id;

            return (
              <div
                key={clinic.id}
                onClick={() => setSelectedClinicId(clinic.id)}
                className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-rose-50/50 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        clinic.isStore
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : clinic.isEmergency
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {clinic.category || (clinic.isEmergency ? '24H URGENCIAS' : 'CONSULTA GENERAL')}
                    </span>

                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {clinic.distanceKm} km
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {clinic.name}
                  </h4>
                  <p className="text-xs text-slate-500">{clinic.address}</p>

                  <div className="text-[11px] text-slate-600 flex items-center space-x-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{clinic.hours}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClinicId(clinic.id);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{isSelected ? 'Ruta Seleccionada' : 'Ver Ruta'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={`tel:${clinic.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition flex-shrink-0"
                    title={`Llamar a ${clinic.name}`}
                  >
                    <Phone className="w-4 h-4 text-rose-400" />
                  </a>

                  <a
                    href={getWhatsAppLink(clinic)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex-shrink-0"
                    title="Avisar por WhatsApp"
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