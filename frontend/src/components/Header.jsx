import React, { useState, useEffect } from 'react';
import { History, HeartPulse, User, LogOut, LogIn, Phone, Check, X, Edit2, ShieldAlert, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header({ onOpenHistory, onOpenAuth, historyCount = 0 }) {
  const { user, tutorPhone, updateTutorPhone, signOut, isAuthenticated } = useAuth();
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState(tutorPhone || '');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  useEffect(() => {
    setTempPhone(tutorPhone || '');
  }, [tutorPhone]);

  const handleSavePhone = async (e) => {
    if (e) e.preventDefault();
    setIsSavingPhone(true);
    try {
      await updateTutorPhone(tempPhone);
      setIsEditingPhone(false);
    } finally {
      setIsSavingPhone(false);
    }
  };

  const userInitial = user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Owner';

  return (
    <header className="sticky top-2 z-40 px-2 sm:px-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between rounded-2xl bg-[#060911]/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.5)] transition-all duration-300">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-blue-700 flex items-center justify-center text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] flex-shrink-0">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Vet<span className="text-primary">IA</span>
              </span>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-semibold border border-primary/20">
                Clinical Intelligence
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant hidden sm:block">
              Triage Quirúrgico & Telemetría Veterinaria
            </p>
          </div>
        </div>

        {/* Center telemetry & emergency badges */}
        <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
          {/* Badge de telemetría */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-surface-container-high border border-primary/20 text-xs font-semibold text-on-surface">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-on-surface text-[11px]">
              IA Motor v4.2 Activo • 99.8% Precisión Diagnóstica
            </span>
          </div>

          {/* Badge de emergencia SOS */}
          <div className="hidden xl:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-error-container/30 border border-error/30 text-error shadow-[0_0_12px_rgba(239,68,68,0.25)] text-xs font-bold tracking-wide">
            <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
            <span>SOS Urgencias: *911-VET</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-surface-container-high/80 bg-surface-container-low text-on-surface hover:bg-surface-container hover:border-primary/40 hover:text-primary text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm"
            title="Ver Historial de Consultas en Supabase"
          >
            <History className="w-4 h-4 text-secondary" />
            <span className="hidden sm:inline">Historial</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-secondary-container/40 text-secondary border border-secondary/30 text-xs font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* Authentication Status & Tutor Phone Badge */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-surface-container-high">
              {/* Tutor Phone badge / inline editor */}
              <div className="relative">
                {isEditingPhone ? (
                  <form onSubmit={handleSavePhone} className="flex items-center space-x-1 bg-surface-container-lowest border-2 border-primary/70 rounded-lg px-2 py-0.5 shadow-md z-50">
                    <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <input
                      type="tel"
                      maxLength={10}
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Celular 10 dígitos"
                      className="w-28 text-xs font-bold outline-none text-on-surface bg-transparent placeholder:text-on-surface-variant"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isSavingPhone}
                      className="p-1 text-primary hover:text-secondary cursor-pointer"
                      title="Guardar teléfono de contacto"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPhone(false);
                        setTempPhone(tutorPhone || '');
                      }}
                      className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all duration-200 cursor-pointer ${
                      tutorPhone
                        ? 'bg-primary-container/20 border-primary/30 text-primary hover:bg-primary-container/30'
                        : 'bg-amber-500/10 border-amber-400/40 text-amber-300 hover:bg-amber-500/20'
                    }`}
                    title="Clic para editar tu celular o WhatsApp de contacto"
                  >
                    <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="hidden sm:inline">
                      {tutorPhone ? `Tel: ${tutorPhone}` : 'Añadir celular 📱'}
                    </span>
                    <span className="sm:hidden">
                      {tutorPhone ? tutorPhone : '📱 Celular'}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-surface-container-high border border-surface-container-highest text-on-surface text-xs font-semibold">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-container to-blue-700 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {userInitial.toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate hidden md:inline">{userName}</span>
              </div>
              <button
                type="button"
                onClick={signOut}
                title="Cerrar Sesión en Supabase"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-surface-container-high bg-surface-container-low hover:bg-error-container/25 hover:border-error/40 text-on-surface-variant hover:text-error text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-error" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-primary-container via-blue-600 to-blue-700 hover:brightness-110 text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-[0_0_14px_rgba(37,99,235,0.4)]"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
