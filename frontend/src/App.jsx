import React, { useState } from 'react';
import Header from './components/Header';
import ImageUploadForm from './components/ImageUploadForm';
import DiagnosisResult from './components/DiagnosisResult';
import VetMap from './components/VetMap';
import HistoryModal from './components/HistoryModal';
import AuthModal from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import useGeolocation from './hooks/useGeolocation';
import useTriage from './hooks/useTriage';
import { AlertCircle, MapPin, Zap, UserCheck } from 'lucide-react';

function MainApp() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [lastPetType, setLastPetType] = useState('Perro (Canino)');

  const { user, isAuthenticated } = useAuth();

  // Custom Hooks
  const { coordinates, loading: geoLoading, error: geoError } = useGeolocation();
  const {
    loading,
    isCompressing,
    currentDiagnosis,
    clinics,
    history,
    error,
    submitTriage,
    resetDiagnosis,
  } = useTriage(user?.id);

  const handleTriageSubmit = ({ file, petType, symptomsDescription }) => {
    setLastPetType(petType);
    submitTriage({
      file,
      petType,
      symptomsDescription,
      userCoordinates: coordinates,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900">
      {/* Top Navigation */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        historyCount={history.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Subheader status banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>
              Geolocalizado en: <strong>{coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</strong>
              {geoError && ' (Modo fallback activo)'}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500">
            {isAuthenticated ? (
              <span className="flex items-center space-x-1.5 text-rose-600 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Sesión Activa: {user.email}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="text-xs text-rose-600 font-semibold hover:underline"
              >
                Inicia sesión para vincular tus consultas
              </button>
            )}

            <div className="hidden sm:flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Gemini 2.5 Flash + Web Worker</span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800 text-sm shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Aviso en la Evaluación</h4>
              <p className="mt-0.5 text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* Grid Layout: Consultation on Left, Map on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form or Diagnosis Card */}
          <div className="lg:col-span-6 space-y-6">
            {!currentDiagnosis ? (
              <ImageUploadForm
                onSubmit={handleTriageSubmit}
                loading={loading}
                isCompressing={isCompressing}
              />
            ) : (
              <DiagnosisResult
                diagnosis={currentDiagnosis}
                onReset={resetDiagnosis}
                petType={lastPetType}
              />
            )}
          </div>

          {/* Right Column: Interactive Leaflet Map */}
          <div className="lg:col-span-6 space-y-6">
            <VetMap
              userLocation={coordinates}
              clinics={clinics}
              urgencyLevel={currentDiagnosis?.urgency_level || 'MODERATE'}
            />

            {/* Quick Helper Guide */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs text-slate-600 space-y-2">
              <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                <span>Protocolo de Emergencia Veterinaria</span>
              </h4>
              <p className="leading-relaxed">
                Si la mascota presenta sangrado activo incontrolable, pérdida de conciencia o asfixia, haz clic de inmediato en <strong>Call</strong> o <strong>Route</strong> sobre el marcador rojo más cercano para acudir a un hospital con servicio de quirófano 24 horas.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* History Drawer Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>VetIA / PetEmergency © 2026 - Triage Multimodal & Seguimiento Contextual</span>
          <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
            <span className="px-2 py-0.5 bg-slate-100 rounded">Supabase Auth</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded">React 18</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded">Web Workers</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded">Gemini 2.5 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
