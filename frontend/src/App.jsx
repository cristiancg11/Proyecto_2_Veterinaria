import React, { useState } from 'react';
import Header from './components/Header';
import TriageEvaluator from './components/TriageEvaluator';
import TriageChatModal from './components/TriageChatModal';
import HistoryModal from './components/HistoryModal';
import AuthModal from './components/AuthModal';
import AuthScreen, { Auth } from './components/AuthScreen';
import FarmOverviewBanner from './components/FarmOverviewBanner';
import FieldFirstAidModal from './components/FieldFirstAidModal';
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
  const [isFieldFirstAidOpen, setIsFieldFirstAidOpen] = useState(false);
  const [lastPetType, setLastPetType] = useState('Bovino (Bovinos, Terneros y Vacas)');
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
      <div className="min-h-screen flex items-center justify-center bg-clinical-canvas text-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center animate-pulse shadow-xl shadow-indigo-600/30">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <div className="text-sm font-medium text-slate-300 flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Verificando sesión en VetIA...</span>
          </div>
        </div>
      </div>
    );
  }

  // Authentication Gate: Require user to sign in or register before entering
  if (!user || !user?.id) {
    return <Auth />;
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
    <div className="relative min-h-screen flex flex-col bg-clinical-canvas text-slate-100 overflow-x-hidden">
      {/* Ambient multi-layer light field (decorative) */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-48 -left-40 w-[42rem] h-[42rem] rounded-full bg-indigo-500/25 blur-3xl animate-aurora" />
        <div className="absolute -bottom-52 -right-44 w-[46rem] h-[46rem] rounded-full bg-violet-600/25 blur-3xl animate-aurora-rev" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full bg-cyan-500/15 blur-3xl animate-float-slow" />
        {/* Fine grid texture for a precise, techy depth */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(148,163,184,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.35) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(circle at 50% 30%, black, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 30%, black, transparent 72%)',
          }}
        />
      </div>

      {/* Top Navigation Bar with Historial de Consultas */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        historyCount={history.length}
      />

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Subheader status banner */}
        <div className="glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl">
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              Geolocalizado en: <strong className="text-white">{coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</strong>
              {geoError && ' (Modo fallback activo)'}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400">
            {isAuthenticated ? (
              <span className="flex items-center space-x-1.5 text-indigo-200 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/30 shadow-glow-indigo">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Sesión Activa: {user.email}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="text-xs text-cyan-300 font-semibold hover:text-cyan-200 hover:underline"
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
          <div className="p-4 bg-rose-950/50 border border-rose-500/40 rounded-2xl flex items-start space-x-3 text-rose-100 text-sm shadow-lg shadow-rose-950/20">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Aviso en la Evaluación</h4>
              <p className="mt-0.5 text-rose-200/90">{error}</p>
            </div>
          </div>
        )}

        {/* Plus al Iniciar Sesión: Dashboard de Bienvenida Zootécnico */}
        <div className="max-w-5xl mx-auto space-y-6">
          <FarmOverviewBanner
            historyCount={history.length}
            userName={user?.user_metadata?.full_name || user?.email || 'Productor'}
            onOpenFieldFirstAid={() => setIsFieldFirstAidOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />

          {/* Core Triage Evaluation & Automatic Sequential Map Unlocking */}
          <TriageEvaluator
            userCoordinates={coordinates}
            onDiagnosisComplete={handleDiagnosisComplete}
            onOpenChat={handleOpenChat}
          />
        </div>
      </main>

      {/* Guía Rápida de Primeros Auxilios de Campo Modal */}
      <FieldFirstAidModal
        isOpen={isFieldFirstAidOpen}
        onClose={() => setIsFieldFirstAidOpen(false)}
      />

      {/* Interactive AI Follow-up Chat Modal */}
      <TriageChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        diagnosis={activeDiagnosis}
        petType={lastPetType}
      />

      {/* Historial de Consultas Drawer Modal (Synchronized with Supabase triage_records) */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onRefresh={fetchHistory}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Footer */}
      <footer className="relative z-10 mt-12 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>VetIA / PetEmergency © 2026 - Triage Multimodal & Seguimiento Contextual</span>
          <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-300">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 backdrop-blur-xl border border-white/10">Supabase Auth</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 backdrop-blur-xl border border-white/10">React 18</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 backdrop-blur-xl border border-white/10">OSRM Routing</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 backdrop-blur-xl border border-white/10">Gemini 2.5 Flash</span>
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