import React, { useState, useEffect } from 'react';
import { History, HeartPulse, User, LogOut, LogIn, Phone, Check, X, Edit2, ShieldAlert, Cpu, Sun, Moon, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { translations } from '../data/translations';

export function Header({ onOpenHistory, onOpenAuth, historyCount = 0 }) {
  const { user, tutorPhone, updateTutorPhone, signOut, isAuthenticated } = useAuth();
  const { theme, toggleTheme, language, setLanguage } = usePreferences();
  const t = translations[language] || translations.es;

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between rounded-2xl bg-white dark:bg-[#162420] border border-[#DCE6E0] dark:border-[#233630] shadow-xs transition-colors duration-200">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#176B55] flex items-center justify-center text-white shadow-xs flex-shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-[#123B32] dark:text-[#E8EFEA]">
                Vet<span className="text-[#176B55] dark:text-[#45A987]">IA</span>
              </span>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-[#EAF3F0] dark:bg-[#1F332C] text-[#176B55] dark:text-[#45A987] font-semibold border border-[#DCE6E0] dark:border-[#233630]">
                Clinical Intelligence
              </span>
            </div>
            <p className="text-[11px] text-[#66756F] dark:text-[#95A59F] hidden sm:block">
              {t.nav?.telemetry || 'Triage Quirúrgico & Telemetría Veterinaria'}
            </p>
          </div>
        </div>

        {/* Center telemetry & emergency badges */}
        <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
          {/* Badge de telemetría */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F4F7F5] dark:bg-[#1B2C27] border border-[#DCE6E0] dark:border-[#233630] text-xs font-semibold text-[#1F2D29] dark:text-[#E8EFEA]">
            <span className="relative flex h-2 w-2">
              <span className="inline-flex rounded-full h-2 w-2 bg-[#176B55] dark:bg-[#45A987]"></span>
            </span>
            <span className="text-[11px]">
              {t.nav?.aiEngineStatus || 'IA Motor v4.2 Activo • 99.8% Precisión Diagnóstica'}
            </span>
          </div>

          {/* Badge de emergencia SOS */}
          <div className="hidden xl:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FDF2F4] dark:bg-[#2A1619] border border-[#F7D7DC] dark:border-[#522328] text-[#C83D4D] dark:text-[#FFAAB4] text-xs font-bold tracking-wide">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SOS Urgencias: *911-VET</span>
          </div>
        </div>

        {/* Action buttons & Preferences Dock */}
        <div className="ml-auto flex items-center space-x-1.5 sm:space-x-2.5">
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#162420] text-[#1F2D29] dark:text-[#E8EFEA] hover:bg-[#F4F7F5] dark:hover:bg-[#1B2C27] hover:border-[#176B55] hover:text-[#176B55] text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-xs"
            title="Ver Historial de Consultas en Supabase"
          >
            <History className="w-4 h-4 text-[#176B55] dark:text-[#45A987]" />
            <span className="hidden sm:inline">{t.nav?.history || 'Historial'}</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#EAF3F0] dark:bg-[#1F332C] text-[#176B55] dark:text-[#45A987] border border-[#DCE6E0] dark:border-[#233630] text-xs font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* Authentication Status & Tutor Phone Badge */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-[#DCE6E0] dark:border-[#233630]">
              {/* Tutor Phone badge / inline editor */}
              <div className="relative">
                {isEditingPhone ? (
                  <form onSubmit={handleSavePhone} className="flex items-center space-x-1 bg-white dark:bg-[#162420] border-2 border-[#176B55] rounded-xl px-2 py-0.5 shadow-xs z-50">
                    <Phone className="w-3.5 h-3.5 text-[#176B55] flex-shrink-0" />
                    <input
                      type="tel"
                      maxLength={10}
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Celular 10 dígitos"
                      className="w-28 text-xs font-bold outline-none text-[#1F2D29] dark:text-[#E8EFEA] bg-transparent placeholder:text-[#66756F]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isSavingPhone}
                      className="p-1 text-[#176B55] hover:text-[#123B32] cursor-pointer"
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
                      className="p-1 text-[#66756F] hover:text-[#1F2D29] cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                      tutorPhone
                        ? 'bg-[#EAF3F0] dark:bg-[#1F332C] border-[#DCE6E0] dark:border-[#233630] text-[#176B55] dark:text-[#45A987] hover:border-[#176B55]'
                        : 'bg-[#FEFCE8] dark:bg-[#2B2713] border-[#FEF08A] dark:border-[#4E4416] text-[#A97812] dark:text-[#FDE047] hover:bg-[#FEF9C3]'
                    }`}
                    title="Clic para editar tu celular o WhatsApp de contacto"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#176B55] flex-shrink-0" />
                    <span className="hidden sm:inline">
                      {tutorPhone ? `Tel: ${tutorPhone}` : 'Añadir celular 📱'}
                    </span>
                    <span className="sm:hidden">
                      {tutorPhone ? tutorPhone : '📱'}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-[#F4F7F5] dark:bg-[#1B2C27] border border-[#DCE6E0] dark:border-[#233630] text-[#1F2D29] dark:text-[#E8EFEA] text-xs font-semibold">
                <div className="w-6 h-6 rounded-full bg-[#176B55] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {userInitial.toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate hidden md:inline">{userName}</span>
              </div>
              <button
                type="button"
                onClick={signOut}
                title="Cerrar Sesión en Supabase"
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#162420] hover:bg-[#FDF2F4] dark:hover:bg-[#2A1619] hover:border-[#F7D7DC] text-[#66756F] dark:text-[#95A59F] hover:text-[#C83D4D] text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4 text-[#C83D4D]" />
                <span className="hidden md:inline">{t.nav?.logout || 'Cerrar Sesión'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#176B55] hover:bg-[#135846] text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.nav?.login || 'Sign In'}</span>
            </button>
          )}

          {/* Global Preferences: Language & Theme strictly anchored to top-right corner */}
          <div className="ml-auto flex items-center gap-2 pl-1 sm:pl-2 border-l border-[#DCE6E0] dark:border-[#233630]">
            <div className="flex items-center space-x-1 bg-[#F4F7F5] dark:bg-[#1B2C27] p-0.5 sm:p-1 rounded-xl border border-[#DCE6E0] dark:border-[#233630]">
              {/* Language Segmented Pill */}
              <div className="flex items-center rounded-lg p-0.5 bg-white dark:bg-[#162420] border border-[#DCE6E0] dark:border-[#233630] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLanguage('es')}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs transition-all cursor-pointer ${
                    language === 'es'
                      ? 'bg-[#176B55] text-white shadow-xs'
                      : 'text-[#66756F] dark:text-[#95A59F] hover:text-[#1F2D29] dark:hover:text-white'
                  }`}
                  title="Español"
                >
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-[#176B55] text-white shadow-xs'
                      : 'text-[#66756F] dark:text-[#95A59F] hover:text-[#1F2D29] dark:hover:text-white'
                  }`}
                  title="English"
                >
                  EN
                </button>
              </div>

              {/* Theme Switcher Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-1 sm:p-1.5 rounded-lg bg-white dark:bg-[#162420] border border-[#DCE6E0] dark:border-[#233630] text-[#66756F] dark:text-[#95A59F] hover:text-[#176B55] dark:hover:text-[#45A987] transition-all flex items-center justify-center cursor-pointer shadow-xs"
                title={theme === 'dark' ? (language === 'es' ? 'Cambiar a Modo Claro' : 'Switch to Light Mode') : (language === 'es' ? 'Cambiar a Modo Oscuro' : 'Switch to Dark Mode')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A97812]" />
                ) : (
                  <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#176B55]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
