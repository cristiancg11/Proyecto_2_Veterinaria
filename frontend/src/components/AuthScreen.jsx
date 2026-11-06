import React, { useState } from 'react';
import {
  HeartPulse,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Activity,
  Cpu,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPABASE_URL } from '../services/supabaseClient';

/**
 * Modern Full-Screen Desktop Authentication Screen for VetIA / PetEmergency
 * Professional Split-Screen Layout (Branding / Active Form)
 * Operates strictly with Supabase Auth
 */
export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!fullName.trim()) {
          setError('Por favor ingresa tu nombre completo como tutor de la mascota.');
          setLoading(false);
          return;
        }
        setSuccessMessage('Creando expediente de tutor en Supabase...');
        await signUp(email, password, { full_name: fullName.trim() });
        setSuccessMessage('¡Cuenta creada exitosamente en Supabase! Ingresando al panel...');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      const targetEndpoint = `${SUPABASE_URL}/auth/v1/${isRegister ? 'signup' : 'token'}`;
      console.error(
        `[AuthScreen.handleSubmit] Error al conectar con ${targetEndpoint}. Motivo del fallo: ${err.message}`,
        err
      );
      setError(err.message || 'Error de autenticación. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* =========================================================================
          LEFT COLUMN: Branding & Platform Showcase (Full Screen Desktop Experience)
          ========================================================================= */}
      <section className="lg:w-1/2 xl:w-[52%] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Branding Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-red-600 flex items-center justify-center text-white shadow-xl shadow-rose-600/30">
              <HeartPulse className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-2xl tracking-tight text-white">
                  Vet<span className="text-rose-500">IA</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  PetEmergency 24/7
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Hospital Digital & Triaje Veterinario
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Supabase Cloud Auth</span>
          </div>
        </div>

        {/* Center Presentation & Value Proposition */}
        <div className="relative z-10 my-10 lg:my-auto max-w-xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Inteligencia Artificial Multimodal en Salud Animal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Triaje Clínico Veterinario con{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-500 to-red-500">
              Inteligencia Artificial
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed font-normal">
            Evaluación fotográfica instantánea, determinación de severidad según protocolos de urgencias y asistencia clínica contextual para tutores y especialistas.
          </p>

          {/* Key Feature Badges */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Feature 1 */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-sm space-y-2 hover:border-slate-700 transition">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white tracking-wide">
                Triage Clínico Rápido
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                Clasificación de severidad (Crítico, Moderado, Leve) en segundos con pautas de primeros auxilios.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-sm space-y-2 hover:border-slate-700 transition">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white tracking-wide">
                Visión por Computadora
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                Análisis multimodal impulsado por Gemini 2.5 Flash con compresión Web Worker en el cliente.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-sm space-y-2 hover:border-slate-700 transition">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white tracking-wide">
                Historial Digital Seguro
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                Expedientes clínicos y fotografías resguardadas en PostgreSQL mediante Supabase Cloud.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Platform Status */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
          <span>VetIA Platform © 2026 • PetEmergency AI Triage</span>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Servicio de Diagnóstico Operativo</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          RIGHT COLUMN: Active Authentication Form (Clean Desktop Interface)
          ========================================================================= */}
      <section className="lg:w-1/2 xl:w-[48%] bg-slate-950 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative">
        <div className="w-full max-w-lg space-y-8 my-auto">
          {/* Header Title for the Form Area */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isRegister ? 'Crear Cuenta de Tutor' : 'Acceso a la Plataforma'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {isRegister
                ? 'Registra tu perfil para gestionar expedientes clínicos y recibir asistencia de triaje con IA.'
                : 'Ingresa con tu correo electrónico y contraseña registrados en Supabase.'}
            </p>
          </div>

          {/* Styled Segmented Toggle Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs sm:text-sm font-bold shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-3 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer ${
                !isRegister
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-3 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer ${
                isRegister
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Cuenta</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-500/15 border-2 border-rose-500 rounded-2xl text-xs sm:text-sm text-rose-200 flex items-start space-x-3 shadow-lg shadow-rose-950/40 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-rose-300 mb-0.5">
                  Aviso de Validación / Error:
                </span>
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-xs sm:text-sm text-emerald-200 flex items-center space-x-3 animate-pulse">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Active Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Tutor Name Field (Register Mode) */}
            {isRegister && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="block text-xs sm:text-sm font-semibold text-slate-300">
                  Nombre Completo del Tutor <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Dra. Mariana Torres o Carlos Ramírez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-slate-300">
                Correo Electrónico <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="tutor@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-semibold text-slate-300">
                  Contraseña <span className="text-rose-500">*</span>
                </label>
                {isRegister && (
                  <span className="text-[11px] text-slate-400">Mínimo 6 caracteres</span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-rose-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Procesando solicitud...</span>
                </>
              ) : isRegister ? (
                <>
                  <span>Crear Expediente</span>
                  <Sparkles className="w-5 h-5" />
                </>
              ) : (
                <>
                  <span>Ingresar al Panel</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-2 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Autenticación segura y cifrada de extremo a extremo con Supabase Auth</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export { AuthScreen as Auth };
export default AuthScreen;
