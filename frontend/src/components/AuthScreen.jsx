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
  ShieldCheck,
  Leaf,
  MapPin,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPABASE_URL } from '../services/supabaseClient';

/**
 * Modern Full-Screen Desktop Authentication Screen for VetIA / PetEmergency
 * Split-screen dark layout, emerald/teal accents + medical traffic-light severity
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

  const inputBase =
    'w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 pl-12 pr-4 text-base text-white placeholder-slate-500 outline-none transition-all duration-200 hover:border-white/20 focus:border-emerald-400/70 focus:bg-white/[0.07] focus:ring-4 focus:ring-emerald-400/15';
  const iconBase =
    'pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors peer-focus:text-emerald-400';
  const tabBase =
    'flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all duration-300';
  const tabOn = 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25';
  const tabOff = 'text-slate-400 hover:bg-white/5 hover:text-white';

  const switchMode = (register) => {
    setIsRegister(register);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-zinc-950 text-slate-100 lg:flex-row">
      {/* =========================================================================
          LEFT: marca y propuesta de valor (solo escritorio)
          ========================================================================= */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-white/5 bg-gradient-to-br from-[#04130E] via-[#062A20] to-[#031A17] p-14 lg:flex lg:w-1/2 xl:w-[54%]">
        {/* Luces y cuadrícula */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-emerald-500/20 blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-32 h-[460px] w-[460px] rounded-full bg-teal-400/15 blur-[140px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" />

        {/* Marca */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-xl shadow-emerald-500/30">
              <HeartPulse className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">
                  Vet<span className="text-emerald-400">IA</span>
                </span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                  PetEmergency 24/7
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400">Hospital Digital & Triaje Veterinario</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Supabase Cloud Auth</span>
          </div>
        </div>

        {/* Propuesta de valor */}
        <div className="relative z-10 my-auto max-w-xl space-y-7 py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-200">
            <Leaf className="h-3.5 w-3.5 text-emerald-300" />
            <span>Para el campo y la familia campesina • Pasto, Nariño</span>
          </div>

          <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white xl:text-5xl">
            Urgencias veterinarias,{' '}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-lime-300 bg-clip-text text-transparent">
              resueltas con IA
            </span>
          </h1>

          <p className="text-base leading-relaxed text-slate-300/90">
            Toma una foto, describe los síntomas y conoce al instante qué tan grave es. Primeros auxilios paso a paso y la ruta al veterinario más cercano, para vacas, caballos, cerdos, ovejas, cuyes, aves, perros y gatos.
          </p>

          {/* Semáforo de urgencia */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Crítico', sub: 'Atención inmediata', dot: 'bg-red-500', ring: 'border-red-500/30 bg-red-500/10', text: 'text-red-300' },
              { label: 'Moderado', sub: 'Consulta pronto', dot: 'bg-amber-400', ring: 'border-amber-400/30 bg-amber-400/10', text: 'text-amber-300' },
              { label: 'Leve', sub: 'Seguimiento en casa', dot: 'bg-emerald-400', ring: 'border-emerald-400/30 bg-emerald-400/10', text: 'text-emerald-300' },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl border p-4 ${s.ring}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.dot} shadow-[0_0_12px] shadow-current`} />
                  <span className={`text-sm font-bold ${s.text}`}>{s.label}</span>
                </div>
                <p className="text-[11px] leading-snug text-slate-400">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Características */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { Icon: Camera, title: 'Análisis por foto', text: 'Gemini 2.5 Flash revisa la imagen y los síntomas.', tone: 'text-emerald-300 bg-emerald-400/15' },
              { Icon: Activity, title: 'Primeros auxilios', text: 'Pautas claras mientras llega el especialista.', tone: 'text-amber-300 bg-amber-400/15' },
              { Icon: MapPin, title: 'Ruta en mapa', text: 'Veterinario o almacén agropecuario más cercano.', tone: 'text-teal-300 bg-teal-400/15' },
            ].map(({ Icon, title, text, tone }) => (
              <div key={title} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-white/[0.07]">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold tracking-wide text-white">{title}</h3>
                <p className="mt-1 text-[11px] leading-snug text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pie */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-500">
          <span>VetIA Platform © 2026 • PetEmergency AI Triage</span>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span>Servicio de Diagnóstico Operativo</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          RIGHT: formulario (pantalla completa en móvil)
          ========================================================================= */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-zinc-950 px-5 py-10 sm:px-12 lg:p-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-[110px] lg:hidden" />

        <div className="relative w-full max-w-md space-y-7">
          {/* Marca compacta (móvil) */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/30">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                Vet<span className="text-emerald-400">IA</span>
              </span>
              <p className="text-[11px] text-slate-400">Urgencias veterinarias con IA</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              {isRegister ? 'Crear Cuenta de Tutor' : 'Acceso a la Plataforma'}
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              {isRegister
                ? 'Registra tu perfil para gestionar expedientes clínicos y recibir asistencia de triaje con IA.'
                : 'Ingresa con tu correo electrónico y contraseña registrados en Supabase.'}
            </p>
          </div>

          {/* Pestañas */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
            <button type="button" onClick={() => switchMode(false)} className={`${tabBase} ${!isRegister ? tabOn : tabOff}`}>
              <LogIn className="h-4 w-4" />
              <span>Iniciar Sesión</span>
            </button>
            <button type="button" onClick={() => switchMode(true)} className={`${tabBase} ${isRegister ? tabOn : tabOff}`}>
              <UserPlus className="h-4 w-4" />
              <span>Crear Cuenta</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 shadow-lg shadow-red-950/40">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
              <div className="flex-1">
                <span className="mb-0.5 block font-bold text-red-300">Aviso de Validación / Error:</span>
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          {/* Éxito */}
          {successMessage && (
            <div role="status" className="flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-2">
                <label htmlFor="auth-name" className="block text-sm font-semibold text-slate-300">
                  Nombre Completo del Tutor <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="auth-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Ej. Dra. Mariana Torres o Carlos Ramírez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`peer ${inputBase}`}
                  />
                  <User className={iconBase} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="auth-email" className="block text-sm font-semibold text-slate-300">
                Correo Electrónico <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tutor@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`peer ${inputBase}`}
                />
                <Mail className={iconBase} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="auth-password" className="block text-sm font-semibold text-slate-300">
                  Contraseña <span className="text-red-400">*</span>
                </label>
                {isRegister && <span className="text-[11px] text-slate-400">Mínimo 6 caracteres</span>}
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`peer ${inputBase} pr-14`}
                />
                <Lock className={iconBase} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-xl p-2.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative mt-2 flex w-full cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 px-6 py-4 text-base font-extrabold text-slate-950 shadow-[0_14px_34px_-10px_rgba(16,185,129,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.75)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {loading ? (
                <>
                  <Loader2 className="relative h-5 w-5 animate-spin" />
                  <span className="relative">Procesando solicitud...</span>
                </>
              ) : isRegister ? (
                <>
                  <span className="relative">Crear Expediente</span>
                  <Sparkles className="relative h-5 w-5" />
                </>
              ) : (
                <>
                  <span className="relative">Ingresar al Panel</span>
                  <ArrowRight className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 pt-1 text-center text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5" />
            <span>Autenticación segura y cifrada con Supabase Auth</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export { AuthScreen as Auth };
export default AuthScreen;
