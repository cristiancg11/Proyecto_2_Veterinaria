import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Phone,
  Navigation,
  Clock,
  MapPin,
  Compass,
  AlertTriangle,
  LocateFixed,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

/**
 * Haversine formula (semiverseno) to calculate real distance between two GPS coordinates in km
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
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
 * Custom SVG DivIcon for the pulsating user location
 */
function createUserPulseIcon() {
  return L.divIcon({
    className: 'custom-user-pulse-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.35);
          animation: pulse-ring 2s infinite ease-in-out;
        "></div>
        <div style="
          position: relative;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #2563eb;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

/**
 * Custom SVG DivIcon for emergency & general veterinary clinics
 */
function createClinicIcon(isEmergency, isNearest = false) {
  const bgColor = isEmergency ? '#ef4444' : '#10b981';
  const badgeBorder = isNearest ? '3px solid #f59e0b' : '2px solid #ffffff';
  const shadow = isNearest
    ? '0 0 12px rgba(245, 158, 11, 0.8), 0 3px 6px rgba(0,0,0,0.4)'
    : '0 3px 6px rgba(0,0,0,0.3)';

  return L.divIcon({
    className: 'custom-clinic-marker',
    html: `
      <div style="
        background: ${bgColor};
        color: white;
        width: ${isNearest ? '36px' : '32px'};
        height: ${isNearest ? '36px' : '32px'};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: ${badgeBorder};
        box-shadow: ${shadow};
      ">
        <span style="transform: rotate(45deg); font-weight: 900; font-size: ${isNearest ? '18px' : '15px'};">+</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
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

// Emergency Veterinary Clinics template
const CLINIC_PRESETS = [
  {
    id: 'vet-urg-01',
    name: 'Hospital Veterinario de Urgencias 24H San Juan',
    address: 'Av. Principal #45-12, Sector Norte',
    phone: '+57 300 123 4567',
    hours: 'Abierto 24 Horas / UCI & Quirófano',
    isEmergency: true,
    dLat: 0.0085,
    dLng: -0.0075,
  },
  {
    id: 'vet-urg-02',
    name: "Centro Quirúrgico y Traumatología Animal 'La Cruz'",
    address: 'Calle 68 #22-80, Zona Médica',
    phone: '+57 311 987 6543',
    hours: 'Abierto 24 Horas / Cirugía de Emergencia',
    isEmergency: true,
    dLat: -0.0110,
    dLng: 0.0088,
  },
  {
    id: 'vet-urg-03',
    name: 'Hospital Clínico VET-SOS Emergencias 24/7',
    address: 'Transversal 23 #97-15, Sector Chicó',
    phone: '+57 301 555 9911',
    hours: 'Abierto 24 Horas / Cuidados Intensivos',
    isEmergency: true,
    dLat: 0.0062,
    dLng: 0.0105,
  },
  {
    id: 'vet-urg-04',
    name: 'Clínica Veterinaria & Diagnóstico Integral PetCare',
    address: 'Carrera 15 #85-30, Barrio El Prado',
    phone: '+57 315 456 7890',
    hours: 'Lun - Dom: 6:00 AM - 10:00 PM',
    isEmergency: false,
    dLat: 0.0038,
    dLng: -0.0048,
  },
  {
    id: 'vet-urg-05',
    name: 'Consultorio Veterinario Huellitas & Especialidades',
    address: 'Diagonal 40 #19-45, Centro',
    phone: '+57 320 654 3210',
    hours: 'Lun - Sáb: 8:00 AM - 7:00 PM',
    isEmergency: false,
    dLat: -0.0078,
    dLng: -0.0102,
  },
];

// Fallback GPS coordinate (Bogotá, Colombia)
const FALLBACK_LOCATION = { lat: 4.6533, lng: -74.0836 };

export function EmergencyMap({
  externalUserLocation = null,
  urgencyLevel = 'MODERATE',
}) {
  const [userLocation, setUserLocation] = useState(externalUserLocation || FALLBACK_LOCATION);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  // Request actual user location via navigator.geolocation.getCurrentPosition
  const requestUserLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocalización no soportada por el navegador.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoError(null);
        setGeoLoading(false);
      },
      (err) => {
        console.warn('[EmergencyMap] Fallback to default coordinates:', err.message);
        setGeoError('No se pudo acceder a tu ubicación GPS en tiempo real. Usando coordenadas de referencia.');
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  useEffect(() => {
    if (externalUserLocation?.lat && externalUserLocation?.lng) {
      setUserLocation(externalUserLocation);
    } else {
      requestUserLocation();
    }
  }, [externalUserLocation]);

  // Calculate dynamic coordinates for clinics relative to the user position
  // and compute distance via Haversine formula
  const clinicsWithDistance = useMemo(() => {
    const baseLat = userLocation.lat;
    const baseLng = userLocation.lng;

    return CLINIC_PRESETS.map((clinic) => {
      const clinicLat = parseFloat((baseLat + clinic.dLat).toFixed(6));
      const clinicLng = parseFloat((baseLng + clinic.dLng).toFixed(6));
      const distance = haversineDistance(baseLat, baseLng, clinicLat, clinicLng);

      return {
        ...clinic,
        lat: clinicLat,
        lng: clinicLng,
        distanceKm: distance,
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userLocation]);

  // Nearest clinic is the first one in the sorted list
  const nearestClinic = clinicsWithDistance[0];

  // Route points for Polyline between user and nearest clinic
  const routePoints = useMemo(() => {
    if (!nearestClinic) return [];
    return [
      [userLocation.lat, userLocation.lng],
      [nearestClinic.lat, nearestClinic.lng],
    ];
  }, [userLocation, nearestClinic]);

  // URLs for navigation
  const googleMapsUrl = nearestClinic
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${nearestClinic.lat},${nearestClinic.lng}`
    : '#';

  const wazeUrl = nearestClinic
    ? `https://waze.com/ul?ll=${nearestClinic.lat},${nearestClinic.lng}&navigate=yes`
    : '#';

  const userIcon = createUserPulseIcon();

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[560px] relative">
      {/* Map Card Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-rose-600 animate-spin-slow" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Mapa de Emergencias Veterinarias en Tiempo Real
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ruta calculada a la clínica más cercana vía fórmula del semiverseno (Haversine).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={requestUserLocation}
            disabled={geoLoading}
            title="Actualizar mi ubicación GPS"
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition cursor-pointer"
          >
            <LocateFixed className={`w-3.5 h-3.5 text-blue-600 ${geoLoading ? 'animate-spin' : ''}`} />
            <span>{geoLoading ? 'Obteniendo GPS...' : 'Mi GPS'}</span>
          </button>

          {nearestClinic && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs flex items-center space-x-1">
              <span>Más cercana:</span>
              <strong>{nearestClinic.distanceKm} km</strong>
            </span>
          )}
        </div>
      </div>

      {/* Geolocation Warning if any */}
      {geoError && (
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
          <span>{geoError}</span>
        </div>
      )}

      {/* Map Canvas */}
      <div className="flex-1 w-full relative z-0">
        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapRecenter center={[userLocation.lat, userLocation.lng]} />

          {/* User Location Pulsing Marker */}
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="p-1 space-y-1 text-xs">
                <span className="font-bold text-blue-600 block">Tu ubicación en tiempo real</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
                <p className="text-[10px] text-slate-400">Punto de partida del triaje</p>
              </div>
            </Popup>
          </Marker>

          {/* Direct Route Polyline to Nearest Clinic */}
          {routePoints.length === 2 && (
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: '#EF4444',
                weight: 4,
                opacity: 0.85,
                dashArray: '6, 8',
              }}
            />
          )}

          {/* Clinic Markers */}
          {clinicsWithDistance.map((clinic, idx) => {
            const isNearest = idx === 0;
            const icon = createClinicIcon(clinic.isEmergency, isNearest);

            return (
              <Marker
                key={clinic.id}
                position={[clinic.lat, clinic.lng]}
                icon={icon}
              >
                <Popup className="custom-popup">
                  <div className="p-2 space-y-2 min-w-[220px] text-xs">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            clinic.isEmergency
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {clinic.isEmergency ? '24H URGENCIAS' : 'CONSULTA GENERAL'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700">
                          {clinic.distanceKm} km
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {clinic.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{clinic.address}</p>
                    </div>

                    <div className="flex items-center space-x-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{clinic.hours}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={`tel:${clinic.phone}`}
                        className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Llamar</span>
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${clinic.lat},${clinic.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Ruta</span>
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Direct Navigation Button */}
        {nearestClinic && (
          <div className="absolute bottom-4 right-4 z-[1000] flex flex-col items-end space-y-2">
            {navDropdownOpen && (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1 min-w-[200px] mb-1 animate-in fade-in slide-in-from-bottom-2">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Selecciona Aplicación
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-800 text-xs font-semibold transition"
                >
                  <span className="flex items-center space-x-2">
                    <span>🗺️</span>
                    <span>Google Maps</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-800 text-xs font-semibold transition"
                >
                  <span className="flex items-center space-x-2">
                    <span>🚗</span>
                    <span>Waze</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => setNavDropdownOpen(!navDropdownOpen)}
              className="px-4 py-3 rounded-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-600/40 border border-rose-400 flex items-center space-x-2 transition transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Navigation className="w-4 h-4 animate-pulse" />
              <span>Iniciar Navegación en Waze / Google Maps</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-mono">
                {nearestClinic.distanceKm} km
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Map Legend Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-2xs inline-block" />
            <span className="text-slate-600 font-medium">Tu ubicación</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-white shadow-2xs inline-block" />
            <span className="text-slate-600 font-medium">Urgencias 24H</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 border-b-2 border-dashed border-rose-500 inline-block w-4" />
            <span className="text-slate-600 font-medium">Ruta directa Haversine</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          Radio de cobertura: Ciudad metropolitana
        </div>
      </div>
    </div>
  );
}

export default EmergencyMap;
