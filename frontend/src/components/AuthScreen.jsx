import React, { useState } from 'react';
import {
  HeartPulse,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPABASE_URL } from '../services/supabaseClient';

/**
 * Modern Authentication Screen for VetIA / PetEmergency
 * Provides seamless registration, login, and instant 1-click demo/guest access.
 */
export function AuthScreen() {
  const { signIn, signUp, loginAsDemo, loginAsGuest } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showAutoRegisterSuggestion, setShowAutoRegisterSuggestion] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setShowAutoRegisterSuggestion(false);
    setLoading(true);

    try {
      if (isRegister) {
        setSuccessMessage('Creando cuenta y configurando expediente...');
        await signUp(email, password, { full_name: fullName });
        setSuccessMessage('¡Cuenta creada exitosamente! Ingresando al sistema...');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      const targetEndpoint = `${SUPABASE_URL}/auth/v1/${isRegister ? 'signup' : 'token'}`;
      console.error(
        `[AuthScreen.handleSubmit] Error al conectar con ${targetEndpoint}. Motivo del fallo: ${err.message}`,
        err
      );
      let errorMsg = err.message || 'Error de autenticación. Verifica tus credenciales.';

      if (
        errorMsg.includes('Invalid login credentials') ||
        errorMsg.includes('Credenciales incorrectas')
      ) {
        errorMsg = 'No encontramos una cuenta con esas credenciales.';
        setShowAutoRegisterSuggestion(true);
      } else if (errorMsg.includes('User already registered')) {
        errorMsg = 'Este correo ya está registrado. Por favor inicia sesión.';
      } else if (errorMsg.includes('Password should be at least')) {
        errorMsg = 'La contraseña debe contener al menos 6 caracteres.';
      } else if (errorMsg.toLowerCase().includes('rate limit')) {
        errorMsg = 'Límite de correos alcanzado en el servidor. Ingresando en modo seguro...';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRegisterAndEnter = async () => {
    if (!email || !password) {
      setIsRegister(true);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp(email, password, { full_name: fullName || email.split('@')[0] });
    } catch (err) {
      const targetEndpoint = `${SUPABASE_URL}/auth/v1/signup`;
      console.error(
        `[AuthScreen.handleQuickRegisterAndEnter] Error al conectar con ${targetEndpoint}. Motivo del fallo: ${err.message}`,
        err
      );
      setError(err.message || 'Error al crear la cuenta rápida.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Decorative Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Simple Brand Bar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Vet<span className="text-rose-500">IA</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/30">
                PetEmergency
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sistema Hospitalario de Triage Veterinario con IA
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/60">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Acceso Médico Seguro</span>
        </div>
      </header>

      {/* Central Auth Container */}
      <main className="relative z-10 max-w-md w-full mx-auto px-4 py-4 sm:py-6">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          {/* Card Title & Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-lg shadow-rose-600/30 mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {isRegister ? 'Crear Cuenta de Tutor' : 'Bienvenido a VetIA'}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
              {isRegister
                ? 'Regístrate para guardar consultas, historial clínico de tus mascotas y acceder al triage con IA'
                : 'Ingresa con tu correo y contraseña o accede al instante con el modo demo'}
            </p>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mb-6 p-3 bg-gradient-to-r from-rose-950/40 via-red-950/30 to-slate-900 border border-rose-500/30 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-rose-300 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Acceso Inmediato de Evaluación</span>
              </span>
              <span className="text-[10px] text-slate-400">Sin contraseñas</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={loginAsDemo}
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition flex items-center justify-center space-x-1.5"
              >
                <span>Dr. de Turno (Demo)</span>
              </button>
              <button
                type="button"
                onClick={loginAsGuest}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition flex items-center justify-center space-x-1.5"
              >
                <span>Tutor Invitado</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-slate-800" />
            <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              o con tu cuenta
            </span>
            <div className="flex-grow border-t border-slate-800" />
          </div>

          {/* Tab Selector: Iniciar Sesión vs Registro */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
                setSuccessMessage(null);
                setShowAutoRegisterSuggestion(false);
              }}
              className={`py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
                !isRegister
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
                setSuccessMessage(null);
                setShowAutoRegisterSuggestion(false);
              }}
              className={`py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
                isRegister
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear Cuenta</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <span>{error}</span>
                  {showAutoRegisterSuggestion && (
                    <div className="mt-2 pt-2 border-t border-rose-500/30 flex items-center justify-between">
                      <span className="text-[11px] text-slate-300">¿Deseas crear la cuenta ahora?</span>
                      <button
                        type="button"
                        onClick={handleQuickRegisterAndEnter}
                        className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline"
                      >
                        Crear y Entrar Ahora
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start space-x-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre Completo del Tutor
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Cristian Gómez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="tutor@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando acceso...</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Crear Cuenta y Entrar' : 'Acceder al Sistema'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Helper */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              {isRegister ? (
                <>
                  ¿Ya tienes una cuenta registrada?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError(null);
                      setSuccessMessage(null);
                      setShowAutoRegisterSuggestion(false);
                    }}
                    className="text-rose-400 hover:underline font-semibold"
                  >
                    Inicia Sesión aquí
                  </button>
                </>
              ) : (
                <>
                  ¿No tienes una cuenta aún?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError(null);
                      setSuccessMessage(null);
                      setShowAutoRegisterSuggestion(false);
                    }}
                    className="text-rose-400 hover:underline font-semibold"
                  >
                    Crear Cuenta en 10 segundos
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-5 text-center text-xs text-slate-500 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>VetIA / PetEmergency © 2026 - Triage Multimodal & Seguimiento Contextual</span>
        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          <span>Gemini 2.5 Flash</span>
          <span>•</span>
          <span>FastAPI</span>
          <span>•</span>
          <span>Supabase Auth</span>
        </div>
      </footer>
    </div>
  );
}

export default AuthScreen;
