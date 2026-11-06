import React, { useState, useEffect } from 'react';
import { History, HeartPulse, User, LogOut, LogIn, Phone, Check, X, Edit2 } from 'lucide-react';
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
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Vet<span className="text-rose-600">IA</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                PetEmergency
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Multimodal AI Veterinary Triage & Clinical Orientation
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
            title="Ver Historial de Consultas en Supabase"
          >
            <History className="w-4 h-4 text-rose-600" />
            <span className="hidden sm:inline">Historial de Consultas</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* Authentication Status & Tutor Phone Badge */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-slate-200">
              {/* Tutor Phone badge / inline editor */}
              <div className="relative">
                {isEditingPhone ? (
                  <form onSubmit={handleSavePhone} className="flex items-center space-x-1 bg-white border-2 border-emerald-500 rounded-xl px-2 py-0.5 shadow-md z-50">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <input
                      type="tel"
                      maxLength={10}
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Celular 10 dígitos"
                      className="w-28 text-xs font-bold outline-none text-slate-800 bg-transparent"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isSavingPhone}
                      className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
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
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      tutorPhone
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 shadow-2xs'
                        : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 shadow-xs'
                    }`}
                    title="Clic para editar tu celular o WhatsApp de contacto"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="hidden sm:inline">
                      {tutorPhone ? `Tel: ${tutorPhone}` : 'Añadir celular de contacto 📱'}
                    </span>
                    <span className="sm:hidden">
                      {tutorPhone ? tutorPhone : '📱 Celular'}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold">
                <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
                  {userInitial.toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate hidden md:inline">{userName}</span>
              </div>
              <button
                type="button"
                onClick={signOut}
                title="Cerrar Sesión en Supabase"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold transition shadow-2xs cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>AI Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
