import React, { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, Loader2, CheckCircle2, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { SUPABASE_URL } from '../services/supabaseClient';

export function AuthModal({ isOpen, onClose }) {
  const { theme, toggleTheme, language, setLanguage } = usePreferences();
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

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
        await signUp(email, password, { full_name: fullName.trim() });
        setSuccessMessage('¡Cuenta creada exitosamente en Supabase! Ingresando...');
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (err) {
      const targetEndpoint = `${SUPABASE_URL}/auth/v1/${isRegister ? 'signup' : 'token'}`;
      console.error(
        `[AuthModal.handleSubmit] Error al conectar con ${targetEndpoint}. Motivo del fallo: ${err.message}`,
        err
      );
      setError(err.message || 'Error de autenticación. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white/95 dark:bg-[#0b0f19]/95 text-slate-800 dark:text-slate-100 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1e293b] backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {/* Selector ES / EN */}
          <div className="flex items-center bg-slate-100 dark:bg-[#151e34] border border-slate-300 dark:border-[#334155] rounded-lg p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLanguage('es')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${language === 'es' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${language === 'en' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              EN
            </button>
          </div>

          {/* Botón Sol / Luna */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#151e34] border border-slate-300 dark:border-[#334155] text-slate-600 dark:text-slate-300 hover:text-[#2563eb] dark:hover:text-[#38bdf8] transition-all flex items-center justify-center shadow-sm cursor-pointer"
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <span className="material-symbols-outlined text-[1.15rem] text-amber-400">light_mode</span>
            ) : (
              <span className="material-symbols-outlined text-[1.15rem] text-[#2563eb]">dark_mode</span>
            )}
          </button>

          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151e34] transition cursor-pointer"
            title="Cerrar modal"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="relative p-5 pr-36 border-b border-slate-200 dark:border-[#1e293b] bg-slate-50/80 dark:bg-[#0b0f19]/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isRegister ? 'Crear Cuenta de Tutor' : 'Iniciar Sesión en VetIA'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Accede a tu historial clínico y seguimiento contextual de urgencias
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-[#1e293b] text-sm font-semibold text-center bg-slate-50/50 dark:bg-[#0b0f19]/40">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-3 transition border-b-2 cursor-pointer flex items-center justify-center space-x-1.5 ${!isRegister
              ? 'border-[#2563eb] text-[#2563eb] dark:text-[#38bdf8] bg-blue-50/50 dark:bg-[#2563eb]/10'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
            }}
            className={`flex-1 py-3 transition border-b-2 cursor-pointer flex items-center justify-center space-x-1.5 ${isRegister
              ? 'border-[#2563eb] text-[#2563eb] dark:text-[#38bdf8] bg-blue-50/50 dark:bg-[#2563eb]/10'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 rounded-xl text-xs text-rose-700 dark:text-rose-200 flex items-start space-x-2.5 shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-rose-700 dark:text-rose-300 mb-0.5">Aviso de Validación / Error:</span>
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-500/30 rounded-xl text-xs text-[#2563eb] dark:text-blue-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#2563eb] dark:text-blue-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nombre Completo del Tutor
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Dra. Mariana Torres o Carlos Ramírez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#334155] bg-slate-50 dark:bg-[#060911] text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-[#2563eb] focus:border-[#2563eb] outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="tutor@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#334155] bg-slate-50 dark:bg-[#060911] text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-[#2563eb] focus:border-[#2563eb] outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#334155] bg-slate-50 dark:bg-[#060911] text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-[#2563eb] focus:border-[#2563eb] outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)] transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <span>{isRegister ? 'Crear Expediente' : 'Ingresar al Panel'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
