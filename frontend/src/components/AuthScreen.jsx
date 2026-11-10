import React, { useState } from 'react';
import {
  HeartPulse,
  Mail,
  Lock,
  User,
  Phone,
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
 * Split-screen dark layout, indigo/teal accents + medical traffic-light severity
 * Operates strictly with Supabase Auth
 */
export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
        const cleanedPhone = phoneNumber.replace(/\D/g, '');
        if (!cleanedPhone || cleanedPhone.length !== 10) {
          setError('Número de Celular / WhatsApp obligatorio de 10 dígitos (ej. 3123456789).');
          setLoading(false);
          return;
        }
        setSuccessMessage('Creando expediente de tutor en Supabase...');
        await signUp(email, password, { full_name: fullName.trim(), phone: cleanedPhone });
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
    'w-full rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-[#F4F7F5] dark:bg-[#0F1A17] py-3.5 pl-12 pr-4 text-sm text-[#1F2D29] dark:text-white placeholder-[#66756F] outline-none transition-all duration-200 focus:border-[#176B55] focus:bg-white dark:focus:bg-[#162420] focus:ring-2 focus:ring-[#176B55]/20';
  const iconBase =
    'pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#66756F] transition-colors peer-focus:text-[#176B55]';
  const tabBase =
    'flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-200';
  const tabOn = 'bg-[#176B55] text-white shadow-xs';
  const tabOff = 'text-[#66756F] hover:text-[#1F2D29] dark:hover:text-white';

  const switchMode = (register) => {
    setIsRegister(register);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#F4F7F5] dark:bg-[#0F1A17] text-[#1F2D29] dark:text-[#E8EFEA] lg:flex-row">
      {/* =========================================================================
          LEFT: marca y propuesta de valor (solo escritorio)
          ========================================================================= */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-[#DCE6E0] dark:border-[#233630] bg-[#F4F7F5] dark:bg-[#121E1B] p-14 lg:flex lg:w-1/2 xl:w-[54%]">
        {/* Marca */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#176B55] text-white shadow-xs">
              <HeartPulse className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-[#123B32] dark:text-white">
                  Vet<span className="text-[#176B55]">IA</span>
                </span>
                <span className="rounded-full border border-[#176B55]/30 bg-[#EAF3F0] px-2 py-0.5 text-[11px] font-bold text-[#176B55]">
                  PetEmergency 24/7
                </span>
              </div>
              <p className="text-xs font-medium text-[#66756F] dark:text-[#A3B8B0]">Hospital Digital & Triaje Veterinario</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#162420] px-3 py-1.5 text-xs text-[#1F2D29] dark:text-slate-200 shadow-xs">
            <ShieldCheck className="h-4 w-4 text-[#176B55]" />
            <span>Supabase Cloud Auth</span>
          </div>
        </div>

        {/* Propuesta de valor */}
        <div className="relative z-10 my-auto max-w-xl space-y-7 py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#176B55]/30 bg-[#EAF3F0] px-3.5 py-1.5 text-xs font-semibold text-[#176B55]">
            <Leaf className="h-3.5 w-3.5 text-[#176B55]" />
            <span>Para el campo y la familia campesina • Pasto, Nariño</span>
          </div>

          <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-[#123B32] dark:text-white xl:text-5xl">
            Urgencias veterinarias,{' '}
            <span className="text-[#176B55]">
              resueltas con IA
            </span>
          </h1>

          <p className="text-base leading-relaxed text-[#66756F] dark:text-[#A3B8B0]">
            Toma una foto, describe los síntomas y conoce al instante qué tan grave es. Primeros auxilios paso a paso y la ruta al veterinario más cercano, para vacas, caballos, cerdos, ovejas, cuyes, aves, perros y gatos.
          </p>

          {/* Semáforo de urgencia */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Crítico', sub: 'Atención inmediata', dot: 'bg-[#C83D4D]', ring: 'border-[#C83D4D]/30 bg-[#FDECEE]', text: 'text-[#C83D4D]' },
              { label: 'Moderado', sub: 'Consulta pronto', dot: 'bg-[#A97812]', ring: 'border-[#A97812]/30 bg-[#FFF9F2]', text: 'text-[#A97812]' },
              { label: 'Leve', sub: 'Seguimiento en casa', dot: 'bg-[#27825D]', ring: 'border-[#27825D]/30 bg-[#EAF3F0]', text: 'text-[#27825D]' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-4 ${s.ring}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  <span className={`text-sm font-bold ${s.text}`}>{s.label}</span>
                </div>
                <p className="text-[11px] leading-snug text-[#66756F] dark:text-[#A3B8B0]">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Características */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { Icon: Camera, title: 'Análisis por foto', text: 'Gemini 2.5 Flash revisa la imagen y los síntomas.', tone: 'text-[#176B55] bg-[#EAF3F0]' },
              { Icon: Activity, title: 'Primeros auxilios', text: 'Pautas claras mientras llega el especialista.', tone: 'text-[#A97812] bg-[#FFF9F2]' },
              { Icon: MapPin, title: 'Ruta en mapa', text: 'Veterinario o almacén agropecuario más cercano.', tone: 'text-[#176B55] bg-[#EAF3F0]' },
            ].map(({ Icon, title, text, tone }) => (
              <div key={title} className="group rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#162420] p-4 transition hover:-translate-y-0.5 shadow-xs">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold tracking-wide text-[#123B32] dark:text-white">{title}</h3>
                <p className="mt-1 text-[11px] leading-snug text-[#66756F] dark:text-[#A3B8B0]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pie */}
        <div className="relative z-10 flex items-center justify-between border-t border-[#DCE6E0] dark:border-[#233630] pt-6 text-xs text-[#66756F]">
          <span>VetIA Platform © 2026 • PetEmergency AI Triage</span>
          <div className="flex items-center gap-2 text-[11px] text-[#176B55]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#176B55]" />
            <span>Servicio de Diagnóstico Operativo</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          RIGHT: formulario (pantalla completa en móvil)
          ========================================================================= */}
      <section className="relative flex flex-1 flex-col items-center justify-center bg-white dark:bg-[#162420] px-5 py-10 sm:px-12 lg:p-16">
        <div className="relative w-full max-w-md space-y-7">
          {/* Marca compacta (móvil) */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B55] text-white shadow-xs">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#123B32] dark:text-white">
                Vet<span className="text-[#176B55]">IA</span>
              </span>
              <p className="text-[11px] text-[#66756F]">Urgencias veterinarias con IA</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#123B32] dark:text-white">
              {isRegister ? 'Crear Cuenta de Tutor' : 'Acceso a la Plataforma'}
            </h2>
            <p className="text-sm leading-relaxed text-[#66756F] dark:text-[#A3B8B0]">
              {isRegister
                ? 'Registra tu perfil para gestionar expedientes clínicos y recibir asistencia de triaje con IA.'
                : 'Ingresa con tu correo electrónico y contraseña registrados en Supabase.'}
            </p>
          </div>

          {/* Pestañas */}
          <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-[#F4F7F5] dark:bg-[#0F1A17] p-1.5">
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
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#C83D4D]/40 bg-[#FDECEE] p-4 text-sm text-[#C83D4D] shadow-xs">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#C83D4D]" />
              <div className="flex-1">
                <span className="mb-0.5 block font-bold text-[#C83D4D]">Aviso de Validación / Error:</span>
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          {/* Éxito */}
          {successMessage && (
            <div role="status" className="flex items-center gap-3 rounded-xl border border-[#176B55]/40 bg-[#EAF3F0] p-4 text-sm text-[#176B55]">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#176B55]" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <>
                <div className="space-y-2">
                  <label htmlFor="auth-name" className="block text-sm font-semibold text-[#1F2D29] dark:text-slate-200">
                    Nombre Completo del Tutor <span className="text-[#C83D4D]">*</span>
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="auth-phone" className="block text-sm font-semibold text-[#1F2D29] dark:text-slate-200">
                      Número de Celular / WhatsApp del Tutor <span className="text-[#C83D4D]">*</span>
                    </label>
                    <span className="text-[11px] text-[#66756F]">10 dígitos (Colombia)</span>
                  </div>
                  <div className="relative">
                    <input
                      id="auth-phone"
                      type="tel"
                      required
                      maxLength={10}
                      autoComplete="tel"
                      placeholder="Ej. 3123456789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className={`peer ${inputBase}`}
                    />
                    <Phone className={iconBase} />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label htmlFor="auth-email" className="block text-sm font-semibold text-[#1F2D29] dark:text-slate-200">
                Correo Electrónico <span className="text-[#C83D4D]">*</span>
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
                <label htmlFor="auth-password" className="block text-sm font-semibold text-[#1F2D29] dark:text-slate-200">
                  Contraseña <span className="text-[#C83D4D]">*</span>
                </label>
                {isRegister && <span className="text-[11px] text-[#66756F]">Mínimo 6 caracteres</span>}
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-xl p-2.5 text-[#66756F] transition hover:bg-[#F4F7F5] dark:hover:bg-[#1F2D29] hover:text-[#1F2D29] dark:hover:text-white"
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
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#176B55] hover:bg-[#135846] px-6 py-3.5 text-base font-bold text-white shadow-xs transition-all duration-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
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

          <div className="flex items-center justify-center gap-2 pt-1 text-center text-xs text-[#66756F]">
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
