import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Phone, Navigation, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

/**
 * Custom SVG DivIcon factories to prevent Leaflet default asset path bundling issues.
 */
function createUserIcon() {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(59, 130, 246, 0.3); animation: pulse-ring 2s infinite ease-in-out;"></div>
        <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function createClinicIcon(isEmergency) {
  const bgColor = isEmergency ? '#ef4444' : '#10b981';
  return L.divIcon({
    className: 'custom-clinic-marker',
    html: `
      <div style="
        background: ${bgColor};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      ">
        <span style="transform: rotate(45deg); font-weight: bold; font-size: 16px;">+</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

/**
 * Helper component to re-center the map view when center coordinates change
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

export function VetMap({ userLocation, clinics = [], urgencyLevel = 'MODERATE' }) {
  const center = [
    userLocation?.lat || 4.6533,
    userLocation?.lng || -74.0836,
  ];

  const userIcon = createUserIcon();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[520px]">
      {/* Map Header */}
      <div className="p-4 px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <span>Nearby Veterinary Facilities</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
              {clinics.length} Available
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time geolocated routing matched to evaluated patient urgency.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-sm inline-block" />
            <span className="text-slate-600">You</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-white shadow-sm inline-block" />
            <span className="text-slate-600">24H Emergency</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm inline-block" />
            <span className="text-slate-600">General Practice</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full relative">
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapRecenter center={center} />

          {/* User Location Marker */}
          <Marker position={center} icon={userIcon}>
            <Popup>
              <div className="text-xs font-semibold p-1">
                <span className="text-blue-600 font-bold block">Your Current Location</span>
                <span className="text-slate-500">
                  {userLocation?.lat?.toFixed(4)}, {userLocation?.lng?.toFixed(4)}
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Nearby Clinic Markers */}
          {clinics.map((clinic) => {
            const clinicCoords = clinic.coordinates || center;
            const icon = createClinicIcon(clinic.is_emergency_facility);

            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${clinicCoords[0]},${clinicCoords[1]}`;

            return (
              <Marker
                key={clinic.id}
                position={[clinicCoords[0], clinicCoords[1]]}
                icon={icon}
              >
                <Popup className="custom-popup">
                  <div className="p-2 space-y-2.5 min-w-[220px]">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            clinic.is_emergency_facility
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {clinic.is_emergency_facility ? '24H EMERGENCY' : 'GENERAL CLINIC'}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {clinic.distance_km} km away
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {clinic.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{clinic.address}</p>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center space-x-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{clinic.hours}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={`tel:${clinic.phone}`}
                        className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Route</span>
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

export default VetMap;
