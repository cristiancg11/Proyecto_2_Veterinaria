import React, { useState } from 'react';
import Header from './components/Header';
import TriageEvaluator from './components/TriageEvaluator';
import EmergencyMap from './components/EmergencyMap';
import TriageChatModal from './components/TriageChatModal';
import HistoryModal from './components/HistoryModal';
import AuthModal from './components/AuthModal';
import AuthScreen from './components/AuthScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import useGeolocation from './hooks/useGeolocation';
import useTriage from './hooks/useTriage';
import {
  AlertCircle,
  MapPin,
  Zap,
  UserCheck,
  HeartPulse,
  Loader2,
  MessageSquare,
} from 'lucide-react';

function MainApp() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [lastPetType, setLastPetType] = useState('Perro (Canino)');
  const [activeDiagnosis, setActiveDiagnosis] = useState(null);

  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Custom Hooks
  const { coordinates, loading: geoLoading, error: geoError } = useGeolocation();
  const {
    history,
    error,
    fetchHistory,
  } = useTriage(user?.id);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-600 flex items-center justify-center animate-pulse shadow-xl shadow-rose-500/40">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <div className="text-sm font-medium text-slate-300 flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            <span>Verificando sesión en VetIA...</span>
          </div>
        </div>
      </div>
    );
  }

  // Authentication Gate: Require user to sign in or register before entering
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const handleDiagnosisComplete = (result, weight, species) => {
    setActiveDiagnosis(result);
    setLastPetType(species);
    if (fetchHistory) {
      fetchHistory();
    }
  };

  const handleOpenChat = (diag) => {
    if (diag) setActiveDiagnosis(diag);
    setIsChatModalOpen(true);
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

        {/* Grid Layout: Triage on Left, Emergency Map on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Triage Evaluator Component */}
          <div className="lg:col-span-6 space-y-6">
            <TriageEvaluator
              userCoordinates={coordinates}
              onDiagnosisComplete={handleDiagnosisComplete}
              onOpenChat={handleOpenChat}
            />
          </div>

          {/* Right Column: Real-Time Emergency Map */}
          <div className="lg:col-span-6 space-y-6">
            <EmergencyMap
              externalUserLocation={coordinates}
              urgencyLevel={activeDiagnosis?.urgency_level || 'MODERATE'}
            />

            {/* Quick Helper Guide */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs text-slate-600 space-y-2">
              <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                <span>Protocolo de Emergencia Veterinaria</span>
              </h4>
              <p className="leading-relaxed">
                Si la mascota presenta sangrado activo incontrolable, pérdida de conciencia o asfixia, haz clic de inmediato en el botón flotante <strong>"Iniciar Navegación en Waze / Google Maps"</strong> o en <strong>Llamar</strong> sobre la clínica más cercana para acudir a un hospital con servicio de quirófano 24 horas.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Interactive AI Follow-up Chat Modal */}
      <TriageChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        diagnosis={activeDiagnosis}
        petType={lastPetType}
      />

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

      {/* Floating Chat Shortcut Button when diagnosis is active */}
      {activeDiagnosis && !isChatModalOpen && (
        <button
          type="button"
          onClick={() => setIsChatModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-2xl shadow-rose-600/40 flex items-center space-x-2 transition transform hover:scale-105 active:scale-95 cursor-pointer border border-rose-400"
          title="Abrir Chat de Seguimiento con Asistente IA"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat de Urgencias IA</span>
        </button>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>VetIA / PetEmergency © 2026 - Triage Multimodal & Seguimiento Contextual</span>
          <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
            <span className="px-2 py-0.5 bg-slate-100 rounded">Supabase Auth</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded">React 18</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded">Leaflet Map</span>
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
