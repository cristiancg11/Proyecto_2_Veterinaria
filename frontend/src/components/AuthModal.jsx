import React, { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, Loader2, CheckCircle2, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPABASE_URL } from '../services/supabaseClient';

export function AuthModal({ isOpen, onClose }) {
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative backdrop-blur-xl bg-slate-900/95 w-full max-w-md rounded-2xl shadow-2xl shadow-emerald-950/40 border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-[100px]" />
        {/* Header */}
        <div className="relative p-5 border-b border-white/10 bg-white/[0.03] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              {isRegister ? 'Crear Cuenta de Tutor' : 'Iniciar Sesión en VetIA'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Accede a tu historial clínico y seguimiento contextual de urgencias
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-white/10 text-sm font-semibold text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-3 transition border-b-2 cursor-pointer flex items-center justify-center space-x-1.5 ${!isRegister
              ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
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
              ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-100 flex items-start space-x-2.5 shadow-lg shadow-rose-950/20">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-rose-300 mb-0.5">Aviso de Validación / Error:</span>
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre Completo del Tutor
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Dra. Mariana Torres o Carlos Ramírez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950/50 text-slate-100 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="tutor@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950/50 text-slate-100 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950/50 text-slate-100 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
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
