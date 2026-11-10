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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-[#162420] w-full max-w-md rounded-2xl shadow-xl border border-[#DCE6E0] dark:border-[#233630] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-5 border-b border-[#DCE6E0] dark:border-[#233630] bg-[#F4F7F5] dark:bg-[#162420] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#123B32] dark:text-white">
              {isRegister ? 'Crear Cuenta de Tutor' : 'Iniciar Sesión en VetIA'}
            </h3>
            <p className="text-xs text-[#66756F] dark:text-[#A3B8B0] mt-0.5">
              Accede a tu historial clínico y seguimiento contextual de urgencias
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#66756F] hover:text-[#1F2D29] dark:hover:text-white hover:bg-white dark:hover:bg-[#1F2D29] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#DCE6E0] dark:border-[#233630] text-sm font-semibold text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-3 transition border-b-2 cursor-pointer flex items-center justify-center space-x-1.5 ${!isRegister
              ? 'border-[#176B55] text-[#176B55] bg-[#EAF3F0] dark:bg-[#176B55]/15'
              : 'border-transparent text-[#66756F] hover:text-[#1F2D29] dark:hover:text-white'
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
              ? 'border-[#176B55] text-[#176B55] bg-[#EAF3F0] dark:bg-[#176B55]/15'
              : 'border-transparent text-[#66756F] hover:text-[#1F2D29] dark:hover:text-white'
              }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-[#FDECEE] border border-[#C83D4D]/40 rounded-xl text-xs text-[#C83D4D] flex items-start space-x-2.5 shadow-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#C83D4D] mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-[#C83D4D] mb-0.5">Aviso de Validación / Error:</span>
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-[#EAF3F0] border border-[#176B55]/30 rounded-xl text-xs text-[#176B55] flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#176B55]" />
              <span>{successMessage}</span>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-[#1F2D29] dark:text-slate-200 mb-1.5">
                Nombre Completo del Tutor
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#66756F] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Dra. Mariana Torres o Carlos Ramírez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#0F1A17] text-[#1F2D29] dark:text-white text-sm placeholder:text-[#66756F] focus:ring-2 focus:ring-[#176B55] focus:border-[#176B55] outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2D29] dark:text-slate-200 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#66756F] absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="tutor@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#0F1A17] text-[#1F2D29] dark:text-white text-sm placeholder:text-[#66756F] focus:ring-2 focus:ring-[#176B55] focus:border-[#176B55] outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2D29] dark:text-slate-200 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#66756F] absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#0F1A17] text-[#1F2D29] dark:text-white text-sm placeholder:text-[#66756F] focus:ring-2 focus:ring-[#176B55] focus:border-[#176B55] outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-[#176B55] hover:bg-[#135846] text-white font-semibold text-sm shadow-xs transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
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
